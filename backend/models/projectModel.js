const pool = require('../config/database');

const Project = {
  // Get all projects with phases (exclude template project)
  getAll: async (tenantId) => {
    const [projects] = await pool.execute(`
      SELECT 
        id, name, description, department, manager, 
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        current_phase, status, progress, created_at, updated_at
      FROM projects 
      WHERE id != 1 AND tenant_id = ?
      ORDER BY created_at DESC
    `, [tenantId]);

    for (let project of projects) {
      const [phases] = await pool.execute(`
        SELECT * FROM project_phases 
        WHERE project_id = ? AND tenant_id = ?
        ORDER BY phase_order
      `, [project.id, tenantId]);
      
      // Parse documents for each phase
      project.phases = phases.map(phase => ({
        ...phase,
        documents: parseDocuments(phase.documents)
      }));

      // Get team members for each project
      project.team = await Project.getTeamMembers(tenantId, project.id);
    }

    return projects;
  },

  // Get project by ID with phases
  getById: async (tenantId, id) => {
    const [projects] = await pool.execute(`
      SELECT 
        id, name, description, department, manager, 
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        current_phase, status, progress, created_at, updated_at
      FROM projects WHERE id = ? AND tenant_id = ?
    `, [id, tenantId]);

    if (projects.length === 0) return null;

    const project = projects[0];
    
    // Get phases for this project
    const [phases] = await pool.execute(`
      SELECT * FROM project_phases 
      WHERE project_id = ? AND tenant_id = ?
      ORDER BY phase_order
    `, [id, tenantId]);
    
    // Parse documents for each phase
    project.phases = phases.map(phase => ({
      ...phase,
      documents: parseDocuments(phase.documents)
    }));
    
    // Get team members for this project
    project.team = await Project.getTeamMembers(tenantId, id);
    
    return project;
  },

// In projectModel.js - Update the create method
create: async (tenantId, projectData) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    console.log('Creating project with data:', projectData);

    const {
      name, department, manager, start_date, end_date, 
      current_phase, status, description = ''
    } = projectData;

    // Validate required fields
    if (!name || !department || !manager) {
      throw new Error('Missing required fields: name, department, manager');
    }

    // Insert project
    const [projectResult] = await connection.execute(
      `INSERT INTO projects (tenant_id, name, description, department, manager, start_date, end_date, current_phase, status, progress) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [tenantId, name, description || '', department, manager, start_date || null, end_date || null, current_phase || 'Planning', status || 'On Track']
    );

    const projectId = projectResult.insertId;

    // Check if project_phases table exists and get template phases
    try {
      // First check if the table exists
      const [tableCheck] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'project_phases'
      `);
      
      if (tableCheck[0].count > 0) {
        // Table exists, get template phases
        const [templatePhases] = await connection.execute(
          'SELECT name, phase_order FROM project_phases WHERE project_id = 1 AND tenant_id = ? ORDER BY phase_order',
          [tenantId]
        );
        
        let phasesToCreate = templatePhases;
        if (!phasesToCreate || phasesToCreate.length === 0) {
          phasesToCreate = [
            { name: 'Planning', phase_order: 1 },
            { name: 'Design', phase_order: 2 },
            { name: 'Development', phase_order: 3 },
            { name: 'Testing', phase_order: 4 },
            { name: 'Deployment', phase_order: 5 }
          ];
        }
        
        // Insert phases
        for (const phase of phasesToCreate) {
          await connection.execute(
            `INSERT INTO project_phases (tenant_id, project_id, name, phase_order, status, progress, comments, documents) 
             VALUES (?, ?, ?, ?, 'Not Started', 0, '', ?)`,
            [tenantId, projectId, phase.name, phase.phase_order, JSON.stringify([])]
          );
        }
      }
    } catch (phaseError) {
      console.log('Project phases table not found or error:', phaseError.message);
      // Continue without phases - phases table might not exist
    }

    await connection.commit();
    
    // Return the created project
    const [createdProject] = await connection.execute(`
      SELECT 
        id, name, description, department, manager, 
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        current_phase, status, progress, created_at, updated_at
      FROM projects WHERE id = ? AND tenant_id = ?
    `, [projectId, tenantId]);
    
    return createdProject[0] || { id: projectId, name, department, manager, status, progress: 0 };
    
  } catch (error) {
    await connection.rollback();
    console.error('Error in Project.create:', error);
    throw error;
  } finally {
    connection.release();
  }
},

  // Update project
  update: async (tenantId, id, projectData) => {
    const {
      name, department, manager, start_date, end_date, 
      current_phase, status, description = ''
    } = projectData;

    const [result] = await pool.execute(
      `UPDATE projects 
       SET name = ?, description = ?, department = ?, manager = ?, start_date = ?, 
           end_date = ?, current_phase = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND tenant_id = ?`,
      [name, description, department, manager, start_date, end_date, current_phase, status, id, tenantId]
    );

    if (result.affectedRows === 0) {
      return null;
    }

    // Return the updated project with formatted dates
    const [updatedProjects] = await pool.execute(`
      SELECT 
        id, name, description, department, manager, 
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        current_phase, status, progress, created_at, updated_at
      FROM projects WHERE id = ? AND tenant_id = ?
    `, [id, tenantId]);
    
    if (updatedProjects.length === 0) return null;
    
    const project = updatedProjects[0];
    
    // Get phases for this project
    const [phases] = await pool.execute(`
      SELECT * FROM project_phases 
      WHERE project_id = ? AND tenant_id = ?
      ORDER BY phase_order
    `, [id, tenantId]);
    
    // Parse documents for each phase
  project.phases = phases.map(phase => ({
  ...phase,
  documents: parseDocuments(phase.documents)
    }));

    // Get team members
    project.team = await Project.getTeamMembers(tenantId, id);
    
    return project;
  },

  // Delete project
  delete: async (tenantId, id) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // First delete phases
      await connection.execute('DELETE FROM project_phases WHERE project_id = ? AND tenant_id = ?', [id, tenantId]);
      
      // Delete team members
      await connection.execute('DELETE FROM project_team_members WHERE project_id = ? AND tenant_id = ?', [id, tenantId]);
      
      // Delete history
      await connection.execute('DELETE FROM project_history WHERE project_id = ? AND tenant_id = ?', [id, tenantId]);
      
      // Then delete project
      const [result] = await connection.execute('DELETE FROM projects WHERE id = ? AND tenant_id = ?', [id, tenantId]);
      
      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update project phase
  updatePhase: async (tenantId, projectId, phaseName, phaseData) => {
    const { status, progress, comments } = phaseData;

    const [result] = await pool.execute(
      `UPDATE project_phases 
       SET status = ?, progress = ?, comments = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE project_id = ? AND name = ? AND tenant_id = ?`,
      [status, progress, comments, projectId, phaseName, tenantId]
    );

    if (result.affectedRows > 0) {
      // Update project progress
      const [phases] = await pool.execute(
        'SELECT progress FROM project_phases WHERE project_id = ? AND tenant_id = ?',
        [projectId, tenantId]
      );

      const avgProgress = phases.length > 0 
        ? Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length)
        : 0;

      await pool.execute(
        'UPDATE projects SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?',
        [avgProgress, projectId, tenantId]
      );
    }

    return await Project.getById(tenantId, projectId);
  },

  // Get dashboard statistics (exclude template project)
  getDashboardStats: async (tenantId) => {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalProjects,
        COUNT(CASE WHEN status != 'Completed' THEN 1 END) as activeProjects,
        COUNT(CASE WHEN status = 'Delayed' THEN 1 END) as delayedProjects,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completedProjects
      FROM projects
      WHERE id != 1 AND tenant_id = ?
    `, [tenantId]);
    
    return rows[0];
  },

  // Get managers list
  getManagers: async (tenantId) => {
    const [rows] = await pool.execute(`
      SELECT DISTINCT manager as name 
      FROM departments 
      WHERE manager IS NOT NULL AND manager != '' AND tenant_id = ?
      UNION
      SELECT DISTINCT CONCAT(u.first_name, ' ', u.last_name) as name
      FROM employee_details ed
      INNER JOIN users u ON ed.user_id = u.id
      WHERE (ed.position LIKE '%manager%' OR 
             ed.position LIKE '%lead%' OR 
             ed.position LIKE '%head%' OR 
             ed.position LIKE '%director%')
      AND u.is_active = 1 AND u.tenant_id = ? AND ed.tenant_id = ?
      ORDER BY name
    `, [tenantId, tenantId, tenantId]);
    return rows;
  },


  // Check if project name already exists
  checkNameExists: async (tenantId, name, excludeId = null) => {
    let query = 'SELECT id FROM projects WHERE name = ? AND id != 1 AND tenant_id = ?';
    const params = [name, tenantId];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  },

  // Get project team members
  getTeamMembers: async (tenantId, projectId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          ptm.employee_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          d.name as department,
          ed.position
        FROM project_team_members ptm
        JOIN employee_details ed ON ptm.employee_id = ed.id
        JOIN users u ON ed.user_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE ptm.project_id = ? AND ptm.tenant_id = ?`,
        [projectId, tenantId]
      );
      return rows;
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      return [];
    }
  },

  // Assign team to project
  assignTeam: async (tenantId, projectId, teamData) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update project with assigned department and manager
      await connection.execute(
        `UPDATE projects SET
          department = ?,
          manager = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND tenant_id = ?`,
        [
          teamData.assigned_department,
          teamData.manager_name,
          projectId,
          tenantId
        ]
      );

      // Remove existing team members
      await connection.execute(
        'DELETE FROM project_team_members WHERE project_id = ? AND tenant_id = ?',
        [projectId, tenantId]
      );

      // Add new team members
      if (teamData.team && teamData.team.length > 0) {
        const teamValues = teamData.team.map(employeeId => [tenantId, projectId, employeeId]);
        await connection.query(
          'INSERT INTO project_team_members (tenant_id, project_id, employee_id) VALUES ?',
          [teamValues]
        );
      }

      // Add to project history
      await connection.execute(
        `INSERT INTO project_history (tenant_id, project_id, date, action, user)
         VALUES (?, ?, CURDATE(), 'Team assigned to project', 'Admin')`,
        [tenantId, projectId]
      );

      await connection.commit();
      
      // Return the updated project with team
      const project = await Project.getById(tenantId, projectId);
      project.team = await Project.getTeamMembers(tenantId, projectId);
      return project;
    } catch (error) {
      await connection.rollback();
      console.error('Error in assignTeam:', error);
      throw error;
    } finally {
      connection.release();
    }
  },
