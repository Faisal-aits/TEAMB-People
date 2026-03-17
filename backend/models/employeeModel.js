// backend/models/employeeModel.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const Employee = {
    // Get all employees
getAll: async (filters = {}) => {
    try {
        let query = `
            SELECT 
                u.id as user_id,
                ed.id as employee_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.is_active,
                u.created_at,
                r.name as role_name,
                r.id as role_id,
                ed.department_id,
                ed.position,
                DATE_FORMAT(ed.joining_date, '%Y-%m-%d') as joining_date,
                DATE_FORMAT(ed.date_of_birth, '%Y-%m-%d') as date_of_birth,
                ed.address,
                ed.emergency_contact,
                ed.bank_account_number,
                ed.ifsc_code,
                ed.pan_number,
                ed.aadhar_number,
                ed.face_encoding,
                d.name as department_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN employee_details ed ON u.id = ed.user_id
            LEFT JOIN departments d ON ed.department_id = d.id
            WHERE u.role_id IN (1, 2, 3)  -- Admin (1), Sub-Admin (2), Employee (3)
        `;
        const params = [];

        if (filters.department_id) {
            query += ' AND ed.department_id = ?';
            params.push(filters.department_id);
        }

        if (filters.role_id) {
            query += ' AND u.role_id = ?';
            params.push(filters.role_id);
        }

        if (filters.is_active !== undefined) {
            query += ' AND u.is_active = ?';
            params.push(filters.is_active);
        }

        query += ' ORDER BY u.first_name, u.last_name';

        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error in Employee.getAll:', error);
        throw error;
    }
},

    // Get employee role ID
    getEmployeeRoleId: async () => {
        try {
            const [rows] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['employee']);
            return rows[0]?.id;
        } catch (error) {
            console.error('Error in getEmployeeRoleId:', error);
            throw error;
        }
    },

    // Create new employee
    create: async (employeeData) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Use provided role_id or default to employee role (3)
            const roleId = employeeData.role_id || '3';
            
            // Validate role exists
            const [roleCheck] = await connection.execute(
                'SELECT id FROM roles WHERE id = ?',
                [roleId]
            );
            
            if (roleCheck.length === 0) {
                throw new Error('Invalid role ID');
            }

            // Determine employee ID (manual or auto-generate)
            let employeeId;
            if (employeeData.employee_id && employeeData.employee_id.trim() !== '') {
                employeeId = employeeData.employee_id.trim().toUpperCase();
                
                // Check if ID already exists in employee_details table
                const [existingEmployee] = await connection.execute(
                    'SELECT id FROM employee_details WHERE id = ?', 
                    [employeeId]
                );
                
                if (existingEmployee.length > 0) {
                    throw new Error(`Employee ID '${employeeId}' already exists in system`);
                }
            } else {
                // FIXED: Auto-generate employee ID with proper sequencing
                const [lastEmployee] = await connection.execute(
                    `SELECT id FROM employee_details 
                     WHERE id LIKE 'AITS%' 
                     ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC 
                     LIMIT 1`
                );
                
                let nextNumber = 1;
                if (lastEmployee.length > 0 && lastEmployee[0].id) {
                    const lastId = lastEmployee[0].id;
                    // Extract numeric part after 'AITS' and convert to number
                    const numericPart = lastId.substring(4); // Remove 'AITS' prefix
                    const lastNumber = parseInt(numericPart) || 0;
                    nextNumber = lastNumber + 1;
                }
                
                // Pad with leading zeros to 3 digits: 1 -> 001, 10 -> 010, 100 -> 100
                employeeId = `AITS${String(nextNumber).padStart(3, '0')}`;
                console.log(`🆔 Auto-generated Employee ID: ${employeeId}`);
            }

            // Create user with NULL password and specified role
            const [userResult] = await connection.execute(
                `INSERT INTO users (role_id, first_name, last_name, email, password_hash, phone, is_active) 
                 VALUES (?, ?, ?, ?, NULL, ?, TRUE)`,
                [
                    roleId, // Use the specified role_id
                    employeeData.first_name, 
                    employeeData.last_name, 
                    employeeData.email, 
                    employeeData.phone || null
                ]
            );

            const userId = userResult.insertId;

            // Create employee details with the employee ID
            await connection.execute(
                `INSERT INTO employee_details 
                (id, user_id, department_id, position, joining_date, date_of_birth, address, emergency_contact,
                 bank_account_number, ifsc_code, pan_number, aadhar_number) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    employeeId,
                    userId,
                    employeeData.department_id || null, 
                    employeeData.position || null,
                    employeeData.joining_date || null,
                    employeeData.date_of_birth || null,
                    employeeData.address || null,
                    employeeData.emergency_contact || null,
                    employeeData.bank_account_number || null,
                    employeeData.ifsc_code || null,
                    employeeData.pan_number || null,
                    employeeData.aadhar_number || null
                ]
            );

            await connection.commit();
            
            return {
                user_id: userId,
                employee_id: employeeId
            };

        } catch (error) {
            await connection.rollback();
            console.error('Error in Employee.create:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get employee by ID
getById: async (id) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                u.id as user_id,
                ed.id as employee_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.is_active,
                u.created_at,
                r.name as role_name,
                ed.department_id,
                ed.position,
                ed.salary,
                DATE_FORMAT(ed.joining_date, '%Y-%m-%d') as joining_date,
                DATE_FORMAT(ed.date_of_birth, '%Y-%m-%d') as date_of_birth,
                ed.address,
                ed.emergency_contact,
                ed.bank_account_number,
                ed.ifsc_code,
                ed.pan_number,
                ed.aadhar_number,
                d.name as department_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN employee_details ed ON u.id = ed.user_id
            LEFT JOIN departments d ON ed.department_id = d.id
            WHERE ed.id = ?`,
            [id]
        );
        return rows[0];
    } catch (error) {
        console.error('Error in Employee.getById:', error);
        throw error;
    }
},

    // Get employee by user ID
    getByUserId: async (userId) => {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    u.id as user_id,
                    ed.id as employee_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.is_active,
                    u.created_at,
                    r.name as role_name,
                    ed.department_id,
                    ed.position,
                    ed.salary,
                    ed.joining_date,
                    ed.date_of_birth,
                    ed.address,
                    ed.emergency_contact,
                    ed.bank_account_number,
                    ed.ifsc_code,
                    ed.pan_number,
                    ed.aadhar_number,
                    ed.face_encoding,
                    d.name as department_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN employee_details ed ON u.id = ed.user_id
                LEFT JOIN departments d ON ed.department_id = d.id
                WHERE u.id = ?`,
                [userId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in Employee.getByUserId:', error);
            throw error;
        }
    },

    // Update employee
    update: async (id, employeeData) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // First get the employee to check if it's admin and get user_id
            const [employee] = await connection.execute(
                'SELECT ed.id, u.email, u.id as user_id FROM employee_details ed JOIN users u ON ed.user_id = u.id WHERE ed.id = ?',
                [id]
            );

            if (employee.length === 0) {
                throw new Error('Employee not found');
            }

            const userId = employee[0].user_id;

            // Update user table with role_id
            await connection.execute(
                `UPDATE users 
                 SET first_name = ?, last_name = ?, email = ?, phone = ?, is_active = ?, role_id = ?
                 WHERE id = ?`,
                [
                    employeeData.first_name,
                    employeeData.last_name,
                    employeeData.email,
                    employeeData.phone,
                    employeeData.is_active,
                    employeeData.role_id || '3', // Update role_id
                    userId
                ]
            );

            // Update employee_details table (removed salary)
            await connection.execute(
                `UPDATE employee_details 
                 SET department_id = ?, position = ?, joining_date = ?,
                     date_of_birth = ?, address = ?, emergency_contact = ?,
                     bank_account_number = ?, ifsc_code = ?, pan_number = ?, aadhar_number = ?
                 WHERE id = ?`,
                [
                    employeeData.department_id,
                    employeeData.position,
                    employeeData.joining_date,
                    employeeData.date_of_birth,
                    employeeData.address,
                    employeeData.emergency_contact,
                    employeeData.bank_account_number,
                    employeeData.ifsc_code,
                    employeeData.pan_number,
                    employeeData.aadhar_number,
                    id
                ]
            );

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            console.error('Error in Employee.update:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Delete employee
delete: async (id) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Get employee details
        const [employee] = await connection.execute(
            'SELECT id, user_id FROM employee_details WHERE id = ?',
            [id]
        );

        if (employee.length === 0) {
            throw new Error('Employee not found');
        }

        const employeeId = employee[0].id;
        const userId = employee[0].user_id;

        console.log(`Starting deletion process for employee: ${employeeId}, user: ${userId}`);

        // List of ALL tables that might reference employee_details OR users
        const relatedTables = [
            // Tables that reference employee_details by employee_id
            { table: 'service_team_members', column: 'employee_id' },
            { table: 'attendance_records', column: 'employee_id' },
            { table: 'leave_requests', column: 'employee_id' },
            { table: 'task_assignments', column: 'employee_id' },
            { table: 'project_members', column: 'employee_id' },
            
            // Tables that reference users by user_id
            { table: 'reports', column: 'generated_by' },
            { table: 'reports', column: 'approved_by' }, // if exists
            { table: 'notifications', column: 'user_id' }, // if exists
            { table: 'user_sessions', column: 'user_id' }, // if exists
            { table: 'audit_logs', column: 'user_id' } // if exists
        ];

        // Delete from all related tables first
        for (const { table, column } of relatedTables) {
            try {
                // For employee_id references, use employeeId
                // For user_id references, use userId
                const value = column.includes('employee') ? employeeId : userId;
                
                const [result] = await connection.execute(
                    `DELETE FROM ${table} WHERE ${column} = ?`,
                    [value]
                );
                if (result.affectedRows > 0) {
                    console.log(`Deleted ${result.affectedRows} records from ${table} where ${column} = ${value}`);
                }
            } catch (error) {
                // Table might not exist or column name might be different
                console.log(`No records in ${table} or error:`, error.message);
                // Continue with deletion
            }
        }

        // Now delete from employee_details
        await connection.execute('DELETE FROM employee_details WHERE id = ?', [employeeId]);
        console.log(`Deleted from employee_details: ${employeeId}`);

        // Finally delete from users
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log(`Deleted from users: ${userId}`);

        await connection.commit();
        console.log('Employee deletion completed successfully');
        return true;

    } catch (error) {
        await connection.rollback();
        console.error('Error in Employee.delete:', error);
        throw error;
    } finally {
        connection.release();
    }
},

    // Get all departments
    getDepartments: async () => {
        try {
            const [rows] = await pool.execute('SELECT * FROM departments ORDER BY name');
            return rows;
        } catch (error) {
            console.error('Error in Employee.getDepartments:', error);
            throw error;
        }
    },

    // Get suggested positions
    getSuggestedPositions: async () => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM suggested_positions WHERE is_active = TRUE ORDER BY category, name'
            );
            return rows;
        } catch (error) {
            console.error('Error in getSuggestedPositions:', error);
            throw error;
        }
    },

    // Add new suggested position
    addSuggestedPosition: async (positionData) => {
        try {
            const [result] = await pool.execute(
                'INSERT INTO suggested_positions (name, category, description) VALUES (?, ?, ?)',
                [positionData.name, positionData.category, positionData.description]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error in addSuggestedPosition:', error);
            throw error;
        }
    },

    // Check if employee ID exists
    checkEmployeeIdExists: async (employeeId) => {
        try {
            const [rows] = await pool.execute(
                'SELECT id FROM employee_details WHERE id = ?',
                [employeeId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error in checkEmployeeIdExists:', error);
            throw error;
        }
    },

  updateFaceEncoding: async (employeeId, faceEncoding) => {
    try {
      const query = `
        UPDATE employee_details 
        SET face_encoding = ?, updated_at = NOW()
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(query, [faceEncoding, employeeId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Employee not found');
      }
      
      console.log(`✅ Face encoding updated for employee: ${employeeId}`);
      return true;
    } catch (error) {
      console.error('❌ Error in Employee.updateFaceEncoding:', error);
      throw error;
    }
  },

  // Get employee with face encoding
  getWithFaceEncoding: async (employeeId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          ed.id as employee_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          ed.face_encoding,
          ed.department_id,
          d.name as department_name
        FROM employee_details ed
        JOIN users u ON ed.user_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE ed.id = ? AND u.is_active = 1`,
        [employeeId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in Employee.getWithFaceEncoding:', error);
      throw error;
    }
  },

  getAllWithFaceEncodings: async () => {
        try {
            const query = `
                SELECT 
                    ed.id as employee_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    ed.face_encoding,
                    d.name as department_name
                FROM employee_details ed
                JOIN users u ON ed.user_id = u.id
                LEFT JOIN departments d ON ed.department_id = d.id
                WHERE u.is_active = 1 AND ed.face_encoding IS NOT NULL
            `;
            
            const [rows] = await pool.execute(query);
            return rows;
        } catch (error) {
            console.error('Error in Employee.getAllWithFaceEncodings:', error);
            throw error;
        }
    }
};

module.exports = Employee;