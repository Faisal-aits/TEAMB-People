// src/services/integrationAPI.js
import api from './api';

export const integrationAPI = {
  // List all API keys for the current tenant
  listApiKeys: () => api.get('/admin/integration/keys'),

  // Generate a new API key
  generateApiKey: (name, projectId = null) => api.post('/admin/integration/keys', { name, project_id: projectId }),

  // Revoke an existing API key
  revokeApiKey: (id) => api.delete(`/admin/integration/keys/${id}`),

  // Retrieve audit logs for external API integration activities
  getAuditLogs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.api_key_id) params.append('api_key_id', filters.api_key_id);
    if (filters.limit) params.append('limit', filters.limit);
    return api.get(`/admin/integration/audit-logs?${params.toString()}`);
  }
};

export default integrationAPI;
