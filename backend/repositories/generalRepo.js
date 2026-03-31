const { poolPromise, sql } = require("../database/sqlConnection");

// 🔹 GET GRID DATA
async function getGeneralData(gtypeuid, tag) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Gtypeuid", sql.Int, gtypeuid)
    .input("Tag", sql.Bit, tag)
    .execute("PR_GetGeneralMData_FrontGrid");

  return result.recordset;
}


// 🔹 INSERT / UPDATE / DELETE
async function iudGeneral(data) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Mode", sql.Int, data.mode)
    .input("Userid", sql.Int, data.userId)
    .input("GTypeMUid", sql.Int, data.gtypeuid)
    .input("gcode", sql.NVarChar(100), data.code)
    .input("gname", sql.NVarChar(200), data.name)
    .input("gsname", sql.NVarChar(80), data.shortName)
    .input("Uid", sql.Int, data.uid)
    .execute("PR_IUD_GeneralM");

  return result.recordset;
}

module.exports = { getGeneralData, iudGeneral };