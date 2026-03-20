// controllers/authController.js
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const Company = require('../models/Company');
const User    = require('../models/User');
const { sendRegistrationAckEmail } = require('../services/emailService');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer:    'printmixbox',
    audience:  'printmixbox-client',
  });

const validationErrors = (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  errs.array().map(e => ({ field: e.path, message: e.msg })),
    });
    return true;
  }
  return false;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Only takes: companyName, gstNumber, email
// No username/password — those are issued by admin on approval
const register = async (req, res) => {
  try {
    if (validationErrors(req, res)) return;

    const { companyName, gstNumber, email } = req.body;

    const [emailEx, gstEx] = await Promise.all([
      Company.findOne({ email: email.toLowerCase() }),
      Company.findOne({ gstNumber: gstNumber.toUpperCase() }),
    ]);

    if (emailEx) return res.status(409).json({ success: false, message: 'A company with this email is already registered.', field: 'email' });
    if (gstEx)   return res.status(409).json({ success: false, message: 'A company with this GST number is already registered.', field: 'gstNumber' });

    const company = await Company.create({
      companyName: companyName.trim(),
      gstNumber:   gstNumber.trim().toUpperCase(),
      email:       email.toLowerCase().trim(),
      status:      'pending',
      isVerified:  false,
    });

    // Send acknowledgement email (non-blocking)
    sendRegistrationAckEmail({ to: company.email, companyName: company.companyName }).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Registration received. Our admin team will review and send your login credentials to your email.',
      data: {
        companyName: company.companyName,
        email:       company.email,
        status:      company.status,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `This ${field} is already in use.`, field });
    }
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Uses credentials that admin sent via email
// companyCode + username + password
const login = async (req, res) => {
  try {
    if (validationErrors(req, res)) return;

    const { companyCode, username, password } = req.body;

    const company = await Company.findOne({
      companyCode: companyCode.trim().toUpperCase(),
      isActive:    true,
    });

    if (!company) return res.status(401).json({ success: false, message: 'Invalid credentials. Check your company code.' });

    if (company.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: company.status === 'pending'
          ? 'Your company registration is pending admin approval. You will receive an email with your credentials once approved.'
          : 'Your company account has been rejected. Please contact support.',
        status: company.status,
      });
    }

    const user = await User.findOne({
      companyId: company._id,
      username:  username.toLowerCase().trim(),
      isActive:  true,
    }).select('+passwordHash');

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials. Check your username.' });

    const valid = await user.comparePassword(password);
    if (!valid)  return res.status(401).json({ success: false, message: 'Invalid credentials. Check your password.' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken({
      userId:    user._id.toString(),
      companyId: company._id.toString(),
      username:  user.username,
      role:      user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        isTemporaryPassword: user.isTemporaryPassword,
        user: {
          id:       user._id,
          username: user.username,
          email:    user.email,
          role:     user.role,
        },
        company: {
          id:          company._id,
          companyName: company.companyName,
          companyCode: company.companyCode,
          plan:        company.plan,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── POST /api/auth/change-password ─────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    if (newPassword.length < 8)     return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ success: false, message: 'New password must contain an uppercase letter.' });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ success: false, message: 'New password must contain a number.' });

    user.passwordHash        = await User.hashPassword(newPassword);
    user.isTemporaryPassword = false;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('companyId', 'companyName companyCode plan status');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({
      success: true,
      data: {
        user:    { id: user._id, username: user.username, email: user.email, role: user.role, isTemporaryPassword: user.isTemporaryPassword },
        company: user.companyId,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, changePassword, getMe };