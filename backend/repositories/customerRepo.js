// repositories/customerRepo.js
const { poolPromise, sql } = require("../database/sqlConnection");

// 🔹 GET GRID  →  PR_GetPartyM_FrontGrid @ptype=2, @active=1|0
async function getCustomerGrid(active) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("ptype",  sql.Int, 2)
    .input("active", sql.Bit, active)
    .execute("PR_GetPartyM_FrontGrid");
  return result.recordset;
}

// 🔹 GET FOR EDIT  →  PR_GetPartyM_ForEdit @Uid=uid
async function getCustomerForEdit(uid) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("Uid", sql.BigInt, uid)
    .execute("PR_GetPartyM_ForEdit");
  return result.recordset[0] || null;
}

// 🔹 INSERT / UPDATE / DELETE  →  PR_IUD_PartyM @json=...
async function iudCustomer(jsonData) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("json", sql.NVarChar(sql.MAX), jsonData)
    .execute("PR_IUD_PartyM");
  return result.recordset;
}

module.exports = { getCustomerGrid, getCustomerForEdit, iudCustomer };