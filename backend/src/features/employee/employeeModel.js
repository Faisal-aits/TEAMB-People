// backend/src/features/employee/employeeModel.js
const { query, pool } = require('../../config/db');
const { calculatePayroll } = require('./employeePayroll');

const employeeDetailSelectColumns = `
          ed.department_id,
          ed.position,
          ed.employment_type,
          ed.salary,
          ed.salary as ctc,
          ed.salary_basic,
          ed.salary_hra,
          ed.salary_medical_allowance,
          ed.salary_travel_allowance,
          ed.salary_other_allowance,
          ed.salary_gross,
          ed.salary_pf,
          ed.salary_esic,
          ed.salary_professional_tax,
          ed.salary_lwf,
          ed.salary_total_deduction,
          ed.salary_net,
          ed.employer_pf,
          ed.employer_esic,
          DATE_FORMAT(ed.joining_date, '%Y-%m-%d') as joining_date,
          DATE_FORMAT(ed.last_working_date, '%Y-%m-%d') as last_working_date,
          DATE_FORMAT(ed.date_of_birth, '%Y-%m-%d') as date_of_birth,
          ed.address,
          ed.emergency_contact,
          ed.bank_account_number,
          ed.ifsc_code,
          ed.pan_number,
          ed.aadhar_number,
          ed.status`;

