import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenus } from '../services/authService';

import {
  Settings,
  ClipboardList,
  Printer,
  Package,
  Truck,
  Users,
  LayoutDashboard,
  ChevronDown,
  Building2,
  UserCog,
  Users2,
  Factory,
  Workflow,
  FileText,Menu, X
} from "lucide-react";
import { User, LogOut } from "lucide-react";

// 🟢 MENU ICON MAP (MAIN MENU)
const MENU_ICONS = {
  'Setup': Settings,
  'Planning': ClipboardList,
  'Pre Press': Printer,
  'Press': Printer,
  'Post Press': Package,
  'Logistics': Truck,
  'User Management': Users,
};


// 🟢 SUBMENU ICON MAP
const SUBMENU_ICONS = {
  'Department': Building2,
  'Designation': UserCog,
  'Employees': Users2,
  'Machines': Factory,
  'Process': Workflow,
  'Job Card': FileText,
};


// 🟢 ROUTE GENERATOR
function getRoute(menuName, subName) {
  const section = menuName.toLowerCase().replace(/\s+/g, '-');
  const sub = subName.toLowerCase().replace(/\s+/g, '-');
  return `/${section}/${sub}`;
}


// 🟢 SIDEBAR MENU COMPONENT
function SidebarMenu({ group, isOpen, onToggle }) {
  const location = useLocation();
  const Icon = MENU_ICONS[group.menu] || Settings;

  const isAnyChildActive = group.subMenus.some(sub => {
    const route = getRoute(group.menu, sub.name);
    return location.pathname.startsWith(route);
  });

  return (
    <div className="sidebar-menu-group">

      <button
        className={`sidebar-menu-btn ${isAnyChildActive ? 'has-active' : ''}`}
        onClick={onToggle}
      >
        <span className="sidebar-menu-icon">
          <Icon size={18} />
        </span>

        <span className="sidebar-menu-label">{group.menu}</span>

        <ChevronDown
          size={16}
          className={`sidebar-menu-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      <div className={`sidebar-submenu ${isOpen ? 'open' : ''}`}>
        {group.subMenus.map(sub => {
          const route = getRoute(group.menu, sub.name);
          const SubIcon = SUBMENU_ICONS[sub.name];

          return (
            <NavLink
              key={sub.id}
              to={route}
              className={({ isActive }) =>
                `sidebar-submenu-item ${isActive ? 'active' : ''}`
              }
            >
              {SubIcon && <SubIcon size={14} style={{ marginRight: 8 }} />}
              {sub.name}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}


// 🟢 MAIN LAYOUT
export default function AppLayout() {
  const { userId, username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menus, setMenus] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // 🔥 LOAD MENUS FROM API
  useEffect(() => {
    if (!userId) return;

    getMenus(userId)
      .then(res => {
        if (res.success) {
          setMenus(res.data);

          const initial = {};
          res.data.forEach((g, i) => {
            const hasActive = g.subMenus.some(sub =>
              location.pathname.startsWith(getRoute(g.menu, sub.name))
            );

            if (hasActive || i === 0) initial[g.menu] = true;
          });

          setOpenGroups(initial);
        }
      })
      .catch(console.error)
      .finally(() => setMenuLoading(false));

  }, [userId, location.pathname]);


  // 🔥 MOBILE CLOSE
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);


  // 🔥 BODY SCROLL LOCK
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);


  const toggleGroup = useCallback((name) => {
    setOpenGroups(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  }, []);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="app-layout">

      {/* SIDEBAR */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* LOGO */}
        <div className="app-sidebar-brand">
          <div className="app-logo-text">
            <span className="app-logo-name">Mr. Press</span>
            <span className="app-logo-sub">Management</span>
          </div>
        </div>


        {/* NAV */}
        <nav className="app-sidebar-nav">

          {/* DASHBOARD */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-dashboard-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-menu-icon">
              <LayoutDashboard size={18} />
            </span>
            <span className="sidebar-menu-label">Dashboard</span>
          </NavLink>


          {/* DYNAMIC MENUS */}
          {menuLoading ? (
            <div style={{ padding: 20 }}>Loading...</div>
          ) : (
            menus.map(group => (
              <SidebarMenu
                key={group.menu}
                group={group}
                isOpen={!!openGroups[group.menu]}
                onToggle={() => toggleGroup(group.menu)}
              />
            ))
          )}

        </nav>


        {/* FOOTER */}
        <div className="app-sidebar-footer">
  <div className="app-user-info">
    {/* <User size={18} className="icon" /> */}
    {/* <span>{username}</span> */}
    {/* <span>User ID: {userId}</span> */}
  </div>

  <button className="app-logout-btn" onClick={handleLogout}>
    <LogOut size={18} className="icon" />        </button>
</div>

      </aside>


      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="app-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      {/* MAIN */}
      <div className="app-main">

        {/* TOPBAR */}
        <header className="app-topbar">

         <button
  className="app-hamburger"
  onClick={() => setSidebarOpen(!sidebarOpen)}
>
  {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
</button>

          <div className="app-topbar-brand">
            Mr. Press Management
          </div>

          {/* <div className="app-topbar-user" onClick={handleLogout}>
            {username}
          </div> */}

        </header>


        {/* CONTENT */}
        <main className="app-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}