import React, { useState, useEffect } from 'react';
import { projectAPI } from '../../../services/projectAPI';
import { employeeAPI } from '../../../services/employeeAPI';
import './Projects.css';

const Projects = () => {
  const [userSession, setUserSession] = useState({
    employeeId: '',
    employeeName: '',
    userId: null
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  // Fetch employee data from localStorage and API
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setEmployeeLoading(true);
        
        // Get user data from localStorage (same as your Info component)
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User data not found. Please log in again.');
        }

        const user = JSON.parse(userData);
        console.log('Current user:', user);

        if (!user.id) {
          throw new Error('User ID not found.');
        }

        // Get employee data using user ID (same logic as your Info component)
        const employee = await getEmployeeByUserId(user.id);
        
        if (!employee) {
          throw new Error('Employee record not found for this user.');
        }

        console.log('Employee data for projects:', employee);
          
        // Set user session with actual data
        setUserSession({
          employeeId: employee.employee_id || employee.id,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          userId: user.id
        });

      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError(err.message || 'Failed to load employee data');
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Get employee data by user ID from all employees list (same as your Info component)
  const getEmployeeByUserId = async (userId) => {
    try {
      console.log('Fetching all employees to find user ID:', userId);
      const response = await employeeAPI.getAll();
      
      if (response.data && response.data.employees) {
        const employee = response.data.employees.find(emp => emp.user_id === userId);
        console.log('Found employee:', employee);
        return employee;
      }
      return null;
    } catch (err) {
      console.error('Error fetching employees list:', err);
      return null;
    }
  };

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectAPI.getAll();
        
        if (response.data.success) {
          setProjects(response.data.data);
        } else {
          setError('Failed to fetch projects');
        }
<<<<<<< Updated upstream
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Error loading projects data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch projects if we have employee data
    if (!employeeLoading && userSession.employeeId) {
      fetchProjects();
    }
  }, [employeeLoading, userSession.employeeId]);
