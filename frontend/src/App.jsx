// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute      from './components/PrivateRoute';
import AppLayout         from './components/AppLayout';
import Login             from './pages/Login';
import Dashboard         from './pages/Dashboard';
import PlaceholderPage   from './pages/PlaceholderPage';

// Helper to build placeholder routes for a section
const ph = (section, subs) => subs.map(sub => (
  <Route
    key={`${section}/${sub}`}
    path={`/${section}/${sub}`}
    element={<PlaceholderPage />}
  />
));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — all behind AppLayout */}
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Setup */}
            {ph('setup', ['department','designation','employees','machines','process','customers'])}

            {/* Planning */}
            {ph('planning', ['job-card','process-planning'])}

            {/* Pre Press */}
            {ph('pre-press', ['process-booking'])}

            {/* Press */}
            {ph('press', ['process-booking','ideal-hours-booking'])}

            {/* Post Press */}
            {ph('post-press', ['process-booking'])}

            {/* Logistics */}
            {ph('logistics', ['courier-booking','courier-tracking'])}

            {/* User Management */}
            {ph('usermgmt', ['users'])}
            {ph('user-management', ['users'])}

            {/* 404 within app */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}