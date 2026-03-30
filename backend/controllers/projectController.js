const Project = require('../models/projectModel');

const projectController = {
  // Get all projects
  getAllProjects: async (req, res) => {
    try {
      const projects = await Project.getAll(req.tenantId);
      res.json({ 
        success: true,
        data: projects,
        message: 'Projects retrieved successfully'
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Get project by ID
  getProjectById: async (req, res) => {
    try {
      const project = await Project.getById(req.tenantId, req.params.id);
      
      if (!project) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      res.json({ 
        success: true,
        data: project,
        message: 'Project retrieved successfully'
      });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Create new project
  createProject: async (req, res) => {
    try {
      const { 
        name, department, manager, start_date, end_date, 
        current_phase, status, description 
      } = req.body;

      // Validation
      if (!name || !department || !manager) {
        return res.status(400).json({ 
          success: false,
          message: 'Project name, department, and manager are required' 
        });
      }

      // Check if project name already exists
      const nameExists = await Project.checkNameExists(req.tenantId, name);
      if (nameExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Project name already exists' 
        });
      }

      const newProject = await Project.create(req.tenantId, {
        name,
        department,
        manager,
        start_date: start_date || null,
        end_date: end_date || null,
        current_phase: current_phase || 'Planning',
        status: status || 'On Track',
        description: description || ''
      });

      res.status(201).json({ 
        success: true,
        data: newProject,
        message: 'Project created successfully'
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Update project
  updateProject: async (req, res) => {
    try {
      const { 
        name, department, manager, start_date, end_date, 
        current_phase, status, description 
      } = req.body;
      const projectId = req.params.id;

      // Validation
      if (!name || !department || !manager) {
        return res.status(400).json({ 
          success: false,
          message: 'Project name, department, and manager are required' 
        });
      }

      // Check if project exists
      const existingProject = await Project.getById(req.tenantId, projectId);
      if (!existingProject) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      // Check if project name already exists (excluding current project)
      const nameExists = await Project.checkNameExists(req.tenantId, name, projectId);
      if (nameExists) {
        return res.status(400).json({ 
          success: false,
          message: 'Project name already exists' 
        });
      }

      const updatedProject = await Project.update(req.tenantId, projectId, {
        name,
        department,
        manager,
        start_date: start_date || null,
        end_date: end_date || null,
        current_phase: current_phase || existingProject.current_phase,
        status: status || existingProject.status,
        description: description || existingProject.description || ''
      });

      if (!updatedProject) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      res.json({ 
        success: true,
        data: updatedProject,
        message: 'Project updated successfully'
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Delete project
  deleteProject: async (req, res) => {
    try {
      const projectId = req.params.id;

      // Check if project exists
      const existingProject = await Project.getById(req.tenantId, projectId);
      if (!existingProject) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      const affectedRows = await Project.delete(req.tenantId, projectId);

      if (affectedRows === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      res.json({ 
        success: true,
        message: 'Project deleted successfully' 
      });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Update project phase
  updateProjectPhase: async (req, res) => {
    try {
      const { projectId, phaseName } = req.params;
      const { status, progress, comments } = req.body;

      // Check if project exists
      const existingProject = await Project.getById(req.tenantId, projectId);
      if (!existingProject) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      const updatedProject = await Project.updatePhase(req.tenantId, projectId, phaseName, {
        status: status || 'Not Started',
        progress: parseInt(progress) || 0,
        comments: comments || ''
      });

      if (!updatedProject) {
        return res.status(404).json({ 
          success: false,
          message: 'Phase not found' 
        });
      }

      res.json({ 
        success: true,
        data: updatedProject,
        message: 'Project phase updated successfully'
      });
    } catch (error) {
      console.error('Update project phase error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const stats = await Project.getDashboardStats(req.tenantId);
      
      res.json({ 
        success: true,
        data: stats,
        message: 'Dashboard stats retrieved successfully'
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Get managers list
  getManagers: async (req, res) => {
    try {
      const managers = await Project.getManagers(req.tenantId);
      res.json({ 
        success: true,
        data: managers,
        message: 'Managers retrieved successfully'
      });
    } catch (error) {
      console.error('Get managers error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Get departments list
  getDepartments: async (req, res) => {
    try {
   const departments = await Project.getDepartments(req.tenantId);
      res.json({ 
        success: true,
        data: departments,
        message: 'Departments retrieved successfully'
      });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Assign team to project
  assignProjectTeam: async (req, res) => {
    try {
      const projectId = req.params.id;
      const { assigned_department, manager_name, team } = req.body;

      // Check if project exists
      const existingProject = await Project.getById(req.tenantId, projectId);
      if (!existingProject) {
        return res.status(404).json({ 
          success: false,
          message: 'Project not found' 
        });
      }

      const teamData = {
        assigned_department: assigned_department || null,
        manager_name: manager_name || null,
        team: team || []
      };

      const updatedProject = await Project.assignTeam(req.tenantId, projectId, teamData);

      res.json({ 
        success: true,
        data: updatedProject,
        message: 'Project team assigned successfully'
      });
    } catch (error) {
      console.error('Assign project team error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Get employees for dropdown
  getProjectEmployees: async (req, res) => {
    try {
      const employees = await Project.getEmployeesForDropdown(req.tenantId);
      res.json({ 
        success: true,
        data: employees,
        message: 'Employees retrieved successfully'
      });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: error.message 
      });
    }
  },
  // In projectController.js
getProjectLeads: async (req, res) => {
  try {
    const employees = await Project.getAllEmployeesForLeads(req.tenantId);
    console.log('Employees for leads:', employees);
    
    res.json({ 
      success: true,
      data: employees,
      message: 'Project leads retrieved successfully'
    });
  } catch (error) {
    console.error('Get project leads error:', error);
    res.json({ 
      success: true,
      data: [],
      message: 'No leads found'
    });
  }
},
// In projectController.js
getProjectLeads: async (req, res) => {
  try {
    const employees = await Project.getAllEmployeesForLeads(req.tenantId);
    console.log('Employees for leads:', employees);
    
    res.json({ 
      success: true,
      data: employees,
      message: 'Project leads retrieved successfully'
    });
  } catch (error) {
    console.error('Get project leads error:', error);
    res.json({ 
      success: true,
      data: [],
      message: 'No leads found'
    });
  }
},

getProjectEmployees: async (req, res) => {
  try {
    const employees = await Project.getEmployeesForDropdown(req.tenantId);
    console.log('Employees for dropdown:', employees);
    
    res.json({ 
      success: true,
      data: employees,
      message: 'Employees retrieved successfully'
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.json({ 
      success: true,
      data: [],
      message: 'No employees found'
    });
  }
},
// In teamController.js - createTeam method
createTeam: async (req, res) => {
  try {
    const tenant_id = req.user?.tenant_id || req.tenantId;
    const { name, project_id, team_lead_id, description } = req.body;  // Add project_id
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }
    
    if (!project_id) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }
    
    const [result] = await db.execute(`
      INSERT INTO teams (tenant_id, name, project_id, team_lead_id, description, status)
      VALUES (?, ?, ?, ?, ?, 'Active')
    `, [tenant_id, name, project_id, team_lead_id || null, description || null]);
    
    const [newTeam] = await db.execute(`
      SELECT t.*, e.name as team_lead_name
      FROM teams t
      LEFT JOIN employees e ON t.team_lead_id = e.id
      WHERE t.id = ? AND t.tenant_id = ?
    `, [result.insertId, tenant_id]);
    
    res.status(201).json({ 
      success: true, 
      data: newTeam[0], 
      message: 'Team created successfully' 
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
},
};

module.exports = projectController;