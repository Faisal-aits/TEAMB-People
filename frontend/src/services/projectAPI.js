import api from './api';

export const projectAPI = {
  // Get all projects
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.department) params.append('department', filters.department);
    if (filters.manager) params.append('manager', filters.manager);
    if (filters.phase) params.append('phase', filters.phase);
    
    return api.get(`/projects?${params.toString()}`);
  },

  // Get project by ID
  getById: (id) => api.get(`/projects/${id}`),

  // Create new project
  create: (projectData) => api.post('/projects', projectData),

  // Update project
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),

  // Delete project
  delete: (id) => api.delete(`/projects/${id}`),

  // Update project phase
  updatePhase: (projectId, phaseName, phaseData) => 
    api.put(`/projects/${projectId}/phases/${phaseName}`, phaseData),

  // Get dashboard statistics
  getStats: () => api.get('/projects/stats'),

  // Get managers list
  getManagers: () => api.get('/projects/managers'),

  // Get departments list
  getDepartments: () => api.get('/projects/departments'),

  // Assign team to project
  assignTeam: (projectId, teamData) => 
    api.post(`/projects/${projectId}/assign`, teamData),

  // Get employees for dropdown
  getEmployees: () => api.get('/projects/employees'),
};