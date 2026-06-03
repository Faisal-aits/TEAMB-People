// src/services/reportAPI.js
import api from './api';

export const reportAPI = {
  getRecent: (limit) => api.get(`/dashboard/reports?limit=${limit}`), // Placeholder
};

export default reportAPI;
