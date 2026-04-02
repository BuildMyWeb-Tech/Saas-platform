const express = require("express");
const router = express.Router();

const controller = require("../controllers/generalMasterController");
const { erpProtect } = require("../middleware/authMiddleware");

// 🔹 GET
router.get("/:type", erpProtect, controller.getData);

// 🔹 CREATE
router.post("/:type", erpProtect, controller.create);

// 🔹 UPDATE
router.put("/:type/:id", erpProtect, controller.update);

// 🔹 DELETE
router.delete("/:type/:id", erpProtect, controller.remove);

module.exports = router;