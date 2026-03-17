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

  // Create new salary record
  create: (salaryData) => api.post('/salary/records', salaryData),

  // Update salary record
  update: (id, salaryData) => api.put(`/salary/records/${id}`, salaryData),

  // Delete salary record
  delete: (id) => api.delete(`/salary/records/${id}`),

  // Get employees for dropdown
  getEmployees: () => api.get('/salary/employees'),

  // Get departments for dropdown
  getDepartments: () => api.get('/salary/departments'),

  // Generate payslip
  generatePayslip: (id) => api.get(`/salary/payslip/${id}`),

  // Get salary statistics
  getStats: () => api.get('/salary/stats'),

    // Generate payslip PDF download
  generatePayslip: (id) => {
    return api.get(`/salary/payslip/${id}`, {
      responseType: 'blob' // Important for file download
    });
  },

  // Generate payslip preview (base64)
  generatePayslipPreview: (id) => api.get(`/salary/payslip-preview/${id}`),

  // Send payslip via email
  sendPayslipEmail: (id, emailData) => api.post(`/salary/payslip/${id}/email`, emailData),
};