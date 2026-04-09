// backend/routes/userRoutes.js
const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/userController");
const { erpProtect } = require("../middleware/authMiddleware");

// All routes require erpProtect (userid header)
router.use(erpProtect);

// Users CRUD
router.get("/",         ctrl.getUsers);
router.post("/",        ctrl.create);
router.put("/:id",      ctrl.update);
router.delete("/:id",   ctrl.remove);

// Permissions
router.get("/:id/permissions",  ctrl.getPermissions);
router.post("/:id/permissions", ctrl.savePermissions);

module.exports = router;