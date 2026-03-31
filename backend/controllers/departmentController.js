const service = require("../services/generalService");


// GET LIST
exports.getDepartments = async (req, res, next) => {
  try {
    const data = await service.getDepartments();

    res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err);
  }
};


// INSERT / UPDATE / DELETE
exports.saveDepartment = async (req, res, next) => {
  try {
    const result = await service.saveDepartment(req.body);

    res.json({
      success: true,
      message: "Operation successful",
      data: result
    });

  } catch (err) {
    next(err);
  }
};

// UPDATE
exports.updateDepartment = async (req, res, next) => {
  try {
    const result = await service.saveDepartment({
      mode: 2,
      userId: req.body.userId,
      code: req.body.code,
      name: req.body.name,
      shortName: req.body.shortName,
      uid: req.params.id
    });

    res.json({
      success: true,
      message: "Updated successfully"
    });

  } catch (err) {
    next(err);
  }
};


// DELETE
exports.deleteDepartment = async (req, res, next) => {
  try {
    const result = await service.saveDepartment({
      mode: 3,
      userId: req.headers.userid, // 👈 important
      uid: req.params.id
    });

    res.json({
      success: true,
      message: "Deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};