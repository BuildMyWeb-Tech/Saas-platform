const express = require("express");
const router = express.Router();

const menuController = require("../controllers/menuController");
const { erpProtect } = require("../middleware/authMiddleware");

// ✅ correct usage
router.get("/grouped/:userId", erpProtect, menuController.getGroupedMenus);

module.exports = router;