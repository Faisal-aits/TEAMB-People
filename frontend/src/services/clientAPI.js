// src/services/clientAPI.js
import api from './api';

export const clientAPI = {
  // Get all clients
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/clients?${params.toString()}`);
  },

  // Get client by ID
  getById: (id) => api.get(`/clients/${id}`),

  // Create new client
  create: (clientData) => api.post('/clients', clientData),

  // Update client
  update: (id, clientData) => api.put(`/clients/${id}`, clientData),

  // Delete client
  delete: (id) => api.delete(`/clients/${id}`),

  // Add interaction
  addInteraction: (clientId, interactionData) => 
    api.post(`/clients/${clientId}/interactions`, interactionData),

  // Get managers list
  getManagers: () => api.get('/clients/managers'),

  // Get industries list
  getIndustries: () => api.get('/clients/industries'),

  // Add new industry
  addIndustry: (industryName) => api.post('/clients/industries', { industry: industryName }),
};