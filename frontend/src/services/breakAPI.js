import api from './api';

export const breakAPI = {
  // Employee Endpoints
  breakIn: () => api.post('/break/in'),
  breakOut: () => api.post('/break/out'),
  getMyTodayBreaks: () => api.get('/break/my-today'),
  getMyHistory: () => api.get('/break/my-history'),

  // Admin Endpoints
  getAllBreaks: (params) => api.get('/break/all', { params }),
  getEmployeeHistory: (employeeId) => api.get(`/break/history/${employeeId}`),
};
