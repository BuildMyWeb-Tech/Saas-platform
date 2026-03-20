// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading, isTemporaryPassword } = useAuth();
  const location = useLocation();

  if (isLoading) return (
    <div className="page-loader">
      <div className="pmb-spinner" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  // Force password change screen
  if (isTemporaryPassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

// src/components/AdminRoute.jsx
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminRoute({ children }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) return (
    <div className="page-loader">
      <div className="pmb-spinner" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/admin/login" state={{ from: location }} replace />;

  return children;
}