// backend/repositories/menuRepo.js
// PR_Get_UserMenus returns: MenuID, MenuName, ParentMenuID, MWrite, MUpdate, MDelete

const { poolPromise, sql } = require("../database/sqlConnection");

async function getUserMenus(userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("userid", sql.Int, userId)
    .execute("PR_Get_UserMenus");

  // Return raw recordset — includes MWrite, MUpdate, MDelete per row
  return result.recordset;
}

module.exports = { getUserMenus };