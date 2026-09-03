// src/services/api.js
import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/super-admin`,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('super_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('super_admin_token');
      localStorage.removeItem('super_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const superAdminAPI = {
  login: (credentials) => api.post('/login', credentials),
  getProfile: () => api.get('/profile'),
  getDashboard: () => api.get('/dashboard'),
  getTenants: (params) => api.get('/tenants', { params }),
  getTenant: (id) => api.get(`/tenants/${id}`),
  createTenant: (data) => api.post('/tenants', data),
  updateTenant: (id, data) => api.put(`/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/tenants/${id}`),
  getSmtpConfig: () => api.get('/smtp'),
  updateSmtpConfig: (data) => api.post('/smtp', data),
  testSmtpConfig: (data) => api.post('/smtp/test', data),
};

export default api;
