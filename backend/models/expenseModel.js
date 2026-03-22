// backend/models/expenseModel.js
const pool = require('../config/database');

const Expense = {
    // Get all expenses with user and category details
    getAll: async (tenantId, filters = {}) => {
        let query = `
            SELECT 
                e.*,
                u.first_name,
                u.last_name,
                u.email,
                r.name as user_role,
                ec.name as category_name,
                ec.limit_amount as category_limit
            FROM expenses e
            JOIN users u ON e.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.tenant_id = ?
        `;
        const params = [tenantId];

        // Add filters based on user role
        if (filters.user_id) {
            query += ' AND e.user_id = ?';
            params.push(filters.user_id);
        }

        if (filters.status) {
            query += ' AND e.status = ?';
            params.push(filters.status);
        }

        if (filters.category_id) {
            query += ' AND e.category_id = ?';
            params.push(filters.category_id);
        }

        query += ' ORDER BY e.submitted_at DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get expense by ID
    getById: async (tenantId, id) => {
        const [rows] = await pool.execute(
            `SELECT 
                e.*,
                u.first_name,
                u.last_name,
                u.email,
                r.name as user_role,
                ec.name as category_name,
                ec.limit_amount as category_limit
            FROM expenses e
            JOIN users u ON e.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.id = ? AND e.tenant_id = ?`,
            [id, tenantId]
        );
        return rows[0];
    },

    // Create new expense
    create: async (tenantId, expenseData) => {
        const { user_id, category_id, amount, description, receipt_url } = expenseData;
        const [result] = await pool.execute(
            'INSERT INTO expenses (tenant_id, user_id, category_id, amount, description, receipt_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [tenantId, user_id, category_id, amount, description, receipt_url, 'pending']
        );
        return result.insertId;
    },

    // Update expense status
    updateStatus: async (tenantId, id, status, approved_by = null) => {
        const approved_at = status !== 'pending' ? 'CURRENT_TIMESTAMP' : 'NULL';
        const [result] = await pool.execute(
            `UPDATE expenses SET status = ?, approved_by = ?, approved_at = ${approved_at}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`,
            [status, approved_by, id, tenantId]
        );
        return result.affectedRows;
    },

    // Get expenses by user ID
    getByUserId: async (tenantId, user_id) => {
        const [rows] = await pool.execute(
            `SELECT 
                e.*,
                ec.name as category_name,
                ec.limit_amount as category_limit
            FROM expenses e
            JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.user_id = ? AND e.tenant_id = ?
            ORDER BY e.submitted_at DESC`,
            [user_id, tenantId]
        );
        return rows;
    },

    // Get all expense categories
    getCategories: async (tenantId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM expense_categories WHERE tenant_id = ? ORDER BY name', [tenantId]
        );
        return rows;
    },

    // Get category by ID
    getCategoryById: async (tenantId, id) => {
        const [rows] = await pool.execute(
            'SELECT * FROM expense_categories WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );
        return rows[0];
    }
};

module.exports = Expense;