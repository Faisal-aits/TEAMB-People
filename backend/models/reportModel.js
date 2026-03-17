// backend/models/reportModel.js
const pool = require('../config/database');

const Report = {
    // Get all reports with user information - filtered by user role
    getAll: async (userId, userRole) => {
        console.log(`Model.getAll - User ID: ${userId}, Role: ${userRole}`);
        
        const isAdmin = userRole === 'admin' || 
                        userRole === 'Admin' || 
                        userRole === 'ADMIN' ||
                        userRole == 1;
        
        if (isAdmin) {
            // Admin gets all reports
            const [rows] = await pool.execute(`
                SELECT 
                    r.*,
                    CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
                FROM reports r
                LEFT JOIN users u ON r.generated_by = u.id
                ORDER BY r.date_generated DESC
            `);
            return rows;
        } else {
            // Regular user gets only their own reports
            const [rows] = await pool.execute(`
                SELECT 
                    r.*,
                    CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
                FROM reports r
                LEFT JOIN users u ON r.generated_by = u.id
                WHERE r.generated_by = ?
                ORDER BY r.date_generated DESC
            `, [userId]);
            return rows;
        }
    },

    // Get report by ID - with access control
    getById: async (id, userId, userRole) => {
        let query = `
            SELECT 
                r.*,
                CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
            FROM reports r
            INNER JOIN users u ON r.generated_by = u.id
            WHERE r.id = ?
        `;
        const params = [id];

        // If user is not admin (role_id = 1), only allow access to their own reports
        if (userRole !== 1 && userRole !== 'admin') {
            query += ' AND r.generated_by = ?';
            params.push(userId);
        }

        const [rows] = await pool.execute(query, params);
        return rows[0];
    },

    // Create new report
    create: async (reportData) => {
        const { date_generated, description, generated_by } = reportData;
        const [result] = await pool.execute(
            'INSERT INTO reports (date_generated, description, generated_by, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [date_generated, description, generated_by]
        );
        return result.insertId;
    },

    // Update report - with access control
    update: async (id, reportData, userId, userRole) => {
        const { date_generated, description } = reportData;
        
        let query = 'UPDATE reports SET date_generated = ?, description = ?, updated_at = NOW() WHERE id = ?';
        const params = [date_generated, description, id];

        // If user is not admin (role_id = 1), only allow updating their own reports
        if (userRole !== 1 && userRole !== 'admin') {
            query += ' AND generated_by = ?';
            params.push(userId);
        }

        const [result] = await pool.execute(query, params);
        return result.affectedRows;
    },

    // Delete report - with access control
    delete: async (id, userId, userRole) => {
        let query = 'DELETE FROM reports WHERE id = ?';
        const params = [id];

        // If user is not admin (role_id = 1), only allow deleting their own reports
        if (userRole !== 1 && userRole !== 'admin') {
            query += ' AND generated_by = ?';
            params.push(userId);
        }

        const [result] = await pool.execute(query, params);
        return result.affectedRows;
    },

    // In reportModel.js - Add this method
// Update the Report.getRecent method in reportModel.js
getRecent: async (userId, userRole, limit = 3) => {
    console.log('=== Model.getRecent ===');
    console.log('Parameters:', { userId, userRole, limit });
    console.log(`User role value: "${userRole}" (type: ${typeof userRole})`);
    
    // Convert role to number for comparison
    const roleNum = Number(userRole);
    console.log(`Role as number: ${roleNum}`);
    
    let query = `
        SELECT 
            r.*,
            CONCAT(u.first_name, ' ', u.last_name) as generated_by_name
        FROM reports r
        INNER JOIN users u ON r.generated_by = u.id
        WHERE 1=1
    `;
    
    const params = [];
    
    // Debug the role check logic
    console.log(`\nRole check logic:`);
    console.log(`- userRole == 1: ${userRole == 1}`);
    console.log(`- userRole === 1: ${userRole === 1}`);
    console.log(`- roleNum === 1: ${roleNum === 1}`);
    console.log(`- userRole === 'admin': ${userRole === 'admin'}`);
    console.log(`- userRole === '1': ${userRole === '1'}`);
    
    // FIXED: Handle both string and number roles
    const isAdmin = userRole == 1 || userRole === 1 || userRole === 'admin' || roleNum === 1;
    console.log(`isAdmin calculated as: ${isAdmin}`);
    
    if (!isAdmin) {
        query += ' AND r.generated_by = ?';
        params.push(userId);
        console.log(`Adding user filter: generated_by = ${userId}`);
    } else {
        console.log('Admin user - showing all reports');
    }
    
    query += ' ORDER BY r.date_generated DESC, r.created_at DESC LIMIT ?';
    params.push(limit);
    
    console.log('\nFinal query:', query);
    console.log('Query params:', params);
    
    const [rows] = await pool.execute(query, params);
    console.log(`Query returned ${rows.length} rows`);
    
    if (rows.length > 0) {
        console.log('First report:', JSON.stringify(rows[0], null, 2));
    }
    
    return rows;
}
};

module.exports = Report;