// In projectModel.js - Update getEmployeesForDropdown


// In projectModel.js - Update getEmployeesForDropdown
getEmployeesForDropdown: async (tenantId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        ed.id as id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        COALESCE(d.name, 'No Department') as department,
        COALESCE(ed.position, 'Employee') as position,
        COALESCE(r.name, 'employee') as role_name
      FROM employee_details ed
      INNER JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id AND d.tenant_id = ?
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1 
        AND u.tenant_id = ?
        AND r.name NOT IN ('hr', 'admin')
      ORDER BY u.first_name, u.last_name`,
      [tenantId, tenantId]
    );
    
    return rows;
  } catch (error) {
    console.error('Error in getEmployeesForDropdown:', error);
    return [];
  }
},

// Update getAllEmployeesForLeads
getAllEmployeesForLeads: async (tenantId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        ed.id as id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        COALESCE(d.name, 'No Department') as department,
        COALESCE(ed.position, 'Employee') as position,
        COALESCE(r.name, 'employee') as role_name
      FROM employee_details ed
      INNER JOIN users u ON ed.user_id = u.id
      LEFT JOIN departments d ON ed.department_id = d.id AND d.tenant_id = ?
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1 
        AND u.tenant_id = ?
        AND r.name NOT IN ('hr')
      ORDER BY u.first_name, u.last_name`,
      [tenantId, tenantId]
    );
    
    return rows;
  } catch (error) {
    console.error('Error in getAllEmployeesForLeads:', error);
    return [];
  }
},

  // Get dashboard statistics (exclude template project)
  getDashboardStats: async (tenantId) => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as totalProjects,
          SUM(CASE WHEN status NOT IN ('Completed', 'Template') THEN 1 ELSE 0 END) as activeProjects,
          SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as delayedProjects,
          SUM(CASE WHEN progress = 100 OR status = 'Completed' THEN 1 ELSE 0 END) as completedProjects
        FROM projects
        WHERE id != 1 AND tenant_id = ?
      `, [tenantId]);
      
      return rows[0];
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  },

  // Get departments list from projects
 getDepartments: async (tenantId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description, manager 
       FROM departments 
       WHERE tenant_id = ? AND name IS NOT NULL AND name != '' 
       ORDER BY name`,
      [tenantId]
    );
    return rows.map(row => row.name); // or return rows if you need full objects
  } catch (error) {
    console.error('Error in getDepartments:', error);
    throw error;
  }
},

  // Get managers list from projects
  getManagers: async (tenantId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT DISTINCT manager FROM projects WHERE tenant_id = ? AND manager IS NOT NULL AND manager != "" AND id != 1 ORDER BY manager',
        [tenantId]
      );
      return rows.map(row => ({ name: row.manager }));
    } catch (error) {
      console.error('Error in getManagers:', error);
      throw error;
    }
  },


  // Check if project name already exists
  checkNameExists: async (tenantId, name, excludeId = null) => {
    try {
      let query = 'SELECT id FROM projects WHERE name = ? AND id != 1 AND tenant_id = ?';
      const params = [name, tenantId];

      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }

      const [rows] = await pool.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Error in checkNameExists:', error);
      throw error;
    }
  },

  // Assign team to project
  assignTeam: async (tenantId, projectId, teamData) => {
    try {
      const { assigned_department, manager_name } = teamData;
      
      const [result] = await pool.execute(
        `UPDATE projects SET department = ?, manager = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND tenant_id = ?`,
        [assigned_department || null, manager_name || null, projectId, tenantId]
      );
      
      return await Project.getById(tenantId, projectId);
    } catch (error) {
      console.error('Error in assignTeam:', error);
      throw error;
    }
  },
  // Add to projectModel.js

