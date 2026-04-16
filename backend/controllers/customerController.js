// controllers/customerController.js
const service = require("../services/customerService");

// 🔹 GET GRID  —  GET /api/customers?active=1
exports.getAll = async (req, res, next) => {
  try {
    const active = req.query.active === "0" ? 0 : 1;
    const data   = await service.getCustomers(active);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 🔹 GET FOR EDIT  —  GET /api/customers/:id
exports.getById = async (req, res, next) => {
  try {
    const uid  = Number(req.params.id);
    const data = await service.getCustomerById(uid);

    if (!data) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// 🔹 CREATE  —  POST /api/customers
exports.create = async (req, res, next) => {
  try {
    const result = await service.createCustomer(req.body);
    const msg    = result?.ResponseMessage || "Customer created successfully";

    res.json({ success: true, message: msg });
  } catch (err) {
    next(err);
  }
};

// 🔹 UPDATE  —  PUT /api/customers/:id
exports.update = async (req, res, next) => {
  try {
    const uid    = req.params.id;
    const result = await service.updateCustomer(uid, req.body);
    const msg    = result?.ResponseMessage || "Customer updated successfully";

    res.json({ success: true, message: msg });
  } catch (err) {
    next(err);
  }
};

// 🔹 DELETE (soft)  —  DELETE /api/customers/:id
// Fetch existing record first so the SP receives all required fields with Active=0
exports.remove = async (req, res, next) => {
  try {
    const uid          = req.params.id;
    const existingData = await service.getCustomerById(Number(uid));
    const result       = await service.deleteCustomer(uid, existingData);
    const msg          = result?.ResponseMessage || "Customer deleted successfully";

    res.json({ success: true, message: msg });
  } catch (err) {
    next(err);
  }
};