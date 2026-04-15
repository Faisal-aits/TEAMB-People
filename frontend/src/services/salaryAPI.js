// src/services/salaryAPI.js
import api from './api';

export const salaryAPI = {
  // Get all salary records
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.employee) params.append('employee', filters.employee);
    if (filters.department) params.append('department', filters.department);
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);
    if (filters.status) params.append('status', filters.status);
    return api.get(`/salary/records?${params.toString()}`);
  },

  // Get salary record by ID
  getById: (id) => api.get(`/salary/records/${id}`),

  // Create salary record
  create: (data) => api.post('/salary/records', data),

  // Update salary record
  update: (id, data) => api.put(`/salary/records/${id}`, data),

  // Delete salary record
  delete: (id) => api.delete(`/salary/records/${id}`),

  // Get employees for dropdown
  getEmployees: () => api.get('/salary/employees'),

  // Get departments for dropdown
  getDepartments: () => api.get('/salary/departments'),

  // Get salary statistics
  getStats: () => api.get('/salary/stats'),

  // Get salary by department
  getByDepartment: (month, year) => api.get(`/salary/by-department?month=${month}&year=${year}`),

  // Generate payslip
  generatePayslip: (id) => api.get(`/salary/payslip/${id}`, { responseType: 'blob' }),

  // Generate payslip preview
  generatePayslipPreview: (id) => api.get(`/salary/payslip-preview/${id}`),

  // Send payslip email
  sendPayslipEmail: (id, data) => api.post(`/salary/send-payslip/${id}`, data),

  // Bulk create salary records
  bulkCreate: (data) => api.post('/salary/bulk-create', data),

  calculateFromAttendance: (data) => {
    console.log('API call - calculateFromAttendance with data:', data);
    return api.post('/salary/calculate-from-attendance', {
        employee_id: data.employee_id,
        month: data.month,
        year: data.year,
        basic_salary: data.basic_salary
    });
  },

  // 👇 ADD THIS NEW METHOD 👇
  // Get current logged-in employee's salary records
  getMySalaryRecords: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.year) params.append('year', filters.year);
    const queryString = params.toString();
   return api.get(`/salary/my-records${queryString ? `?${queryString}` : ''}`);
  },
};

export default salaryAPI;