// Get project tasks
getProjectTasks: async (tenantId, projectId) => {
  const [tasks] = await pool.execute(`
    SELECT * FROM tasks 
    WHERE project_id = ? AND tenant_id = ?
    ORDER BY due_date ASC
  `, [projectId, tenantId]);
  return tasks;
},

// Get all employees for leads
getAllEmployeesForLeads: async (tenantId) => {
  const [rows] = await pool.execute(`
    SELECT 
      ed.id,
      CONCAT(u.first_name, ' ', u.last_name) as name,
      u.email,
      COALESCE(ed.position, 'Employee') as position,
      COALESCE(d.name, 'No Department') as department
    FROM employee_details ed
    INNER JOIN users u ON ed.user_id = u.id
    LEFT JOIN departments d ON ed.department_id = d.id
    WHERE u.is_active = 1 AND u.tenant_id = ?
    ORDER BY u.first_name, u.last_name
  `, [tenantId]);
  return rows;
},

// Get employees for dropdown
getEmployeesForDropdown: async (tenantId) => {
  const [rows] = await pool.execute(`
    SELECT 
      ed.id,
      CONCAT(u.first_name, ' ', u.last_name) as name,
      u.email,
      COALESCE(ed.position, 'Employee') as position,
      COALESCE(d.name, 'No Department') as department
    FROM employee_details ed
    INNER JOIN users u ON ed.user_id = u.id
    LEFT JOIN departments d ON ed.department_id = d.id
    WHERE u.is_active = 1 AND u.tenant_id = ?
    ORDER BY u.first_name, u.last_name
  `, [tenantId]);
  return rows;
},

 
  // Initialize template project (run this once)
  initializeTemplate: async (tenantId) => {
    try {
      // Check if template already exists
      const [existing] = await pool.execute('SELECT id FROM projects WHERE id = 1 AND tenant_id = ?', [tenantId]);
      
      if (existing.length === 0) {
        await pool.execute(`
          INSERT INTO projects (id, tenant_id, name, description, department, manager, start_date, end_date, current_phase, status, progress) 
          VALUES (1, ?, 'Project Template', 'Template project with standard phases', 'IT', 'Template Manager', '2024-01-01', '2024-12-31', 'Planning', 'Template', 0)
        `, [tenantId]);
        
        await pool.execute(`
          INSERT INTO project_phases (project_id, tenant_id, name, status, progress, comments, phase_order) VALUES
          (1, ?, 'Planning', 'Not Started', 0, 'Project planning and requirements gathering', 1),
          (1, ?, 'Design', 'Not Started', 0, 'System design and architecture', 2),
          (1, ?, 'Development', 'Not Started', 0, 'Implementation and coding', 3),
          (1, ?, 'Testing', 'Not Started', 0, 'Quality assurance and testing', 4),
          (1, ?, 'Deployment', 'Not Started', 0, 'Production deployment', 5)
        `, [tenantId, tenantId, tenantId, tenantId, tenantId]);
        
        console.log('Template project initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing template:', error);
    }
  }
  
};

// Helper function to parse documents - Update this function
const parseDocuments = (documents) => {
  if (!documents) return [];
  if (typeof documents === 'string') {
    // Handle empty string or malformed JSON
    if (documents === '' || documents === 'null' || documents === 'undefined') {
      return [];
    }
    try {
      return JSON.parse(documents);
    } catch (e) {
      console.error('Error parsing documents:', e);
      return [];
    }
  }
  return Array.isArray(documents) ? documents : [];
};


module.exports = Project;