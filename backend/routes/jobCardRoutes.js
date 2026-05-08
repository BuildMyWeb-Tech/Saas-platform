// backend/routes/jobCardRoutes.js
const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/jobCardController");
const { erpProtect } = require("../middleware/authMiddleware");

router.get(  "/",    erpProtect, controller.getAll);
router.get(  "/:id", erpProtect, controller.getById);
router.post( "/",    erpProtect, controller.create);
router.put(  "/:id", erpProtect, controller.update);
router.delete("/:id", erpProtect, controller.remove);   // ?status=0 delete, ?status=1 restore

module.exports = router;