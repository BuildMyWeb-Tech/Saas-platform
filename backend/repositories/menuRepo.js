const { poolPromise, sql } = require("../database/sqlConnection");

async function getMenus(userId) {
  const pool = await poolPromise;

  if (!pool) {
    throw new Error("Database connection not initialized");
  }

  const result = await pool.request()
    .input("userid", sql.Int, userId)
    .execute("PR_Get_UserMenus");

  return result.recordset;
}

module.exports = { getMenus };