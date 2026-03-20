// src/services/authService.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('pmb_token');
      localStorage.removeItem('pmb_auth');
      window.location.href = '/login?reason=session_expired';
    }
    return Promise.reject(err);
  }
);

export const registerCompany = async (data) => {
  const r = await api.post('/auth/register', data);
  return r.data;
};

export const loginUser = async (data) => {
  const r = await api.post('/auth/login', data);
  if (r.data.success) {
    localStorage.setItem('pmb_token', r.data.data.token);
    localStorage.setItem('pmb_auth',  JSON.stringify(r.data.data));
  }
  return r.data;
};

export const changePassword = async (data) => {
  const r = await api.post('/auth/change-password', data);
  return r.data;
};

export const getMe = async () => {
  const r = await api.get('/auth/me');
  return r.data;
};

export const logout = () => {
  localStorage.removeItem('pmb_token');
  localStorage.removeItem('pmb_auth');
};

export const getStoredAuth = () => {
  try {
    const raw   = localStorage.getItem('pmb_auth');
    const token = localStorage.getItem('pmb_token');
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export default api;