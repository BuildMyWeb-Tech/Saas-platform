const erpAuthService = require("../services/erpAuthService");
const { validateLogin } = require("../utils/validate");

exports.login = async (req, res, next) => {
  try {
    const error = validateLogin(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    const { username, password } = req.body;

    const result = await erpAuthService.login(username, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    next(err);
  }
};

// REGISTER (temporary stub if not implemented yet)
exports.register = async (req, res) => {
  return res.json({
    success: true,
    message: "Register API working (implement service logic)"
  });
};

// CHANGE PASSWORD (temporary stub)
exports.changePassword = async (req, res) => {
  return res.json({
    success: true,
    message: "Change password API working"
  });
};

// GET ME (temporary stub)
exports.getMe = async (req, res) => {
  return res.json({
    success: true,
    message: "GetMe API working"
  });
};