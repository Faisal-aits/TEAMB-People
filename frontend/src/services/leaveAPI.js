// src/services/leaveAPI.js
import api from './api';

export const leaveAPI = {
  // ==================== ADMIN ENDPOINTS ====================
  
  // Get all leave requests (for admin)
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    return api.get(`/leaves?${params.toString()}`);
  },

  // Approve leave request (admin)
  approve: (leaveId) => api.post(`/leaves/${leaveId}/approve`),

  // Reject leave request (admin)
  reject: (leaveId) => api.post(`/leaves/${leaveId}/reject`),

  // Get leave statistics (admin)
  getStats: () => api.get('/leaves/stats'),

  // Get employee attendance history (admin)
  getEmployeeAttendanceHistory: (employeeId) => api.get(`/leaves/history/${employeeId}`),

  // ==================== EMPLOYEE ENDPOINTS ====================
  
  // Get current user's leaves (employee)
  getMyLeaves: () => api.get('/leaves/my'),

  // Submit new leave request (employee)
  create: (leaveData) => api.post('/leaves', leaveData),

  // Delete leave request (employee - only their own pending leaves)
  delete: (leaveId) => api.delete(`/leaves/${leaveId}`)
};