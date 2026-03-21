// src/services/authService.js
import axios from 'axios';

// In production (Vercel) VITE_API_URL is set to the Render backend URL.
// In local dev it's empty, so Vite proxy handles /api → localhost:5000.
const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
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

export const registerCompany = async (data) => (await api.post('/auth/register', data)).data;
export const loginUser = async (data) => {
  const r = await api.post('/auth/login', data);
  if (r.data.success) {
    localStorage.setItem('pmb_token', r.data.data.token);
    localStorage.setItem('pmb_auth',  JSON.stringify(r.data.data));
  }
  return r.data;
};
export const changePassword = async (data) => (await api.post('/auth/change-password', data)).data;
export const getMe          = async ()      => (await api.get('/auth/me')).data;
export const logout         = ()            => {
  localStorage.removeItem('pmb_token');
  localStorage.removeItem('pmb_auth');
};
export const getStoredAuth  = () => {
  try {
    const raw = localStorage.getItem('pmb_auth');
    const tok = localStorage.getItem('pmb_token');
    if (!raw || !tok) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export default api;