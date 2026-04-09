// backend/repositories/userRepo.js
const { poolPromise, sql } = require("../database/sqlConnection");

// 🔹 GET USERS FOR GRID
async function getUsers(tag) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("Tag", sql.Int, tag)
    .execute("PR_Get_Users_ForFrontgrid");
  return result.recordset;
}

// 🔹 CREATE / UPDATE / DELETE USER
async function iudUser({ mode, userId, userName, pwd, active, uid }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("Mode",     sql.Int,         mode)
    .input("Userid",   sql.Int,         uid || 0)
    .input("UserName", sql.NVarChar(30), userName || "")
    .input("Pwd",      sql.NVarChar(30), pwd || "")
    .input("active",   sql.Bit,         active ?? 1)
    .execute("PR_IUD_UserM");
  return result.recordset;
}

// 🔹 GET MENUS + EXISTING PERMISSIONS FOR A USER
async function getUserPermissions(userId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("Userid", sql.Int, userId)
    .execute("PR_Get_MenuData_ForUsermanagement");
  return {
    menus:  result.recordsets[0],
    rights: result.recordsets[1],
  };
}

// 🔹 SAVE PERMISSIONS JSON
async function savePermissions(json) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("json", sql.NVarChar(sql.MAX), json)
    .execute("PR_Insert_UserMenus");
  return result.recordset;
}

module.exports = { getUsers, iudUser, getUserPermissions, savePermissions };