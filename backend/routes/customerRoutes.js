// routes/customerRoutes.js
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/customerController");
const { erpProtect } = require("../middleware/authMiddleware");

// GET  /api/customers?active=1
router.get("/",    erpProtect, controller.getAll);

// GET  /api/customers/:id
router.get("/:id", erpProtect, controller.getById);

// POST /api/customers
router.post("/",   erpProtect, controller.create);

// PUT  /api/customers/:id
router.put("/:id", erpProtect, controller.update);

// DELETE /api/customers/:id
router.delete("/:id", erpProtect, controller.remove);

module.exports = router;