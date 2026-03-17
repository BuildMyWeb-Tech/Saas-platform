// routes/authRoutes.js
// ─────────────────────────────────────────────
//  Authentication Routes
//  All validation rules are defined here
// ─────────────────────────────────────────────

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const {
  register,
  verify,
  login,
  resendVerification,
  getMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── Targeted Rate Limiters ───────────────────────────────────────────────────

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: { success: false, message: 'Too many resend attempts. Wait 5 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Validation Rules ─────────────────────────────────────────────────────────

const registerValidation = [
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Company name must be 2–100 characters'),

  body('gstNumber')
    .trim()
    .notEmpty().withMessage('GST number is required')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format (e.g. 27AAPFU0939F1ZV)'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Invalid email address'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const verifyValidation = [
  body('companyCode')
    .trim()
    .notEmpty().withMessage('Company code is required')
    .matches(/^COMP-\d{4}$/).withMessage('Invalid company code format (e.g. COMP-4829)'),

  body('verificationCode')
    .trim()
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
    .isNumeric().withMessage('Verification code must be numeric'),
];

const loginValidation = [
  body('companyCode')
    .trim()
    .notEmpty().withMessage('Company code is required'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

const resendValidation = [
  body('companyCode')
    .trim()
    .notEmpty().withMessage('Company code is required'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// @route   POST /api/auth/register
// @desc    Register a new company
// @access  Public
router.post('/register', registerLimiter, registerValidation, register);

// @route   POST /api/auth/verify
// @desc    Verify company email using OTP
// @access  Public
router.post('/verify', verifyValidation, verify);

// @route   POST /api/auth/login
// @desc    Login and receive JWT
// @access  Public
router.post('/login', loginLimiter, loginValidation, login);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification OTP
// @access  Public
router.post('/resend-verification', resendLimiter, resendValidation, resendVerification);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private (JWT required)
router.get('/me', protect, getMe);

module.exports = router;
