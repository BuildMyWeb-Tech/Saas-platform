// routes/authRoutes.js
const express    = require('express');
const { body }   = require('express-validator');
const rateLimit  = require('express-rate-limit');
const { register, login, changePassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const registerLimiter = rateLimit({ windowMs: 60*60*1000, max: 5,  message: { success: false, message: 'Too many registration attempts.' } });
const loginLimiter    = rateLimit({ windowMs: 15*60*1000, max: 10, message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } });

// POST /api/auth/register — only company info, no credentials
router.post('/register', registerLimiter, [
  body('companyName').trim().notEmpty().withMessage('Company name is required').isLength({ min: 2, max: 100 }),
  body('gstNumber').trim().notEmpty().withMessage('GST number is required')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Invalid email address'),
], register);

// POST /api/auth/login
router.post('/login', loginLimiter, [
  body('companyCode').trim().notEmpty().withMessage('Company code is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

// POST /api/auth/change-password (protected)
router.post('/change-password', protect, changePassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;