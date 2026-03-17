const pool = require('../config/database');

const Project = {
  // Get all projects with phases (exclude template project)
  getAll: async () => {
    const [projects] = await pool.execute(`
      SELECT 
        id, name, description, department, manager, 
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        current_phase, status, progress, created_at, updated_at
      FROM projects 
      WHERE id != 1
      ORDER BY created_at DESC
    `);

    for (let project of projects) {
      const [phases] = await pool.execute(`
        SELECT * FROM project_phases 
        WHERE project_id = ? 
        ORDER BY phase_order
      `, [project.id]);
      
      // Parse documents for each phase
      project.phases = phases.map(phase => ({
        ...phase,
        documents: parseDocuments(phase.documents)
      }));

      // Get team members for each project
      project.team = await Project.getTeamMembers(project.id);
    }

    return projects;
  },

  // Get project by ID with phases
  getById: async (id) => {
    const [projects] = await pool.execute(`
      SELECT 
        id, name, description, department, manager, 
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        current_phase, status, progress, created_at, updated_at
      FROM projects WHERE id = ?
    `, [id]);

    if (projects.length === 0) return null;

    const project = projects[0];
    
    // Get phases for this project
    const [phases] = await pool.execute(`
      SELECT * FROM project_phases 
      WHERE project_id = ? 
      ORDER BY phase_order
    `, [id]);
    
    // Parse documents for each phase
    project.phases = phases.map(phase => ({
      ...phase,
      documents: parseDocuments(phase.documents)
    }));
    
    // Get team members for this project
    project.team = await Project.getTeamMembers(id);
    
    return project;
  },

  // Create new project with phases
  create: async (projectData) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const {
        name, department, manager, start_date, end_date, 
        current_phase, status, description = ''
      } = projectData;

      // Insert project
      const [projectResult] = await connection.execute(
        `INSERT INTO projects (name, description, department, manager, start_date, end_date, current_phase, status, progress) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, department, manager, start_date, end_date, current_phase, status, 0]
      );

      const projectId = projectResult.insertId;

      // Check if template project exists and get its phases
      const [templatePhases] = await connection.execute(
        'SELECT name, phase_order FROM project_phases WHERE project_id = 1 ORDER BY phase_order'
      );
      
      // If template doesn't exist, use default phases
      let phasesToCreate = [];
      if (templatePhases.length > 0) {
        phasesToCreate = templatePhases;
      } else {
        // Default phases if template doesn't exist
        phasesToCreate = [
          { name: 'Planning', phase_order: 1 },
          { name: 'Design', phase_order: 2 },
          { name: 'Development', phase_order: 3 },
          { name: 'Testing', phase_order: 4 },
          { name: 'Deployment', phase_order: 5 }
        ];
      }
      
      // Insert phases
      if (phasesToCreate.length > 0) {
        const phaseValues = phasesToCreate.map(phase => [
          projectId, phase.name, 'Not Started', 0, '', '[]', phase.phase_order
        ]);

        await connection.query(
          `INSERT INTO project_phases (project_id, name, status, progress, comments, documents, phase_order) 
           VALUES ?`,
          [phaseValues]
        );
      }

      await connection.commit();
      
      // Return the created project with formatted dates
      const [createdProject] = await connection.execute(`
        SELECT 
          id, name, description, department, manager, 
          DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
          DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
          current_phase, status, progress, created_at, updated_at
        FROM projects WHERE id = ?
      `, [projectId]);
      
      const project = createdProject[0];
      
      // Get phases for this project
      const [phases] = await connection.execute(`
        SELECT * FROM project_phases 
        WHERE project_id = ? 
        ORDER BY phase_order
      `, [projectId]);
      
      // Parse documents for each phase
      project.phases = phases.map(phase => ({
        ...phase,
        documents: parseDocuments(phase.documents)
      }));

      // Get team members
      project.team = await Project.getTeamMembers(projectId);
      
      return project;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update project
  update: async (id, projectData) => {
    const {
      name, department, manager, start_date, end_date, 
      current_phase, status, description = ''
    } = projectData;

    const [result] = await pool.execute(
      `UPDATE projects 
       SET name = ?, description = ?, department = ?, manager = ?, start_date = ?, 
           end_date = ?, current_phase = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, description, department, manager, start_date, end_date, current_phase, status, id]
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
      FROM projects WHERE id = ?
    `, [id]);
    
    if (updatedProjects.length === 0) return null;
    
    const project = updatedProjects[0];
    
    // Get phases for this project
    const [phases] = await pool.execute(`
      SELECT * FROM project_phases 
      WHERE project_id = ? 
      ORDER BY phase_order
    `, [id]);
    
    // Parse documents for each phase
    project.phases = phases.map(phase => ({
      ...phase,
      documents: parseDocuments(phase.documents)
    }));

    // Get team members
    project.team = await Project.getTeamMembers(id);
    
    return project;
  },

  // Delete project
  delete: async (id) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // First delete phases
      await connection.execute('DELETE FROM project_phases WHERE project_id = ?', [id]);
      
      // Delete team members
      await connection.execute('DELETE FROM project_team_members WHERE project_id = ?', [id]);
      
      // Delete history
      await connection.execute('DELETE FROM project_history WHERE project_id = ?', [id]);
      
      // Then delete project
      const [result] = await connection.execute('DELETE FROM projects WHERE id = ?', [id]);
      
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
  updatePhase: async (projectId, phaseName, phaseData) => {
    const { status, progress, comments } = phaseData;

    const [result] = await pool.execute(
      `UPDATE project_phases 
       SET status = ?, progress = ?, comments = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE project_id = ? AND name = ?`,
      [status, progress, comments, projectId, phaseName]
    );

    if (result.affectedRows > 0) {
      // Update project progress
      const [phases] = await pool.execute(
        'SELECT progress FROM project_phases WHERE project_id = ?',
        [projectId]
      );

      const avgProgress = phases.length > 0 
        ? Math.round(phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length)
        : 0;

      await pool.execute(
        'UPDATE projects SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [avgProgress, projectId]
      );
    }

    return await Project.getById(projectId);
  },

  // Get dashboard statistics (exclude template project)
  getDashboardStats: async () => {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalProjects,
        COUNT(CASE WHEN status != 'Completed' THEN 1 END) as activeProjects,
        COUNT(CASE WHEN status = 'Delayed' THEN 1 END) as delayedProjects,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completedProjects
      FROM projects
      WHERE id != 1
    `);
    
    return rows[0];
  },

  // Get managers list
  getManagers: async () => {
    const [rows] = await pool.execute(`
      SELECT DISTINCT manager as name 
      FROM departments 
      WHERE manager IS NOT NULL AND manager != ''
      UNION
      SELECT DISTINCT CONCAT(u.first_name, ' ', u.last_name) as name
      FROM employee_details ed
      INNER JOIN users u ON ed.user_id = u.id
      WHERE (ed.position LIKE '%manager%' OR 
             ed.position LIKE '%lead%' OR 
             ed.position LIKE '%head%' OR 
             ed.position LIKE '%director%')
      AND u.is_active = 1
      ORDER BY name
    `);
    return rows;
  },

  // Get departments list
  getDepartments: async () => {
    const [rows] = await pool.execute(`
      SELECT DISTINCT name 
      FROM departments 
      WHERE name IS NOT NULL AND name != ''
      ORDER BY name
    `);
    return rows.map(row => row.name);
  },

  // Check if project name already exists
  checkNameExists: async (name, excludeId = null) => {
    let query = 'SELECT id FROM projects WHERE name = ? AND id != 1';
    const params = [name];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  },

  // Get project team members
  getTeamMembers: async (projectId) => {
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
        WHERE ptm.project_id = ?`,
        [projectId]
      );
      return rows;
    } catch (error) {
      console.error('Error in getTeamMembers:', error);
      return [];
    }
  },

  // Assign team to project
  assignTeam: async (projectId, teamData) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update project with assigned department and manager
      await connection.execute(
        `UPDATE projects SET
          department = ?,
          manager = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          teamData.assigned_department,
          teamData.manager_name,
          projectId
        ]
      );

      // Remove existing team members
      await connection.execute(
        'DELETE FROM project_team_members WHERE project_id = ?',
        [projectId]
      );

      // Add new team members
      if (teamData.team && teamData.team.length > 0) {
        const teamValues = teamData.team.map(employeeId => [projectId, employeeId]);
        await connection.query(
          'INSERT INTO project_team_members (project_id, employee_id) VALUES ?',
          [teamValues]
        );
      }

      // Add to project history
      await connection.execute(
        `INSERT INTO project_history (project_id, date, action, user)
         VALUES (?, CURDATE(), 'Team assigned to project', 'Admin')`,
        [projectId]
      );

      await connection.commit();
      
      // Return the updated project with team
      const project = await Project.getById(projectId);
      project.team = await Project.getTeamMembers(projectId);
      return project;
    } catch (error) {
      await connection.rollback();
      console.error('Error in assignTeam:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get employees for dropdown
  getEmployeesForDropdown: async () => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          ed.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          d.name as department,
          ed.position
        FROM employee_details ed
        JOIN users u ON ed.user_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE u.is_active = TRUE AND ed.status = 'active'
        ORDER BY u.first_name, u.last_name`
      );
      return rows;
    } catch (error) {
      console.error('Error in getEmployeesForDropdown:', error);
      throw error;
    }
  },

  // Initialize template project (run this once)
  initializeTemplate: async () => {
    try {
      // Check if template already exists
      const [existing] = await pool.execute('SELECT id FROM projects WHERE id = 1');
      
      if (existing.length === 0) {
        await pool.execute(`
          INSERT INTO projects (id, name, description, department, manager, start_date, end_date, current_phase, status, progress) 
          VALUES (1, 'Project Template', 'Template project with standard phases', 'IT', 'Template Manager', '2024-01-01', '2024-12-31', 'Planning', 'Template', 0)
        `);
        
        await pool.execute(`
          INSERT INTO project_phases (project_id, name, status, progress, comments, phase_order) VALUES
          (1, 'Planning', 'Not Started', 0, 'Project planning and requirements gathering', 1),
          (1, 'Design', 'Not Started', 0, 'System design and architecture', 2),
          (1, 'Development', 'Not Started', 0, 'Implementation and coding', 3),
          (1, 'Testing', 'Not Started', 0, 'Quality assurance and testing', 4),
          (1, 'Deployment', 'Not Started', 0, 'Production deployment', 5)
        `);
        
        console.log('Template project initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing template:', error);
    }
  }
};

// Helper function to parse documents
const parseDocuments = (documents) => {
  if (!documents) return [];
  if (typeof documents === 'string') {
    try {
      return JSON.parse(documents);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(documents) ? documents : [];
};

module.exports = Project;