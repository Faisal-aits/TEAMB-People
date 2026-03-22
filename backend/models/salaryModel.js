// backend/models/salaryModel.js
const pool = require('../config/database');

const Salary = {
    // Get all salary records with employee and department details
    getAll: async (tenantId, filters = {}) => {
        let query = `
            SELECT 
                sr.*,
                CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                ed.position as designation,
                d.name as department_name
            FROM salary_records sr
            INNER JOIN employee_details ed ON sr.employee_id = ed.id
            INNER JOIN users u ON ed.user_id = u.id
            INNER JOIN departments d ON sr.department_id = d.id
            WHERE sr.tenant_id = ?
        `;
        
        const params = [tenantId];
        
        // Apply filters
        if (filters.employee) {
            query += ' AND sr.employee_id = ?';
            params.push(filters.employee);
        }
        
        if (filters.department) {
            query += ' AND sr.department_id = ?';
            params.push(filters.department);
        }
        
        if (filters.month) {
            query += ' AND sr.month = ?';
            params.push(filters.month);
        }
        
        if (filters.year) {
            query += ' AND sr.year = ?';
            params.push(filters.year);
        }
        
        if (filters.status) {
            query += ' AND sr.status = ?';
            params.push(filters.status);
        }
        
        query += ' ORDER BY sr.created_at DESC';
        
        const [rows] = await pool.execute(query, params);
        
        // Parse JSON fields
        return rows.map(row => ({
            ...row,
            allowances: typeof row.allowances === 'string' ? JSON.parse(row.allowances) : row.allowances,
            deductions: typeof row.deductions === 'string' ? JSON.parse(row.deductions) : row.deductions
        }));
    },

    // Get salary record by ID
    getById: async (tenantId, id) => {
        const [rows] = await pool.execute(
            `SELECT 
                sr.*,
                CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                ed.position as designation,
                d.name as department_name,
                ed.bank_account_number,
                ed.ifsc_code,
                ed.pan_number,
                ed.aadhar_number
            FROM salary_records sr
            INNER JOIN employee_details ed ON sr.employee_id = ed.id
            INNER JOIN users u ON ed.user_id = u.id
            INNER JOIN departments d ON sr.department_id = d.id
            WHERE sr.id = ? AND sr.tenant_id = ?`,
            [id, tenantId]
        );
        
        if (rows.length === 0) return null;
        
        const row = rows[0];
        return {
            ...row,
            allowances: typeof row.allowances === 'string' ? JSON.parse(row.allowances) : row.allowances,
            deductions: typeof row.deductions === 'string' ? JSON.parse(row.deductions) : row.deductions
        };
    },

    // Create new salary record
    create: async (tenantId, salaryData) => {
        const {
            employee_id,
            department_id,
            basic_salary,
            allowances,
            deductions,
            net_salary,
            payment_date,
            month,
            year,
            payment_frequency,
            status
        } = salaryData;

        const [result] = await pool.execute(
            `INSERT INTO salary_records (
                tenant_id, employee_id, department_id, basic_salary, allowances, deductions, 
                net_salary, payment_date, month, year, payment_frequency, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                tenantId,
                employee_id,
                department_id,
                basic_salary,
                JSON.stringify(allowances),
                JSON.stringify(deductions),
                net_salary,
                payment_date,
                month,
                year,
                payment_frequency,
                status
            ]
        );
        return result.insertId;
    },

    // Update salary record
    update: async (tenantId, id, salaryData) => {
        const {
            employee_id,
            department_id,
            basic_salary,
            allowances,
            deductions,
            net_salary,
            payment_date,
            month,
            year,
            payment_frequency,
            status
        } = salaryData;

        const [result] = await pool.execute(
            `UPDATE salary_records 
            SET employee_id = ?, department_id = ?, basic_salary = ?, allowances = ?, 
                deductions = ?, net_salary = ?, payment_date = ?, month = ?, year = ?, 
                payment_frequency = ?, status = ?, updated_at = NOW()
            WHERE id = ? AND tenant_id = ?`,
            [
                employee_id,
                department_id,
                basic_salary,
                JSON.stringify(allowances),
                JSON.stringify(deductions),
                net_salary,
                payment_date,
                month,
                year,
                payment_frequency,
                status,
                id,
                tenantId
            ]
        );
        return result.affectedRows;
    },

    // Delete salary record
    delete: async (tenantId, id) => {
        const [result] = await pool.execute(
            'DELETE FROM salary_records WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return result.affectedRows;
    },

    // Get employees for dropdown
    getEmployees: async (tenantId) => {
        const [rows] = await pool.execute(
            `SELECT 
                ed.id,
                ed.id as employee_id,
                CONCAT(u.first_name, ' ', u.last_name) as name,
                ed.position,
                ed.department_id,
                ed.salary
            FROM employee_details ed
            INNER JOIN users u ON ed.user_id = u.id
            WHERE u.is_active = 1 AND ed.tenant_id = ? AND u.tenant_id = ?
            ORDER BY u.first_name, u.last_name`, [tenantId, tenantId]
        );
        return rows;
    },

    // Get departments for dropdown
    getDepartments: async (tenantId) => {
        const [rows] = await pool.execute(
            'SELECT id, name FROM departments WHERE tenant_id = ? ORDER BY name', [tenantId]
        );
        return rows;
    },

    // Check if salary record already exists for employee and period
    checkRecordExists: async (tenantId, employee_id, month, year, excludeId = null) => {
        let query = 'SELECT id FROM salary_records WHERE employee_id = ? AND month = ? AND year = ? AND tenant_id = ?';
        const params = [employee_id, month, year, tenantId];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    },

    // Get salary statistics
    getStatistics: async (tenantId) => {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total_records,
                COUNT(CASE WHEN status = 'paid' THEN 1 END) as total_paid,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
                COALESCE(SUM(net_salary), 0) as total_amount
            FROM salary_records
            WHERE tenant_id = ?`, [tenantId]
        );
        return rows[0];
    }
};

module.exports = Salary;