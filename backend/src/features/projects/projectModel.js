const { query } = require('../../config/db');
const { ensureProjectSchema } = require('./projectSchema');

const projectModel = {
  getAll: async (tenantId) => {
    await ensureProjectSchema();
    let sql = 'SELECT * FROM projects WHERE tenant_id = ? ORDER BY created_at DESC';
    return await query(sql, [tenantId]);
  },

  getById: async (tenantId, id) => {
    await ensureProjectSchema();
    const projects = await query('SELECT * FROM projects WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return projects[0] || null;
  },

  create: async (tenantId, data) => {
    await ensureProjectSchema();
    const result = await query(
      `INSERT INTO projects (tenant_id, client_id, name, description, start_date, end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, 
        data.client_id || data.clientId, 
        data.name || 'Unnamed Project', 
        data.description || null, 
        data.start_date || data.startDate || null, 
        data.end_date || data.endDate || null, 
        data.status || 'Active'
      ]
    );
    return result.insertId;
  },

  update: async (tenantId, id, data) => {
    await ensureProjectSchema();
    return await query(
      `UPDATE projects SET client_id = ?, name = ?, description = ?, start_date = ?, end_date = ?, status = ? 
       WHERE id = ? AND tenant_id = ?`,
      [
        data.client_id || data.clientId, 
        data.name || 'Unnamed Project', 
        data.description || null, 
        data.start_date || data.startDate || null, 
        data.end_date || data.endDate || null, 
        data.status || 'Active', 
        id, 
        tenantId
      ]
    );
  },

  delete: async (tenantId, id) => {
    await ensureProjectSchema();
    return await query('DELETE FROM projects WHERE id = ? AND tenant_id = ?', [id, tenantId]);
  }
};

module.exports = projectModel;
