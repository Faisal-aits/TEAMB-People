const { query } = require('../../config/db');
const { ensureProjectSchema } = require('./projectSchema');

const projectModel = {
  getAll: async (tenantId) => {
    await ensureProjectSchema();
    let sql = 'SELECT * FROM projects WHERE tenant_id = ? ORDER BY created_at DESC';
    return await query(sql, [tenantId]);
  },

  getStats: async (tenantId) => {
    await ensureProjectSchema();
    const rows = await query(
      `SELECT
         COUNT(*) as totalProjects,
         SUM(CASE WHEN LOWER(COALESCE(status, '')) <> 'completed' THEN 1 ELSE 0 END) as activeProjects,
         SUM(CASE WHEN LOWER(COALESCE(status, '')) IN ('delayed', 'at risk', 'overdue') THEN 1 ELSE 0 END) as delayedProjects,
         SUM(CASE WHEN LOWER(COALESCE(status, '')) = 'completed' THEN 1 ELSE 0 END) as completedProjects
       FROM projects
       WHERE tenant_id = ?`,
      [tenantId]
    );

    return {
      totalProjects: Number(rows[0]?.totalProjects || 0),
      activeProjects: Number(rows[0]?.activeProjects || 0),
      delayedProjects: Number(rows[0]?.delayedProjects || 0),
      completedProjects: Number(rows[0]?.completedProjects || 0),
    };
  },

  getMyProjects: async (tenantId, userId, userName) => {
    await ensureProjectSchema();
    const params = [tenantId];
    let sql = `
      SELECT DISTINCT p.*
      FROM projects p
      LEFT JOIN pttm_tasks t ON t.project_id = p.id AND t.tenant_id = p.tenant_id AND t.assigned_user_id = ?
      WHERE p.tenant_id = ?
    `;
    params.unshift(userId);

    if (userName) {
      sql += ' AND (t.id IS NOT NULL OR LOWER(COALESCE(p.manager, \'\')) = LOWER(?))';
      params.push(userName);
    } else {
      sql += ' AND t.id IS NOT NULL';
    }

    sql += ' ORDER BY p.created_at DESC';

    try {
      return await query(sql, params);
    } catch (error) {
      if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      const fallbackParams = [tenantId];
      let fallbackSql = 'SELECT * FROM projects WHERE tenant_id = ?';
      if (userName) {
        fallbackSql += ' AND LOWER(COALESCE(manager, \'\')) = LOWER(?)';
        fallbackParams.push(userName);
      }
      fallbackSql += ' ORDER BY created_at DESC';
      return await query(fallbackSql, fallbackParams);
    }
  },

  getById: async (tenantId, id) => {
    await ensureProjectSchema();
    const projects = await query('SELECT * FROM projects WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return projects[0] || null;
  },

  create: async (tenantId, data) => {
    await ensureProjectSchema();
    const result = await query(
      `INSERT INTO projects (tenant_id, client_id, name, description, start_date, end_date, status, department, manager, current_phase)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        data.client_id || data.clientId || null,
        data.name || 'Unnamed Project',
        data.description || null,
        data.start_date || data.startDate || null,
        data.end_date || data.endDate || null,
        data.status || 'Active',
        data.department || data.assigned_department || null,
        data.manager || data.project_lead || data.project_lead_name || null,
        data.current_phase || null
      ]
    );
    return result.insertId;
  },

  update: async (tenantId, id, data) => {
    await ensureProjectSchema();
    return await query(
      `UPDATE projects SET client_id = ?, name = ?, description = ?, start_date = ?, end_date = ?, status = ?,
       department = ?, manager = ?, current_phase = ?
       WHERE id = ? AND tenant_id = ?`,
      [
        data.client_id || data.clientId || null,
        data.name || 'Unnamed Project',
        data.description || null,
        data.start_date || data.startDate || null,
        data.end_date || data.endDate || null,
        data.status || 'Active',
        data.department || data.assigned_department || null,
        data.manager || data.project_lead || data.project_lead_name || null,
        data.current_phase || null,
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
