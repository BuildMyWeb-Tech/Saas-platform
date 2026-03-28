const menuService = require("../services/menuService");

exports.getGroupedMenus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required"
      });
    }

    const menus = await menuService.getGroupedMenus(userId);

    res.json({
      success: true,
      data: menus
    });

  } catch (err) {
    next(err);
  }
};