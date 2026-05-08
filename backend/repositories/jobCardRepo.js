const { poolPromise, sql } = require("../database/sqlConnection");

// ======================================================
// NORMALIZE SQL ROWS → FRONTEND FORMAT
// ======================================================
function normalizeRow(row) {
  return {
    uid:
      row.uid ??
      row.UID ??
      0,

    // SQL may return DocNo OR "JC No"
    DocNo:
      row.DocNo ??
      row["JC No"] ??
      "",

    // SQL may return DocDate OR "JC Date"
    DocDate:
      row.DocDate ??
      row["JC Date"] ??
      null,

    JobName:
      row.JobName ??
      "",

    // SQL may return JobDesc1
    JobDesc:
      row.JobDesc ??
      row.JobDesc1 ??
      "",

    ContactPerson:
      row.ContactPerson ??
      "",

    // SQL may return MobileNo
    ContactMobile:
      row.ContactMobile ??
      row.MobileNo ??
      null,

    CustomerUid:
      row.CustomerUid ??
      null,

    DelivaryDate:
      row.DelivaryDate ??
      null,

    Active: Number(
      row.Active ??
      row.active ??
      0
    ),
  };
}

// ======================================================
// GET GRID
// SP RETURNS:
//   recordsets[0] => Active records
//   recordsets[1] => Inactive records
// ======================================================
async function getJobCardGrid(active) {
  const pool = await poolPromise;

  const result = await pool.request()
    .execute("PR_GetJobcarddata_frontgrid");

  // Merge ALL result sets
  const allRows = [
    ...(result.recordsets?.[0] || []),
    ...(result.recordsets?.[1] || []),
  ];

  // Normalize rows
  const normalized = allRows.map(normalizeRow);

  // Filter based on active/inactive toggle
  return normalized.filter(
    row => Number(row.Active) === Number(active)
  );
}

// ======================================================
// GET SINGLE RECORD FOR EDIT
// ======================================================
async function getJobCardForEdit(uid) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Uid", sql.Int, uid)
    .execute("PR_GetJobcarddata_Foredit");

  const row = result.recordset?.[0];

  if (!row) return null;

  return normalizeRow(row);
}

// ======================================================
// INSERT / UPDATE
// ======================================================
async function iudJobCard(jsonData) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Json", sql.NVarChar(sql.MAX), jsonData)
    .execute("PR_IUDJobCard");

  // SQL returns:
  // [
  //   {
  //     ResponseCode,
  //     ResponseMessage,
  //     Uid
  //   }
  // ]

  return result.recordsets?.[0]?.[0] || null;
}

// ======================================================
// DELETE / RESTORE
// Status = 0 => Delete (Inactive)
// Status = 1 => Restore (Active)
// ======================================================
async function deleteRestoreJobCard(uid, status) {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("Uid", sql.Int, uid)
    .input("Status", sql.Int, status)
    .execute("PR_Delete_JobCard");

  return result.recordsets?.[0]?.[0] || null;
}

module.exports = {
  getJobCardGrid,
  getJobCardForEdit,
  iudJobCard,
  deleteRestoreJobCard,
};