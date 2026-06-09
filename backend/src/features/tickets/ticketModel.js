const { query } = require('../../config/db');
const { ensureTicketSchema } = require('./ticketSchema');

const ticketModel = {
  create: async (tenantId, raisedByUserId, data) => {
    await ensureTicketSchema();

    // Verify project belongs to tenant if project_id is provided
    if (data.project_id) {
      const projects = await query(
        'SELECT id FROM projects WHERE id = ? AND tenant_id = ?',
        [data.project_id, tenantId]
      );
      if (projects.length === 0) {
        throw new Error('Selected project is invalid or does not belong to your organization');
      }
    }

    const result = await query(
      `INSERT INTO tickets (tenant_id, project_id, raised_by_user_id, title, description, priority, status, attachment_url)
       VALUES (?, ?, ?, ?, ?, ?, 'Open', ?)`,
      [
        tenantId,
        data.project_id || null,
        raisedByUserId,
        data.title,
        data.description,
        data.priority || 'Medium',
        data.attachment_url || null,
      ]
    );
    return result.insertId;
  },

  getAll: async (tenantId, filters = {}) => {
    await ensureTicketSchema();
    let sql = `
      SELECT t.*, 
             p.name as project_name,
             CONCAT(u1.first_name, ' ', u1.last_name) as raised_by_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as assigned_to_name
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      JOIN users u1 ON t.raised_by_user_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_user_id = u2.id
      WHERE t.tenant_id = ?
    `;
    const params = [tenantId];

    if (filters.raised_by_user_id) {
      sql += ' AND t.raised_by_user_id = ?';
      params.push(filters.raised_by_user_id);
    }
    if (filters.assigned_to_user_id) {
      sql += ' AND t.assigned_to_user_id = ?';
      params.push(filters.assigned_to_user_id);
    }
    if (filters.project_id) {
      sql += ' AND t.project_id = ?';
      params.push(filters.project_id);
    }
    if (filters.status) {
      sql += ' AND t.status = ?';
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ' AND t.priority = ?';
      params.push(filters.priority);
    }
    if (filters.search) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    sql += ' ORDER BY t.created_at DESC';
    return await query(sql, params);
  },

  getById: async (tenantId, id) => {
    await ensureTicketSchema();
    const sql = `
      SELECT t.*, 
             p.name as project_name,
             CONCAT(u1.first_name, ' ', u1.last_name) as raised_by_name,
             CONCAT(u2.first_name, ' ', u2.last_name) as assigned_to_name
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      JOIN users u1 ON t.raised_by_user_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to_user_id = u2.id
      WHERE t.id = ? AND t.tenant_id = ?
    `;
    const rows = await query(sql, [id, tenantId]);
    return rows[0] || null;
  },

  update: async (tenantId, id, data) => {
    await ensureTicketSchema();
    const updates = [];
    const params = [];

    if (data.priority) {
      updates.push('priority = ?');
      params.push(data.priority);
    }
    if (data.status) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.assigned_to_user_id !== undefined) {
      // If assignment is changed, verify assignee belongs to tenant
      if (data.assigned_to_user_id) {
        const users = await query(
          'SELECT id FROM users WHERE id = ? AND tenant_id = ?',
          [data.assigned_to_user_id, tenantId]
        );
        if (users.length === 0) {
          throw new Error('Assigned user is invalid or does not belong to this organization');
        }
      }
      updates.push('assigned_to_user_id = ?');
      params.push(data.assigned_to_user_id);
    }

    if (updates.length === 0) return false;

    params.push(id, tenantId);
    const result = await query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  addComment: async (tenantId, ticketId, userId, comment) => {
    await ensureTicketSchema();

    // Verify ticket belongs to tenant
    const ticket = await query(
      'SELECT id FROM tickets WHERE id = ? AND tenant_id = ?',
      [ticketId, tenantId]
    );
    if (ticket.length === 0) {
      throw new Error('Ticket not found or access denied');
    }

    const result = await query(
      `INSERT INTO ticket_comments (tenant_id, ticket_id, user_id, comment)
       VALUES (?, ?, ?, ?)`,
      [tenantId, ticketId, userId, comment]
    );
    return result.insertId;
  },

  getComments: async (tenantId, ticketId) => {
    await ensureTicketSchema();
    const sql = `
      SELECT tc.*, 
             CONCAT(u.first_name, ' ', u.last_name) as user_name,
             u.position as user_role
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ? AND tc.tenant_id = ?
      ORDER BY tc.created_at ASC
    `;
    return await query(sql, [ticketId, tenantId]);
  },
};

module.exports = ticketModel;
