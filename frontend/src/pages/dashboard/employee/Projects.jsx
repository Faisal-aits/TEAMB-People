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
<<<<<<< Updated upstream
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
=======
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
>>>>>>> Stashed changes
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedPhase, setSelectedPhase] = useState(null);
<<<<<<< Updated upstream
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);
  const [tempPhaseData, setTempPhaseData] = useState({
    progress: 0
  });
  
  const [editFormData, setEditFormData] = useState({
=======
  const [selectedProjectTeams, setSelectedProjectTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
const [isExcelEditorOpen, setIsExcelEditorOpen] = useState(false);
const [editableTasks, setEditableTasks] = useState([]);
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [showMonthFilter, setShowMonthFilter] = useState(false);
  // Form states
  const [formData, setFormData] = useState({
>>>>>>> Stashed changes
    name: '',
    department: '',
    manager: '',
    start_date: '',
    end_date: '',
    current_phase: '',
    status: ''
  });
  
<<<<<<< Updated upstream
=======
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    estimated_hours: 0,
    due_date: '',
    project_id: '',
    team_id: '',
    assigned_to_members: []
  });
  
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    team_lead_id: '',
    project_id: '',
    description: '',
    members: []
  });

>>>>>>> Stashed changes
  const [phaseFormData, setPhaseFormData] = useState({
    progress: '',
    comments: ''
  });
<<<<<<< Updated upstream
  
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
=======

  const [filters, setFilters] = useState({
    status: '',
    department: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    delayedProjects: 0,
    completedProjects: 0
  });
const filterTasksByMonth = (tasks, month, year) => {
  return tasks.filter(task => {
    if (!task.created_at && !task.due_date) return true;
    const taskDate = task.created_at ? new Date(task.created_at) : (task.due_date ? new Date(task.due_date) : null);
    if (!taskDate) return true;
    return taskDate.getMonth() === month && taskDate.getFullYear() === year;
  });
};

  const phases = ['Requirement Specification', 'System Design', 'Development', 'Integration & Testing', 'Deployment', 'Maintenance & Repeat Cycle'];
  const projectStatuses = ['On Track', 'Delayed', 'At Risk', 'Completed', 'On Hold'];
  const taskPriorities = ['High', 'Medium', 'Low'];
  const taskStatuses = ['To-Do', 'In Progress', 'Ready for Review', 'Completed', 'Blocked', 'Cancelled'];
  const reviewStatuses = ['Not Reviewed', 'Approved', 'Rejected', 'Needs Rework'];
