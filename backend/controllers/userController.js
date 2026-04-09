// backend/controllers/userController.js
const service = require("../services/userService");

// 🔹 GET USERS GRID
exports.getUsers = async (req, res, next) => {
  try {
    const tag = req.query.tag === "0" ? 0 : 1;
    const data = await service.getUsers(tag);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 🔹 CREATE USER
// SP ResponseCode 101 = success, 102 = already exists / error
exports.create = async (req, res, next) => {
  try {
    const { userName, pwd, active } = req.body;

    if (!userName || !pwd) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const result = await service.createUser({ userName, pwd, active: active ?? 1 });

    // ✅ Use ResponseCode 101 as success indicator, NOT presence of userId
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.responseMessage || "Failed to create user",
      });
    }

    res.json({
      success: true,
      message: result.responseMessage || "User created successfully",
      data:    { userId: result.userId },
    });
  } catch (err) {
    next(err);
  }
};

// 🔹 UPDATE USER
exports.update = async (req, res, next) => {
  try {
    const uid = Number(req.params.id);
    const { userName, pwd, active } = req.body;

    const result = await service.updateUser({ uid, userName, pwd, active });

    res.json({
      success: true,
      message: result?.ResponseMessage || "User updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

// 🔹 DELETE USER (soft delete — sets active = 0)
exports.remove = async (req, res, next) => {
  try {
    const uid = Number(req.params.id);
    const result = await service.deleteUser({ uid });

    res.json({
      success: true,
      message: result?.ResponseMessage || "User deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// 🔹 GET PERMISSIONS
exports.getPermissions = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const data   = await service.getUserPermissions(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 🔹 SAVE PERMISSIONS
exports.savePermissions = async (req, res, next) => {
  try {
    const userId      = Number(req.params.id);
    const permissions = req.body.permissions;

    if (!permissions || typeof permissions !== "object") {
      return res.status(400).json({
        success: false,
        message: "Permissions object required",
      });
    }

    const result = await service.savePermissions(userId, permissions);

    res.json({
      success: true,
      message: result?.ResponseMessage || "Permissions saved successfully",
    });
  } catch (err) {
    next(err);
  }
};