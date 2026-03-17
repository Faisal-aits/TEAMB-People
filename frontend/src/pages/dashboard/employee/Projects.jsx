import React, { useState, useEffect } from 'react';
import { projectAPI } from '../../../services/projectAPI';
import { employeeAPI } from '../../../services/employeeAPI';
import { FaExclamationTriangle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
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
  
  // ========== PROJECT DETAIL STATES ==========
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);
  const [tempPhaseData, setTempPhaseData] = useState({
    progress: 0
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: '',
    manager: '',
    start_date: '',
    end_date: '',
    current_phase: '',
    status: ''
  });
  
  const [phaseFormData, setPhaseFormData] = useState({
    progress: '',
    comments: ''
  });
  
  const [assignFormData, setAssignFormData] = useState({
    assigned_department: '',
    manager_name: '',
    team: []
  });
  
  // Additional states needed for modals
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectStatuses] = useState(['On Track', 'Delayed', 'At Risk', 'Completed', 'On Hold']);
  const [phases] = useState(['Requirement Specification', 'System Design', 'Development', 'Integration & Testing', 'Deployment', 'Maintenance & Repeat Cycle']);

  // Fetch employee data from localStorage and API
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setEmployeeLoading(true);
        
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User data not found. Please log in again.');
        }

        const user = JSON.parse(userData);
        console.log('Current user:', user);

        if (!user.id) {
          throw new Error('User ID not found.');
        }

        const employee = await getEmployeeByUserId(user.id);
        
        if (!employee) {
          throw new Error('Employee record not found for this user.');
        }

        console.log('Employee data for projects:', employee);
          
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

  // Get employee data by user ID
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
          // Also fetch departments and managers for modals
          fetchDepartmentsAndManagers();
        } else {
          setError('Failed to fetch projects');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Error loading projects data');
      } finally {
        setLoading(false);
      }
    };

    if (!employeeLoading && userSession.employeeId) {
      fetchProjects();
    }
  }, [employeeLoading, userSession.employeeId]);

  // Fetch departments and managers
  const fetchDepartmentsAndManagers = async () => {
    try {
      const [deptsRes, managersRes] = await Promise.all([
        projectAPI.getDepartments(),
        projectAPI.getManagers()
      ]);
      
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data || []);
      }
      if (managersRes.data.success) {
        setManagers(managersRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments/managers:', err);
    }
  };

  // Load employees for assignment
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await projectAPI.getEmployees();
        if (response.data.success) {
          setEmployees(response.data.data || []);
        }
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    };
    
    loadEmployees();
  }, []);

  // Check if employee is assigned to project
  const isEmployeeAssignedToProject = (project) => {
    if (!userSession.employeeId || !userSession.employeeName) return false;

    const isManager = project.manager && project.manager.toLowerCase().includes(userSession.employeeName.toLowerCase());
    
    const isTeamMember = project.team && project.team.some(
      member => member.employee_id === userSession.employeeId
    );
    
    return isManager || isTeamMember;
  };

  // Calculate overall progress from phases
  const calculateOverallProgress = (phases) => {
    if (!phases || phases.length === 0) return 0;
    const total = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
    return Math.round(total / phases.length);
  };

  // Calculate project status based on phases
  const calculateProjectStatus = (phases, endDate) => {
    if (!phases || phases.length === 0) return 'Planning';
    
    const overallProgress = calculateOverallProgress(phases);
    
    // Check if all phases are completed
    const allCompleted = phases.every(phase => phase.progress === 100);
    if (allCompleted) return 'Completed';
    
    // Check if any phase is behind schedule (you can customize this logic)
    const hasDelayedPhases = phases.some(phase => {
      // If progress is less than expected based on timeline
      // This is a simplified logic - you can make it more sophisticated
      return phase.progress < 30 && phase.status === 'In Progress';
    });
    
    // Check if project is near deadline
    if (endDate) {
      const today = new Date();
      const end = new Date(endDate);
      const daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) return 'Delayed';
      if (daysRemaining < 7 && overallProgress < 90) return 'At Risk';
    }
    
    // Determine status based on progress
    if (overallProgress === 100) return 'Completed';
    if (overallProgress > 0) return 'On Track';
    
    return 'Planning';
  };

  // Transform database project data
  const transformProjectData = (dbProjects) => {
    return dbProjects.map(project => {
      const phases = project.phases || [];
      const overallProgress = calculateOverallProgress(phases);
      const calculatedStatus = calculateProjectStatus(phases, project.end_date);
      
      return {
        id: project.id,
        projectName: project.name,
        description: project.description,
        department: project.department,
        manager: project.manager,
        startDate: project.start_date,
        endDate: project.end_date,
        phase: project.current_phase,
        progress: overallProgress,
        status: calculatedStatus, // Use calculated status instead of stored status
        team: project.team || [],
        phases: phases,
        role: project.manager && project.manager.toLowerCase().includes(userSession.employeeName?.toLowerCase()) ? 'Manager' : 'Team Member'
      };
    });
  };

  const assignedProjects = transformProjectData(projects).filter(project => 
    isEmployeeAssignedToProject(project)
  );

  // ========== PHASE EDITING FUNCTIONS ==========

  // Start editing a phase
  const handleEditPhaseClick = (project, phase, index) => {
    setSelectedProject(project);
    setSelectedPhase(phase);
    setEditingPhaseIndex(index);
    setTempPhaseData({
      progress: phase.progress || 0
    });
    setIsEditingPhase(true);
  };

  // Cancel phase editing
  const handleCancelPhaseEdit = () => {
    setIsEditingPhase(false);
    setEditingPhaseIndex(null);
    setSelectedPhase(null);
    setTempPhaseData({ progress: 0 });
  };

  // Update temp phase data
  const handleTempPhaseChange = (field, value) => {
    setTempPhaseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save phase changes
  const handleSavePhase = async () => {
    if (!selectedProject || editingPhaseIndex === null) return;

    try {
      // Create updated phases array
      const updatedPhases = [...selectedProject.phases];
      const progress = parseInt(tempPhaseData.progress) || 0;
      
      // Auto-determine phase status based on progress
      let phaseStatus = 'Not Started';
      if (progress >= 100) {
        phaseStatus = 'Completed';
      } else if (progress > 0) {
        phaseStatus = 'In Progress';
      }
      
      updatedPhases[editingPhaseIndex] = {
        ...updatedPhases[editingPhaseIndex],
        progress: progress,
        status: phaseStatus
      };

      // Calculate new overall progress
      const newOverallProgress = calculateOverallProgress(updatedPhases);
      
      // Calculate new project status
      const newProjectStatus = calculateProjectStatus(updatedPhases, selectedProject.endDate);

      // Call API to update phase
      const response = await projectAPI.updatePhase(
        selectedProject.id,
        selectedPhase.name,
        {
          progress: progress,
          status: phaseStatus
        }
      );

      if (response.data.success) {
        // Update local projects state with new status
        setProjects(prev => prev.map(proj => 
          proj.id === selectedProject.id 
            ? { 
                ...proj, 
                phases: updatedPhases, 
                progress: newOverallProgress,
                status: newProjectStatus 
              }
            : proj
        ));
        
        // Reset editing state
        setIsEditingPhase(false);
        setEditingPhaseIndex(null);
        setSelectedPhase(null);
        
        // alert('Phase updated successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error updating phase:', err);
      alert(err.response?.data?.message || 'Failed to update phase. Please try again.');
    }
  };

  // ========== PROJECT DETAIL HANDLER FUNCTIONS ==========

  // View Project
  const handleViewProject = (project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  // Edit Project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (error) {
        return '';
      }
    };

    setEditFormData({
      name: project.name,
      department: project.department,
      manager: project.manager,
      start_date: formatDateForInput(project.start_date),
      end_date: formatDateForInput(project.end_date),
      current_phase: project.current_phase,
      status: project.status
    });
    
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    if (!editFormData.name || !editFormData.department || !editFormData.manager) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await projectAPI.update(selectedProject.id, editFormData);
      
      if (response.data.success) {
        setProjects(prev => prev.map(proj => 
          proj.id === selectedProject.id ? response.data.data : proj
        ));
        setIsEditModalOpen(false);
        setSelectedProject(null);
        alert('Project updated successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error updating project:', err);
      alert(err.response?.data?.message || 'Failed to update project. Please try again.');
    }
  };

  // Assign Project Team
  const handleAssignProject = (project) => {
    setSelectedProject(project);
    setAssignFormData({
      assigned_department: project.department || '',
      manager_name: project.manager || '',
      team: project.team ? project.team.map(member => member.employee_id) : []
    });
    setIsViewModalOpen(false);
    setIsAssignModalOpen(true);
  };

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target;
    setAssignFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeamMemberToggle = (employeeId) => {
    setAssignFormData(prev => {
      const team = [...prev.team];
      const index = team.indexOf(employeeId);
      
      if (index > -1) {
        team.splice(index, 1);
      } else {
        team.push(employeeId);
      }
      
      return { ...prev, team };
    });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await projectAPI.assignTeam(selectedProject.id, assignFormData);
      
      if (response.data.success) {
        setProjects(prev => prev.map(proj => 
          proj.id === selectedProject.id ? response.data.data : proj
        ));
        setIsAssignModalOpen(false);
        setSelectedProject(null);
        alert('Project team assigned successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error assigning team:', err);
      alert(err.response?.data?.message || 'Failed to assign team. Please try again.');
    }
  };

  // Delete Project
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
        alert('Project deleted successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.response?.data?.message || 'Failed to delete project. Please try again.');
    }
  };

  // Edit Phase (Modal version)
  const handleEditPhaseModal = (project, phase) => {
    setSelectedProject(project);
    setSelectedPhase(phase);
    setPhaseFormData({
      progress: phase.progress,
      comments: phase.comments || ''
    });
    setIsPhaseModalOpen(true);
  };

  const handlePhaseInputChange = (e) => {
    const { name, value } = e.target;
    setPhaseFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePhaseModal = async (e) => {
    e.preventDefault();
    
    try {
      const progress = parseInt(phaseFormData.progress) || 0;
      
      // Auto-determine phase status based on progress
      let phaseStatus = 'Not Started';
      if (progress >= 100) {
        phaseStatus = 'Completed';
      } else if (progress > 0) {
        phaseStatus = 'In Progress';
      }
      
      const response = await projectAPI.updatePhase(
        selectedProject.id, 
        selectedPhase.name, 
        {
          progress: progress,
          status: phaseStatus,
          comments: phaseFormData.comments
        }
      );
      
      if (response.data.success) {
        // Update local projects
        setProjects(prev => prev.map(proj => 
          proj.id === selectedProject.id ? response.data.data : proj
        ));
        setIsPhaseModalOpen(false);
        setSelectedProject(null);
        setSelectedPhase(null);
        alert('Phase updated successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error updating phase:', err);
      alert(err.response?.data?.message || 'Failed to update phase. Please try again.');
    }
  };

  // Start New Cycle
  const handleStartNewCycle = async (project) => {
    try {
      const newProjectData = {
        ...project,
        name: `${project.name} - Cycle ${Math.floor(Math.random() * 100) + 1}`,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        progress: 0,
        status: 'On Track',
        phases: project.phases.map(phase => ({
          ...phase,
          status: 'Not Started',
          progress: 0,
          documents: [],
          comments: ''
        }))
      };

      const response = await projectAPI.create(newProjectData);
      
      if (response.data.success) {
        setProjects(prev => [response.data.data, ...prev]);
        alert('New project cycle started successfully!');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error starting new cycle:', err);
      alert(err.response?.data?.message || 'Failed to start new cycle. Please try again.');
    }
  };

  // ========== HELPER FUNCTIONS ==========

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'On Track': 'proj-status-active',
      'Completed': 'proj-status-active',
      'Delayed': 'proj-status-inactive',
      'At Risk': 'proj-status-inactive',
      'On Hold': 'proj-status-inactive',
      'Planning': 'proj-status-pending'
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

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // ========== MODAL COMPONENTS ==========

  // View Project Details Modal
  const ViewProjectModal = () => (
    <div className="proj-modal-overlay">
      <div className="proj-modal-content proj-large-modal">
        <div className="proj-modal-header">
          <h2 id="proj-view-modal-title">Project Details - {selectedProject?.name}</h2>
          <button 
            className="proj-close-btn"
            id="proj-view-close"
            onClick={() => setIsViewModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="proj-details-content">
          <div className="proj-form-section">
            <h3 className="proj-section-title">Project Information</h3>
            <div className="proj-details-grid">
              <div className="proj-detail-item">
                <label>Project ID</label>
                <span>PROJ{String(selectedProject?.id).padStart(3, '0')}</span>
              </div>
              <div className="proj-detail-item">
                <label>Project Name</label>
                <span>{selectedProject?.name}</span>
              </div>
              <div className="proj-detail-item">
                <label>Department</label>
                <span>{selectedProject?.department}</span>
              </div>
              <div className="proj-detail-item">
                <label>Manager</label>
                <span>{selectedProject?.manager}</span>
              </div>
              <div className="proj-detail-item">
                <label>Start Date</label>
                <span>{formatDate(selectedProject?.start_date)}</span>
              </div>
              <div className="proj-detail-item">
                <label>End Date</label>
                <span>{formatDate(selectedProject?.end_date)}</span>
              </div>
              <div className="proj-detail-item">
                <label>Current Phase</label>
                <span>{selectedProject?.current_phase}</span>
              </div>
              <div className="proj-detail-item">
                <label>Overall Progress</label>
                <span>{selectedProject?.progress}%</span>
              </div>
              <div className="proj-detail-item">
                <label>Status</label>
                <span>{getStatusBadge(selectedProject?.status)}</span>
              </div>
            </div>
          </div>

          {/* Team Information Section */}
          {selectedProject?.team && selectedProject.team.length > 0 && (
            <div className="proj-form-section">
              <h3 className="proj-section-title">Team Members</h3>
              <div className="proj-details-grid">
                {selectedProject.team.map((member, index) => (
                  <div key={index} className="proj-detail-item">
                    <label>Team Member {index + 1}</label>
                    <span>{member.name} ({member.department}) - {member.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProject?.phases?.map((phase, index) => (
                      <tr key={index}>
                        <td>
                          <div className="proj-phase-name-cell">
                            <div className="proj-phase-name">{phase.name}</div>
                          </div>
                        </td>
                        <td>
                          <div className="proj-phase-status-cell">
                            {getPhaseStatusBadge(phase)}
                          </div>
                        </td>
                        <td>{phase.progress}%</td>
                        <td>
                          <button
                            onClick={() => handleEditPhaseModal(selectedProject, phase)}
                            className="proj-action-btn proj-edit-phase-btn"
                            style={{
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FaEdit /> Edit
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
              onClick={() => handleAssignProject(selectedProject)}
              className="proj-submit-btn"
            >
              Assign Project Team
            </button>
            <button
              type="button"
              onClick={() => handleStartNewCycle(selectedProject)}
              className="proj-submit-btn"
            >
              Start New Cycle
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
  );

 

  // Inline Phase Editor (Input Only)
const InlinePhaseEditor = ({ project, phase, index }) => {
  if (isEditingPhase && editingPhaseIndex === index && selectedProject?.id === project.id) {
    return (
      <div style={{
        padding: '6px 8px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        marginTop: '5px',
        width: '60%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min="0"
            max="100"
            value={tempPhaseData.progress}
            onChange={(e) => handleTempPhaseChange('progress', e.target.value)}
            style={{
              width: '50px',
              padding: '4px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              textAlign: 'center'
            }}
            autoFocus
          />
          <span style={{ fontSize: '13px', marginRight: '4px' }}>%</span>
          <button onClick={handleCancelPhaseEdit} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Cancel"><FaTimes size={12} /></button>
          <button onClick={handleSavePhase} style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', background: '#4CAF50', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Save"><FaSave size={12} /></button>
        </div>
      </div>
    );
  }

  return (
   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontWeight: '500', fontSize: '14px' }}>{phase.progress}%</span>
      <button onClick={() => handleEditPhaseClick(project, phase, index)} style={{ background: 'none', border: 'none', color: '#4CAF50', cursor: 'pointer', padding: '4px', borderRadius: '4px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center' }} title="Edit phase progress"><FaEdit size={12} /></button>
    </div>
  );
};

  // Edit Project Modal
  const EditProjectModal = () => (
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
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="proj-form-row">
              <div className="proj-form-group">
                <label>Manager *</label>
                <select
                  name="manager"
                  value={editFormData.manager}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="">Select Manager</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.name}>
                      {manager.name}
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
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                >
                  <option value="">Auto-calculated</option>
                </select>
                <small style={{ color: '#666' }}>Status is auto-calculated based on phases</small>
              </div>
            </div>
            <div className="proj-form-row">
              <div className="proj-form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={editFormData.start_date}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="proj-form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={editFormData.end_date}
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
                  <option key={phase} value={phase}>{phase}</option>
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
  );

  // Assign Project Modal
  const AssignProjectModal = () => (
    <div className="proj-modal-overlay">
      <div className="proj-modal-content proj-large-modal">
        <div className="proj-modal-header">
          <h2>Assign Project Team - {selectedProject?.name}</h2>
          <button 
            className="proj-close-btn"
            onClick={() => setIsAssignModalOpen(false)}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleAssignSubmit} className="proj-form">
          <div className="proj-form-section">
            <h3 className="proj-section-title">Project Assignment</h3>
            <div className="proj-form-row-two">
              <div className="proj-form-group">
                <label>Assigned Department</label>
                <select
                  name="assigned_department"
                  value={assignFormData.assigned_department}
                  onChange={handleAssignInputChange}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="proj-form-section">
            <h3 className="proj-section-title">Team Members</h3>
            <div className="proj-team-selection">
              {employees.map(employee => (
                <div key={employee.id} className="proj-team-member-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={assignFormData.team.includes(employee.id)}
                      onChange={() => handleTeamMemberToggle(employee.id)}
                    />
                    <span>{employee.name} ({employee.department}) - {employee.position}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="proj-form-actions">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="proj-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="proj-submit-btn"
            >
              Assign Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Delete Confirmation Modal
  const DeleteProjectModal = () => (
    <div className="proj-modal-overlay">
      <div className="proj-modal-content">
        <div className="proj-modal-header">
          <h2 id="proj-delete-modal-title">Delete Project</h2>
          <button 
            className="proj-close-btn"
            id="proj-delete-close"
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
            Delete {selectedProject?.name}?
          </h3>
          <p className="proj-delete-message">
            Are you sure you want to delete the <strong>{selectedProject?.name}</strong> project? 
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
  );

  // ========== RENDER MODALS ==========
  const renderProjectModals = () => (
    <>
      {isViewModalOpen && selectedProject && <ViewProjectModal key="view-modal" />}
      {isEditModalOpen && selectedProject && <EditProjectModal key="edit-modal" />}
      {isAssignModalOpen && selectedProject && <AssignProjectModal key="assign-modal" />}
      {isPhaseModalOpen && selectedProject && selectedPhase && <EditPhaseModal key="phase-modal" />}
      {isDeleteModalOpen && selectedProject && <DeleteProjectModal key="delete-modal" />}
    </>
  );

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

      {/* Debug Info */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '20px', 
        borderRadius: '5px',
        fontSize: '12px',
        display: 'none'
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
            {assignedProjects.filter(p => p.status === 'On Track' || p.status === 'In Progress').length}
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
            {assignedProjects.filter(p => p.status === 'Delayed' || p.status === 'At Risk').length}
          </div>
          <div className="project-summary-label">At Risk/Delayed</div>
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
                        <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>{project.progress}%</span>

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

                    {/* Project Phases with Edit Options */}
                    <div className="project-phases-section">
                      <label>Project Phases:</label>
                      <div className="project-phases-list">
                        {project.phases && project.phases.map((phase, index) => (
                          <div key={index} className="project-phase-item">
                            <div className="phase-name">{phase.name}</div>
                            <div className="phase-details">
                              {getPhaseStatusBadge(phase)}
                              <InlinePhaseEditor 
                                project={project} 
                                phase={phase} 
                                index={index} 
                              />
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
      
      {/* Render Modals */}
      {renderProjectModals()}
    </div>
  );
};

export default Projects;