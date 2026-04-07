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

  // Get employee attendance history - Use existing endpoint
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

  // Employee specific methods
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
      timeout: 30000
    });
  },

  getAttendancePercentage: (employeeId, month = null, year = null) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return api.get(`/attendance/percentage/${employeeId}?${params.toString()}`);
  },

  verifyMyFaceAndMarkAttendance: (formData) => {
    return api.post('/attendance/my/verify-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });
  },

  getMyHistory: () => api.get('/attendance/my/history'),

  markAbsent: () => api.post('/attendance/mark-absent'),

  markMyAttendance: (attendanceData) => api.post('/attendance/my/mark', attendanceData),

  // ✅ FIXED: Use existing getEmployeeHistory endpoint instead
  getEmployeeAttendance: (employeeId, month, year) => {
    // Use the existing getEmployeeHistory endpoint
    // Filter by month/year on frontend since backend might not support it
    return api.get(`/attendance/history/${employeeId}`).then(response => {
      let attendance = response.data.attendance || response.data.data || [];
      
      // Filter by month and year on frontend
      if (month && year) {
        attendance = attendance.filter(record => {
          const recordDate = new Date(record.date || record.check_in_time);
          return recordDate.getMonth() + 1 === parseInt(month) && 
                 recordDate.getFullYear() === parseInt(year);
        });
      }
      
      return { data: { attendance } };
    });
  },

  getEmployeeShift: (employeeId, date) => {
    return api.get('/attendance/employee-shift', {
      params: { employeeId, date }
    });
  },

  getMonthlyAttendanceSummary: (employeeId, month, year) => {
    // Use existing endpoint or create summary from history
    return api.get(`/attendance/history/${employeeId}`).then(response => {
      let attendance = response.data.attendance || response.data.data || [];
      
      // Filter by month and year
      if (month && year) {
        attendance = attendance.filter(record => {
          const recordDate = new Date(record.date || record.check_in_time);
          return recordDate.getMonth() + 1 === parseInt(month) && 
                 recordDate.getFullYear() === parseInt(year);
        });
      }
      
      // Calculate summary
      const summary = {
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        halfDay: attendance.filter(a => a.status === 'half-day').length
      };
      
      return { data: { summary, attendance } };
    });
  },

  getTodayAttendance: (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    return api.get(`/attendance/history/${employeeId}`).then(response => {
      let attendance = response.data.attendance || response.data.data || [];
      const todayRecord = attendance.find(record => {
        const recordDate = new Date(record.date || record.check_in_time).toISOString().split('T')[0];
        return recordDate === today;
      });
      return { data: { attendance: todayRecord ? [todayRecord] : [] } };
    });
  },
  // src/services/attendanceAPI.js - Add this method

// src/services/attendanceAPI.js
getMonthlySummary: async (employeeId, month, year) => {
    // Convert month name to number if needed
    let monthNumber = month;
    if (isNaN(month) && month) {
        const months = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        monthNumber = months[month];
    }
    
    // Use the correct endpoint
    return api.get(`/attendance/summary/${employeeId}?month=${monthNumber}&year=${year}`);
},
};