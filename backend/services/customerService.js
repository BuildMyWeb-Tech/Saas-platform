// services/customerService.js
const repo = require("../repositories/customerRepo");

// ─── Normalise a raw grid row from PR_GetPartyM_FrontGrid ───────────────────
// The SP may alias columns differently than the raw table column names.
// This function checks every likely variant so the frontend always gets
// consistent field names regardless of how the SP aliases its SELECT list.
//
// To confirm actual column names from your SP, temporarily uncomment the
// console.log inside getCustomers() below and check your server terminal.
function normaliseGridRow(row) {
  return {
    uid: row.uid ?? row.UID ?? 0,

    Pcode: row.Pcode ?? row.pcode ?? "",

    // ✅ FIX HERE
    Pname: row.Pname 
        ?? row.pname 
        ?? row.Customer   // ← THIS LINE SOLVES YOUR ISSUE
        ?? row.name 
        ?? "",

    Pbranch: row.Pbranch ?? row.pbranch ?? row.branch ?? "",

    State: row.State ?? row.state ?? "",

    GSTNo: row.GSTNo ?? row.gstno ?? "",

    Mobile: row.Mobile ?? row.mobile ?? null,

    Active: row.Active ?? row.active ?? 1,
  };
}

// 🔹 GET GRID
async function getCustomers(active) {
  const data = await repo.getCustomerGrid(active);

  return data.map(normaliseGridRow);
}

// 🔹 GET SINGLE (for edit form)
async function getCustomerById(uid) {
  const data = await repo.getCustomerForEdit(uid);
  return data;
}

// 🔹 CREATE  (uid = 0, Pcode NOT sent — auto-generated in SP)
async function createCustomer(body) {
  const payload = {
    Active:        body.Active        ?? 1,
    Address1:      body.Address1      || "",
    Address2:      body.Address2      || "",
    City:          body.City          || "",
    GSTNo:         body.GSTNo         || "",
    Mobile:        body.Mobile        != null ? body.Mobile        : null,
    Pbranch:       body.Pbranch       || "",
    Pincode:       body.Pincode       != null ? body.Pincode       : null,
    Pname:         body.Pname         || "",
    Ptype:         2,
    State:         body.State         || "",
    contactperson: body.contactperson || "",
    country:       "India",
    email:         body.email         || "",
    uid:           0,
    website:       body.website       || "",
  };

  const result = await repo.iudCustomer(JSON.stringify(payload));
  return result[0];
}

// 🔹 UPDATE  (uid = existing id, Pcode passed back as read-only)
async function updateCustomer(uid, body) {
  const payload = {
    Active:        body.Active        ?? 1,
    Address1:      body.Address1      || "",
    Address2:      body.Address2      || "",
    City:          body.City          || "",
    GSTNo:         body.GSTNo         || "",
    Mobile:        body.Mobile        != null ? body.Mobile        : null,
    Pbranch:       body.Pbranch       || "",
    Pcode:         body.Pcode         || "",
    Pincode:       body.Pincode       != null ? body.Pincode       : null,
    Pname:         body.Pname         || "",
    Ptype:         2,
    State:         body.State         || "",
    contactperson: body.contactperson || "",
    country:       "India",
    email:         body.email         || "",
    uid:           Number(uid),
    website:       body.website       || "",
  };

  const result = await repo.iudCustomer(JSON.stringify(payload));
  return result[0];
}

// 🔹 DELETE (soft — Active = 0, passes full existing record to SP)
async function deleteCustomer(uid, existingData) {
  const payload = {
    Active:        0,
    Address1:      existingData?.Address1      || "",
    Address2:      existingData?.Address2      || "",
    City:          existingData?.City          || "",
    GSTNo:         existingData?.GSTNo         || "",
    Mobile:        existingData?.Mobile        != null ? existingData.Mobile        : null,
    Pbranch:       existingData?.Pbranch       || "",
    Pcode:         existingData?.Pcode         || "",
    Pincode:       existingData?.Pincode       != null ? existingData.Pincode       : null,
    Pname:         existingData?.Pname         || "",
    Ptype:         2,
    State:         existingData?.State         || "",
    contactperson: existingData?.contactperson || "",
    country:       "India",
    email:         existingData?.email         || "",
    uid:           Number(uid),
    website:       existingData?.website       || "",
  };

  const result = await repo.iudCustomer(JSON.stringify(payload));
  return result[0];
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};