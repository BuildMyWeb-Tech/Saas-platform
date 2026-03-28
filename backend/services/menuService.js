const menuRepo = require("../repositories/menuRepo");

async function getGroupedMenus(userId) {
  const rawMenus = await menuRepo.getMenus(userId);

  const grouped = {};

  rawMenus.forEach(item => {
    const menuName = item.menuname;

    if (!grouped[menuName]) {
      grouped[menuName] = {
        menu: menuName,
        subMenus: []
      };
    }

    grouped[menuName].subMenus.push({
      id: item.menudid,
      name: item.SubMenuName
    });
  });

  return Object.values(grouped);
}

module.exports = { getGroupedMenus };