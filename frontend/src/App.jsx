// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { AuthProvider }      from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Route guards
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';

// Company portal pages
import Register       from './pages/Register';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';

// Admin panel pages
import AdminLogin     from './pages/admin/AdminLogin';
import AdminLayout    from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Companies      from './pages/admin/Companies';
import CompanyDetail  from './pages/admin/CompanyDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>
          <Routes>

            {/* ── Company Portal ─────────────────────────── */}
            <Route path="/register" element={<Register />} />
            <Route path="/login"    element={<Login />} />

            <Route path="/dashboard" element={
              <PrivateRoute><Dashboard /></PrivateRoute>
            } />

            <Route path="/change-password" element={
              <PrivateRoute><ChangePassword /></PrivateRoute>
            } />

            {/* ── Admin Panel ───────────────────────────── */}
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/admin" element={
              <AdminRoute><AdminLayout /></AdminRoute>
            }>
              <Route index          element={<AdminDashboard />} />
              <Route path="companies"     element={<Companies />} />
              <Route path="companies/:id" element={<CompanyDetail />} />
            </Route>

            {/* ── Redirects ─────────────────────────────── */}
            <Route path="/"  element={<Navigate to="/login" replace />} />
            <Route path="*"  element={<Navigate to="/login" replace />} />

          </Routes>
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}