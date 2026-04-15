// services/projectAPI.js
import api from './api';
import axios from 'axios';
export const projectAPI = {
  // ==================== EXISTING PROJECT METHODS ====================

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

 update: (id, data) => api.put(`/projects/${id}`, data),
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

  // Get project leads
  getProjectLeads: () => api.get('/projects/project-leads'),

  // Assign team to project
  assignTeam: (projectId, teamData) =>
    api.post(`/projects/${projectId}/assign`, teamData),

  // Get employees for dropdown
  getEmployees: () => api.get('/projects/employees'),

  // Get project tasks
  getProjectTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),

  // Get project team
  getProjectTeam: (projectId) => api.get(`/projects/${projectId}/team`),

  // Get project phases
  getProjectPhases: (projectId) => api.get(`/projects/${projectId}/phases`),

  // Update project phase by ID
  updateProjectPhaseById: (projectId, phaseId, data) =>
    api.put(`/projects/${projectId}/phases/${phaseId}`, data),

  // Add document to phase
  addPhaseDocument: (projectId, phaseId, data) =>
    api.post(`/projects/${projectId}/phases/${phaseId}/documents`, data),

  // Remove document from phase
  removePhaseDocument: (projectId, phaseId, docId) =>
    api.delete(`/projects/${projectId}/phases/${phaseId}/documents/${docId}`),

  // Get detailed stats
  getDetailedStats: () => api.get('/projects/stats/detailed'),

  // Export projects to Excel
  exportProjects: () => api.get('/projects/export', { responseType: 'blob' }),

  // Bulk delete projects
  bulkDeleteProjects: (projectIds) => api.post('/projects/bulk-delete', { project_ids: projectIds }),

  // Bulk update project status
  bulkUpdateProjectStatus: (projectIds, status) =>
    api.post('/projects/bulk-status', { project_ids: projectIds, status }),

  // Get overdue projects
  getOverdueProjects: () => api.get('/projects/overdue'),

  // Get my projects
  getMyProjects: () => api.get('/projects/my-projects'),

  // ==================== TASK MANAGEMENT METHODS ====================

  // Get all tasks
  getAllTasks: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.assigned_to_member) params.append('assigned_to_member', filters.assigned_to_member);
    return api.get(`/tasks?${params.toString()}`);
  },

  // Get task by ID
  getTaskById: (id) => api.get(`/tasks/${id}`), // Fixed: was /projects/${id}

  createTask: (taskData) => {
  return api.post('/tasks', taskData);
},

  // Update task
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData), // Fixed: was /projects/${id}

  // Delete task
  deleteTask: (id) => api.delete(`/tasks/${id}`), // Fixed: was /projects/${id}

  // Accept task
  acceptTask: (id) => api.post(`/tasks/${id}/accept`), // Fixed: was /projects/${id}/accept

  // Get user projects
  getUserTasks: (userId) => api.get(`/users/${userId}/tasks`),

  // Get team tasks
  getTeamTasks: (teamId) => api.get(`/teams/${teamId}/tasks`), // Fixed: was /projects/${teamId}/tasks

  // Get overdue tasks
  getOverdueTasks: () => api.get('/tasks/overdue'), // Fixed: was /projects/overdue

  // Get blocked tasks
  getBlockedTasks: () => api.get('/tasks/blocked'), // Fixed: was /projects/blocked

  // Get my tasks
  getMyTasks: () => api.get('/tasks/my-tasks'), // Fixed: was /projects/my-tasks

  // Bulk update task status
  bulkUpdateTaskStatus: (taskIds, status) =>
    api.put('/tasks/bulk/status', { task_ids: taskIds, status }), // Fixed: was /projects/bulk/status

  // Bulk assign tasks
  bulkAssignTasks: (taskIds, assigneeId, assignerRole) =>
    api.put('/tasks/bulk/assign', { task_ids: taskIds, assignee_id: assigneeId, assigner_role: assignerRole }), // Fixed: was /projects/bulk/assign

  // Add comment to task
  addTaskComment: (taskId, comment) => api.post(`/tasks/${taskId}/comments`, { comment }), // Fixed: was /projects/${taskId}/comments

  // Get task comments
  getTaskComments: (taskId) => api.get(`/tasks/${taskId}/comments`), // Fixed: was /projects/${taskId}/comments

  // Add time log
  addTimeLog: (taskId, data) => api.post(`/tasks/${taskId}/time-log`, data), // Fixed: was /projects/${taskId}/time-log

  // Get time logs
  getTimeLogs: (taskId) => api.get(`/tasks/${taskId}/time-logs`), // Fixed: was /projects${taskId}/time-logs

  // ==================== TEAM MANAGEMENT METHODS ====================

  // Get all teams
  getAllTeams: () => api.get('/teams'), // Fixed: was /projects

  // Get team by ID
  getTeamById: (id) => api.get(`/teams/${id}`), // Fixed: was /projects/${id}

  // Create team
  // In your projectAPI service
  createTeam: (teamData) => {
    // console.log('API call - createTeam with data:', JSON.stringify(teamData, null, 2));
    return api.post('/teams', teamData);
  },
  addTeamMembers: (teamId, membersData) => {
    return api.post(`/teams/${teamId}/members`, membersData); // Optional: separate endpoint for adding members
  },

  // Update team
  updateTeam: (id, data) => api.put(`/teams/${id}`, data), // Fixed: was /projects/${id}

  // Delete team
  deleteTeam: (id) => api.delete(`/teams/${id}`), // Fixed: was /projects/${id}

  // Add member to team
  addTeamMember: (data) => api.post('/teams/members', data), // Fixed: was /projects/members

  // Remove member from team
  removeTeamMember: (teamId, employeeId) =>
    api.delete(`/teams/${teamId}/members/${employeeId}`), // Fixed: was /projects/${teamId}/members/${employeeId}

  // Get team members
  getTeamMembers: (teamId) => api.get(`/teams/${teamId}/members`), // Fixed: was /projects/${teamId}/members

  // Get teams by employee
  getTeamsByEmployee: (employeeId) => api.get(`/employees/${employeeId}/teams`), // Fixed: was /employees/${employeeId}/projects

  // Get available employees for team
  getAvailableEmployees: (teamId) => api.get(`/teams/${teamId}/available-employees`), // Fixed: was /projects/${teamId}/available-employees

  // Get team leads
  getTeamLeads: () => api.get('/teams/leads'), // Fixed: was /team-leads

  // Get all employees
  getAllEmployees: () => api.get('/employees'), // Fixed: was /all-employees

  // Bulk add members to team
  bulkAddTeamMembers: (teamId, employeeIds, roleInTeam) =>
    api.post(`/teams/${teamId}/members/bulk`, { employee_ids: employeeIds, role_in_team: roleInTeam }), // Fixed: was /projects/${teamId}/members/bulk

  // ==================== DAILY REPORT METHODS ====================

  // Get daily reports
  getDailyReports: (employeeId, date) => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (date) params.append('date', date);
    return api.get(`/daily-reports?${params.toString()}`);
  },

  // Submit daily report
  submitDailyReport: (data) => api.post('/daily-reports', data), // Fixed: was /projects

  // Get employee daily reports
  getEmployeeDailyReports: (employeeId) => api.get(`/daily-reports/employee/${employeeId}`), // Fixed: was /projects/${employeeId}

  // Export daily reports
  exportDailyReports: (date) => api.get(`/daily-reports/export/${date}`, { responseType: 'blob' }), // Fixed: was /projects/export/${date}

  // ==================== NOTIFICATION METHODS ====================

  // Get notifications
  getNotifications: () => api.get('/notifications'), // Fixed: was /projects

  // Send notification
  sendNotification: (data) => api.post('/notifications/send', data), // Fixed: was /projects/send

  // Mark notification as read
  markNotificationRead: (notificationId) => api.put(`/notifications/${notificationId}/read`), // Fixed: was /projects/${notificationId}/read

  // Mark all notifications as read
  markAllNotificationsRead: () => api.put('/notifications/read-all'), // Fixed: was /projects/read-all

  // ==================== ASSIGNMENT METHODS ====================

  // Assign to team lead
  assignToTeamLead: (taskId, teamLeadId) =>
    api.put(`/tasks/${taskId}/assign-team-lead`, { team_lead_id: teamLeadId }), // Fixed: was /projects/${taskId}/assign-team-lead

  // Assign to member
  assignToMember: (taskId, memberId) =>
    api.put(`/tasks/${taskId}/assign-member`, { member_id: memberId }),
  assignMultipleEmployees: (taskId, employeeIds) =>
    api.post(`/tasks/${taskId}/assign-multiple`, { employeeIds }),

  getTaskAssignees: (taskId) =>
    api.get(`/tasks/${taskId}/assignees`),

  removeTaskAssignee: (taskId, employeeId) =>
    api.delete(`/tasks/${taskId}/assignees/${employeeId}`),

  // In projectAPI.js, make sure this method exists:
  bulkAssignMembers: (taskId, memberIds) => {
    // console.log('Calling bulkAssignMembers with:', { taskId, memberIds });
    return api.post(`/tasks/${taskId}/bulk-assign`, { member_ids: memberIds });
  },
};