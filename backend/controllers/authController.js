// controllers/authController.js
// ─────────────────────────────────────────────
//  Authentication Controller
//  Handles: register, verify, login
// ─────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const Company = require('../models/Company');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const generateCompanyCode = require('../utils/generateCompanyCode');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/emailService');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign a JWT token
 */
const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'printmixbox',
    audience: 'printmixbox-client',
  });
};

/**
 * Send validation error response
 */
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
/**
 * Register a new company with initial owner user
 */
const register = async (req, res) => {
  try {
    // 1. Validate inputs
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { companyName, gstNumber, email, username, password } = req.body;

    // 2. Check for existing email or GST
    const [emailExists, gstExists] = await Promise.all([
      Company.findOne({ email: email.toLowerCase() }),
      Company.findOne({ gstNumber: gstNumber.toUpperCase() }),
    ]);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'A company with this email is already registered.',
        field: 'email',
      });
    }

    if (gstExists) {
      return res.status(409).json({
        success: false,
        message: 'A company with this GST number is already registered.',
        field: 'gstNumber',
      });
    }

    // 3. Generate unique company code
    const companyCode = await generateCompanyCode();

    // 4. Hash password
    const passwordHash = await User.hashPassword(password);

    // 5. Create Company document
    const company = await Company.create({
      companyName: companyName.trim(),
      gstNumber: gstNumber.trim().toUpperCase(),
      email: email.toLowerCase().trim(),
      companyCode,
      isVerified: false,
    });

    // 6. Create owner User document
    await User.create({
      companyId: company._id,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'owner',
    });

    // 7. Generate OTP verification code
    const rawCode = VerificationCode.generateCode();
    await VerificationCode.create({
      companyId: company._id,
      verificationCode: rawCode,
      ipAddress: req.ip,
    });

    // 8. Send verification email (non-blocking on failure)
    try {
      await sendVerificationEmail({
        to: company.email,
        companyName: company.companyName,
        companyCode: company.companyCode,
        verificationCode: rawCode,
      });
    } catch (emailError) {
      console.error(`⚠️  Email send failed for ${company.email}: ${emailError.message}`);
      // Continue — don't fail registration because of email error
    }

    // 9. Return success (never expose OTP in response in production)
    const responseData = {
      success: true,
      message: 'Company registered successfully. Check your email for the verification code.',
      data: {
        companyCode: company.companyCode,
        companyName: company.companyName,
        email: company.email,
      },
    };

    // In development, expose OTP for easy testing
    if (process.env.NODE_ENV === 'development') {
      responseData.debug = { verificationCode: rawCode };
    }

    return res.status(201).json(responseData);

  } catch (error) {
    console.error('Register error:', error);

    // Handle Mongoose duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `This ${field} is already in use.`,
        field,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
};

// ─── POST /api/auth/verify ────────────────────────────────────────────────────
/**
 * Verify company email using OTP
 */
const verify = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { companyCode, verificationCode } = req.body;

    // 1. Find company
    const company = await Company.findOne({
      companyCode: companyCode.trim().toUpperCase(),
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found. Check your company code.',
      });
    }

    // 2. Check if already verified
    if (company.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This company is already verified. Please login.',
      });
    }

    // 3. Find latest unused, unexpired code for this company
    const codeDoc = await VerificationCode.findOne({
      companyId: company._id,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!codeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired or does not exist. Please request a new one.',
      });
    }

    // 4. Check attempt limit
    if (codeDoc.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.',
      });
    }

    // 5. Validate code
    if (codeDoc.verificationCode !== verificationCode.trim()) {
      // Increment attempt counter
      codeDoc.attempts += 1;
      await codeDoc.save();

      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${5 - codeDoc.attempts} attempts remaining.`,
      });
    }

    // 6. Mark code as used & company as verified (atomic)
    await Promise.all([
      VerificationCode.updateOne({ _id: codeDoc._id }, { $set: { isUsed: true } }),
      Company.updateOne({ _id: company._id }, { $set: { isVerified: true } }),
    ]);

    // 7. Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail({
        to: company.email,
        companyName: company.companyName,
        companyCode: company.companyCode,
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Company verified successfully! You can now log in.',
      data: {
        companyCode: company.companyCode,
        companyName: company.companyName,
      },
    });

  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during verification.',
    });
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * Login with companyCode + username + password → returns JWT
 */
const login = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { companyCode, username, password } = req.body;

    // 1. Find company
    const company = await Company.findOne({
      companyCode: companyCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your company code.',
      });
    }

    // 2. Ensure company is verified
    if (!company.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Company email not verified. Please check your inbox.',
        action: 'VERIFY_REQUIRED',
        companyCode: company.companyCode,
      });
    }

    // 3. Find user (include passwordHash explicitly since it's excluded by default)
    const user = await User.findOne({
      companyId: company._id,
      username: username.toLowerCase().trim(),
      isActive: true,
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your username.',
      });
    }

    // 4. Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your password.',
      });
    }

    // 5. Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 6. Sign JWT
    const token = signToken({
      userId: user._id.toString(),
      companyId: company._id.toString(),
      username: user.username,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        company: {
          id: company._id,
          companyName: company.companyName,
          companyCode: company.companyCode,
          plan: company.plan,
        },
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// ─── POST /api/auth/resend-verification ──────────────────────────────────────
/**
 * Resend verification OTP (rate-limited via route middleware)
 */
const resendVerification = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { companyCode } = req.body;

    const company = await Company.findOne({
      companyCode: companyCode.trim().toUpperCase(),
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    if (company.isVerified) {
      return res.status(400).json({ success: false, message: 'Company is already verified.' });
    }

    // Invalidate previous codes
    await VerificationCode.updateMany(
      { companyId: company._id, isUsed: false },
      { $set: { isUsed: true } }
    );

    // Generate new code
    const rawCode = VerificationCode.generateCode();
    await VerificationCode.create({
      companyId: company._id,
      verificationCode: rawCode,
      ipAddress: req.ip,
    });

    try {
      await sendVerificationEmail({
        to: company.email,
        companyName: company.companyName,
        companyCode: company.companyCode,
        verificationCode: rawCode,
      });
    } catch (emailError) {
      console.error('Resend email error:', emailError.message);
    }

    const responseData = {
      success: true,
      message: 'New verification code sent to your email.',
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.debug = { verificationCode: rawCode };
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * Get current authenticated user profile
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('companyId', 'companyName companyCode plan isVerified');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
        },
        company: user.companyId,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  register,
  verify,
  login,
  resendVerification,
  getMe,
};
