// backend/models/departmentModel.js
const pool = require('../config/database');

const Department = {
    // Get all departments with employee count
    getAll: async () => {
        const query = `
            SELECT 
                d.*,
                COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN employee_details e ON d.id = e.department_id
            GROUP BY d.id 
            ORDER BY d.name
        `;

        const [rows] = await pool.execute(query);
        return rows;
    },

    // Get department by ID with employee count
    getById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT 
                d.*,
                COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN employee_details e ON d.id = e.department_id
            WHERE d.id = ?
            GROUP BY d.id`,
            [id]
        );
        return rows[0];
    },

    // Create new department
    create: async (departmentData) => {
        const { name, description, manager } = departmentData;
        const [result] = await pool.execute(
            'INSERT INTO departments (name, description, manager, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [name, description, manager]
        );
        return result.insertId;
    },

    // Update department
    update: async (id, departmentData) => {
        const { name, description, manager } = departmentData;
        const [result] = await pool.execute(
            'UPDATE departments SET name = ?, description = ?, manager = ?, updated_at = NOW() WHERE id = ?',
            [name, description, manager, id]
        );
        return result.affectedRows;
    },

    // Delete department
delete: async (id) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            console.log(`Starting deletion process for department: ${id}`);

            // Discover all foreign key constraints for departments
            const constraintsQuery = `
                SELECT 
                    TABLE_NAME, 
                    COLUMN_NAME, 
                    CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE REFERENCED_TABLE_SCHEMA = 'arham_it_solutions'
                AND REFERENCED_TABLE_NAME = 'departments'
                AND REFERENCED_COLUMN_NAME = 'id'
            `;

            const [constraints] = await connection.execute(constraintsQuery);
            console.log('Found department constraints:', constraints);

            // Handle all constrained tables
            for (const constraint of constraints) {
                try {
                    // Delete related records from each constrained table
                    const [result] = await connection.execute(
                        `DELETE FROM ${constraint.TABLE_NAME} WHERE ${constraint.COLUMN_NAME} = ?`,
                        [id]
                    );
                    if (result.affectedRows > 0) {
                        console.log(`Deleted ${result.affectedRows} records from ${constraint.TABLE_NAME}`);
                    }
                } catch (error) {
                    console.log(`Error with ${constraint.TABLE_NAME}:`, error.message);
                    // Continue with deletion even if some tables fail
                }
            }

            // Now delete the department
            const [result] = await connection.execute(
                'DELETE FROM departments WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Department not found');
            }

            await connection.commit();
            console.log(`Department ${id} deleted successfully`);
            return result.affectedRows;

        } catch (error) {
            await connection.rollback();
            console.error('Error in Department.delete:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get department employees
    getEmployees: async (departmentId) => {
        const [rows] = await pool.execute(
            `SELECT 
                ed.id, 
                CONCAT(u.first_name, ' ', u.last_name) as name,
                ed.position,
                u.email,
                u.phone
            FROM employee_details ed
            INNER JOIN users u ON ed.user_id = u.id
            WHERE ed.department_id = ? 
            AND u.is_active = 1
            ORDER BY u.first_name, u.last_name`,
            [departmentId]
        );
        return rows;
    },

    // Get managers from employee_details table
    getManagers: async () => {
        const [rows] = await pool.execute(
            `SELECT 
                ed.id,
                ed.user_id,
                u.first_name,
                u.last_name,
                CONCAT(u.first_name, ' ', u.last_name) as name,
                u.email,
                ed.position,
                u.phone
            FROM employee_details ed
            INNER JOIN users u ON ed.user_id = u.id
            WHERE (ed.position LIKE '%manager%' OR 
                   ed.position LIKE '%lead%' OR 
                   ed.position LIKE '%head%' OR 
                   ed.position LIKE '%director%' OR
                   ed.position LIKE '%Administrator%' OR
                   ed.position LIKE '%Senior%' OR
                   ed.position LIKE '%chief%' OR
                   ed.position LIKE '%vp%')
            AND u.is_active = 1
            ORDER BY u.first_name, u.last_name`
        );
        return rows;
    },

    // Check if department name already exists
    checkNameExists: async (name, excludeId = null) => {
        let query = 'SELECT id FROM departments WHERE name = ?';
        const params = [name];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    },

    // Get department statistics
    getStatistics: async () => {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) as total_departments,
                COUNT(*) as active_departments,
                0 as inactive_departments
            FROM departments`
        );
        return rows[0];
    }
};

module.exports = Department;