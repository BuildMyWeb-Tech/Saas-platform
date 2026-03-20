// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredAuth, logout as logoutSvc } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null, company: null, token: null,
    isTemporaryPassword: false,
  });

  useEffect(() => {
    const stored = getStoredAuth();
    const token  = localStorage.getItem('pmb_token');
    if (stored && token) {
      setState({ isAuthenticated: true, isLoading: false, user: stored.user, company: stored.company, token, isTemporaryPassword: stored.isTemporaryPassword || false });
    } else {
      setState(p => ({ ...p, isLoading: false }));
    }
  }, []);

  const login = useCallback((data) => {
    setState({ isAuthenticated: true, isLoading: false, user: data.user, company: data.company, token: data.token, isTemporaryPassword: data.isTemporaryPassword || false });
  }, []);

  const logout = useCallback(() => {
    logoutSvc();
    setState({ isAuthenticated: false, isLoading: false, user: null, company: null, token: null, isTemporaryPassword: false });
  }, []);

  const clearTempPassword = useCallback(() => {
    setState(p => ({ ...p, isTemporaryPassword: false }));
    const raw = localStorage.getItem('pmb_auth');
    if (raw) {
      try { const d = JSON.parse(raw); d.isTemporaryPassword = false; localStorage.setItem('pmb_auth', JSON.stringify(d)); } catch {}
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearTempPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};