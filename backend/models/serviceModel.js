// backend/models/serviceModel.js
const pool = require('../config/database');

class Service {
  // Get all services with related data
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          s.id,
          s.service_name,
          st.name as service_type,
          s.description,
          d.name as assigned_department,
          ss.name as status,
          s.service_manager_id,
          IFNULL(CONCAT(u.first_name, ' ', u.last_name), 'Not Assigned') as service_manager,
          s.scheduled_date,
          s.scheduled_time,
          s.progress,
          s.created_at,
          s.updated_at
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        LEFT JOIN departments d ON s.assigned_department_id = d.id
        LEFT JOIN service_status ss ON s.status_id = ss.id
        LEFT JOIN employee_details ed ON s.service_manager_id = ed.id
        LEFT JOIN users u ON ed.user_id = u.id
      `;

      const conditions = [];
      const params = [];

      // Apply filters
      if (filters.service_type) {
        conditions.push('st.name = ?');
        params.push(filters.service_type);
      }

      if (filters.status) {
        conditions.push('ss.name = ?');
        params.push(filters.status);
      }

      if (filters.assigned_department) {
        conditions.push('d.name = ?');
        params.push(filters.assigned_department);
      }

      if (filters.search) {
        conditions.push('s.service_name LIKE ?');
        params.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY s.created_at DESC';

      const [rows] = await pool.execute(query, params);
      
      // Format the results to match frontend structure
      const formattedServices = await Promise.all(
        rows.map(async (service) => {
          const history = await this.getServiceHistory(service.id);
          const teamMembers = await this.getServiceTeamMembers(service.id);
          
          return {
            id: service.id,
            service_name: service.service_name,
            service_type: service.service_type,
            description: service.description,
            assigned_department: service.assigned_department,
            status: service.status,
            service_manager: service.service_manager,
            scheduled_date: service.scheduled_date,
            scheduled_time: service.scheduled_time?.substring(0, 5),
            progress: service.progress,
            team: teamMembers,
            history: history
          };
        })
      );
      
      return formattedServices;
    } catch (error) {
      console.error('Error in Service.getAll:', error);
      throw error;
    }
  }

  // Get service by ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          s.id,
          s.service_name,
          st.name as service_type,
          s.description,
          d.name as assigned_department,
          ss.name as status,
          s.service_manager_id,
          IFNULL(CONCAT(u.first_name, ' ', u.last_name), 'Not Assigned') as service_manager,
          s.scheduled_date,
          s.scheduled_time,
          s.progress,
          s.created_at,
          s.updated_at
        FROM services s
        LEFT JOIN service_types st ON s.service_type_id = st.id
        LEFT JOIN departments d ON s.assigned_department_id = d.id
        LEFT JOIN service_status ss ON s.status_id = ss.id
        LEFT JOIN employee_details ed ON s.service_manager_id = ed.id
        LEFT JOIN users u ON ed.user_id = u.id
        WHERE s.id = ?
      `;

      const [rows] = await pool.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const service = rows[0];
      const history = await this.getServiceHistory(id);
      const teamMembers = await this.getServiceTeamMembers(id);