const Employee = {
  // Get all employees (tenant-scoped)
  getAll: async (tenantId, filters = {}) => {
    try {
      let sql = `
        SELECT 
          u.id as user_id,
          ed.id as employee_id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          u.is_active,
          u.created_at,
${employeeDetailSelectColumns},
          d.name as department_name
        FROM employee_details ed
        JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE ed.tenant_id = ?
      `;
      const params = [tenantId];

      if (filters.department_id) {
        sql += ' AND ed.department_id = ?';
        params.push(filters.department_id);
      }
      if (filters.position) {
        sql += ' AND ed.position = ?';
        params.push(filters.position);
      }
      if (filters.is_active !== undefined) {
        sql += ' AND u.is_active = ?';
        params.push(filters.is_active);
      }
      if (filters.status) {
        sql += ' AND ed.status = ?';
        params.push(filters.status);
      }

      sql += ' ORDER BY u.created_at DESC';
      
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Error in Employee.getAll:', error);
      throw error;
    }
  },

  // Create new employee (tenant-scoped)
  create: async (tenantId, employeeData) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Determine employee ID
      let employeeId;
      if (employeeData.employee_id && employeeData.employee_id.trim() !== '') {
        employeeId = employeeData.employee_id.trim().toUpperCase();
        
        const [existingEmployee] = await connection.execute(
          'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?', 
          [employeeId, tenantId]
        );
        
        if (existingEmployee.length > 0) {
          throw new Error(`Employee ID '${employeeId}' already exists in system`);
        }
      } else {
        // Auto-generate employee ID with AITS prefix
        const [lastEmployee] = await connection.execute(
          `SELECT id FROM employee_details 
           WHERE tenant_id = ? AND id LIKE 'AITS%' 
           ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC 
           LIMIT 1`,
          [tenantId]
        );
        
        let nextNumber = 1;
        if (lastEmployee.length > 0 && lastEmployee[0].id) {
          const numericPart = lastEmployee[0].id.substring(4);
          const lastNumber = parseInt(numericPart) || 0;
          nextNumber = lastNumber + 1;
        }
        
        employeeId = `AITS${String(nextNumber).padStart(3, '0')}`;
       
      }

      // Create user with tenant_id (no role_id)
      const [userResult] = await connection.execute(
        `INSERT INTO users (tenant_id, first_name, last_name, email, password_hash, phone, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          employeeData.first_name, 
          employeeData.last_name, 
          employeeData.email, 
          employeeData.password_hash || null,
          employeeData.phone || null,
          employeeData.is_active !== undefined ? employeeData.is_active : 1
        ]
      );

      const userId = userResult.insertId;

      const payroll = calculatePayroll(employeeData);

      // Create employee details with tenant_id
      await connection.execute(
        `INSERT INTO employee_details 
        (id, tenant_id, employee_id, department_id, position, employment_type, salary,
         salary_basic, salary_hra, salary_medical_allowance, salary_travel_allowance, salary_other_allowance,
         salary_gross, salary_pf, salary_esic, salary_professional_tax, salary_lwf,
         salary_total_deduction, salary_net, employer_pf, employer_esic,
         joining_date, last_working_date, date_of_birth, address, emergency_contact,
         bank_account_number, ifsc_code, pan_number, aadhar_number, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeId,
          tenantId,
          userId,
          employeeData.department_id || null, 
          employeeData.position || null,
          employeeData.employment_type || null,
          employeeData.salary || null,
          payroll.salary_basic,
          payroll.salary_hra,
          payroll.salary_medical_allowance,
          payroll.salary_travel_allowance,
          payroll.salary_other_allowance,
          payroll.salary_gross,
          payroll.salary_pf,
          payroll.salary_esic,
          payroll.salary_professional_tax,
          payroll.salary_lwf,
          payroll.salary_total_deduction,
          payroll.salary_net,
          payroll.employer_pf,
          payroll.employer_esic,
          employeeData.joining_date || null,
          employeeData.last_working_date || null,
          employeeData.date_of_birth || null,
          employeeData.address || null,
          employeeData.emergency_contact || null,
          employeeData.bank_account_number || null,
          employeeData.ifsc_code || null,
          employeeData.pan_number || null,
          employeeData.aadhar_number || null,
          employeeData.status || 'active'
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

  // Get employee by ID (tenant-scoped)
  getById: async (tenantId, id) => {
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
${employeeDetailSelectColumns},
          d.name as department_name
        FROM employee_details ed
        JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE ed.id = ? AND u.tenant_id = ?`,
        [id, tenantId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in Employee.getById:', error);
      throw error;
    }
  },

  // Get employee by user ID (tenant-scoped)
  getByUserId: async (tenantId, userId) => {
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
${employeeDetailSelectColumns},
          d.name as department_name
        FROM employee_details ed
        JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE u.id = ? AND u.tenant_id = ?`,
        [userId, tenantId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in Employee.getByUserId:', error);
      throw error;
    }
  },

  // Update employee
  update: async (tenantId, id, employeeData) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [employee] = await connection.execute(
        `SELECT ed.id, ed.employee_id, u.id as user_id 
         FROM employee_details ed 
         JOIN users u ON ed.employee_id = u.id 
         WHERE ed.id = ? AND ed.tenant_id = ?`,
        [id, tenantId]
      );

      if (employee.length === 0) {
        throw new Error('Employee not found');
      }

      const userId = employee[0].user_id;
      const currentEmployeeId = String(id).trim().toUpperCase();
      const requestedEmployeeId = String(employeeData.employee_id || id).trim().toUpperCase();

      if (!requestedEmployeeId) {
        throw new Error('Employee ID is required when updating an employee');
      }

      if (requestedEmployeeId.length > 20) {
        throw new Error('Employee ID must be 20 characters or less');
      }

      if (requestedEmployeeId !== currentEmployeeId) {
        const [existingEmployee] = await connection.execute(
          'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?',
          [requestedEmployeeId, tenantId]
        );

        if (existingEmployee.length > 0) {
          throw new Error('Employee ID already exists');
        }
      }

      // Update users table
      await connection.execute(
        `UPDATE users 
         SET first_name = ?, last_name = ?, email = ?, phone = ?, is_active = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          employeeData.first_name,
          employeeData.last_name,
          employeeData.email,
          employeeData.phone || null,
          employeeData.is_active !== undefined ? employeeData.is_active : 1,
          userId,
          tenantId
        ]
      );

      const payroll = calculatePayroll(employeeData);

      // Update employee_details table
      await connection.execute(
        `UPDATE employee_details 
         SET id = ?, department_id = ?, position = ?, employment_type = ?, salary = ?,
             salary_basic = ?, salary_hra = ?, salary_medical_allowance = ?,
             salary_travel_allowance = ?, salary_other_allowance = ?, salary_gross = ?,
             salary_pf = ?, salary_esic = ?, salary_professional_tax = ?, salary_lwf = ?,
             salary_total_deduction = ?, salary_net = ?, employer_pf = ?, employer_esic = ?,
             joining_date = ?, last_working_date = ?, date_of_birth = ?, address = ?, emergency_contact = ?,
             bank_account_number = ?, ifsc_code = ?, pan_number = ?, aadhar_number = ?, status = ?
         WHERE id = ? AND tenant_id = ?`,
        [
          requestedEmployeeId,
          employeeData.department_id || null,
          employeeData.position || null,
          employeeData.employment_type || null,
          employeeData.salary || null,
          payroll.salary_basic,
          payroll.salary_hra,
          payroll.salary_medical_allowance,
          payroll.salary_travel_allowance,
          payroll.salary_other_allowance,
          payroll.salary_gross,
          payroll.salary_pf,
          payroll.salary_esic,
          payroll.salary_professional_tax,
          payroll.salary_lwf,
          payroll.salary_total_deduction,
          payroll.salary_net,
          payroll.employer_pf,
          payroll.employer_esic,
          employeeData.joining_date || null,
          employeeData.last_working_date || null,
          employeeData.date_of_birth || null,
          employeeData.address || null,
          employeeData.emergency_contact || null,
          employeeData.bank_account_number || null,
          employeeData.ifsc_code || null,
          employeeData.pan_number || null,
          employeeData.aadhar_number || null,
          employeeData.status || 'active',
          id,
          tenantId
        ]
      );

      await connection.commit();
      return { employee_id: requestedEmployeeId };

    } catch (error) {
      await connection.rollback();
      console.error('Error in Employee.update:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Delete employee (soft delete)
  delete: async (tenantId, id) => {
    try {
      const [result] = await pool.execute(
        `UPDATE employee_details SET status = 'inactive', updated_at = NOW() 
         WHERE id = ? AND tenant_id = ?`,
        [id, tenantId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error in Employee.delete:', error);
      throw error;
    }
  },

  // Hard delete employee (tenant-scoped)
  hardDelete: async (tenantId, id) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [employee] = await connection.execute(
        'SELECT id, employee_id FROM employee_details WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );

      if (employee.length === 0) {
        throw new Error('Employee not found');
      }

      const employeeDetailId = employee[0].id;
      const userId = employee[0].employee_id;

      try {
        await connection.execute(
          'DELETE FROM employee_departments WHERE employee_id = ? AND tenant_id = ?',
          [employeeDetailId, tenantId]
        );
      } catch (tableError) {
        if (tableError.code !== 'ER_NO_SUCH_TABLE') {
          throw tableError;
        }
      }

      // Delete from employee_details
      await connection.execute('DELETE FROM employee_details WHERE id = ? AND tenant_id = ?', [employeeDetailId, tenantId]);

      // Delete from users
      await connection.execute('DELETE FROM users WHERE id = ? AND tenant_id = ?', [userId, tenantId]);

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      console.error('Error in Employee.hardDelete:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all departments (tenant-scoped)
  getDepartments: async (tenantId) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM departments WHERE tenant_id = ? ORDER BY name', [tenantId]);
      return rows;
    } catch (error) {
      console.error('Error in Employee.getDepartments:', error);
      throw error;
    }
  },

  createDepartment: async (tenantId, departmentData) => {
    const name = String(departmentData.name || '').trim();
    const description = String(departmentData.description || '').trim() || null;
    const manager = String(departmentData.manager || '').trim() || null;

    if (!name) {
      throw new Error('Department name is required');
    }

    const [existing] = await pool.execute(
      'SELECT id FROM departments WHERE tenant_id = ? AND LOWER(name) = LOWER(?)',
      [tenantId, name]
    );

    if (existing.length > 0) {
      throw new Error('Department already exists');
    }

    const [result] = await pool.execute(
      `INSERT INTO departments (tenant_id, name, description, manager)
       VALUES (?, ?, ?, ?)`,
      [tenantId, name, description, manager]
    );

    return result.insertId;
  },

  updateDepartment: async (tenantId, departmentId, departmentData) => {
    const name = String(departmentData.name || '').trim();
    const description = String(departmentData.description || '').trim() || null;
    const manager = String(departmentData.manager || '').trim() || null;

    if (!name) {
      throw new Error('Department name is required');
    }

    const [existing] = await pool.execute(
      'SELECT id FROM departments WHERE tenant_id = ? AND LOWER(name) = LOWER(?) AND id <> ?',
      [tenantId, name, departmentId]
    );

    if (existing.length > 0) {
      throw new Error('Department already exists');
    }

    const [result] = await pool.execute(
      `UPDATE departments
       SET name = ?, description = ?, manager = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND tenant_id = ?`,
      [name, description, manager, departmentId, tenantId]
    );

    return result.affectedRows;
  },

  deleteDepartment: async (tenantId, departmentId) => {
    const [employees] = await pool.execute(
      'SELECT COUNT(*) as count FROM employee_details WHERE tenant_id = ? AND department_id = ?',
      [tenantId, departmentId]
    );

    if (Number(employees[0]?.count || 0) > 0) {
      throw new Error('Department is assigned to employees and cannot be deleted');
    }

    const [result] = await pool.execute(
      'DELETE FROM departments WHERE id = ? AND tenant_id = ?',
      [departmentId, tenantId]
    );

    return result.affectedRows;
  },

  // Check if employee ID exists (tenant-scoped)
  checkEmployeeIdExists: async (tenantId, employeeId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?',
        [employeeId, tenantId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error in checkEmployeeIdExists:', error);
      throw error;
    }
  },

  getExistingEmails: async (emails = []) => {
    const uniqueEmails = [...new Set(emails.filter(Boolean).map((email) => email.toLowerCase()))];
    if (uniqueEmails.length === 0) return new Set();

    try {
      const placeholders = uniqueEmails.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT LOWER(email) as email FROM users WHERE LOWER(email) IN (${placeholders})`,
        uniqueEmails
      );
      return new Set(rows.map((row) => row.email));
    } catch (error) {
      console.error('Error in Employee.getExistingEmails:', error);
      throw error;
    }
  },

  getExistingEmployeeIds: async (tenantId, employeeIds = []) => {
    const uniqueEmployeeIds = [...new Set(employeeIds.filter(Boolean).map((id) => id.toUpperCase()))];
    if (uniqueEmployeeIds.length === 0) return new Set();

    try {
      const placeholders = uniqueEmployeeIds.map(() => '?').join(',');
      const [rows] = await pool.execute(
        `SELECT UPPER(id) as employee_id FROM employee_details WHERE tenant_id = ? AND UPPER(id) IN (${placeholders})`,
        [tenantId, ...uniqueEmployeeIds]
      );
      return new Set(rows.map((row) => row.employee_id));
    } catch (error) {
      console.error('Error in Employee.getExistingEmployeeIds:', error);
      throw error;
    }
  },

  bulkCreate: async (tenantId, employees) => {
    if (!Array.isArray(employees) || employees.length === 0) return [];

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [lastEmployee] = await connection.execute(
        `SELECT id FROM employee_details
         WHERE tenant_id = ? AND id LIKE 'AITS%'
         ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC
         LIMIT 1`,
        [tenantId]
      );

      let nextNumber = 1;
      if (lastEmployee.length > 0 && lastEmployee[0].id) {
        nextNumber = (parseInt(lastEmployee[0].id.substring(4), 10) || 0) + 1;
      }

      const usedEmployeeIds = new Set(employees
        .map((employee) => employee.employee_id)
        .filter(Boolean)
        .map((employeeId) => employeeId.toUpperCase()));

      const employeesWithIds = employees.map((employee) => {
        let employeeId = employee.employee_id ? employee.employee_id.trim().toUpperCase() : '';

        if (!employeeId) {
          do {
            employeeId = `AITS${String(nextNumber).padStart(3, '0')}`;
            nextNumber += 1;
          } while (usedEmployeeIds.has(employeeId));
        }

        usedEmployeeIds.add(employeeId);
        return { ...employee, employee_id: employeeId };
      });

      const userValues = employeesWithIds.map((employee) => [
        tenantId,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.password_hash || null,
        employee.phone || null,
        employee.is_active !== undefined ? employee.is_active : 1
      ]);

      await connection.query(
        `INSERT INTO users (tenant_id, first_name, last_name, email, password_hash, phone, is_active)
         VALUES ?`,
        [userValues]
      );

      const uniqueEmails = employeesWithIds.map((employee) => employee.email.toLowerCase());
      const userPlaceholders = uniqueEmails.map(() => '?').join(',');
      const [createdUsers] = await connection.execute(
        `SELECT id, LOWER(email) as email FROM users
         WHERE tenant_id = ? AND LOWER(email) IN (${userPlaceholders})`,
        [tenantId, ...uniqueEmails]
      );
      const userIdByEmail = new Map(createdUsers.map((user) => [user.email, user.id]));

      const employeeDetailValues = employeesWithIds.map((employee) => {
        const userId = userIdByEmail.get(employee.email.toLowerCase());
        if (!userId) {
          throw new Error(`User record was not created for ${employee.email}`);
        }

        const payroll = calculatePayroll(employee);

        return [
          employee.employee_id,
          tenantId,
          userId,
          employee.department_id || null,
          employee.position || null,
          employee.employment_type || null,
          employee.salary || null,
          payroll.salary_basic,
          payroll.salary_hra,
          payroll.salary_medical_allowance,
          payroll.salary_travel_allowance,
          payroll.salary_other_allowance,
          payroll.salary_gross,
          payroll.salary_pf,
          payroll.salary_esic,
          payroll.salary_professional_tax,
          payroll.salary_lwf,
          payroll.salary_total_deduction,
          payroll.salary_net,
          payroll.employer_pf,
          payroll.employer_esic,
          employee.joining_date || null,
          employee.last_working_date || null,
          employee.date_of_birth || null,
          employee.address || null,
          employee.emergency_contact || null,
          employee.bank_account_number || null,
          employee.ifsc_code || null,
          employee.pan_number || null,
          employee.aadhar_number || null,
          employee.status || 'active'
        ];
      });

      await connection.query(
        `INSERT INTO employee_details
         (id, tenant_id, employee_id, department_id, position, employment_type, salary,
          salary_basic, salary_hra, salary_medical_allowance, salary_travel_allowance, salary_other_allowance,
          salary_gross, salary_pf, salary_esic, salary_professional_tax, salary_lwf,
          salary_total_deduction, salary_net, employer_pf, employer_esic,
          joining_date, last_working_date, date_of_birth, address, emergency_contact,
          bank_account_number, ifsc_code, pan_number, aadhar_number, status)
         VALUES ?`,
        [employeeDetailValues]
      );

      try {
        await connection.execute('SELECT 1 FROM employee_departments LIMIT 1');
        const departmentValues = employeesWithIds
          .filter((employee) => employee.department_id)
          .map((employee) => [employee.employee_id, employee.department_id, tenantId]);

        if (departmentValues.length > 0) {
          await connection.query(
            'INSERT INTO employee_departments (employee_id, department_id, tenant_id) VALUES ?',
            [departmentValues]
          );
        }
      } catch (tableError) {
        if (tableError.code !== 'ER_NO_SUCH_TABLE') {
          throw tableError;
        }
      }

      await connection.commit();

      return employeesWithIds.map((employee) => ({
        rowNumber: employee.rowNumber,
        user_id: userIdByEmail.get(employee.email.toLowerCase()),
        employee_id: employee.employee_id,
        email: employee.email
      }));
    } catch (error) {
      await connection.rollback();
      console.error('Error in Employee.bulkCreate:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update face encoding
  updateFaceEncoding: async (tenantId, employeeId, faceEncoding) => {
    try {
      const [result] = await pool.execute(
        'UPDATE employee_details SET face_encoding = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
        [faceEncoding, employeeId, tenantId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Employee not found');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in Employee.updateFaceEncoding:', error);
      throw error;
    }
  },

  // Get employee with face encoding
  getWithFaceEncoding: async (tenantId, employeeId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          ed.id as employee_id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          ed.face_encoding,
          ed.department_id,
          d.name as department_name
        FROM employee_details ed
        JOIN users u ON ed.employee_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE ed.id = ? AND ed.tenant_id = ? AND u.is_active = 1`,
        [employeeId, tenantId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in Employee.getWithFaceEncoding:', error);
      throw error;
    }
  },

  // Get all employees with face encodings
  getAllWithFaceEncodings: async (tenantId) => {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          ed.id as employee_id,
          u.first_name,
          u.last_name,
          u.email,
          ed.face_encoding,
          d.name as department_name
        FROM employee_details ed
        JOIN users u ON ed.employee_id = u.id
        LEFT JOIN departments d ON ed.department_id = d.id
        WHERE ed.tenant_id = ? AND u.is_active = 1 AND ed.face_encoding IS NOT NULL`,
        [tenantId]
      );
      return rows;
    } catch (error) {
      console.error('Error in Employee.getAllWithFaceEncodings:', error);
      throw error;
    }
  }
};

module.exports = Employee;
