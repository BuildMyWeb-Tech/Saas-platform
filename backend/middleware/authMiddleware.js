// middleware/authMiddleware.js
// ─────────────────────────────────────────────
//  JWT Authentication Middleware
//  Protects private routes from unauthenticated access
// ─────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * protect — verifies JWT and attaches user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'printmixbox',
        audience: 'printmixbox-client',
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'TOKEN_INVALID',
      });
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or has been deactivated.',
      });
    }

    // Verify company is still active & verified
    const company = await Company.findById(decoded.companyId);
    if (!company || !company.isActive || !company.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Company account is inactive or unverified.',
      });
    }

    // Attach to request
    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * authorize — restrict access to specific roles
 * Usage: router.get('/admin', protect, authorize('owner', 'admin'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

/**
 * requireSameCompany — ensure user only accesses their own company's resources
 * Compares req.user.companyId with a :companyId param or body field
 */
const requireSameCompany = (req, res, next) => {
  const targetCompanyId =
    req.params.companyId ||
    req.body.companyId ||
    req.query.companyId;

  if (targetCompanyId && targetCompanyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own company resources.',
    });
  }
  next();
};

module.exports = { protect, authorize, requireSameCompany };
