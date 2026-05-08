// backend/controllers/jobCardController.js
const service = require("../services/jobCardService");

// GET /api/jobcards?active=1
exports.getAll = async (req, res, next) => {
  try {
    const active = req.query.active === "0" ? 0 : 1;
    const data   = await service.getJobCards(active);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// GET /api/jobcards/:id
exports.getById = async (req, res, next) => {
  try {
    const data = await service.getJobCardById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Job card not found" });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/jobcards
exports.create = async (req, res, next) => {
  try {
    const result = await service.createJobCard(req.body, req.erpUser.userId);
    res.json({
      success: true,
      message: result?.ResponseMessage || "Job card created successfully",
      uid:     result?.UID ?? result?.uid ?? null,
      docNo:   result?.DocNo ?? result?.docno ?? null,
    });
  } catch (err) { next(err); }
};

// PUT /api/jobcards/:id
exports.update = async (req, res, next) => {
  try {
    const result = await service.updateJobCard(req.params.id, req.body);
    res.json({
      success: true,
      message: result?.ResponseMessage || "Job card updated successfully",
    });
  } catch (err) { next(err); }
};

// DELETE /api/jobcards/:id?status=0  (status=1 for restore)
exports.remove = async (req, res, next) => {
  try {
    const status = req.query.status === "1" ? 1 : 0;
    const fn     = status === 1 ? service.restoreJobCard : service.deleteJobCard;
    const result = await fn(req.params.id);
    res.json({
      success: true,
      message: result?.ResponseMessage ||
        (status === 1 ? "Job card restored successfully" : "Job card deleted successfully"),
    });
  } catch (err) { next(err); }
};