// src/pages/Dashboard.jsx
// ─────────────────────────────────────────────
//  Main Dashboard — post-login landing page
//  Shows stats + module cards for future features
// ─────────────────────────────────────────────

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MODULES = [
  {
    icon: '📡',
    title: 'Printer Devices',
    desc: 'Register and manage your IoT printer fleet, assign locations, and monitor connectivity.',
    tag: null,
    ready: false,
  },
  {
    icon: '📋',
    title: 'Print Job Queue',
    desc: 'Create, dispatch, and track print jobs across all your devices in real-time.',
    tag: null,
    ready: false,
  },
  {
    icon: '🎨',
    title: 'Branding Templates',
    desc: 'Upload logos, set brand colors, and design box templates for consistent output.',
    tag: null,
    ready: false,
  },
  {
    icon: '👥',
    title: 'Team Management',
    desc: 'Invite operators and admins to your company workspace with role-based access.',
    tag: null,
    ready: false,
  },
  {
    icon: '📊',
    title: 'Analytics',
    desc: 'Monitor print volumes, device uptime, and job completion rates over time.',
    tag: null,
    ready: false,
  },
  {
    icon: '⚙️',
    title: 'Settings',
    desc: 'Configure your company profile, billing, API keys, and notification preferences.',
    tag: null,
    ready: false,
  },
];

const Dashboard = () => {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-layout">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="auth-logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>🖨️</div>
          <span className="topbar-logo">PrintMixBox</span>
          <div className="topbar-divider" />
          <span className="topbar-company">{company?.companyCode}</span>
        </div>

        <div className="topbar-right">
          <span className="topbar-user">
            Signed in as <span>{user?.username}</span>
          </span>
          <div style={{
            background: 'var(--teal-muted)',
            border: '1px solid var(--border-glow)',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--teal)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {user?.role}
          </div>
          <button
            className="btn btn-ghost"
            onClick={handleLogout}
            style={{ padding: '8px 16px', fontSize: 12 }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Greeting */}
        <div className="dashboard-greeting">
          <h1>
            {greeting()}, {user?.username} 👋
          </h1>
          <p>
            // {company?.companyName} &nbsp;·&nbsp; {company?.plan?.toUpperCase() || 'FREE'} plan
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '🖨️', value: '0', label: 'Printers Online', badge: 'No devices yet' },
            { icon: '📋', value: '0', label: 'Active Jobs', badge: 'Queue empty' },
            { icon: '🎨', value: '0', label: 'Templates', badge: 'Create one' },
            { icon: '✅', value: '0', label: 'Jobs Completed', badge: 'This month' },
          ].map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-badge">{stat.badge}</div>
            </div>
          ))}
        </div>

        {/* Company Info Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, var(--teal), var(--blue))',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}>
            🏭
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              {company?.companyName}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: 1 }}>
                COMPANY CODE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--teal)', letterSpacing: 2 }}>
                {company?.companyCode}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: 1 }}>
                STATUS
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>
                ● VERIFIED
              </div>
            </div>
          </div>
        </div>

        {/* Platform Modules */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, letterSpacing: -0.3 }}>
            Platform Modules
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            // Coming soon — building out the full IoT suite
          </p>
        </div>

        <div className="modules-grid">
          {MODULES.map((mod) => (
            <div
              key={mod.title}
              className={`module-card coming-soon`}
            >
              {mod.tag && <span className="module-card-tag">{mod.tag}</span>}
              <div className="module-card-icon">{mod.icon}</div>
              <h3 className="module-card-title">{mod.title}</h3>
              <p className="module-card-desc">{mod.desc}</p>
              <div style={{
                marginTop: 16,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--warning)',
                letterSpacing: 1,
              }}>
                COMING SOON
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