=======
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
      console.log(`✅ Notification sent to ${projectLead.name}`);
    } catch (err) {
      console.error('❌ Error sending notification:', err);
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('Form Data:', formData);
  console.log('Project Leads:', projectLeads);
  console.log('Selected Lead ID:', formData.project_lead);
  
  if (!formData.name || !formData.department || !formData.project_lead) {
    alert('Please fill in all required fields (Project Name, Department, and Project Lead)');
    return;
  }

  try {
    // Find the lead - compare as strings (since employee_id is a string like 'AITS001')
    const selectedLead = projectLeads.find(lead => String(lead.id) === String(formData.project_lead));
    
    console.log('Found lead:', selectedLead);
    
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

  // Add confirmation before proceeding (though you already have modal)
  if (!window.confirm(`Are you absolutely sure you want to delete "${selectedProject.name}"?`)) {
    return;
  }

  try {
    setLoading(true); // Add loading state
    console.log('Deleting project with ID:', selectedProject.id);
    
    const response = await projectAPI.delete(selectedProject.id);
    console.log('Delete response:', response);
    
    if (response.data.success) {
      // Update local state
      setProjects(prev => prev.filter(proj => proj.id !== selectedProject.id));
      
      // Close all modals
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedProject(null);
      
      // Refresh data to ensure consistency
      await fetchData();
      
      // Show success message
      alert('✅ Project deleted successfully!');
    } else {
      throw new Error(response.data.message || 'Failed to delete project');
    }
  } catch (err) {
    console.error('Error deleting project:', err);
    // More detailed error message
    const errorMessage = err.response?.data?.message || err.message || 'Failed to delete project. Please try again.';
    alert(`❌ Delete failed: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};
>>>>>>> Stashed changes

  // Check if employee is assigned to project (either as manager or team member)
  const isEmployeeAssignedToProject = (project) => {
    if (!userSession.employeeId || !userSession.employeeName) return false;

    // Check if employee is the project manager (by name match)
    const isManager = project.manager && project.manager.toLowerCase().includes(userSession.employeeName.toLowerCase());
    
    // Check if employee is in the project team (by employee ID)
    const isTeamMember = project.team && project.team.some(
      member => member.employee_id === userSession.employeeId
    );
    
    console.log(`Project: ${project.name}, Manager: ${project.manager}, IsManager: ${isManager}, IsTeamMember: ${isTeamMember}`);
    return isManager || isTeamMember;
  };

  // Transform database project data to match UI format
  const transformProjectData = (dbProjects) => {
    return dbProjects.map(project => ({
      id: project.id,
      projectName: project.name,
      description: project.description,
      department: project.department,
      manager: project.manager,
      startDate: project.start_date,
      endDate: project.end_date,
      phase: project.current_phase,
      progress: project.progress || 0,
      status: project.status,
      team: project.team || [],
      phases: project.phases || [],
      // Role in project for display purposes
      role: project.manager && project.manager.toLowerCase().includes(userSession.employeeName?.toLowerCase()) ? 'Manager' : 'Team Member'
    }));
  };

  // Filter projects to show only those assigned to the logged-in employee
  const assignedProjects = transformProjectData(projects).filter(project => 
    isEmployeeAssignedToProject(project)
  );

  const getProjectStatusBadge = (status) => {
    const statusClasses = {
      'Completed': 'project-status--approved',
      'On Track': 'project-status--approved',
      'In Progress': 'project-status--pending',
      'Planning': 'project-status--pending',
      'Delayed': 'project-status--rejected',
      'At Risk': 'project-status--rejected',
      'On Hold': 'project-status--rejected'
    };
    
    return (
      <span className={`project-status-badge ${statusClasses[status] || 'project-status--pending'}`}>
        {status}
      </span>
    );
  };

  const getPhaseStatusBadge = (phase) => {
    const statusClasses = {
      'Completed': 'project-status--approved',
      'In Progress': 'project-status--pending',
      'Review': 'project-status--pending',
      'Not Started': 'project-status--rejected',
      'On Hold': 'project-status--rejected'
    };
    
    return (
      <span className={`project-phase-badge ${statusClasses[phase.status] || 'project-status--pending'}`}>
        {phase.status}
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

  // Calculate days remaining until end date
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Combined loading state
  if (employeeLoading || loading) {
    return (
      <div className="project-management-section">
        <div className="project-loading">
          Loading your projects...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-management-section">
        <div className="project-error">
          Error: {error}
        </div>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!userSession.employeeId) {
    return (
      <div className="project-management-section">
        <div className="project-error">
          Unable to load employee information. Please try logging in again.
        </div>
      </div>
    );
  }

  return (
    <div className="project-management-section" id="project-management-section">
      <div className="project-management-header">
        <h2 className="project-management-title">Project & Assignment</h2>
        <div className="project-welcome-message">
          Welcome, {userSession.employeeName}
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '5px',
        fontSize: '12px',
        display: 'none' /* Set to 'block' to see debug info */
      }}>
        <strong>Debug Info:</strong><br />
        Employee ID: {userSession.employeeId}<br />
        Employee Name: {userSession.employeeName}<br />
        Total Projects: {projects.length}<br />
        Assigned Projects: {assignedProjects.length}
      </div>

      {/* Project Summary Cards */}
      <div className="project-summary-cards">
        <div className="project-summary-card">
          <div className="project-summary-number">{assignedProjects.length}</div>
          <div className="project-summary-label">Total Projects</div>
        </div>
        <div className="project-summary-card">
          <div className="project-summary-number">
            {assignedProjects.filter(p => p.status === 'In Progress' || p.status === 'On Track').length}
          </div>
          <div className="project-summary-label">Active Projects</div>
        </div>
        <div className="project-summary-card">
          <div className="project-summary-number">
            {assignedProjects.filter(p => p.status === 'Completed').length}
          </div>
          <div className="project-summary-label">Completed</div>
        </div>
        <div className="project-summary-card">
          <div className="project-summary-number">
            {assignedProjects.filter(p => p.role === 'Manager').length}
          </div>
          <div className="project-summary-label">Managing</div>
        </div>
      </div>

      {/* Project & Assignment Section */}
      <div className="project-table-container glass-form-project" style={{marginTop: '2rem'}}>
        <div className="project-table-header">
          <h3 className="project-table-title">My Projects</h3>
          <div className="project-table-actions">
            <span className="project-helper-text">
              Showing {assignedProjects.length} projects assigned to you
            </span>
          </div>
        </div>
        
        {assignedProjects.length === 0 ? (
          <div className="project-empty-state">
            <div className="project-empty-icon">📊</div>
            <p>No projects assigned to you yet.</p>
            <p className="project-empty-subtext">
              {projects.length > 0 
                ? "You're not assigned to any projects. Contact your manager to be added to project teams."
                : "No projects found in the system."}
            </p>
          </div>
        ) : (
          <div className="project-cards-container">
            {assignedProjects.map(project => {
              const daysRemaining = getDaysRemaining(project.endDate);
              
              return (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <div className="project-card-title">
                      <h4>{project.projectName}</h4>
                      <span className="project-role-badge">{project.role}</span>
                    </div>
                    {getProjectStatusBadge(project.status)}
                  </div>
                  
                  <div className="project-card-body">
                    <div className="project-info-grid">
                      <div className="project-info-item">
                        <label>Department:</label>
                        <span>{project.department}</span>
                      </div>
                      <div className="project-info-item">
                        <label>Manager:</label>
                        <span>{project.manager}</span>
                      </div>
                      <div className="project-info-item">
                        <label>Current Phase:</label>
                        <span>{project.phase}</span>
                      </div>
                      <div className="project-info-item">
                        <label>Timeline:</label>
                        <span>
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                          {daysRemaining !== null && (
                            <span className={`project-days-remaining ${daysRemaining < 0 ? 'overdue' : daysRemaining < 7 ? 'urgent' : 'normal'}`}>
                              ({daysRemaining < 0 ? Math.abs(daysRemaining) + ' days overdue' : daysRemaining + ' days left'})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="project-progress-section">
                      <div className="project-progress-header">
                        <span>Overall Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="project-progress-track">
                        <div 
                          className={`project-progress-bar project-progress-${project.progress >= 80 ? 'high' : project.progress >= 50 ? 'medium' : 'low'}`} 
                          style={{width: `${project.progress}%`}} 
                        />
                      </div>
                    </div>

                    {project.description && (
                      <div className="project-description">
                        <label>Description:</label>
                        <p>{project.description}</p>
                      </div>
                    )}

                    {/* Project Phases */}
                    <div className="project-phases-section">
                      <label>Project Phases:</label>
                      <div className="project-phases-list">
                        {project.phases && project.phases.map((phase, index) => (
                          <div key={index} className="project-phase-item">
                            <div className="phase-name">{phase.name}</div>
                            <div className="phase-details">
                              {getPhaseStatusBadge(phase)}
                              <span className="phase-progress">{phase.progress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Members */}
                    {project.team && project.team.length > 0 && (
                      <div className="project-team-section">
                        <label>Team Members:</label>
                        <div className="project-team-list">
                          {project.team.map((member, index) => (
                            <div key={index} className="team-member-tag">
                              {member.name} ({member.department})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;