const openExcelEditor = () => {
  if (!selectedProject) {
    alert('Please select a project first from the dropdown above');
    return;
  }
  
  let projectTasks = tasks.filter(task => task.project_id == selectedProject.id);
  
  if (projectTasks.length === 0) {
    alert(`No tasks found for project "${selectedProject.name}". Please create tasks first.`);
    return;
  }
  
  // Apply month filter if enabled
  if (showMonthFilter) {
    projectTasks = filterTasksByMonth(projectTasks, selectedMonth, selectedYear);
    if (projectTasks.length === 0) {
      alert(`No tasks found for ${getMonthName(selectedMonth)} ${selectedYear}. Please select a different month or disable the filter.`);
      return;
    }
  }
  
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  // Create a map of tasks by date
  const tasksByDate = {};
  projectTasks.forEach(task => {
    const taskDate = task.created_at ? new Date(task.created_at) : (task.due_date ? new Date(task.due_date) : new Date());
    const day = taskDate.getDate();
    if (!tasksByDate[day]) {
      tasksByDate[day] = [];
    }
    tasksByDate[day].push(task);
  });
  
  // Prepare editable copy of tasks with monthly view
  const monthlyTasks = [];
  
  // Create entries for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (tasksByDate[day] && tasksByDate[day].length > 0) {
      tasksByDate[day].forEach(task => {
        monthlyTasks.push({
          id: task.id,
          date: dateStr,
          displayDate: `${day}/${selectedMonth + 1}/${selectedYear}`,
          project: selectedProject.name,
          task: task.title,
          description: task.description || '',
          status: task.status,
          remarks: task.remarks || '',
          priority: task.priority,
          dueDate: task.due_date ? formatDate(task.due_date) : 'Not set',
          assignedTo: task.assigned_to_name || 'Not Assigned'
        });
      });
    } else {
      monthlyTasks.push({
        id: null,
        date: dateStr,
        displayDate: `${day}/${selectedMonth + 1}/${selectedYear}`,
        project: selectedProject.name,
        task: '',
        description: '',
        status: 'To-Do',
        remarks: '',
        priority: 'Medium',
        dueDate: 'Not set',
        assignedTo: ''
      });
    }
  }
  
  setEditableTasks(monthlyTasks);
  setIsExcelEditorOpen(true);
};
const downloadSheetAsExcel = () => {
  if (!selectedProject) {
    alert('Please select a project first');
    return;
  }
  
  if (editableTasks.length === 0) {
    alert('No data to download');
    return;
  }
    const exportData = editableTasks.map(task => ({
    'Date': task.displayDate,
    'Project': task.project,
    'Task/Activity': task.task,
    'Description (What I did)': task.description,
    'Status': task.status,
    'Remarks': task.remarks,
    'Priority': task.priority,
    'Due Date': task.dueDate,
    'Assigned To': task.assignedTo
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Tasks_${selectedProject.name}`);
  
  // Auto-size columns
  worksheet['!cols'] = [
    { wch: 15 },  // Date
    { wch: 25 },  // Project
    { wch: 30 },  // Task/Activity
    { wch: 40 },  // Description
    { wch: 15 },  // Status
    { wch: 30 },  // Remarks
    { wch: 10 },  // Priority
    { wch: 15 },  // Due Date
    { wch: 20 }   // Assigned To
  ];
  
  const fileName = `${selectedProject.name}_Tasks_${getMonthName(selectedMonth)}_${selectedYear}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  alert(`✅ Sheet downloaded successfully as "${fileName}"`);
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

// Add this function to export the current view as PDF (if needed)
const downloadAsPDF = () => {
  alert('PDF export feature - You can use browser print (Ctrl+P) to save as PDF');
  window.print();
};

// Save all changes from Excel editor
const saveExcelEdits = async () => {
    let updatedCount = 0;
    let createdCount = 0;
    let errors = [];
    
    for (const editedTask of editableTasks) {
        const updateData = {};
        
        // If this is a new task (no ID) and has task name
        if (!editedTask.id && editedTask.task && editedTask.task.trim()) {
            try {
                // Create new task
                const employeeName = editedTask.assignedTo;
                const employee = employees.find(e => e.name === employeeName);
                
                if (!employee) {
                    errors.push(`No employee found for task "${editedTask.task}"`);
                    continue;
                }
                
                const taskData = {
                    title: editedTask.task.trim(),
                    description: editedTask.description || '',
                    priority: editedTask.priority || 'Medium',
                    due_date: editedTask.date || null,
                    project_id: selectedProject.id,
                    assigned_by: currentUser.id,
                    assigned_by_name: currentUser.name,
                    status: editedTask.status || 'To-Do',
                    remarks: editedTask.remarks || '',
                    assigned_to_member: employee.id
                };
                
                const response = await projectAPI.createTask(taskData);
                if (response.data.success) {
                    createdCount++;
                }
            } catch (err) {
                errors.push(`Error creating task "${editedTask.task}": ${err.message}`);
            }
            continue;
        }
        
        // Update existing task
        const originalTask = tasks.find(t => t.id == editedTask.id);
        if (!originalTask) continue;
        
        if (editedTask.description !== originalTask.description) {
            updateData.description = editedTask.description;
        }
        
        if (editedTask.status !== originalTask.status) {
            updateData.status = editedTask.status;
            if (editedTask.status === 'Completed') {
                updateData.progress = 100;
                updateData.completed_date = new Date().toISOString().split('T')[0];
            } else if (editedTask.status === 'In Progress') {
                updateData.progress = 50;
            } else if (editedTask.status === 'Ready for Review') {
                updateData.progress = 80;
            } else if (editedTask.status === 'To-Do') {
                updateData.progress = 0;
            } else if (editedTask.status === 'Blocked') {
                updateData.progress = 0;
            }
        }
        
        if (editedTask.remarks !== originalTask.remarks) {
            updateData.remarks = editedTask.remarks;
        }
        
        if (Object.keys(updateData).length > 0) {
            try {
                await projectAPI.updateTask(editedTask.id, updateData);
                updatedCount++;
            } catch (err) {
                errors.push(`Task ${editedTask.task}: ${err.message}`);
            }
        }
    }
    
    if (updatedCount > 0 || createdCount > 0) {
        await fetchAllData();
        alert(`✅ Updated: ${updatedCount} tasks | Created: ${createdCount} new tasks`);
        if (errors.length > 0) {
            console.error('Errors:', errors);
        }
    } else {
        alert('No changes detected');
    }
    
    setIsExcelEditorOpen(false);
    setEditableTasks([]);
};

// Update field in editable tasks
const updateEditableTask = (index, field, value) => {
    const updated = [...editableTasks];
    updated[index][field] = value;
    setEditableTasks(updated);
};

// Handle delete task - Only Project Lead can delete
const handleDeleteTask = async () => {
  if (!selectedTask) return;
  
  // Check if current user is project lead for this project
  const isProjectLeadForTask = currentUser.isProjectLead && currentUser.managedProjects.includes(selectedTask.project_id);
  
  if (!isProjectLeadForTask) {
    alert('Only Project Lead can delete tasks');
    return;
  }
  
  try {
    const response = await projectAPI.deleteTask(selectedTask.id);
    if (response.data.success) {
      setIsDeleteTaskModalOpen(false);
      setSelectedTask(null);
      await fetchAllData();
      alert('Task deleted successfully!');
    } else {
      alert(response.data.message || 'Failed to delete task');
    }
  } catch (err) {
    console.error('Error deleting task:', err);
    alert(err.response?.data?.message || 'Failed to delete task');
  }
};

const handleDeleteTeam = async () => {
  if (!selectedTeam) return;
  
  const isProjectLeadForTeam = currentUser.isProjectLead && currentUser.managedProjects.includes(selectedTeam.project_id);
  
  if (!isProjectLeadForTeam) {
    alert('Only Project Lead can delete teams');
    return;
  }
  
  try {
    console.log('Deleting team with ID:', selectedTeam.id);
    
    const response = await projectAPI.deleteTeam(selectedTeam.id);
    console.log('Delete response:', response);
    
    if (response.data.success) {
      // Manually remove the team from state
      setTeams(prevTeams => prevTeams.filter(team => team.id !== selectedTeam.id));
      
      setIsDeleteTeamModalOpen(false);
      setSelectedTeam(null);
      alert('Team deleted successfully!');
    } else {
      alert(response.data.message || 'Failed to delete team');
    }
  } catch (err) {
    console.error('Error deleting team:', err);
    alert(err.response?.data?.message || 'Failed to delete team');
  }
};
  // Load current user
>>>>>>> Stashed changes
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
<<<<<<< Updated upstream
        setEmployeeLoading(true);
        
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('User data not found. Please log in again.');
=======
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log('=== USER DATA FROM LOCALSTORAGE ===');
        console.log('Raw user data:', userData);
        
        if (userData) {
          const userId = userData.employee_id || userData.id || userData.user_id;
          console.log('User ID:', userId);
          
          setCurrentUser({
            id: userId,
            employeeId: userId,
            name: userData.name || `${userData.first_name} ${userData.last_name}` || 'User',
            role: userData.role || userData.user_role || 'team_member',
            isProjectLead: false,
            managedProjects: []
          });
        } else {
          console.warn('No user data found in localStorage');
          setCurrentUser({
            id: 1,
            employeeId: 1,
            name: 'Test User',
            role: 'team_member',
            isProjectLead: false,
            managedProjects: []
          });
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

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
=======
  
  // Set project lead status
  useEffect(() => {
    if (projects.length > 0 && currentUser.name) {
      const managed = projects.filter(p => p.manager === currentUser.name);
      setCurrentUser(prev => ({
        ...prev,
        isProjectLead: managed.length > 0,
        managedProjects: managed.map(p => p.id)
      }));
    }
  }, [projects, currentUser.name]);

  // Load teams when project is selected
  useEffect(() => {
    if (taskFormData.project_id) {
      console.log('=== LOADING TEAMS FOR PROJECT ===');
      console.log('Selected project ID:', taskFormData.project_id);
      console.log('All teams:', teams);
      
      const projectTeams = teams.filter(t => t.project_id === parseInt(taskFormData.project_id));
      console.log('Filtered teams for project:', projectTeams);
      
      setSelectedProjectTeams(projectTeams);
      setTaskFormData(prev => ({ ...prev, team_id: '' }));
      setAvailableTeamMembers([]);
      setSelectedTaskEmployees([]);
    } else {
      setSelectedProjectTeams([]);
      setAvailableTeamMembers([]);
    }
  }, [taskFormData.project_id, teams]);
  
  // Load team members when team is selected
  useEffect(() => {
    if (taskFormData.team_id) {
      loadTeamMembers(taskFormData.team_id);
    } else {
      setAvailableTeamMembers([]);
      setSelectedTaskEmployees([]);
    }
  }, [taskFormData.team_id]);

  useEffect(() => {
    if (isTaskModalOpen && selectedProject?.id) {
      setTaskFormData(prev => ({
        ...prev,
        project_id: selectedProject.id
      }));
    }
  }, [isTaskModalOpen, selectedProject]);

  const loadTeamMembers = async (teamId) => {
    try {
      setLoadingTeamMembers(true);
      console.log('=== LOADING TEAM MEMBERS ===');
      console.log('Team ID:', teamId);
      
      const existingTeam = teams.find(t => t.id === parseInt(teamId));
      console.log('Existing team data:', existingTeam);
      
      if (existingTeam && existingTeam.members && existingTeam.members.length > 0) {
        console.log('Using cached members:', existingTeam.members);
        const formattedMembers = existingTeam.members.map(member => ({
          id: member.user_id || member.id,
          user_id: member.user_id || member.id,
          employee_detail_id: member.employee_detail_id || member.employee_id,
          name: member.name,
          position: member.position || 'Team Member',
          email: member.email || ''
        }));
        setAvailableTeamMembers(formattedMembers);
        setLoadingTeamMembers(false);
        return;
      }
      
      console.log('Fetching from API for team:', teamId);
      const response = await projectAPI.getTeamMembers(teamId);
      console.log('API Response Data:', response.data);
      
      let membersList = [];
      
      if (response.data && response.data.success && response.data.data) {
        membersList = response.data.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        membersList = response.data.data;
      } else if (Array.isArray(response.data)) {
        membersList = response.data;
      }
      
      if (membersList.length === 0) {
        console.warn(`⚠️ No members found for team ${teamId}`);
        setAvailableTeamMembers([]);
        setLoadingTeamMembers(false);
        return;
      }
      
      const formattedMembers = membersList.map(member => ({
        id: member.user_id,
        user_id: member.user_id,
        employee_detail_id: member.employee_detail_id || member.employee_id,
        name: member.name,
        position: member.position || 'Team Member',
        email: member.email || ''
      }));
      
      console.log('Formatted members:', formattedMembers);
      setAvailableTeamMembers(formattedMembers);
      
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === parseInt(teamId) 
            ? { ...team, members: formattedMembers, member_count: formattedMembers.length }
            : team
        )
      );
      
    } catch (err) {
      console.error('Error fetching team members:', err);
      setAvailableTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };
const fetchAllData = async () => {
  try {
    setLoading(true);
    console.log('=== FETCHING ALL DATA ===');

    const [projectsRes, statsRes, employeesRes, departmentsRes, teamsRes, tasksRes] = await Promise.allSettled([
      projectAPI.getAll(),
      projectAPI.getStats(),
      projectAPI.getEmployees(),
      projectAPI.getDepartments(),
      projectAPI.getAllTeams(),
      projectAPI.getAllTasks()
    ]);

    console.log('Teams API Response Status:', teamsRes.status);
    if (teamsRes.status === 'fulfilled') {
      console.log('Teams API Full Response:', teamsRes.value);
      console.log('Teams API Data:', teamsRes.value?.data);
      
      if (teamsRes.value?.data?.success) {
        const teamsData = teamsRes.value.data.data || [];
        console.log('Raw teams data from API:', JSON.stringify(teamsData, null, 2));
        console.log('Number of teams received:', teamsData.length);
        
        // Ensure each team has members array
        const teamsWithMembers = teamsData.map(team => ({
          ...team,
          members: team.members || [],
          member_count: team.members?.length || 0
        }));
        
        console.log('Processed teams:', teamsWithMembers);
        setTeams(teamsWithMembers);
      } else {
        console.log('Teams API success false or no data:', teamsRes.value?.data);
        setTeams([]);
      }
    } else {
      console.log('Teams API failed:', teamsRes);
      setTeams([]);
    }

    // Rest of your existing code for projects, stats, etc...
    if (projectsRes.status === 'fulfilled') {
      if (projectsRes.value?.data?.success) {
        const projectsData = projectsRes.value.data.data || [];
        setProjects(projectsData);
      } else {
        setProjects([]);
      }
    } else {
      setProjects([]);
    }

    if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
      const stats = statsRes.value.data.data || {};
      setDashboardStats(stats);
    }

    if (employeesRes.status === 'fulfilled') {
      if (employeesRes.value?.data?.success) {
        const employeesData = employeesRes.value.data.data || [];
        const validEmployees = employeesData.filter(emp => emp && emp.id);
        setEmployees(validEmployees);
        
        const leads = validEmployees.filter(emp => {
          const role = emp.role_name?.toLowerCase();
          const position = emp.position?.toLowerCase();
          return role !== 'hr' && position !== 'hr';
        });
        setProjectLeads(leads);
      } else {
        setEmployees([]);
      }
    }

    if (departmentsRes.status === 'fulfilled' && departmentsRes.value?.data?.success) {
      setDepartments(departmentsRes.value.data.data || []);
    }

    if (tasksRes.status === 'fulfilled' && tasksRes.value?.data?.success) {
      const tasksData = tasksRes.value.data.data || [];
      setTasks(tasksData);
    } else if (tasksRes.status === 'fulfilled') {
      setTasks([]);
    } else {
      setTasks([]);
    }

    setError('');
  } catch (err) {
    console.error('Error fetching data:', err);
    setError('Failed to load data. Please refresh the page.');
  } finally {
    setLoading(false);
  }
};

  const getUserProjects = () => {
    if (projects.length > 0) {
      return projects;
    }
    return projects;
  };

  const getUserTasks = () => {
    const userIdStr = String(currentUser.id);
    const userTasksFiltered = tasks.filter(t => {
      const assignedId = t.assigned_to_member;
      const assignedIdStr = String(assignedId);
      return assignedIdStr === userIdStr;
    });
    return userTasksFiltered;
  };

  const canCreateProject = () => currentUser.role === 'hr';
  const canCreateTeam = () => currentUser.isProjectLead;
  const canCreateTask = (projectId) => currentUser.isProjectLead && currentUser.managedProjects.includes(projectId);
  const canEditProject = () => currentUser.role === 'hr';
  const canDeleteTask = (task) => {
    if (currentUser.isProjectLead) return currentUser.managedProjects.includes(task.project_id);
    return false;
  };
  const canDeleteTeam = (team) => {
    if (currentUser.isProjectLead) return currentUser.managedProjects.includes(team.project_id);
    return false;
  };
  const canEditTask = (task) => {
    if (currentUser.role === 'hr') return true;
    if (currentUser.isProjectLead) return currentUser.managedProjects.includes(task.project_id);
    return task.assigned_to_member === currentUser.employeeId;
  };
  const canViewTeamManagement = () => currentUser.isProjectLead;

  const handleEmployeeSelection = (employeeId) => {
    if (!employeeId || employeeId === 'null' || employeeId === 'undefined' || employeeId === '') {
      console.warn('Invalid employee ID attempted:', employeeId);
      return;
    }
    
    const id = String(employeeId).trim();
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

 const handleCreateTeam = async (e) => {
  e.preventDefault();
  
  if (!teamFormData.name) {
    alert('Team name is required');
    return;
  }
  if (!teamFormData.project_id) {
    alert('Please select a project for this team');
    return;
  }
  
  const validMembers = selectedEmployees.filter(id => {
    return id && id !== 'null' && id !== 'undefined' && id !== '' && id !== null;
  });
  
  if (validMembers.length === 0) {
    alert('Please select at least one valid team member');
    return;
  }

  try {
    const teamData = {
      name: teamFormData.name,
      project_id: parseInt(teamFormData.project_id),
      team_lead_id: teamFormData.team_lead_id ? parseInt(teamFormData.team_lead_id) : null,
      description: teamFormData.description || '',
      status: 'Active',
      members: validMembers
    };
    
    console.log('Creating team with data:', teamData);
    
    const response = await projectAPI.createTeam(teamData);
    console.log('Create team response:', response);
    
    if (response.data && response.data.success) {
      // Get the newly created team from response
      const newTeam = response.data.data;
      console.log('New team created:', newTeam);
      
      // Add the new team to the existing teams state
      if (newTeam) {
        setTeams(prevTeams => {
          const updatedTeams = [...prevTeams, {
            ...newTeam,
            members: newTeam.members || [],
            member_count: newTeam.members?.length || validMembers.length
          }];
          console.log('Updated teams list:', updatedTeams);
          return updatedTeams;
        });
      } else {
        // If response doesn't return the team, fetch all teams again
        await fetchAllData();
      }
      
      // Reset form and close modal
      setTeamFormData({ 
        name: '', 
        team_lead_id: '', 
        project_id: '', 
        description: '', 
        members: [] 
      });
      setSelectedEmployees([]);
      setIsTeamModalOpen(false);
      alert(response.data.message || 'Team created successfully!');
      setActiveTab('teams');
    } else {
      alert(response.data?.message || 'Failed to create team');
    }
  } catch (error) {
    console.error('Error creating team:', error);
    console.error('Error response:', error.response);
    alert(error.response?.data?.message || 'Failed to create team');
  }
};

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!taskFormData.title || !taskFormData.title.trim()) {
      alert('Task title is required');
      return;
    }
    if (!taskFormData.project_id) {
      alert('Project is required');
      return;
    }
    if (selectedTaskEmployees.length === 0) {
      alert('Please select at least one employee to assign this task to');
      return;
    }

    try {
      let createdCount = 0;
      
      for (const userId of selectedTaskEmployees) {
        const numericUserId = Number(userId);
        
        const taskData = {
          title: taskFormData.title.trim(),
          description: taskFormData.description?.trim() || '',
          priority: taskFormData.priority || 'Medium',
          estimated_hours: Number(taskFormData.estimated_hours) || 0,
          due_date: taskFormData.due_date || null,
          project_id: Number(taskFormData.project_id),
          team_id: taskFormData.team_id ? Number(taskFormData.team_id) : null,
          assigned_by: currentUser?.id ? Number(currentUser.id) : null,
          assigned_by_name: currentUser?.name || null,
          status: 'To-Do',
          review_status: 'Not Reviewed',
          progress: 0,
          assigned_to_member: numericUserId
        };
        
        const response = await projectAPI.createTask(taskData);
        
        if (response.data.success) {
          createdCount++;
        }
      }
      
      setTaskFormData({ 
        title: '', 
        description: '', 
        priority: 'Medium', 
        estimated_hours: 0, 
        due_date: '', 
        project_id: selectedProject?.id || '',
        team_id: '',
        assigned_to_members: [] 
      });
      setSelectedTaskEmployees([]);
      setIsTaskModalOpen(false);
      
      await fetchAllData();
      
      if (createdCount > 0) {
        alert(`${createdCount} task(s) created successfully!`);
      } else {
        alert('Failed to create tasks.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  // Export to Excel for editing
  const handleEditInExcel = (projectId) => {
    const project = projects.find(p => p.id == projectId);
    if (!project) return;
    
    const projectTasks = tasks.filter(task => task.project_id == projectId);
    
    if (projectTasks.length === 0) {
      alert('No tasks to export for this project');
      return;
    }
    
    const exportData = projectTasks.map(task => ({
      'Task ID': task.id,
      'Date': new Date().toLocaleDateString(),
      'Project': project.name,
      'Task/Activity': task.title,
      'Description (What I did)': task.description || '',
      'Status': task.status,
      'Remarks': task.remarks || '',
      'Priority': task.priority,
      'Due Date': task.due_date ? formatDate(task.due_date) : 'Not set',
      'Assigned To': task.assigned_to_name || 'Not Assigned'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Editable_Tasks_${project.name}`);
    
    // Auto-size columns
    worksheet['!cols'] = [
      { wch: 10 },  // Task ID
      { wch: 12 },  // Date
      { wch: 20 },  // Project
      { wch: 30 },  // Task/Activity
      { wch: 40 },  // Description
      { wch: 15 },  // Status
      { wch: 30 },  // Remarks
      { wch: 10 },  // Priority
      { wch: 12 },  // Due Date
      { wch: 20 }   // Assigned To
    ];
    
    const fileName = `Editable_Tasks_${project.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    alert(`Excel file exported! Edit the Description, Status, and Remarks columns, then save the file. The changes will be applied when you import back.`);
  };

  // Import from Excel after editing
  const handleImportFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        let updatedCount = 0;
        let errors = [];

        for (const row of jsonData) {
          const taskId = row['Task ID'];
          const description = row['Description (What I did)'];
          const status = row['Status'];
          const remarks = row['Remarks'];
          
          if (taskId) {
            try {
              const updateData = {};
              if (description !== undefined) updateData.description = description;
              if (status !== undefined) {
                updateData.status = status;
                // Auto-update progress based on status
                if (status === 'Completed') {
                  updateData.progress = 100;
                  updateData.completed_date = new Date().toISOString().split('T')[0];
                } else if (status === 'In Progress') {
                  updateData.progress = 50;
                } else if (status === 'Ready for Review') {
                  updateData.progress = 80;
                } else if (status === 'To-Do') {
                  updateData.progress = 0;
                } else if (status === 'Blocked') {
                  updateData.progress = 0;
                }
              }
              if (remarks !== undefined) updateData.remarks = remarks;
              
              if (Object.keys(updateData).length > 0) {
                await projectAPI.updateTask(taskId, updateData);
                updatedCount++;
              }
            } catch (err) {
              errors.push(`Task ID ${taskId}: ${err.message}`);
            }
          }
        }

        await fetchAllData();
        
        let message = `✅ Import Complete!\n`;
        message += `📝 Updated: ${updatedCount} tasks\n`;
        if (errors.length > 0) {
          message += `\n❌ Errors (${errors.length}):\n${errors.slice(0, 5).join('\n')}`;
        }
        alert(message);
        
        // Clear file input
        event.target.value = '';
        
      } catch (err) {
        console.error('Error importing tasks:', err);
        alert('Failed to import tasks: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Simple Monthly Export Function
  const handleExportMonthlyReport = (projectId) => {
    const project = projects.find(p => p.id == projectId);
    if (!project) return;
    
    const projectTasks = tasks.filter(task => task.project_id == projectId);
    
    if (projectTasks.length === 0) {
      alert('No tasks to export for this project');
      return;
    }
    
    const exportData = projectTasks.map(task => ({
      'Date': new Date().toLocaleDateString(),
      'Project': project.name,
      'Task/Activity': task.title,
      'Description': task.description || '',
      'Status': task.status,
      'Remarks': task.remarks || '',
      'Priority': task.priority,
      'Due Date': task.due_date ? formatDate(task.due_date) : 'Not set',
      'Progress': `${task.progress || 0}%`,
      'Assigned To': task.assigned_to_name || 'Not Assigned'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Monthly_Report_${project.name}`);
    
    const fileName = `Monthly_Report_${project.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    alert(`Monthly report exported successfully!`);
  };

  // Calculate overall project progress from all tasks
  const calculateOverallProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(task => task.project_id == projectId);
    
    if (projectTasks.length === 0) return 0;
    
    let totalProgress = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    projectTasks.forEach(task => {
      totalProgress += task.progress || 0;
      if (task.status === 'Completed') {
        completedTasks++;
      } else if (task.status === 'In Progress') {
        inProgressTasks++;
      }
    });
    
    const averageProgress = totalProgress / projectTasks.length;
    const completionRate = (completedTasks / projectTasks.length) * 100;
    const inProgressRate = (inProgressTasks / projectTasks.length) * 50;
    
    // Weighted calculation: 50% average progress + 30% completion rate + 20% in-progress rate
    let overallProgress = (averageProgress * 0.5) + (completionRate * 0.3) + (inProgressRate * 0.2);
    
    return Math.round(overallProgress);
  };

  const getTaskStatusIcon = (status) => {
    switch(status) {
      case 'Completed': return <FaCheckCircle style={{ color: '#28a745' }} />;
      case 'In Progress': return <FaHourglassHalf style={{ color: '#ffc107' }} />;
      case 'To-Do': return <FaClock style={{ color: '#6c757d' }} />;
      case 'Blocked': return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      default: return null;
    }
  };

  const getReviewStatusBadge = (status) => {
    const statusMap = {
      'Approved': { class: 'review-approved', text: '✓ Approved' },
      'Rejected': { class: 'review-rejected', text: '✗ Rejected' },
      'Needs Rework': { class: 'review-rework', text: '⟳ Needs Rework' },
      'Not Reviewed': { class: 'review-pending', text: '⏳ Pending' }
    };
    const config = statusMap[status] || statusMap['Not Reviewed'];
    return <span className={`review-badge ${config.class}`}>{config.text}</span>;
  };

  const handleUpdateTask = async (taskId, updateData) => {
    try {
      await projectAPI.updateTask(taskId, updateData);
      await fetchAllData();
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  const handleExportProjects = () => {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    <div className="project-management-section" id="project-management-section">
      <div className="project-management-header">
        <h2 className="project-management-title">Project & Assignment</h2>
        <div className="project-welcome-message">
          Welcome, {userSession.employeeName}
=======
    <div className="proj-management-section" id="proj-management-main">
      {/* Header */}
      <div className="proj-management-header">
        <h2 id="proj-management-title">
          Project Management System
          {currentUser.role === 'hr' && <span className="proj-hr-badge">HR Access</span>}
          {currentUser.isProjectLead && <span className="proj-lead-badge">Project Lead</span>}
        </h2>
        <div className="proj-user-info">
          <span className="proj-user-name">{currentUser.name}</span>
          <span className="proj-user-role">
            {currentUser.role === 'hr' ? 'HR Administrator' : (currentUser.isProjectLead ? 'Project Lead' : 'Team Member')}
          </span>
        </div>
        <div className="proj-header-actions">
          <button className={`proj-tab-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            <FaTasks /> Projects ({userProjects.length})
          </button>
          {canViewTeamManagement() && (
            <button className={`proj-tab-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
              <FaUsers /> Teams ({teams.filter(t => currentUser.managedProjects.includes(t.project_id)).length})
            </button>
          )}
          <button className={`proj-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <FaTasks /> Tasks ({userTasks.length})
          </button>
          {canCreateProject() && activeTab === 'projects' && (
            <button className="proj-add-btn" onClick={() => setIsModalOpen(true)}><FaPlus /> Create Project</button>
          )}
          {canCreateTeam() && activeTab === 'teams' && (
            <button className="proj-add-btn" onClick={() => setIsTeamModalOpen(true)}><FaUsers /> Create Team</button>
          )}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="proj-table-container">
          <div className="proj-table-header">
            <h3>Project Directory</h3>
            <div className="proj-table-actions">
              <input type="text" placeholder="Search projects..." className="proj-filter-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select className="proj-filter-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">All Status</option>
                {projectStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              <select className="proj-filter-select" value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              <button className="proj-export-btn" onClick={handleExportProjects} disabled={filteredProjects.length === 0}>Export</button>
              
              
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td>{project.department}</td>
                    <td>{project.manager}</td>
                    <td>{formatDate(project.start_date)}</td>
                    <td>{formatDate(project.end_date)}  </td>
                    <td>{project.current_phase}</td>
                    <td>{project.progress}%</td>
                    <td>{getStatusBadge(project)}</td>
           <td style={{ minWidth: '100px' }}>
    <button onClick={() => { setSelectedProject(project); setIsViewModalOpen(true); }} className="proj-action-btn" title="View Details">
        <FaEye />
    </button>
    {canEditProject() && (
        <button onClick={() => { setSelectedProject(project); setIsDeleteModalOpen(true); }} className="proj-action-btn" title="Delete Project">
            <FaTrash />
        </button>
    )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

  {/* Teams Tab */}
{activeTab === 'teams' && canViewTeamManagement() && (
  <div className="proj-table-container">
    <div className="proj-table-header">
      <h3>Teams ({teams.filter(t => currentUser.managedProjects.includes(t.project_id)).length})</h3>
      <div className="proj-table-actions">
        {canCreateTeam() && <button className="proj-add-btn" onClick={() => setIsTeamModalOpen(true)}><FaUsers /> Create Team</button>}
      </div>
    </div>
    <div className="proj-table-wrapper">
      {teams.filter(t => currentUser.managedProjects.includes(t.project_id)).length === 0 ? (
        <div className="proj-empty-state">
          <div className="proj-empty-icon">👥</div>
          <p>No teams found. Create a team to get started!</p>
        </div>
      ) : (
        <table className="proj-main-table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Project</th>
        
              <th>Members</th>
              <th>Member Count</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams
              .filter(team => currentUser.managedProjects.includes(team.project_id))
              .map(team => {
                const project = projects.find(p => p.id === team.project_id);
                const membersList = team.members || [];
                const isInactive = team.status === 'Inactive';
                return (
                  <tr key={team.id} style={isInactive ? { opacity: 0.6, backgroundColor: '#f5f5f5' } : {}}>
                    <td><strong>{team.name}</strong>{isInactive && <span style={{ color: '#999', fontSize: '11px', marginLeft: '8px' }}>(Deleted)</span>}</td>
                    <td>{project ? <span className="project-badge">{project.name}</span> : <span className="text-muted">Not Assigned</span>}</td>
                    <td>{team.team_lead_name || 'Not Assigned'}</td>
                    <td>
                      <div className="team-members-list">
                        {membersList && membersList.length > 0 ? (
                          membersList.map((member, index) => (
                            <div key={member.id || index} className="member-item">
                              <span className="member-name">{member.name || 'Unknown'}</span>
                              <small className="member-position">{member.position || 'Member'}</small>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted">No members assigned</span>
                        )}
                      </div>
                    </td>
                    <td>{membersList.length || team.member_count || 0}</td>
                    <td>
                      <span className={`team-status-badge ${team.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                        {team.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => {
                          const membersListText = membersList && membersList.length > 0
                            ? membersList.map(m => `- ${m.name} (${m.position || 'Member'})`).join('\n')
                            : 'No members assigned';
                          alert(`Team: ${team.name}\nProject: ${project?.name || 'Not Assigned'}\nLead: ${team.team_lead_name || 'None'}\nStatus: ${team.status || 'Active'}\n\nMembers (${membersList.length}):\n${membersListText}`);
                        }} 
                        className="proj-action-btn" 
                        title="View Team Details"
                      >
                        <FaEye />
                      </button>
                      {canDeleteTeam(team) && team.status !== 'Inactive' && (
                        <button 
                          onClick={() => {
                            setSelectedTeam(team);
                            setIsDeleteTeamModalOpen(true);
                          }} 
                          className="proj-action-btn" 
                          title="Delete Team"
                          style={{ color: '#dc3545' }}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  </div>
)}

     {/* Tasks Tab with Excel Editing and Filtering */}
{activeTab === 'tasks' && (
  <div className="proj-table-container">
    <div className="proj-table-header">
      <h3>Tasks</h3>
      <div className="proj-table-actions">
        <select 
          className="proj-filter-select" 
          value={selectedProject?.id || ''} 
          onChange={(e) => {
            const projectId = e.target.value;
            if (projectId) {
              const project = projects.find(p => p.id == projectId);
              setSelectedProject(project);
            } else {
              setSelectedProject(null);
            }
          }}
          style={{ minWidth: '250px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">-- Select a Project --</option>
          {userProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        {/* Month Filter Toggle */}
        <button 
          className={`proj-filter-btn ${showMonthFilter ? 'active' : ''}`}
          onClick={() => setShowMonthFilter(!showMonthFilter)}
          style={{
            padding: '8px 12px',
            background: showMonthFilter ? '#4caf50' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📅 {showMonthFilter ? 'Filter ON' : 'Filter OFF'}
        </button>
        
        {/* Month/Year Selectors (visible when filter is on) */}
        {showMonthFilter && (
          <>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="proj-filter-select"
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
            
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="proj-filter-select"
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </>
        )}
        
      
        {canCreateTask(selectedProject?.id) && (
          <button className="proj-add-btn" onClick={() => setIsTaskModalOpen(true)}><FaPlus /> Create Task</button>
        )}
      </div>
    </div>
    
    {/* Show Overall Project Progress */}
    {selectedProject && (
      <div style={{ 
        padding: '15px 20px', 
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
        borderBottom: '1px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <strong style={{ fontSize: '14px', color: '#2c3e50' }}>📊 Overall Project Progress:</strong>
          <div style={{ marginTop: '5px' }}>
            <div style={{ 
              width: '300px', 
              height: '8px', 
              background: '#e9ecef', 
              borderRadius: '4px', 
              overflow: 'hidden' 
            }}>
              <div style={{ 
                width: `${calculateOverallProjectProgress(selectedProject.id)}%`, 
                height: '100%', 
                background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: '#666' }}>
          Total Tasks: {tasks.filter(t => t.project_id == selectedProject.id).length} | 
          Completed: {tasks.filter(t => t.project_id == selectedProject.id && t.status === 'Completed').length} |
          In Progress: {tasks.filter(t => t.project_id == selectedProject.id && t.status === 'In Progress').length}
          {showMonthFilter && (
            <span style={{ marginLeft: '10px', padding: '4px 8px', background: '#e3f2fd', borderRadius: '4px' }}>
              Filtered: {getMonthName(selectedMonth)} {selectedYear}
            </span>
          )}
        </div>
      </div>
    )}
    
    <div className="proj-table-wrapper">
      {!selectedProject ? (
        <div className="proj-empty-state">
          <div className="proj-empty-icon">📋</div>
          <p>Please select a project from the dropdown above to view its tasks.</p>
        </div>
      ) : (() => {
        let projectTasks = tasks.filter(task => task.project_id == selectedProject.id);
        
        // Apply month filter if enabled
        if (showMonthFilter) {
          projectTasks = filterTasksByMonth(projectTasks, selectedMonth, selectedYear);
        }
        
        if (projectTasks.length === 0) {
          return (
            <div className="proj-empty-state">
              <div className="proj-empty-icon">📋</div>
              <p>No tasks found for project: <strong>{selectedProject.name}</strong></p>
              {showMonthFilter && (
                <p style={{ fontSize: '13px', color: '#666' }}>
                  Filter applied: {getMonthName(selectedMonth)} {selectedYear}
                </p>
              )}
              {canCreateTask(selectedProject?.id) && (
                <button className="proj-add-btn" onClick={() => setIsTaskModalOpen(true)} style={{ marginTop: '15px' }}>
                  <FaPlus /> Create First Task
                </button>
              )}
            </div>
          );
        }
        
        return (
          <>
            {/* Download Buttons */}
            <div style={{ 
              padding: '10px', 
              background: '#f8f9fa', 
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button 
                onClick={() => openExcelEditor()}
                className="proj-action-btn"
                style={{
                  background: '#4caf50',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <FaFileExcel /> Edit in Sheet View
              </button>
            </div>
            
            <table className="proj-main-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Task/Activity</th>
                  <th>Description (What I did)</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projectTasks.map(task => (
                  <tr key={task.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {task.created_at ? formatDate(task.created_at) : formatDate(new Date())}
                    </td>
                    <td>{selectedProject?.name}</td>
                    <td>
                      <strong>{task.title}</strong>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        Priority: {getTaskPriorityBadge(task.priority)}
                      </div>
                      {task.due_date && (
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Due: {formatDate(task.due_date)}
                        </div>
                      )}
                    </td>
                    <td style={{ minWidth: '250px' }}>
                      {task.description || <span style={{ color: '#999', fontStyle: 'italic' }}>No description added yet</span>}
                    </td>
                    <td style={{ minWidth: '150px' }}>
                      <div className="task-status-text">
                        {getTaskStatusIcon(task.status)}
                        {task.status}
                      </div>
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      {task.remarks || <span style={{ color: '#999', fontStyle: 'italic' }}>No remarks</span>}
                    </td>
                    <td style={{ minWidth: '100px' }}>
                      <button 
                        onClick={() => {
                          setSelectedTask(task);
                          setIsTaskDetailsModalOpen(true);
                        }} 
                        className="proj-action-btn" 
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {canDeleteTask(task) && (
                        <button 
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDeleteTaskModalOpen(true);
                          }} 
                          className="proj-action-btn" 
                          title="Delete Task"
                          style={{ color: '#dc3545' }}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      })()}
    </div>
  </div>
)}
      {/* Create Team Modal */}
      {isTeamModalOpen && canCreateTeam() && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Create New Team</h2>
              <button className="proj-close-btn" onClick={() => setIsTeamModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTeam} className="proj-form">
              <div className="proj-form-group">
                <label className="required">Project *</label>
                <select 
                  name="project_id" 
                  value={teamFormData.project_id} 
                  onChange={(e) => setTeamFormData({...teamFormData, project_id: e.target.value})} 
                  required
                >
                  <option value="">Select Project</option>
                  {projects.filter(p => currentUser.managedProjects.includes(p.id)).map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="proj-form-group">
                <label className="required">Team Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={teamFormData.name} 
                  onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})} 
                  required 
                  placeholder="e.g., Frontend Development Team" 
                />
              </div>
              
              
              <div className="proj-form-group">
                <label className="required">Team Members *</label>
                <div style={{ 
                  marginBottom: '10px', 
                  padding: '10px', 
                  background: '#f8f9fa', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '4px',
                  minHeight: '60px'
                }}>
                  <strong>Selected Members ({selectedEmployees.length}):</strong>
                  {selectedEmployees.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {selectedEmployees.map(id => {
                        const emp = employees.find(e => e.id == id);
                        return emp ? (
                          <span key={id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: '#28a745', color: 'white', padding: '4px 10px',
                            borderRadius: '16px', fontSize: '13px'
                          }}>
                            {emp.name}
                            <button 
                              type="button" 
                              onClick={() => handleEmployeeSelection(id)} 
                              style={{ 
                                background: 'none', border: 'none', color: 'white', 
                                cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 
                              }}
                            >×</button>
                          </span>
                        ) : (
                          <span key={id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: '#dc3545', color: 'white', padding: '4px 10px',
                            borderRadius: '16px', fontSize: '13px'
                          }}>
                            ID: {id} (Not Found)
                            <button 
                              type="button" 
                              onClick={() => handleEmployeeSelection(id)} 
                              style={{ 
                                background: 'none', border: 'none', color: 'white', 
                                cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 
                              }}
                            >×</button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color: '#dc3545', marginTop: '6px', fontSize: '13px' }}>
                      ⚠️ No members selected. Please select at least one team member below.
                    </div>
                  )}
                </div>

                <div style={{ 
                  maxHeight: '240px', 
                  overflowY: 'auto', 
                  border: '1px solid #ced4da', 
                  borderRadius: '4px',
                  background: 'white'
                }}>
                  <div style={{ 
                    padding: '8px 12px', 
                    background: '#e9ecef', 
                    fontWeight: '600', 
                    fontSize: '13px',
                    position: 'sticky',
                    top: 0,
                    borderBottom: '1px solid #ced4da'
                  }}>
                    Available Employees ({employees.filter(emp => emp.role_name?.toLowerCase() !== 'hr').length})
                  </div>
                  {employees.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                      ⚠️ No employees found. Please check if employees are loaded.
                      
                    </div>
                  ) : (
                    employees
                      .filter(emp => emp.role_name?.toLowerCase() !== 'hr')
                      .map(emp => {
                        const empId = String(emp.id);
                        const isSelected = selectedEmployees.includes(empId);
                        return (
                          <label 
                            key={emp.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '10px 12px', 
                              cursor: 'pointer',
                              borderBottom: '1px solid #f0f0f0',
                              background: isSelected ? '#e3f2fd' : 'white'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleEmployeeSelection(empId)} 
                              style={{ marginRight: '12px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ flex: 1, fontWeight: isSelected ? '600' : '400' }}>
                              {emp.name}
                            </span>
                            <small style={{ color: '#6c757d', fontSize: '12px', marginRight: '8px' }}>
                              {emp.position || 'Employee'}
                            </small>
                            <small style={{ color: '#adb5bd', fontSize: '10px' }}>
                              ID: {emp.id}
                            </small>
                          </label>
                        );
                      })
                  )}
                </div>
                
                <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                  * Required: Select at least one member for the team
                </small>
              </div>
              
              <div className="proj-form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={teamFormData.description} 
                  onChange={(e) => setTeamFormData({...teamFormData, description: e.target.value})} 
                  rows="3" 
                  placeholder="Describe the team's purpose..." 
                />
              </div>
              
              <div className="proj-form-actions">
                <button type="button" onClick={() => setIsTeamModalOpen(false)} className="proj-cancel-btn">Cancel</button>
                <button 
                  type="submit" 
                  className="proj-submit-btn"
                  disabled={selectedEmployees.length === 0}
                  style={selectedEmployees.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Create Team with {selectedEmployees.length} Member(s)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && canCreateTask(selectedProject?.id) && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Create New Task for {selectedProject?.name}</h2>
              <button className="proj-close-btn" onClick={() => setIsTaskModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateTask} className="proj-form">
              <div className="proj-form-group">
                <label className="required">Project *</label>
                <input 
                  type="text" 
                  value={selectedProject?.name || 'No project selected'} 
                  disabled 
                  style={{ background: '#f5f5f5' }}
                />
                <input 
                  type="hidden" 
                  name="project_id" 
                  value={selectedProject?.id || ''} 
                />
              </div>
              
              <div className="proj-form-group">
                <label className="required">Task Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={taskFormData.title} 
                  onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="proj-form-group">
                <label>Select Team</label>
                <select 
                  name="team_id" 
                  value={taskFormData.team_id} 
                  onChange={(e) => {
                    const teamId = e.target.value;
                    setTaskFormData({...taskFormData, team_id: teamId});
                    
                    if (teamId) {
                      loadTeamMembers(teamId);
                    } else {
                      setAvailableTeamMembers([]);
                      setSelectedTaskEmployees([]);
                    }
                  }}
                  className="proj-form-select"
                >
                  <option value="">Select Team (Optional)</option>
                  {teams
                    .filter(team => team.project_id === selectedProject?.id)
                    .map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} (Members: {team.members?.length || team.member_count || 0})
                      </option>
                    ))}
                </select>
                {teams.filter(team => team.project_id === selectedProject?.id).length === 0 && (
                  <small style={{ color: '#f44336', display: 'block', marginTop: '5px' }}>
                    No teams found for this project. Please create a team first in the Teams tab.
                  </small>
                )}
              </div>
              
              {taskFormData.team_id && (
                <div className="proj-form-group">
                  <label className="required">Assign to Team Members *</label>
                  
                  
                  
                  {loadingTeamMembers ? (
                    <div className="loading-members">Loading team members...</div>
                  ) : availableTeamMembers.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                      {availableTeamMembers.map(member => (
                        <label key={member.user_id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '10px', 
                          cursor: 'pointer', 
                          borderBottom: '1px solid #f0f0f0',
                          background: selectedTaskEmployees.includes(member.user_id) ? '#e3f2fd' : 'white'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={selectedTaskEmployees.includes(member.user_id)} 
                            onChange={() => {
                              const userId = member.user_id;
                              setSelectedTaskEmployees(prev => 
                                prev.includes(userId) 
                                  ? prev.filter(id => id !== userId) 
                                  : [...prev, userId]
                              );
                            }} 
                            style={{ marginRight: '10px' }}
                          />
                          <span style={{ flex: 1 }}>
                            <strong>{member.name}</strong>
                            <br/>
                            <small style={{ color: '#666' }}>{member.position || 'Team Member'}</small>
                          </span>
                          <small style={{ color: '#999', fontSize: '10px', marginLeft: '8px' }}>
                            ID: {member.user_id}
                          </small>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#f44336', background: '#ffebee', borderRadius: '4px' }}>
                      ⚠️ No members found in this team.
                     
                    </div>
                  )}
                </div>
              )}
              
              <div className="proj-form-row">
                <div className="proj-form-group">
                  <label>Priority</label>
                  <select name="priority" value={taskFormData.priority} onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value})}>
                    {taskPriorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="proj-form-group">
                  <label>Estimated Hours</label>
                  <input type="number" name="estimated_hours" value={taskFormData.estimated_hours} onChange={(e) => setTaskFormData({...taskFormData, estimated_hours: parseFloat(e.target.value)})} step="0.5" min="0" />
                </div>
              </div>
              
              <div className="proj-form-group">
                <label>Due Date</label>
                <input type="date" name="due_date" value={taskFormData.due_date} onChange={(e) => setTaskFormData({...taskFormData, due_date: e.target.value})} />
              </div>
              
              <div className="proj-form-group">
                <label>Description</label>
                <textarea name="description" value={taskFormData.description} onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})} rows="3" />
              </div>
              
              <div className="proj-form-actions">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="proj-cancel-btn">Cancel</button>
                <button 
                  type="submit" 
                  className="proj-submit-btn"
                  disabled={!taskFormData.title || selectedTaskEmployees.length === 0}
                  style={(!taskFormData.title || selectedTaskEmployees.length === 0) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Create Task{selectedTaskEmployees.length > 0 ? ` for ${selectedTaskEmployees.length} Member(s)` : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && canCreateProject() && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Create New Project</h2>
              <button className="proj-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitProject} className="proj-form">
              <div className="proj-form-section">
                <h3 className="proj-section-title"><FaBell /> Project Information</h3>
                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label className="required">Project Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="proj-form-group">
                    <label className="required">Department *</label>
                    <select name="department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required>
                      <option value="">Select Department</option>
                      {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                </div>
                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label className="required">Project Lead *</label>
                    <select name="project_lead" value={formData.project_lead} onChange={(e) => setFormData({...formData, project_lead: e.target.value})} required>
                      <option value="">Select Project Lead</option>
                      {projectLeads.map(lead => <option key={lead.id} value={lead.id}>{lead.name} - {lead.position}</option>)}
                    </select>
                  </div>
                  <div className="proj-form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      {projectStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </div>
                <div className="proj-form-row">
                  <div className="proj-form-group">
                    <label>Start Date</label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                  </div>
                  <div className="proj-form-group">
                    <label>End Date</label>
                    <input type="date" name="end_date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                </div>
                <div className="proj-form-group">
                  <label>Current Phase</label>
                  <select name="current_phase" value={formData.current_phase} onChange={(e) => setFormData({...formData, current_phase: e.target.value})}>
                    <option value="">Select Phase</option>
                    {phases.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                  </select>
                </div>
                <div className="proj-form-group">
                  <label>Project Description</label>
                  <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3" />
                </div>
              </div>
              <div className="proj-form-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="proj-cancel-btn">Cancel</button>
                <button type="submit" className="proj-submit-btn">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {isTaskDetailsModalOpen && selectedTask && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Task Details - {selectedTask.title}</h2>
              <button className="proj-close-btn" onClick={() => setIsTaskDetailsModalOpen(false)}>×</button>
            </div>
            <div className="proj-details-content">
              <div className="proj-details-grid">
                <div className="proj-detail-item"><label>Date</label><span>{new Date().toLocaleDateString()}</span></div>
                <div className="proj-detail-item"><label>Project</label><span>{selectedProject?.name}</span></div>
                <div className="proj-detail-item full-width"><label>Task/Activity</label><span>{selectedTask.title}</span></div>
                <div className="proj-detail-item full-width"><label>Description</label><span>{selectedTask.description || 'No description'}</span></div>
                <div className="proj-detail-item"><label>Status</label><span>{selectedTask.status}</span></div>
                <div className="proj-detail-item full-width"><label>Remarks</label><span>{selectedTask.remarks || 'No remarks'}</span></div>
                <div className="proj-detail-item"><label>Priority</label><span>{getTaskPriorityBadge(selectedTask.priority)}</span></div>
                <div className="proj-detail-item"><label>Due Date</label><span>{formatDate(selectedTask.due_date)}</span></div>
                <div className="proj-detail-item"><label>Assigned To</label><span>{selectedTask.assigned_to_name || 'Not Assigned'}</span></div>
                <div className="proj-detail-item"><label>Assigned By</label><span>{selectedTask.assigned_by_name}</span></div>
                <div className="proj-detail-item"><label>Review Status</label>{getReviewStatusBadge(selectedTask.review_status)}</div>
              </div>
              <div className="proj-form-actions">
                {canDeleteTask(selectedTask) && (
                  <button onClick={() => {
                    setIsTaskDetailsModalOpen(false);
                    setIsDeleteTaskModalOpen(true);
                  }} className="proj-delete-btn">Delete Task</button>
                )}
                <button onClick={() => setIsTaskDetailsModalOpen(false)} className="proj-cancel-btn">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Project Details Modal */}
      {isViewModalOpen && selectedProject && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content proj-large-modal">
            <div className="proj-modal-header">
              <h2>Project Details - {selectedProject.name}</h2>
              <button className="proj-close-btn" onClick={() => setIsViewModalOpen(false)}>×</button>
            </div>
            <div className="proj-details-content">
              <div className="proj-details-grid">
                <div className="proj-detail-item"><label>Project ID</label><span>PROJ{String(selectedProject.id).padStart(3, '0')}</span></div>
                <div className="proj-detail-item"><label>Project Name</label><span>{selectedProject.name}</span></div>
                <div className="proj-detail-item"><label>Department</label><span>{selectedProject.department}</span></div>
                <div className="proj-detail-item"><label>Project Lead</label><span>{selectedProject.manager}</span></div>
                <div className="proj-detail-item"><label>Start Date</label><span>{formatDate(selectedProject.start_date)}</span></div>
                <div className="proj-detail-item"><label>End Date</label><span>{formatDate(selectedProject.end_date)}</span></div>
                <div className="proj-detail-item"><label>Current Phase</label><span>{selectedProject.current_phase}</span></div>
                <div className="proj-detail-item"><label>Progress</label><span>{selectedProject.progress}%</span></div>
                <div className="proj-detail-item"><label>Status</label><span>{getStatusBadge(selectedProject)}</span></div>
              </div>
              <div className="proj-form-actions">
                {canEditProject() && <button onClick={() => setIsDeleteModalOpen(true)} className="proj-delete-btn">Delete Project</button>}
                <button onClick={() => setIsViewModalOpen(false)} className="proj-cancel-btn">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

         {/* Delete Project Confirmation Modal */}
      {isDeleteModalOpen && selectedProject && canEditProject() && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content">
            <div className="proj-modal-header">
              <h2>Delete Project</h2>
              <button className="proj-close-btn" onClick={() => setIsDeleteModalOpen(false)}>×</button>
            </div>
            <div className="proj-delete-confirm">
              <div className="emp-delete-icon"><FaExclamationTriangle /></div>
              <h3>Delete {selectedProject.name}?</h3>
              <p>Are you sure you want to delete this project? This action cannot be undone.</p>
              <div className="proj-delete-actions">
                <button onClick={() => setIsDeleteModalOpen(false)} className="proj-cancel-btn">Cancel</button>
                <button onClick={handleDeleteProject} className="proj-delete-btn">Delete Project</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {isDeleteTaskModalOpen && selectedTask && canDeleteTask(selectedTask) && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content">
            <div className="proj-modal-header">
              <h2>Delete Task</h2>
              <button className="proj-close-btn" onClick={() => setIsDeleteTaskModalOpen(false)}>×</button>
            </div>
            <div className="proj-delete-confirm">
              <div className="emp-delete-icon"><FaExclamationTriangle /></div>
              <h3>Delete Task: {selectedTask.title}?</h3>
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="proj-delete-actions">
                <button onClick={() => setIsDeleteTaskModalOpen(false)} className="proj-cancel-btn">Cancel</button>
                <button onClick={handleDeleteTask} className="proj-delete-btn">Delete Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {isDeleteTeamModalOpen && selectedTeam && canDeleteTeam(selectedTeam) && (
        <div className="proj-modal-overlay">
          <div className="proj-modal-content">
            <div className="proj-modal-header">
              <h2>Delete Team</h2>
              <button className="proj-close-btn" onClick={() => setIsDeleteTeamModalOpen(false)}>×</button>
            </div>
            <div className="proj-delete-confirm">
              <div className="emp-delete-icon"><FaExclamationTriangle /></div>
              <h3>Delete Team: {selectedTeam.name}?</h3>
              <p>Are you sure you want to delete this team? This action cannot be undone.</p>
              <div className="proj-delete-actions">
                <button onClick={() => setIsDeleteTeamModalOpen(false)} className="proj-cancel-btn">Cancel</button>
                <button onClick={handleDeleteTeam} className="proj-delete-btn">Delete Team</button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Excel-like Editor Modal with Download Option */}
{isExcelEditorOpen && (
  <div className="proj-modal-overlay">
    <div className="proj-modal-content" style={{ maxWidth: '95%', width: '1400px', maxHeight: '85vh' }}>
      <div className="proj-modal-header">
        <h2>📊 Edit Tasks - {selectedProject?.name}</h2>
        <button className="proj-close-btn" onClick={() => setIsExcelEditorOpen(false)}>×</button>
      </div>
      
      
      <div style={{ padding: '20px', overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
        <table className="proj-main-table" style={{ minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '120px' }}>Date (Day/Month/Year)</th>
              <th style={{ minWidth: '150px' }}>Project</th>
              <th style={{ minWidth: '200px' }}>Task/Activity</th>
              <th style={{ minWidth: '250px' }}>Description (What I did)</th>
              <th style={{ minWidth: '150px' }}>Status</th>
              <th style={{ minWidth: '250px' }}>Remarks</th>
              <th style={{ minWidth: '100px' }}>Priority</th>
              <th style={{ minWidth: '120px' }}>Due Date</th>
              <th style={{ minWidth: '150px' }}>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {editableTasks.map((task, index) => {
              const isAssignedToMe = task.assignedTo === currentUser.name;
              const isProjectLeadUser = currentUser.isProjectLead && currentUser.managedProjects.includes(selectedProject?.id);
              
              return (
                <tr key={index} style={!task.id && !task.task ? { background: '#f9f9f9' } : {}}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {task.displayDate}
                    {!task.id && !task.task && <span style={{ fontSize: '10px', color: '#999', display: 'block' }}>No task</span>}
                  </td>
                  <td>{task.project}</td>
                  <td>
                    {isProjectLeadUser ? (
                      <input
                        type="text"
                        value={task.task}
                        onChange={(e) => updateEditableTask(index, 'task', e.target.value)}
                        placeholder="Enter task name..."
                        style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    ) : (
                      <strong>{task.task || <span style={{ color: '#999' }}>No task</span>}</strong>
                    )}
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      Priority: {getTaskPriorityBadge(task.priority)}
                    </div>
                  </td>
                  <td>
                    {isAssignedToMe ? (
                      <textarea
                        value={task.description}
                        onChange={(e) => updateEditableTask(index, 'description', e.target.value)}
                        rows="2"
                        style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="What did you do?"
                      />
                    ) : (
                      <div style={{ padding: '5px', background: '#f5f5f5', borderRadius: '4px', minHeight: '50px' }}>
                        {task.description || <span style={{ color: '#999' }}>No description</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    {isProjectLeadUser ? (
                      <select
                        value={task.status}
                        onChange={(e) => updateEditableTask(index, 'status', e.target.value)}
                        style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        {taskStatuses.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="task-status-text">
                        {getTaskStatusIcon(task.status)}
                        {task.status}
                      </div>
                    )}
                  </td>
                  <td>
                    {isProjectLeadUser ? (
                      <textarea
                        value={task.remarks}
                        onChange={(e) => updateEditableTask(index, 'remarks', e.target.value)}
                        rows="2"
                        style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        placeholder="Add remarks here..."
                      />
                    ) : (
                      <div style={{ padding: '5px', background: '#f5f5f5', borderRadius: '4px', minHeight: '50px' }}>
                        {task.remarks || <span style={{ color: '#999' }}>No remarks</span>}
                      </div>
                    )}
                  </td>
                  <td>{getTaskPriorityBadge(task.priority)}</td>
                  <td>{task.dueDate}</td>
                  <td>
                    {isProjectLeadUser ? (
                      <input
                        type="text"
                        value={task.assignedTo}
                        onChange={(e) => updateEditableTask(index, 'assignedTo', e.target.value)}
                        placeholder="Employee name"
                        style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                        list="employeeNames"
                      />
                    ) : (
                      task.assignedTo || 'Not Assigned'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="proj-form-actions" style={{ padding: '15px', borderTop: '1px solid #e9ecef' }}>
        <div style={{ fontSize: '13px', color: '#666', flex: 1 }}>
          <FaCheckCircle style={{ color: '#4caf50' }} /> Employees can edit Description | 
          <FaCheckCircle style={{ color: '#ff9800', marginLeft: '10px' }} /> Project Leads can edit Status & Remarks |
          <FaDownload style={{ color: '#2196f3', marginLeft: '10px' }} /> Download as Excel for offline editing
        </div>
        <button onClick={() => setIsExcelEditorOpen(false)} className="proj-cancel-btn">
          Cancel
        </button>
        <button onClick={saveExcelEdits} className="proj-submit-btn">
          Save All Changes
        </button>
      </div>
    </div>
  </div>
)}
>>>>>>> Stashed changes
    </div>
  );
};

export default Projects;