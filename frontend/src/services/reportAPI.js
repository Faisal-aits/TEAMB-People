// src/services/reportAPI.js
import api from './api';

export const reportAPI = {
  // Get all reports
  getAll: () => api.get('/reports'),

   // Get recent reports for dashboard - ADD THIS!
  getRecent: (limit = 3) => api.get(`/reports/recent?limit=${limit}`),

  // Get report by ID
  getById: (id) => api.get(`/reports/${id}`),

  // Create new report
  create: (reportData) => api.post('/reports', reportData),

  // Update report
  update: (id, reportData) => api.put(`/reports/${id}`, reportData),

  // Delete report
  delete: (id) => api.delete(`/reports/${id}`),
};