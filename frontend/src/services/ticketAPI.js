import api from './api';

export const ticketAPI = {
  // Raise a new ticket
  create: (ticketData) => {
    if (ticketData instanceof FormData) {
      return api.post('/tickets', ticketData, {
        headers: { 'Content-Type': undefined }
      });
    }
    return api.post('/tickets', ticketData);
  },

  // Get secure ticket attachment blob URL
  getAttachment: async (id) => {
    const response = await api.get(`/tickets/${id}/attachment`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  // List tickets with filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.search) params.append('search', filters.search);
    return api.get(`/tickets?${params.toString()}`);
  },

  // Get detailed view of a ticket
  getById: (id) => api.get(`/tickets/${id}`),

  // Update a ticket
  update: (id, updateData) => api.put(`/tickets/${id}`, updateData),

  // Add a reply/comment to a ticket
  addComment: (ticketId, comment) => api.post(`/tickets/${ticketId}/comments`, { comment }),

  // Get comments history of a ticket
  getComments: (ticketId) => api.get(`/tickets/${ticketId}/comments`),
};
