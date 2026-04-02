const repo = require("../repositories/generalRepo");

// 🔹 GET (COMMON)
async function getGeneralMaster(type, tag = 1) {
  const data = await repo.getGeneralData(type, tag);

  return data
    .filter(item => item.uid !== null)
    .map(item => ({
      id: Number(item.uid),
      code: item.gcode,
      name: item.gname,
      shortName: item.gsname
    }));
}

// 🔹 GET BOTH ACTIVE + INACTIVE
async function getAllGeneralMaster(type) {
  const active = await repo.getGeneralData(type, 1);
  const inactive = await repo.getGeneralData(type, 0);

  const combined = [...active, ...inactive];

  return combined
    .filter(item => item.uid !== null)
    .map(item => ({
      id: Number(item.uid),
      code: item.gcode,
      name: item.gname,
      shortName: item.gsname,
      isActive: Number(item.tag ?? 1) // optional if available
    }));
}

// 🔹 CREATE
async function createGeneralMaster({ userId, type, code, name, shortName }) {
  const result = await repo.iudGeneral({
    mode: 1,
    userId,
    gtypeuid: type,
    code,
    name,
    shortName,
    uid: 0
  });

  return result[0];
}


// 🔹 UPDATE
async function updateGeneralMaster({ userId, type, id, code, name, shortName }) {
  const result = await repo.iudGeneral({
    mode: 2,
    userId,
    gtypeuid: type,
    code,
    name,
    shortName,
    uid: id
  });

  return result[0];
}


// 🔹 DELETE
async function deleteGeneralMaster({ userId, type, id }) {
  const result = await repo.iudGeneral({
    mode: 3,
    userId,
    gtypeuid: type,
    code: "",
    name: "",
    shortName: "",
    uid: id
  });

  return result[0];
}

module.exports = {
  getGeneralMaster,
  getAllGeneralMaster,
  createGeneralMaster,
  updateGeneralMaster,
  deleteGeneralMaster
};