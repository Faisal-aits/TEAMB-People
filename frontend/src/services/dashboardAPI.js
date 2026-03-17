// src/services/dashboardAPI.js
import api from './api';

export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => api.get('/dashboard/stats'),

  // Get students chart data
  getStudentsChart: () => api.get('/dashboard/students-chart'),

  // Get projects overview for pie chart
  getProjectsOverview: () => api.get('/dashboard/projects-overview'),



  // Get recent projects
  getRecentProjects: () => api.get('/dashboard/recent-projects'),

  // Get notifications
  getNotifications: () => api.get('/dashboard/notifications'),

  // Mark notification as read
  markNotificationAsRead: (id) => api.put(`/dashboard/notifications/${id}/read`),

  // Mark all notifications as read
  markAllNotificationsAsRead: () => api.put('/dashboard/notifications/read-all'),
};

export default dashboardAPI;