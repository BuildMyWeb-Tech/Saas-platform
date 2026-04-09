// backend/services/userService.js
const repo = require("../repositories/userRepo");

// 🔹 GET USERS (active=1 / inactive=0)
async function getUsers(tag = 1) {
  const rows = await repo.getUsers(tag);
  return rows
    .filter(r => r.uid !== null)
    .map((r, i) => ({
      serialNo:   r.serial_no ?? i + 1,
      uid:        Number(r.uid),
      username:   r.username,
      menuAccess: Number(r.MenuAccess ?? 0),
      active:     Number(r.active ?? 1),
      // ❌ userpassword intentionally omitted
    }));
}

// 🔹 CREATE USER → returns new userId
// SP returns: { ResponseCode: 101, ResponseMessage: "Saved Successfully", Userid: 8 }
// ResponseCode 101 = success, 102 = already exists / error
async function createUser({ userName, pwd, active }) {
  const result = await repo.iudUser({ mode: 1, uid: 0, userName, pwd, active });
  const row = result[0];

  const isSuccess = Number(row?.ResponseCode) === 101;

  return {
    success:         isSuccess,
    responseCode:    row?.ResponseCode,
    responseMessage: row?.ResponseMessage,
    // ✅ SP returns "Userid" (capital U, lowercase serid)
    userId: isSuccess ? (row?.Userid ?? row?.userid ?? row?.UserId ?? row?.UID ?? row?.uid) : null,
  };
}

// 🔹 UPDATE USER
async function updateUser({ uid, userName, pwd, active }) {
  const result = await repo.iudUser({ mode: 2, uid, userName, pwd, active });
  return result[0];
}

// 🔹 SOFT DELETE (active = 0)
async function deleteUser({ uid }) {
  const result = await repo.iudUser({ mode: 3, uid, userName: "", pwd: "", active: 0 });
  return result[0];
}

// 🔹 GET PERMISSIONS (menus + rights merged)
// SP PR_Get_MenuData_ForUsermanagement returns:
//   Dataset 1: ResponseCode, ResponseMessage, menumuid, menuname, menudid, SubMenuName
//   Dataset 2: existing permissions (empty array for new users)
async function getUserPermissions(userId) {
  const { menus, rights } = await repo.getUserPermissions(userId);

  // Build rights lookup by menudid
  const rightsMap = {};
  if (rights && rights.length > 0) {
    rights.forEach(r => {
      const key = r.MenuDUid ?? r.menudid ?? r.Menudid;
      if (key != null) {
        rightsMap[Number(key)] = {
          MWrite:  Number(r.MWrite  ?? r.mwrite  ?? 0),
          MRead:   Number(r.MRead   ?? r.mread   ?? 0),
          MUpdate: Number(r.MUpdate ?? r.mupdate ?? 0),
          MDelete: Number(r.MDelete ?? r.mdelete ?? 0),
          MPrint:  Number(r.MPrint  ?? r.mprint  ?? 0),
          UID:     Number(r.UID     ?? r.uid     ?? 0),
        };
      }
    });
  }

  // Map using actual SP column names: menudid, SubMenuName, menuname (parent)
  const finalMenus = (menus || [])
    .filter(m => m.menudid != null && Number(m.menudid) > 0)
    .map(m => ({
      menuDUid:   Number(m.menudid),
      menuName:   m.SubMenuName || "",
      parentMenu: m.menuname    || "General",
      permissions: rightsMap[Number(m.menudid)] || {
        MWrite: 0, MRead: 0, MUpdate: 0, MDelete: 0, MPrint: 0, UID: 0,
      },
    }));

  return finalMenus;
}

// 🔹 SAVE PERMISSIONS
async function savePermissions(userId, permissionsMap) {
  const json = Object.entries(permissionsMap)
    .filter(([menuId]) => {
      const n = Number(menuId);
      return !isNaN(n) && n > 0;
    })
    .map(([menuId, p]) => ({
      UID:      p.UID || 0,
      UserUid:  Number(userId),
      MenuDUid: Number(menuId),
      MWrite:   p.MWrite  ?? 0,
      MRead:    p.MRead   ?? 0,
      MUpdate:  p.MUpdate ?? 0,
      MDelete:  p.MDelete ?? 0,
      MPrint:   p.MPrint  ?? 0,
    }));

  if (json.length === 0) {
    return { ResponseMessage: "No permissions to save" };
  }

  const result = await repo.savePermissions(JSON.stringify(json));
  return result[0];
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserPermissions,
  savePermissions,
};