const menuRepo = require("../repositories/menuRepo");

async function getDashboardData(userId) {
  const menus = await menuRepo.getMenus(userId);

  const totalMenus = new Set(menus.map(m => m.menuname)).size;

  return {
    userId,
    totalMenus,
    totalSubMenus: menus.length
  };
}

module.exports = { getDashboardData };