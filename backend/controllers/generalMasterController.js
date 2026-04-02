const service = require("../services/generalMasterService");


// 🔹 GET LIST
exports.getData = async (req, res, next) => {
  try {
    const type = Number(req.params.type);
    const tag = req.query.tag === "0" ? 0 : 1;

    const data = await service.getGeneralMaster(type, tag);

    res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err);
  }
};


// 🔹 CREATE
exports.create = async (req, res, next) => {
  try {
    const { code, name, shortName } = req.body;
    const type = Number(req.params.type);

    const userId = req.erpUser.userId; // ✅ SAFE

    const result = await service.createGeneralMaster({
      userId,
      type,
      code,
      name,
      shortName
    });

    res.json({
      success: true,
      message: result?.ResponseMessage || "Created successfully"
    });

  } catch (err) {
    next(err);
  }
};


// 🔹 UPDATE
exports.update = async (req, res, next) => {
  try {
    const { userId, code, name, shortName } = req.body;
    const type = Number(req.params.type);
    const id = Number(req.params.id);

    const result = await service.updateGeneralMaster({
      userId,
      type,
      id,
      code,
      name,
      shortName
    });

    res.json({
      success: true,
      message: result?.ResponseMessage || "Updated successfully"
    });

  } catch (err) {
    next(err);
  }
};


// 🔹 DELETE
exports.remove = async (req, res, next) => {
  try {
    const userId = req.headers.userid;
    const type = Number(req.params.type);
    const id = Number(req.params.id);

    const result = await service.deleteGeneralMaster({
      userId,
      type,
      id
    });

    res.json({
      success: true,
      message: result?.ResponseMessage || "Deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};