      return {
        id: service.id,
        service_name: service.service_name,
        service_type: service.service_type,
        description: service.description,
        assigned_department: service.assigned_department,
        status: service.status,
        service_manager: service.service_manager,
        scheduled_date: service.scheduled_date,
        scheduled_time: service.scheduled_time?.substring(0, 5),
        progress: service.progress,
        team: teamMembers,
        history: history
      };
    } catch (error) {
      console.error('Error in Service.getById:', error);
      throw error;
    }
  }

  // Get service history
  static async getServiceHistory(serviceId) {
    try {
      const query = `
        SELECT date, action, user 
        FROM service_history 
        WHERE service_id = ? 
        ORDER BY date DESC, created_at DESC
      `;
      
      const [rows] = await pool.execute(query, [serviceId]);
      return rows;
    } catch (error) {
      console.error('Error in getServiceHistory:', error);
      throw error;
    }
  }

  // Get service team members
  static async getServiceTeamMembers(serviceId) {
    try {
      const query = `
        SELECT 
          stm.employee_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          d.name as department
        FROM service_team_members stm
        JOIN employee_details ed ON stm.employee_id = ed.id
        JOIN users u ON ed.user_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE stm.service_id = ?
      `;
      
      const [rows] = await pool.execute(query, [serviceId]);
      return rows;
    } catch (error) {
      console.error('Error in getServiceTeamMembers:', error);
      return [];
    }
  }

  // Create new service
  static async create(serviceData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get IDs for related data
      const [serviceType] = await connection.execute(
        'SELECT id FROM service_types WHERE name = ?',
        [serviceData.service_type]
      );
      
      const [department] = await connection.execute(
        'SELECT id FROM departments WHERE name = ?',
        [serviceData.assigned_department]
      );
      
      const [status] = await connection.execute(
        'SELECT id FROM service_status WHERE name = ?',
        [serviceData.status || 'Active']
      );

      // Get employee ID from employee name
      let serviceManagerId = null;
      if (serviceData.service_manager && serviceData.service_manager !== 'Not Assigned') {
        const [manager] = await connection.execute(
          `SELECT ed.id 
           FROM employee_details ed 
           JOIN users u ON ed.user_id = u.id 
           WHERE CONCAT(u.first_name, ' ', u.last_name) = ?`,
          [serviceData.service_manager]
        );
        serviceManagerId = manager.length > 0 ? manager[0].id : null;
      }

      if (serviceType.length === 0) {
        throw new Error('Service type not found');
      }

      // Insert service
      const [result] = await connection.execute(
        `INSERT INTO services (
          service_name, service_type_id, description, assigned_department_id,
          status_id, service_manager_id, scheduled_date, scheduled_time, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          serviceData.service_name,
          serviceType[0].id,
          serviceData.description || null,
          department.length > 0 ? department[0].id : null,
          status.length > 0 ? status[0].id : 1,
          serviceManagerId,
          serviceData.scheduled_date || null,
          serviceData.scheduled_time ? serviceData.scheduled_time + ':00' : null,
          serviceData.progress || 0
        ]
      );

      const serviceId = result.insertId;

      // Add initial history entry
      await connection.execute(
        `INSERT INTO service_history (service_id, date, action, user)
         VALUES (?, CURDATE(), 'Service created', 'Admin')`,
        [serviceId]
      );

      await connection.commit();
      
      // Return the created service
      return await this.getById(serviceId);
    } catch (error) {
      await connection.rollback();
      console.error('Error in Service.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update service
  static async update(id, serviceData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get IDs for related data
      const [serviceType] = await connection.execute(
        'SELECT id FROM service_types WHERE name = ?',
        [serviceData.service_type]
      );
      
      const [department] = await connection.execute(
        'SELECT id FROM departments WHERE name = ?',
        [serviceData.assigned_department]
      );
      
      const [status] = await connection.execute(
        'SELECT id FROM service_status WHERE name = ?',
        [serviceData.status]
      );

      // Get employee ID from employee name
      let serviceManagerId = null;
      if (serviceData.service_manager && serviceData.service_manager !== 'Not Assigned') {
        const [manager] = await connection.execute(
          `SELECT ed.id 
           FROM employee_details ed 
           JOIN users u ON ed.user_id = u.id 
           WHERE CONCAT(u.first_name, ' ', u.last_name) = ?`,
          [serviceData.service_manager]
        );
        serviceManagerId = manager.length > 0 ? manager[0].id : null;
      }

      // Update service
      await connection.execute(
        `UPDATE services SET
          service_name = ?,
          service_type_id = ?,
          description = ?,
          assigned_department_id = ?,
          status_id = ?,
          service_manager_id = ?,
          scheduled_date = ?,
          scheduled_time = ?,
          progress = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          serviceData.service_name,
          serviceType[0].id,
          serviceData.description || null,
          department.length > 0 ? department[0].id : null,
          status.length > 0 ? status[0].id : null,
          serviceManagerId,
          serviceData.scheduled_date || null,
          serviceData.scheduled_time ? serviceData.scheduled_time + ':00' : null,
          serviceData.progress || 0,
          id
        ]
      );

      // Add history entry
      await connection.execute(
        `INSERT INTO service_history (service_id, date, action, user)
         VALUES (?, CURDATE(), 'Service updated', 'Admin')`,
        [id]
      );

      await connection.commit();
      
      // Return the updated service
      return await this.getById(id);
    } catch (error) {
      await connection.rollback();
      console.error('Error in Service.update:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete service
  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        'DELETE FROM services WHERE id = ?',
        [id]
      );

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error in Service.delete:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Assign team to service
  static async assignTeam(serviceId, teamData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get department ID
      const [department] = await connection.execute(
        'SELECT id FROM departments WHERE name = ?',
        [teamData.assigned_department]
      );

      // Get employee ID from employee name for service manager
      let serviceManagerId = null;
      if (teamData.service_manager && teamData.service_manager !== 'Not Assigned') {
        const [manager] = await connection.execute(
          `SELECT ed.id 
           FROM employee_details ed 
           JOIN users u ON ed.user_id = u.id 
           WHERE CONCAT(u.first_name, ' ', u.last_name) = ?`,
          [teamData.service_manager]
        );
        serviceManagerId = manager.length > 0 ? manager[0].id : null;
      }

      // Update service department and manager
      await connection.execute(
        `UPDATE services SET
          assigned_department_id = ?,
          service_manager_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          department.length > 0 ? department[0].id : null,
          serviceManagerId,
          serviceId
        ]
      );

      // Remove existing team members
      await connection.execute(
        'DELETE FROM service_team_members WHERE service_id = ?',
        [serviceId]
      );

      // Add new team members
      if (teamData.team && teamData.team.length > 0) {
        const teamValues = teamData.team.map(employeeId => [serviceId, employeeId]);
        const insertQuery = 'INSERT INTO service_team_members (service_id, employee_id) VALUES ?';
        
        await connection.query(insertQuery, [teamValues]);
      }

      // Add history entry
      await connection.execute(
        `INSERT INTO service_history (service_id, date, action, user)
         VALUES (?, CURDATE(), 'Service assigned/updated', 'Admin')`,
        [serviceId]
      );

      await connection.commit();
      
      return await this.getById(serviceId);
    } catch (error) {
      await connection.rollback();
      console.error('Error in Service.assignTeam:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get all service types
  static async getServiceTypes() {
    try {
      const [rows] = await pool.execute('SELECT * FROM service_types ORDER BY name');
      return rows;
    } catch (error) {
      console.error('Error in Service.getServiceTypes:', error);
      throw error;
    }
  }

  // Get all status types
  static async getStatusTypes() {
    try {
      const [rows] = await pool.execute('SELECT * FROM service_status ORDER BY name');
      return rows;
    } catch (error) {
      console.error('Error in Service.getStatusTypes:', error);
      throw error;
    }
  }

  // Get all employees for dropdown
  static async getEmployeesForDropdown() {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          ed.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          d.name as department
        FROM employee_details ed
        JOIN users u ON ed.user_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE u.is_active = TRUE
        ORDER BY u.first_name, u.last_name`
      );
      return rows;
    } catch (error) {
      console.error('Error in Service.getEmployeesForDropdown:', error);
      throw error;
    }
  }
}

module.exports = Service;