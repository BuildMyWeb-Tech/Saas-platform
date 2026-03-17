import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredAuth, logout as logoutService, getMe } from '../services/authService';

// ✅ CHANGE THIS LINE
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    company: null,
    token: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredAuth();
      const token = localStorage.getItem('pmb_token');

      if (stored && token) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: stored.user,
          company: stored.company,
          token,
        });

        try {
          await getMe();
        } catch {}
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = useCallback((authData) => {
    const { token, user, company } = authData;
    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user,
      company,
      token,
    });
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      company: null,
      token: null,
    });
  }, []);

  const updateUser = useCallback((userData) => {
    setAuthState((prev) => ({
      ...prev,
      user: { ...prev.user, ...userData },
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ✅ OPTIONAL (can keep or remove)
export default AuthContext;