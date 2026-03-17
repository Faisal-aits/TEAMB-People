// src/services/shiftAPI.js
import api from './api';

export const shiftAPI = {
  // Get all shifts
  getAll: () => api.get('/shifts'),

  // Get default shift
  getDefault: () => api.get('/shifts/default'),

  // Get available employees
  getEmployees: () => api.get('/shifts/employees'),

  // Get shift by ID
  getById: (shiftId) => api.get(`/shifts/${shiftId}`),

  // Get employees in shift
  getShiftEmployees: (shiftId) => api.get(`/shifts/${shiftId}/employees`),

  // Create shift
  create: (shiftData) => api.post('/shifts', shiftData),

  // Update shift
  update: (shiftId, shiftData) => api.put(`/shifts/${shiftId}`, shiftData),

  // Set shift as default
  setAsDefault: (shiftId) => api.post(`/shifts/${shiftId}/set-default`),

  // Delete shift
  delete: (shiftId) => api.delete(`/shifts/${shiftId}`)
};