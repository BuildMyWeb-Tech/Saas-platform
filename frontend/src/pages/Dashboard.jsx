// src/pages/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { icon: '🖨️', value: '0', label: 'Printers Online',  sub: 'No devices registered' },
  { icon: '📋', value: '0', label: 'Active Jobs',       sub: 'Queue is empty' },
  { icon: '🎨', value: '0', label: 'Templates',         sub: 'None created yet' },
  { icon: '✅', value: '0', label: 'Jobs Completed',    sub: 'This month' },
];

const MODULES = [
  { icon: '📡', title: 'Printer Devices',    desc: 'Register and manage your IoT printer fleet.' },
  { icon: '📋', title: 'Print Job Queue',    desc: 'Create and dispatch print jobs in real-time.' },
  { icon: '🎨', title: 'Branding Templates', desc: 'Logos, brand colors, and box designs.' },
  { icon: '👥', title: 'Team Members',       desc: 'Invite users with role-based access control.' },
  { icon: '📊', title: 'Analytics',          desc: 'Monitor volumes, uptime, and completion rates.' },
  { icon: '⚙️', title: 'Settings',           desc: 'Company profile, API keys, and preferences.' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      <header className="topbar">
        <div className="topbar-left">
          <div className="auth-logo-icon" style={{ width: 26, height: 26, fontSize: 13, borderRadius: 6 }}>🖨️</div>
          <span className="topbar-logo">PrintMixBox</span>
          <div className="topbar-divider" />
          <span className="topbar-company">{company?.companyCode}</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-user"><span>{user?.username}</span></span>
          <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>
            {greeting()}, {user?.username}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {company?.companyName} &nbsp;·&nbsp; {(company?.plan || 'free').charAt(0).toUpperCase() + (company?.plan || 'free').slice(1)} plan
          </p>
        </div>

        <div className="stats-grid">
          {STATS.map(s => (
            <div className="stat-card" key={s.label}>
              <div style={{ fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">Company Details</span>
            <span className="badge badge-green">● Verified</span>
          </div>
          <div>
            {[
              { label: 'Company Name', value: company?.companyName },
              { label: 'Company Code', value: company?.companyCode, mono: true },
              { label: 'Username',     value: user?.username },
              { label: 'Role',         value: user?.role, capitalize: true },
              { label: 'Plan',         value: company?.plan || 'Free', capitalize: true },
            ].map(r => (
              <div className="info-row" key={r.label}>
                <span className="info-row-label">{r.label}</span>
                <span className={`info-row-value${r.mono ? ' mono' : ''}`} style={r.capitalize ? { textTransform: 'capitalize' } : {}}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="section-header">
          <h2>Platform Modules</h2>
          <p>These modules are under development and will be available soon.</p>
        </div>
        <div className="modules-grid">
          {MODULES.map(m => (
            <div className="module-card coming-soon" key={m.title}>
              <div className="module-card-tag">
                <span className="badge badge-yellow" style={{ fontSize: 10 }}>Coming Soon</span>
              </div>
              <div className="module-card-icon">{m.icon}</div>
              <h3 className="module-card-title">{m.title}</h3>
              <p className="module-card-desc">{m.desc}</p>
            </div>
          ))}
        </div> */}
      </main>
    </div>
  );
}