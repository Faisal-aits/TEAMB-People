// models/userModel.js
const pool = require('../config/database');

const User = {
    // Find user by email
    findByEmail: async (email) => {
        try {   
            const [rows] = await pool.execute(
                'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ? AND u.is_active = true',
                [email]
            );
            return rows[0];
        } catch (error) {
            console.error('Database error in findByEmail:', error);
            throw error;
        }
    },

    // Find user by ID
    findById: async (id) => {
        try {
            const [rows] = await pool.execute(
                'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = true',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Database error in findById:', error);
            throw error;
        }
    },

    // Create new user
    create: async (userData) => {
        const { role_id, first_name, last_name, email, password_hash, phone } = userData;
        const [result] = await pool.execute(
            'INSERT INTO users (role_id, first_name, last_name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [role_id, first_name, last_name, email, password_hash, phone]
        );
        return result.insertId;
    },

    // Update user password - ADD THIS METHOD
    updatePassword: async (userId, passwordHash) => {
        try {
            const [result] = await pool.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [passwordHash, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Database error in updatePassword:', error);
            throw error;
        }
    }
};

module.exports = User;