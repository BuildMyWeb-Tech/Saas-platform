const repo = require("../repositories/menuRepo");

async function getGroupedMenus(userId) {
  const rows = await repo.getUserMenus(userId);

  console.log("RAW MENU ROWS:", rows); // keep for debug

  const groups = {};

  for (const row of rows) {
    // ✅ MAIN MENU (from DB)
    const parentMenu =
      row.menuname ||      // ✅ correct column
      row.MenuName ||
      row.menu ||
      "General";

    // ✅ SUB MENU (from DB)
    const subName =
      row.SubMenuName ||   // ✅ correct column
      row.submenuname ||
      row.name;

    // ✅ UNIQUE ID (from DB)
    const subId =
      row.menudid ||       // ✅ correct column
      row.MenuID ||
      row.id;

    // ✅ PERMISSIONS (if available later)
    const mWrite  = Number(row.MWrite ?? 0);
    const mUpdate = Number(row.MUpdate ?? 0);
    const mDelete = Number(row.MDelete ?? 0);


// const isAdmin = Number(userId) === 2;

// const mWrite  = isAdmin ? 1 : Number(row.MWrite ?? 0);
// const mUpdate = isAdmin ? 1 : Number(row.MUpdate ?? 0);
// const mDelete = isAdmin ? 1 : Number(row.MDelete ?? 0);    


    if (!subName) continue;

    if (!groups[parentMenu]) {
      groups[parentMenu] = {
        menu: parentMenu,
        subMenus: []
      };
    }

    // ✅ REMOVE DUPLICATES
    const exists = groups[parentMenu].subMenus.find(
      m => m.name === subName
    );

    if (!exists) {
      groups[parentMenu].subMenus.push({
        id: subId,
        name: subName,
        mWrite,
        mUpdate,
        mDelete
      });
    }
  }

  return Object.values(groups);
}

module.exports = { getGroupedMenus };