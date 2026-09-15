import api from './api';

export const breakAPI = {  // Employee Endpoints
  breakIn: (data = {}) => api.post('/break/in', data),
  breakOut: (data = {}) => api.post('/break/out', data),
  getMyTodayBreaks: () => api.get('/break/my-today'),
  getMyHistory: () => api.get('/break/my-history'),

  // Admin Endpoints
  adminBreakIn: (employeeId) => api.post('/break/in', { employeeId }),
  adminBreakOut: (employeeId) => api.post('/break/out', { employeeId }),
  getAllBreaks: (params) => api.get('/break/all', { params }),
  getEmployeeHistory: (employeeId) => api.get(`/break/history/${employeeId}`),
};
