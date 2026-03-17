// backend/models/clientModel.js
const pool = require('../config/database');

const Client = {
    // Get all clients with counts
    getAll: async (filters = {}) => {
        let query = `
            SELECT 
                c.*,
                COUNT(DISTINCT ci.id) as interactions_count,
                COUNT(DISTINCT cp.id) as projects_count,
                COUNT(DISTINCT cd.id) as documents_count
            FROM clients c
            LEFT JOIN client_interactions ci ON c.id = ci.client_id
            LEFT JOIN client_projects cp ON c.id = cp.client_id
            LEFT JOIN client_documents cd ON c.id = cd.client_id
        `;

        const whereConditions = [];
        const params = [];

        if (filters.search) {
            whereConditions.push(`
                (c.name LIKE ? OR c.contact_person LIKE ? OR c.industry LIKE ? 
                OR c.location LIKE ? OR c.assigned_manager LIKE ?)
            `);
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters.industry) {
            whereConditions.push('c.industry = ?');
            params.push(filters.industry);
        }

        if (filters.status) {
            whereConditions.push('c.status = ?');
            params.push(filters.status);
        }

        if (filters.assigned_manager) {
            whereConditions.push('c.assigned_manager = ?');
            params.push(filters.assigned_manager);
        }

        if (filters.location) {
            whereConditions.push('c.location LIKE ?');
            params.push(`%${filters.location}%`);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' GROUP BY c.id ORDER BY c.name';

        const [rows] = await pool.execute(query, params);
        return rows;
    },

    // Get client by ID
    getById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT * FROM clients WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    // Create new client
    create: async (clientData) => {
        const {
            name, industry, contact_person, contact_email, contact_phone,
            location, assigned_manager, status, founded_year, employees_count,
            revenue, website, notes, preferred_contact, follow_up_frequency, next_follow_up
        } = clientData;

        const [result] = await pool.execute(
            `INSERT INTO clients (
                name, industry, contact_person, contact_email, contact_phone,
                location, assigned_manager, status, founded_year, employees_count,
                revenue, website, notes, preferred_contact, follow_up_frequency, next_follow_up
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, industry, contact_person, contact_email, contact_phone,
                location, assigned_manager, status, founded_year, employees_count,
                revenue, website, notes, preferred_contact, follow_up_frequency, next_follow_up
            ]
        );
        return result.insertId;
    },

    // Update client
    update: async (id, clientData) => {
        const {
            name, industry, contact_person, contact_email, contact_phone,
            location, assigned_manager, status, founded_year, employees_count,
            revenue, website, notes, preferred_contact, follow_up_frequency, next_follow_up
        } = clientData;

        const [result] = await pool.execute(
            `UPDATE clients SET 
                name = ?, industry = ?, contact_person = ?, contact_email = ?, contact_phone = ?,
                location = ?, assigned_manager = ?, status = ?, founded_year = ?, employees_count = ?,
                revenue = ?, website = ?, notes = ?, preferred_contact = ?, follow_up_frequency = ?, next_follow_up = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                name, industry, contact_person, contact_email, contact_phone,
                location, assigned_manager, status, founded_year, employees_count,
                revenue, website, notes, preferred_contact, follow_up_frequency, next_follow_up, id
            ]
        );
        return result.affectedRows;
    },

    // Delete client
    delete: async (id) => {
        const [result] = await pool.execute(
            'DELETE FROM clients WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    },

    // Get client interactions
    getInteractions: async (clientId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM client_interactions WHERE client_id = ? ORDER BY date DESC',
            [clientId]
        );
        return rows;
    },

    // Add interaction
    addInteraction: async (interactionData) => {
        const { client_id, type, date, title, description, participants } = interactionData;
        
        const [result] = await pool.execute(
            'INSERT INTO client_interactions (client_id, type, date, title, description, participants) VALUES (?, ?, ?, ?, ?, ?)',
            [client_id, type, date, title, description, JSON.stringify(participants)]
        );
        return result.insertId;
    },

    // Get client projects
    getProjects: async (clientId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM client_projects WHERE client_id = ? ORDER BY created_at DESC',
            [clientId]
        );
        return rows;
    },

    // Get client documents
    getDocuments: async (clientId) => {
        const [rows] = await pool.execute(
            'SELECT * FROM client_documents WHERE client_id = ? ORDER BY upload_date DESC',
            [clientId]
        );
        return rows;
    },

    // Get managers list
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

        // Add new industry
    addIndustry: async (industryName) => {
        // First check if industry already exists
        const [existing] = await pool.execute(
            'SELECT id FROM clients WHERE industry = ? LIMIT 1',
            [industryName]
        );
        
        if (existing.length > 0) {
            return existing[0].id; // Industry already exists
        }

        // Industry doesn't exist, we'll just return success
        // Since industries are stored in client records, we don't need a separate table
        return true;
    },

    // Check if client email already exists
    checkEmailExists: async (email, excludeId = null) => {
        let query = 'SELECT id FROM clients WHERE contact_email = ?';
        const params = [email];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    }
};

module.exports = Client;