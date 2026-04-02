const { poolPromise, sql } = require("../database/sqlConnection");

// 🔹 GET DATA (GRID)
async function getGeneralData(type, tag) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Gtypeuid", sql.Int, type)
    .input("Tag", sql.Bit, tag)
    .execute("PR_GetGeneralMData_FrontGrid");

  return result.recordset;
}


// 🔹 INSERT / UPDATE / DELETE
async function iudGeneral({ mode, userId, gtypeuid, code, name, shortName, uid }) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Mode", sql.Int, mode)
    .input("Userid", sql.Int, userId)
    .input("GTypeMUid", sql.Int, gtypeuid)
    .input("gcode", sql.NVarChar(100), code || "")
    .input("gname", sql.NVarChar(200), name || "")
    .input("gsname", sql.NVarChar(80), shortName || "")
    .input("Uid", sql.Int, uid || 0)
    .execute("PR_IUD_GeneralM");

  return result.recordset;
}

module.exports = { getGeneralData, iudGeneral };