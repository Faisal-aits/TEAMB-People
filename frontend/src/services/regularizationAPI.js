// src/services/regularizationAPI.js
import api from './api';

export const regularizationAPI = {
  // ── Admin: Settings ────────────────────────────────────────────────────────
  getSettings: () => api.get('/attendance/regularization/settings'),
  updateSettings: (data) => api.put('/attendance/regularization/settings', data),

  // ── Admin: All requests (with optional filters) ────────────────────────────
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    return api.get(`/attendance/regularization?${params.toString()}`);
  },

  // ── Admin: Stats ───────────────────────────────────────────────────────────
  getStats: () => api.get('/attendance/regularization/stats'),

  // ── Admin: Approve ─────────────────────────────────────────────────────────
  approve: (id, admin_remarks = '') =>
    api.post(`/attendance/regularization/${id}/approve`, { admin_remarks }),

  // ── Admin: Reject ──────────────────────────────────────────────────────────
  reject: (id, admin_remarks = '') =>
    api.post(`/attendance/regularization/${id}/reject`, { admin_remarks }),

  // ── Admin: Delete ──────────────────────────────────────────────────────────
  deleteRequest: (id) => api.delete(`/attendance/regularization/${id}`),

  // ── Employee: Own requests ─────────────────────────────────────────────────
  getMyRequests: () => api.get('/attendance/regularization/my'),

  // ── Employee: Monthly usage vs limit ──────────────────────────────────────
  getMyMonthlyUsage: () => api.get('/attendance/regularization/my/usage'),

  // ── Employee: Submit new request ───────────────────────────────────────────
  create: (data) => api.post('/attendance/regularization', data),
};
