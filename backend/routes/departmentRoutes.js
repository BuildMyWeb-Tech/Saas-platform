const express = require("express");
const router = express.Router();
const controller = require("../controllers/departmentController");
const { erpProtect } = require("../middleware/authMiddleware");

// ✅ GET
router.get("/", erpProtect, controller.getDepartments);

// ✅ CREATE
router.post("/", erpProtect, controller.saveDepartment);

// ✅ UPDATE (IMPORTANT)
router.put("/:id", erpProtect, controller.updateDepartment);

// ✅ DELETE (IMPORTANT)
router.delete("/:id", erpProtect, controller.deleteDepartment);

module.exports = router;