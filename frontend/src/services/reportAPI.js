// src/services/reportAPI.js
import api from './api';

// Helper function to convert date to MySQL datetime format
const toMySQLDateTime = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already in MySQL format (YYYY-MM-DD HH:MM:SS)
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return dateValue;
  }
  
  // Convert Date object or ISO string to MySQL datetime
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const reportAPI = {
  // Get all reports
  getAll: () => api.get('/reports'),

  // Get recent reports for dashboard
  getRecent: (limit = 3) => api.get(`/reports/recent?limit=${limit}`),

  // Get report by ID
  getById: (id) => api.get(`/reports/${id}`),

  // Create new report - auto-format date
  create: (reportData) => {
    const formattedData = { ...reportData };
    if (formattedData.date_generated) {
      formattedData.date_generated = toMySQLDateTime(formattedData.date_generated);
    }
    console.log('Creating report with formatted date:', formattedData);
    return api.post('/reports', formattedData);
  },

  // Update report - auto-format date
  update: (id, reportData) => {
    const formattedData = { ...reportData };
    if (formattedData.date_generated) {
      formattedData.date_generated = toMySQLDateTime(formattedData.date_generated);
    }
    console.log('Updating report with formatted date:', formattedData);
    return api.put(`/reports/${id}`, formattedData);
  },

  // Delete report
  delete: (id) => api.delete(`/reports/${id}`),
};