// backend/models/expenseModel.js
const pool = require('../config/database');

const Expense = {
    // Get all expenses with user and category details
    getAll: async (filters = {}) => {
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
            WHERE 1=1
        `;
        const params = [];

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
    getById: async (id) => {
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
            WHERE e.id = ?`,
            [id]
        );
        return rows[0];
    },

    // Create new expense
    create: async (expenseData) => {
        const { user_id, category_id, amount, description, receipt_url } = expenseData;
        const [result] = await pool.execute(
            'INSERT INTO expenses (user_id, category_id, amount, description, receipt_url, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, category_id, amount, description, receipt_url, 'pending']
        );
        return result.insertId;
    },

    // Update expense status
    updateStatus: async (id, status, approved_by = null) => {
        const approved_at = status !== 'pending' ? 'CURRENT_TIMESTAMP' : 'NULL';
        const [result] = await pool.execute(
            `UPDATE expenses SET status = ?, approved_by = ?, approved_at = ${approved_at}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [status, approved_by, id]
        );
        return result.affectedRows;
    },

    // Get expenses by user ID
    getByUserId: async (user_id) => {
        const [rows] = await pool.execute(
            `SELECT 
                e.*,
                ec.name as category_name,
                ec.limit_amount as category_limit
            FROM expenses e
            JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.user_id = ?
            ORDER BY e.submitted_at DESC`,
            [user_id]
        );
        return rows;
    },

    // Get all expense categories
    getCategories: async () => {
        const [rows] = await pool.execute(
            'SELECT * FROM expense_categories ORDER BY name'
        );
        return rows;
    },

    // Get category by ID
    getCategoryById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT * FROM expense_categories WHERE id = ?',
            [id]
        );
        return rows[0];
    }
};

module.exports = Expense;