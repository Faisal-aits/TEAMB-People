// src/services/employeeAPI.js
import api from './api';

export const employeeAPI = {
  // Get all employees
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.department_id) params.append('department_id', filters.department_id);
    if (filters.role_id) params.append('role_id', filters.role_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    return api.get(`/employees?${params.toString()}`);
  },

  // Get employee by ID
  getById: (id) => api.get(`/employees/${id}`),

  // Get current logged-in employee profile
  getMyProfile: () => api.get('/employees/my-profile'),

  // Create new employee
  create: (employeeData) => api.post('/employees', employeeData),

  // Update employee
  update: (id, employeeData) => api.put(`/employees/${id}`, employeeData),

  // Delete employee
  delete: (id) => api.delete(`/employees/${id}`),

  // Reset employee password
  resetPassword: (id, data) => api.post(`/employees/${id}/reset-password`, data),

  // Get roles for this tenant
  getRoles: () => api.get('/employees/roles'),

  // Get departments
  getDepartments: () => api.get('/employees/departments'),

  // Get positions
  getPositions: () => api.get('/employees/positions'),

  // Get suggested positions
  getSuggestedPositions: () => api.get('/employees/positions/suggested'),

  // Add new suggested position
  addSuggestedPosition: (positionData) => api.post('/employees/positions/suggested', positionData),

   // Enroll face for employee
  enrollFace: (employeeId, imageFile) => {
    const formData = new FormData();
    formData.append('faceImage', imageFile);
    formData.append('employeeId', employeeId);
    
    return api.post(`/employees/${employeeId}/enroll-face`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
    // Verify face using FormData
  verifyFace: (employeeId, imageFile) => {
    const formData = new FormData();
    formData.append('faceImage', imageFile);
    formData.append('employeeId', employeeId);
    
    return api.post('/employees/verify-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

    // Get face enrollment status
  getFaceStatus: (employeeId) => 
    api.get(`/employees/${employeeId}/face-status`),
};