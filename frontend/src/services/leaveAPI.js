// src/services/leaveAPI.js
import api from './api';

export const leaveAPI = {
  // ==================== ADMIN ENDPOINTS ====================

  // Get all leave requests (for admin)
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.leave_type) params.append('leave_type', filters.leave_type);
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

  // Get leave balances for a specific employee (admin)
  getBalances: (employeeId, year = new Date().getFullYear()) =>
    api.get(`/leaves/balances/${employeeId}?year=${year}`),

  // Fetch and open medical document for a leave request (admin)
  // Returns a blob URL string that can be passed to window.open()
  getDocument: async (leaveId) => {
    const response = await api.get(`/leaves/${leaveId}/document`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  // ==================== EMPLOYEE ENDPOINTS ====================

  // Get current user's leaves (employee)
  getMyLeaves: () => api.get('/leaves/my'),

  // Submit new leave request (employee)
  // leaveData can be a plain object or FormData (when a file is attached)
  create: (leaveData) => {
    if (leaveData instanceof FormData) {
      // Let the axios interceptor strip Content-Type so the browser sets multipart boundary
      return api.post('/leaves', leaveData);
    }
    return api.post('/leaves', leaveData);
  },

  // Delete leave request (employee - only their own pending leaves)
  delete: (leaveId) => api.delete(`/leaves/${leaveId}`),

  // Get leave balances for the logged-in employee (self)
  getMyBalances: (year = new Date().getFullYear()) =>
    api.get(`/leaves/balances/my?year=${year}`),

  // Get active leave types
  getLeaveTypes: () => api.get('/leaves/types')
};