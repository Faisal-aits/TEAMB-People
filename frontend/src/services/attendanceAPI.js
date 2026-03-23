// src/services/attendanceAPI.js
import api from './api';

export const attendanceAPI = {
  // Get all attendance records
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);
    return api.get(`/attendance?${params.toString()}`);
  },

  // Get employee attendance history
  getEmployeeHistory: (employeeId) => api.get(`/attendance/history/${employeeId}`),
  mark: (attendanceData) => api.post('/attendance/mark', attendanceData),

  // Approve attendance
  approve: (attendanceId) => api.post(`/attendance/${attendanceId}/approve`),

  // Reject attendance
  reject: (attendanceId, remarks = null) => api.post(`/attendance/${attendanceId}/reject`, { remarks }),

  // Get shifts
  getShifts: () => api.get('/attendance/shifts'),

  // Get statistics
  getStats: (date = null) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    return api.get(`/attendance/stats?${params.toString()}`);
  },

  // ✅ ADD THESE 3 NEW METHODS RIGHT HERE - Employee specific
  getMyTodayAttendance: () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get(`/attendance/my/today?date=${today}`);
  },

  getAllWithFilters: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.department) params.append('department', filters.department);
    if (filters.status) params.append('status', filters.status);
    return api.get(`/attendance/report?${params.toString()}`);
  },

  identifyAndMarkAttendance: (formData) => {
    return api.post('/attendance/identify-and-mark', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout for face recognition
    });
  },

  // In attendanceAPI.js - Add this method after getStats
  getAttendancePercentage: (employeeId, month = null, year = null) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return api.get(`/attendance/percentage/${employeeId}?${params.toString()}`);
  },

  // attendanceAPI.js - ADD THIS METHOD
  verifyMyFaceAndMarkAttendance: (formData) => {
    return api.post('/attendance/my/verify-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });
  },

  getMyHistory: () => api.get('/attendance/my/history'),

  // In attendanceAPI.js - add this method:
  markAbsent: () => api.post('/attendance/mark-absent'),

  markMyAttendance: (attendanceData) => api.post('/attendance/my/mark', attendanceData)

};

