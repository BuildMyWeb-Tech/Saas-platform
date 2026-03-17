// src/services/authService.js
// ─────────────────────────────────────────────
//  Auth API Service Layer
//  All HTTP calls to /api/auth go through here
// ─────────────────────────────────────────────

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pmb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('pmb_token');
      localStorage.removeItem('pmb_user');
      window.location.href = '/login?reason=session_expired';
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

/**
 * Register a new company
 * @param {{ companyName, gstNumber, email, username, password }} data
 */
export const registerCompany = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/**
 * Verify company email with OTP
 * @param {{ companyCode, verificationCode }} data
 */
export const verifyCompany = async (data) => {
  const response = await api.post('/auth/verify', data);
  return response.data;
};

/**
 * Login and receive JWT
 * @param {{ companyCode, username, password }} data
 */
export const loginUser = async (data) => {
  const response = await api.post('/auth/login', data);

  if (response.data.success) {
    // Persist auth data to localStorage
    localStorage.setItem('pmb_token', response.data.data.token);
    localStorage.setItem('pmb_user', JSON.stringify(response.data.data));
  }

  return response.data;
};

/**
 * Resend verification code
 * @param {{ companyCode }} data
 */
export const resendVerification = async (data) => {
  const response = await api.post('/auth/resend-verification', data);
  return response.data;
};

/**
 * Fetch current user profile (protected)
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

/**
 * Clear auth data from localStorage
 */
export const logout = () => {
  localStorage.removeItem('pmb_token');
  localStorage.removeItem('pmb_user');
};

/**
 * Get stored auth data (from localStorage)
 */
export const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('pmb_user');
    const token = localStorage.getItem('pmb_token');
    if (!stored || !token) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export default api;
