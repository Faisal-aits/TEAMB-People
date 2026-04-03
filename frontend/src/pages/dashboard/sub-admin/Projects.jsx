import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { projectAPI } from '../../../services/projectAPI';
import './Projects.css';
import * as XLSX from 'xlsx';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [projectLeads, setProjectLeads] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const phases = ['Requirement Specification', 'System Design', 'Development', 'Integration & Testing', 'Deployment', 'Maintenance & Repeat Cycle'];
  const projectStatuses = ['On Track', 'Delayed', 'At Risk', 'Completed', 'On Hold'];
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [editFormData, setEditFormData] = useState({
  name: '',
  department: '',
  manager: '',
  start_date: '',
  end_date: '',
  current_phase: '',
  status: ''
});
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    project_lead: '',
    phase: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    delayedProjects: 0,
    completedProjects: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    project_lead: '',
    start_date: '',
    end_date: '',
    current_phase: '',
    status: 'On Track',
    description: ''
  });

  const [phaseFormData, setPhaseFormData] = useState({
    status: '',
    progress: '',
    comments: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

 useEffect(() => {
  // console.log('Project Leads loaded:', projectLeads);
  // console.log('Number of leads:', projectLeads.length);
  
  if (projectLeads.length > 0) {
    // console.log('Sample lead:', {
    //   id: projectLeads[0].id,
    //   idType: typeof projectLeads[0].id,
    //   name: projectLeads[0].name,
    //   position: projectLeads[0].position
    // });
  }
}, [projectLeads]);
// In Projects.js, update the API calls for teams:
const handleEditProject = (project) => {
  setSelectedProject(project);
  setEditFormData({
    name: project.name || '',
    department: project.department || '',
    manager: project.manager || project.project_lead_name || '',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    current_phase: project.current_phase || '',
    status: project.status || 'On Track'
  });
  setIsEditModalOpen(true);
};

const handleEditInputChange = (e) => {
  const { name, value } = e.target;
  setEditFormData(prev => ({ ...prev, [name]: value }));
};

const handleUpdateProject = async (e) => {
  e.preventDefault();
  
  try {
    const response = await projectAPI.update(selectedProject.id, editFormData);
    
    if (response.data.success) {
      // Update the project in the local state
      setProjects(prev => prev.map(proj => 
        proj.id === selectedProject.id ? response.data.data : proj
      ));
      setIsEditModalOpen(false);
      setSelectedProject(null);
      await fetchData(); // Refresh data to ensure consistency
      alert('Project updated successfully!');
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error('Error updating project:', err);
    alert(err.response?.data?.message || 'Failed to update project. Please try again.');
  }
};
// Fetch all employees for dropdown
const fetchEmployees = async () => {
  try {
    const res = await projectAPI.getAllEmployees();
    setEmployees(res.data.data || []);
  } catch (err) {
    console.error('Error fetching employees:', err);
  }
};

// Fetch team leads for assignment
const fetchTeamLeads = async () => {
  try {
    const res = await projectAPI.getTeamLeads();
    setTeamLeads(res.data.data || []);
  } catch (err) {
    console.error('Error fetching team leads:', err);
  }
};

// Fetch available employees for a team
const fetchAvailableEmployees = async (teamId) => {
  try {
    const res = await projectAPI.getAvailableEmployees(teamId);
    setAvailableEmployees(res.data.data || []);
  } catch (err) {
    console.error('Error fetching available employees:', err);
  }
};
const fetchData = async () => {
  try {
    setLoading(true);
    
    // console.log('Fetching projects...');
    let projectsRes;
    try {
      projectsRes = await projectAPI.getAll();
      // console.log('Projects response:', projectsRes);
    } catch (err) {
      console.error('Projects API failed:', err);
      projectsRes = { data: { success: false, data: [] } };
    }
    
    // console.log('Fetching stats...');
    let statsRes;
    try {
      statsRes = await projectAPI.getStats();
      // console.log('Stats response:', statsRes);
    } catch (err) {
      console.error('Stats API failed:', err);
      statsRes = { data: { success: false, data: {} } };
    }
    
    // console.log('Fetching employees...');
    let employeesRes;
    try {
      employeesRes = await projectAPI.getEmployees();
      // console.log('Employees response:', employeesRes);
    } catch (err) {
      console.error('Employees API failed:', err);
      employeesRes = { data: { success: false, data: [] } };
    }
    
    // Get departments from a direct database query through a custom endpoint
    // console.log('Fetching departments from departments table...');
    let deptsRes;
    try {
      // If you have a separate endpoint for departments from departments table
      // Use that endpoint instead
      deptsRes = await projectAPI.getDepartments();
      // console.log('Departments response:', deptsRes);
    } catch (err) {
      console.error('Departments API failed:', err);
      deptsRes = { data: { success: false, data: [] } };
    }

    // Set data
    if (projectsRes.data.success) {
      const projectsData = projectsRes.data.data || [];
      const projectsWithLead = projectsData.map(project => ({
        ...project,
        project_lead_name: project.manager
      }));
      setProjects(projectsWithLead);
    } else {
      setProjects([]);
    }
    
    if (statsRes.data.success) {
      setDashboardStats(statsRes.data.data || {});
    } else {
      setDashboardStats({ totalProjects: 0, activeProjects: 0, delayedProjects: 0, completedProjects: 0 });
    }
    
    if (employeesRes.data.success) {
      const employeesData = employeesRes.data.data || [];
      setEmployees(employeesData);
      
      const allEmployeesExceptHR = employeesData.filter(emp => {
        const role = emp.role_name?.toLowerCase();
        const position = emp.position?.toLowerCase();
        
        if (role === 'hr' || position === 'hr' || position === 'human resources') {
          return false;
        }
        return true;
      });
      
      setProjectLeads(allEmployeesExceptHR);
    } else {
      setProjectLeads([]);
    }
    
    // Handle departments - check if data exists
    if (deptsRes.data.success && deptsRes.data.data && deptsRes.data.data.length > 0) {
      setDepartments(deptsRes.data.data);
    } else {
      // If no departments from API, try to get from employees or use defaults
    
    }
    
    setError('');
    
  } catch (err) {
    console.error('Error fetching data:', err);
    setError('Failed to load projects. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhaseInputChange = (e) => {
    const { name, value } = e.target;
    setPhaseFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const sendNotificationToLead = async (projectLead, project) => {
    try {
      const notificationData = {
        user_id: projectLead.id,
        title: 'New Project Assignment',
        message: `You have been assigned as Project Lead for "${project.name}". Please review the project details.`,
        type: 'project_assignment',
        project_id: project.id,
        priority: 'high'
      };
      
      await projectAPI.sendNotification(notificationData);
      // console.log(`✅ Notification sent to ${projectLead.name}`);
    } catch (err) {
      console.error('❌ Error sending notification:', err);
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // console.log('Form Data:', formData);
  // console.log('Project Leads:', projectLeads);
  // console.log('Selected Lead ID:', formData.project_lead);
  
  if (!formData.name || !formData.department || !formData.project_lead) {
    alert('Please fill in all required fields (Project Name, Department, and Project Lead)');
    return;
  }

  try {
    // Find the lead - compare as strings (since employee_id is a string like 'AITS001')
    const selectedLead = projectLeads.find(lead => String(lead.id) === String(formData.project_lead));
    
    // console.log('Found lead:', selectedLead);
    
    if (!selectedLead) {
      alert(`Selected project lead not found. Available leads: ${projectLeads.map(l => `${l.id} - ${l.name}`).join(', ')}`);
      return;
    }

   const projectData = {
  name: formData.name,
  department: formData.department,
  manager: selectedLead.name,
  start_date: formData.start_date || null,
  end_date: formData.end_date || null,
  current_phase: formData.current_phase || 'Planning',
  status: formData.status,
  description: formData.description || ''
};

    const response = await projectAPI.create(projectData);
    
    if (response.data.success) {
      const newProject = response.data.data;
      setProjects(prev => [newProject, ...prev]);
      
      await sendNotificationToLead(selectedLead, newProject);
      
      setFormData({
        name: '', department: '', project_lead: '', start_date: '', 
        end_date: '', current_phase: '', status: 'On Track', description: ''
      });
      setIsModalOpen(false);
      await fetchData();
      alert(`✅ Project added successfully! Notification sent to ${selectedLead.name}`);
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error('Error creating project:', err);
    alert(err.response?.data?.message || 'Failed to create project. Please try again.');
  }
};

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await projectAPI.delete(selectedProject.id);
      
      if (response.data.success) {
        setProjects(prev => prev.filter(proj => proj.id !== selectedProject.id));
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedProject(null);
        await fetchData();
        alert('Project deleted successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project. Please try again.');
    }
  };

  const handleEditPhase = (project, phase) => {
    setSelectedProject(project);
    setSelectedPhase(phase);
    setPhaseFormData({
      status: phase.status,
      progress: phase.progress,
      comments: phase.comments || ''
    });
    setIsPhaseModalOpen(true);
  };

  const handleUpdatePhase = async (e, shouldClose = false) => {
    e.preventDefault();
    
    try {
      const response = await projectAPI.updatePhase(
        selectedProject.id, 
        selectedPhase.name, 
        phaseFormData
      );
      
      if (response.data.success) {
        setProjects(prev => prev.map(proj => 
          proj.id === selectedProject.id ? response.data.data : proj
        ));
        setSelectedProject(response.data.data);
        
        if (shouldClose) {
          setIsPhaseModalOpen(false);
          setSelectedPhase(null);
        }
        alert('Phase updated successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error updating phase:', err);
      alert(err.response?.data?.message || 'Failed to update phase. Please try again.');
    }
  };

  const handleExport = () => {
    try {
      if (filteredProjects.length === 0) {
        alert('No projects to export!');
        return;
      }

      const exportData = filteredProjects.map(project => ({
        'Project ID': `PROJ${String(project.id).padStart(3, '0')}`,
        'Project Name': project.name,
        'Department': project.department,
        'Project Lead': project.project_lead_name || project.manager,
        'Start Date': formatDate(project.start_date),
        'End Date': formatDate(project.end_date),
        'Current Phase': project.current_phase,
        'Overall Progress': `${project.progress}%`,
        'Status': project.status,
        'Description': project.description || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const wscols = [
        { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 40 }
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
      const fileName = `Projects_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`Exported ${filteredProjects.length} projects successfully!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  const getStatusBadge = (project) => {
    if (project.status?.toUpperCase() === 'DELAYED' || 
        project.status === 'Delayed' || 
        project.status?.toUpperCase() === 'AT RISK') {
      return (
        <span className="proj-status-badge proj-status-inactive">
          DELAYED
        </span>
      );
    }
    
    const progress = project.progress || 0;
    let displayStatus = 'ON TRACK';
    let statusClass = 'proj-status-active';
    
    if (progress === 100) {
      displayStatus = 'COMPLETED';
      statusClass = 'proj-status-active';
    } else if (progress === 0) {
      displayStatus = 'NOT STARTED';
      statusClass = 'proj-status-inactive';
    }

    return (
      <span className={`proj-status-badge ${statusClass}`}>
        {displayStatus}
      </span>
    );
  };

  const getPhaseStatusBadge = (status) => {
    const statusConfig = {
      'Completed': 'proj-status-active',
      'In Progress': 'proj-status-active',
      'Not Started': 'proj-status-inactive',
      'On Hold': 'proj-status-inactive',
      'Review': 'proj-status-active'
    };

    return (
      <span className={`proj-status-badge ${statusConfig[status] || 'proj-status-inactive'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredProjects = projects.filter(project => {
    if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.status && project.status !== filters.status) {
      return false;
    }
    if (filters.department && project.department !== filters.department) {
      return false;
    }
    if (filters.project_lead && project.project_lead_name !== filters.project_lead) {
      return false;
    }
    if (filters.phase && project.current_phase !== filters.phase) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="proj-management-section">
        <div className="proj-loading">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proj-management-section">
        <div className="proj-error">{error}</div>
        <button onClick={fetchData} className="proj-retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="proj-management-section" id="proj-management-main">
      {/* Header */}
      <div className="proj-management-header">
        <h2 id="proj-management-title">
          Project Management
          <span className="proj-hr-badge">HR Access</span>
        </h2>
        <button 
          className="proj-add-btn"
          id="proj-add-main-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="proj-btn-icon">+</span>
          Create New Project
        </button>
      </div>

      {/* Overview Dashboard */}
      <div className="proj-dashboard-stats">
        <div className="proj-stat-card" id="proj-stat-total">
          <div className="proj-stat-number">{dashboardStats.totalProjects}</div>
          <div className="proj-stat-label">Total Projects</div>
        </div>
        <div className="proj-stat-card" id="proj-stat-active">
          <div className="proj-stat-number">{dashboardStats.activeProjects}</div>
          <div className="proj-stat-label">Active Projects</div>
        </div>
        <div className="proj-stat-card" id="proj-stat-delayed">
          <div className="proj-stat-number">{dashboardStats.delayedProjects}</div>
          <div className="proj-stat-label">Delayed Projects</div>
        </div>
        <div className="proj-stat-card" id="proj-stat-completed">
          <div className="proj-stat-number">
            {projects.filter(project => 
              project.progress === 100 || 
              project.status?.toUpperCase() === 'COMPLETED'
            ).length}
          </div>
          <div className="proj-stat-label">Completed Projects</div>
        </div>
      </div>

      {/* Project Table */}
      <div className="proj-table-container proj-glass-form" id="proj-main-table">
        <div className="proj-table-header">
          <h3 id="proj-table-title">Project Directory</h3>
          <div className="proj-table-actions">
            <input
              type="text"
              placeholder="Search projects..."
              className="proj-filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="proj-filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              {projectStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select 
              className="proj-filter-select"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select 
              className="proj-filter-select"
              value={filters.project_lead}
              onChange={(e) => handleFilterChange('project_lead', e.target.value)}
            >
              <option value="">All Project Leads</option>
              {projectLeads.map(lead => (
                <option key={lead.id} value={lead.name}>{lead.name}</option>
              ))}
            </select>
            <button className="proj-export-btn" onClick={handleExport} disabled={filteredProjects.length === 0}>
              Export
            </button>
          </div>
        </div>
        
        <div className="proj-table-wrapper">
          <table className="proj-main-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Department</th>
                <th>Project Lead</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Current Phase</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.id}>
                  <td>
                    <div className="proj-name-cell">
                      <div 
                        className="proj-name-text proj-clickable"
                        onClick={() => handleViewProject(project)}
                      >
                        {project.name}
                      </div>
                      <div className="proj-id-text">
                        ID: PROJ{String(project.id).padStart(3, '0')}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="proj-dept-cell">
                      <div className="proj-dept-name">{project.department}</div>
                    </div>
                  </td>
                  <td>
                    <div className="proj-lead-cell">
                      <div className="proj-lead-name">{project.project_lead_name || project.manager}</div>
                    </div>
                  </td>
                  <td>
                    <div className="proj-date-cell">
                      {formatDate(project.start_date)}
                    </div>
                  </td>
                  <td>
                    <div className="proj-date-cell">
                      {formatDate(project.end_date)}
                    </div>
                  </td>
                  <td>
                    <div className="proj-phase-cell">
                      {project.current_phase}
                    </div>
                  </td>
                  <td>
                    <div className="proj-progress-cell">
                      {project.progress}%
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(project)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProjects.length === 0 && (
          <div className="proj-empty-state">
            <div className="proj-empty-icon">📊</div>
            <p>No projects found</p>
            <p className="proj-empty-subtext">
              {searchTerm || filters.status || filters.department || filters.project_lead || filters.phase
                ? 'Try changing your filters to see more results.'
                : 'Get started by creating your first project.'}
            </p>
            {!searchTerm && !filters.status && !filters.department && !filters.project_lead && !filters.phase && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="proj-add-first-btn"
              >
                Create First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Create New Project</h2>
              <button 
                className="proj-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="proj-form">
              <div className="proj-form-section">
                <h3 className="proj-section-title">
                  <FaBell className="proj-icon" />
                  Project Information
                </h3>
                
                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label className="required">Project Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  <div className="proj-form-group">
                    <label className="required">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label className="required">Project Lead *</label>
                   <select
  name="project_lead"
  value={formData.project_lead}
  onChange={handleInputChange}
  required
>
  <option value="">Select Project Lead</option>
  {projectLeads.map(lead => (
    <option key={lead.id} value={lead.id}>
      {lead.name} 
      {lead.role_name && ` (${lead.role_name.toUpperCase()})`}
      {lead.position && ` - ${lead.position}`}
      {lead.department && ` (${lead.department})`}
    </option>
  ))}
</select>
                    <small>
                      <FaBell className="proj-icon-small" /> 
                      Notification will be sent to the selected project lead
                    </small>
                  </div>
                  <div className="proj-form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {projectStatuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="proj-form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="proj-form-group">
                  <label>Current Phase</label>
                  <select
                    name="current_phase"
                    value={formData.current_phase}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Phase</option>
                    {phases.map(phase => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="proj-form-group">
                  <label>Project Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter project description..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="proj-form-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="proj-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="proj-submit-btn"
                >
                  <FaBell className="proj-icon" />
                  Create Project & Send Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Details Modal */}
      {isViewModalOpen && selectedProject && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Project Details - {selectedProject.name}</h2>
              <button 
                className="proj-close-btn"
                onClick={() => setIsViewModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="proj-details-content">
              <div className="proj-details-grid">
                <div className="proj-detail-item">
                  <label>Project ID</label>
                  <span>PROJ{String(selectedProject.id).padStart(3, '0')}</span>
                </div>
                <div className="proj-detail-item">
                  <label>Project Name</label>
                  <span>{selectedProject.name}</span>
                </div>
                <div className="proj-detail-item">
                  <label>Department</label>
                  <span>{selectedProject.department}</span>
                </div>
                <div className="proj-detail-item">
                  <label>Project Lead</label>
                  <span>{selectedProject.project_lead_name || selectedProject.manager}</span>
                </div>
                <div className="proj-detail-item">
                  <label>Start Date</label>
                  <span>{formatDate(selectedProject.start_date)}</span>
                </div>
                <div className="proj-detail-item">
                  <label>End Date</label>
                  <span>{formatDate(selectedProject.end_date)}</span>
                </div>
                <div className="proj-detail-item">
                  <label>Current Phase</label>
                  <span>{selectedProject.current_phase}</span>
                </div>
                <div className="proj-detail-item">
                  <label>Overall Progress</label>
                  <span>{selectedProject.progress}%</span>
                </div>
                <div className="proj-detail-item">
                  <label>Status</label>
                  <span>{getStatusBadge(selectedProject)}</span>
                </div>
                {selectedProject.description && (
                  <div className="proj-detail-item full-width">
                    <label>Description</label>
                    <span>{selectedProject.description}</span>
                  </div>
                )}
              </div>

              {/* Phases Section */}
              <div className="proj-form-section">
                <h3 className="proj-section-title">Project Phases</h3>
                <div className="proj-phases-table-container">
                  <div className="proj-phases-scroll">
                    <table className="proj-phases-table">
                      <thead>
                        <tr>
                          <th>Phase Name</th>
                          <th>Status</th>
                          <th>Progress</th>
                          <th>Comments</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.phases && selectedProject.phases.map((phase, index) => (
                          <tr key={index}>
                            <td>
                              <div className="proj-phase-name-cell">
                                <div className="proj-phase-name">{phase.name}</div>
                              </div>
                            </td>
                            <td>
                              <div className="proj-phase-status-cell">
                                {getPhaseStatusBadge(phase.status)}
                              </div>
                            </td>
                            <td>{phase.progress}%</td>
                            <td>{phase.comments || 'No comments'}</td>
                            <td>
                              <button
                                onClick={() => handleEditPhase(selectedProject, phase)}
                                className="proj-action-btn proj-edit-phase-btn"
                              >
                                Update Phase
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="proj-form-actions">
               <button
                  type="button"
                  onClick={() => handleEditProject(selectedProject)}
                  className="proj-edit-btn"
                >
                  Edit Project
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedProject)}
                  className="proj-delete-btn"
                >
                  Delete Project
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="proj-cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* Edit Project Modal */}
{isEditModalOpen && selectedProject && (
  <div className="proj-modal-overlay">
    <div className="proj-modal-content">
      <div className="proj-modal-header">
        <h2 id="proj-edit-modal-title">Edit Project</h2>
        <button 
          className="proj-close-btn"
          id="proj-edit-close"
          onClick={() => setIsEditModalOpen(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleUpdateProject} className="proj-form">
        <div className="proj-form-section">
          <h3 className="proj-section-title">Project Information</h3>
          <div className="proj-form-row">
            <div className="proj-form-group">
              <label>Project Name *</label>
              <input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleEditInputChange}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="proj-form-group">
              <label>Department *</label>
              <select
                name="department"
                value={editFormData.department}
                onChange={handleEditInputChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="proj-form-row">
            <div className="proj-form-group">
              <label>Project Lead *</label>
              <select
                name="manager"
                value={editFormData.manager}
                onChange={handleEditInputChange}
                required
              >
                <option value="">Select Project Lead</option>
                {projectLeads.map(lead => (
                  <option key={lead.id} value={lead.name}>
                    {lead.name} {lead.role_name && `(${lead.role_name})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="proj-form-group">
              <label>Status</label>
              <select
                name="status"
                value={editFormData.status}
                onChange={handleEditInputChange}
              >
                {projectStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="proj-form-row">
            <div className="proj-form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="start_date"
                value={editFormData.start_date?.split('T')[0] || editFormData.start_date || ''}
                onChange={handleEditInputChange}
              />
            </div>
            <div className="proj-form-group">
              <label>End Date</label>
              <input
                type="date"
                name="end_date"
                value={editFormData.end_date?.split('T')[0] || editFormData.end_date || ''}
                onChange={handleEditInputChange}
              />
            </div>
          </div>
          
          <div className="proj-form-group">
            <label>Current Phase</label>
            <select
              name="current_phase"
              value={editFormData.current_phase}
              onChange={handleEditInputChange}
            >
              <option value="">Select Phase</option>
              {phases.map(phase => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="proj-form-actions">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            className="proj-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="proj-submit-btn"
          >
            Update Project
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      {/* Edit Phase Modal */}
      {isPhaseModalOpen && selectedProject && selectedPhase && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content">
            <div className="proj-modal-header">
              <h2>Update Phase - {selectedPhase.name}</h2>
              <button 
                className="proj-close-btn"
                onClick={() => setIsPhaseModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => handleUpdatePhase(e, true)} className="proj-form">
              <div className="proj-form-section">
                <h3 className="proj-section-title">Phase Information</h3>
                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={phaseFormData.status}
                      onChange={handlePhaseInputChange}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div className="proj-form-group">
                    <label>Progress (%)</label>
                    <input
                      type="number"
                      name="progress"
                      value={phaseFormData.progress}
                      onChange={handlePhaseInputChange}
                      min="0"
                      max="100"
                      placeholder="0-100"
                    />
                  </div>
                </div>
                <div className="proj-form-group">
                  <label>Comments</label>
                  <textarea
                    name="comments"
                    value={phaseFormData.comments}
                    onChange={handlePhaseInputChange}
                    placeholder="Enter phase comments or updates..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="proj-form-actions">
                <button
                  type="button"
                  onClick={() => setIsPhaseModalOpen(false)}
                  className="proj-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="proj-submit-btn"
                >
                  Update Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedProject && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content">
            <div className="proj-modal-header">
              <h2>Delete Project</h2>
              <button 
                className="proj-close-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="proj-delete-confirm">
              <div className="emp-delete-icon">
                <FaExclamationTriangle />
              </div>
              <h3 className="proj-delete-title">
                Delete {selectedProject.name}?
              </h3>
              <p className="proj-delete-message">
                Are you sure you want to delete the <strong>{selectedProject.name}</strong> project? 
                This action cannot be undone and all associated data will be permanently removed.
              </p>

              <div className="proj-delete-actions">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="proj-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="proj-delete-btn"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;