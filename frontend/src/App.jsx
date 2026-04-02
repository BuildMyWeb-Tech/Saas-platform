// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import PrivateRoute      from './components/PrivateRoute';
import AppLayout         from './components/AppLayout';

import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';

// Setup modules — all powered by GeneralMaster
import Department  from './pages/setup/Department';
import Designation from './pages/setup/Designation';
import Employees   from './pages/setup/Employees';
import Machines    from './pages/setup/Machines';
import Process     from './pages/setup/Process';

// Placeholder helper for future modules
const ph = (section, subs) => subs.map(sub => (
  <Route key={`${section}/${sub}`} path={`/${section}/${sub}`} element={<PlaceholderPage />} />
));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* ── Setup ── all 5 modules live */}
            <Route path="setup/department"  element={<Department />} />
            <Route path="setup/designation" element={<Designation />} />
            <Route path="setup/employees"   element={<Employees />} />
            <Route path="setup/machines"    element={<Machines />} />
            <Route path="setup/process"     element={<Process />} />
            {ph('setup', ['customers'])}

            {/* ── Other modules (placeholders) ── */}
            {ph('planning',       ['job-card', 'process-planning'])}
            {ph('pre-press',      ['process-booking'])}
            {ph('press',          ['process-booking', 'ideal-hours-booking'])}
            {ph('post-press',     ['process-booking'])}
            {ph('logistics',      ['courier-booking', 'courier-tracking'])}
            {ph('usermgmt',       ['users'])}
            {ph('user-management',['users'])}

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}