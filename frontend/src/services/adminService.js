// src/services/adminService.js
import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api/admin',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmb_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && err.config?.url !== '/auth/login') {
      localStorage.removeItem('pmb_admin_token');
      localStorage.removeItem('pmb_admin');
      window.location.href = '/admin/login?reason=session_expired';
    }
    return Promise.reject(err);
  }
);

export const adminLogin = async ({ username, password }) => {
  const r = await adminApi.post('/auth/login', { username, password });
  if (r.data.success) {
    localStorage.setItem('pmb_admin_token', r.data.data.token);
    localStorage.setItem('pmb_admin',       JSON.stringify(r.data.data.admin));
  }
  return r.data;
};

export const adminLogout = () => {
  localStorage.removeItem('pmb_admin_token');
  localStorage.removeItem('pmb_admin');
};

export const getAdminMe = async () => {
  const r = await adminApi.get('/me');
  return r.data;
};

export const getStats = async () => {
  const r = await adminApi.get('/stats');
  return r.data;
};

export const getCompanies = async (params = {}) => {
  const r = await adminApi.get('/companies', { params });
  return r.data;
};

export const getCompanyById = async (id) => {
  const r = await adminApi.get(`/companies/${id}`);
  return r.data;
};

export const approveCompany = async (id, note = '') => {
  const r = await adminApi.post(`/companies/${id}/approve`, { note });
  return r.data;
};

export const rejectCompany = async (id, reason = '') => {
  const r = await adminApi.post(`/companies/${id}/reject`, { reason });
  return r.data;
};

export const resendCredentials = async (id) => {
  const r = await adminApi.post(`/companies/${id}/resend-credentials`);
  return r.data;
};

export const getStoredAdmin = () => {
  try {
    const raw   = localStorage.getItem('pmb_admin');
    const token = localStorage.getItem('pmb_admin_token');
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

export default adminApi;