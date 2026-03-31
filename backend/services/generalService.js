const repo = require("../repositories/generalRepo");


// 🔹 GET DEPARTMENT LIST
async function getDepartments() {
  const data = await repo.getGeneralData(1, 1);

  console.log("RAW DATA:", data); // 👈 ADD THIS

return data.map(item => ({
  id: item.uid,          // ✅ lowercase
  code: item.gcode,      // ✅ lowercase
  name: item.gname,
  shortName: item.gsname
}));
}


// 🔹 INSERT / UPDATE / DELETE
async function saveDepartment(payload) {
  return await repo.iudGeneral({
    mode: payload.mode,
    userId: payload.userId,
    gtypeuid: 1,
    code: payload.code,
    name: payload.name,
    shortName: payload.shortName,
    uid: payload.uid || 0
  });
}

module.exports = { getDepartments, saveDepartment };