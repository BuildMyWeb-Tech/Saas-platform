// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, logout as logoutSvc } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: true,
    userId: null,
    username: null,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored?.userId) {
      setState({ isAuthenticated: true, isLoading: false, userId: stored.userId, username: stored.username });
    } else {
      setState(p => ({ ...p, isLoading: false }));
    }
  }, []);

  const login = useCallback(({ userId, username }) => {
    setState({ isAuthenticated: true, isLoading: false, userId, username });
  }, []);

  const logout = useCallback(() => {
    logoutSvc();
    setState({ isAuthenticated: false, isLoading: false, userId: null, username: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};