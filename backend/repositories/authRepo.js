const { poolPromise, sql } = require("../database/sqlConnection");

async function validateUser(username, password) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("username", sql.VarChar, username)
    .input("password", sql.VarChar, password)
    .execute("PR_Validate_UserLogin");

  return result.recordset[0];
}

module.exports = { validateUser };