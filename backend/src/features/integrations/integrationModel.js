const { query } = require('../../config/db');
const { ensureIntegrationSchema } = require('./integrationSchema');

const integrationModel = {
  /**
   * Create a new API key for a tenant.
   */
  createApiKey: async (tenantId, name, apiKey, projectId = null) => {
    await ensureIntegrationSchema();
    const result = await query(
      'INSERT INTO api_keys (tenant_id, project_id, name, api_key, status) VALUES (?, ?, ?, ?, ?)',
      [tenantId, projectId, name, apiKey, 'active']
    );
    return result.insertId;
  },

  /**
   * Find an API key record by the raw key string.
   * Returns { id, tenant_id, name, status, project_id } or null.
   */
  findApiKey: async (apiKey) => {
    await ensureIntegrationSchema();
    const rows = await query(
      'SELECT id, tenant_id, project_id, name, status FROM api_keys WHERE api_key = ? LIMIT 1',
      [apiKey]
    );
    return rows[0] || null;
  },

  /**
   * List all API keys for a tenant.
   */
  listApiKeys: async (tenantId) => {
    await ensureIntegrationSchema();
    return await query(
      `SELECT ak.id, ak.name, ak.status, ak.created_at, ak.project_id, p.name as project_name 
       FROM api_keys ak
       LEFT JOIN projects p ON ak.project_id = p.id
       WHERE ak.tenant_id = ? 
       ORDER BY ak.created_at DESC`,
      [tenantId]
    );
  },

  /**
   * Revoke (deactivate) an API key.
   */
  revokeApiKey: async (tenantId, keyId) => {
    await ensureIntegrationSchema();
    const result = await query(
      "UPDATE api_keys SET status = 'revoked' WHERE id = ? AND tenant_id = ?",
      [keyId, tenantId]
    );
    return result.affectedRows > 0;
  },

  /**
   * Write an audit log entry for every external API call.
   */
  logAudit: async ({ tenantId, apiKeyId, action, ticketId = null, statusCode, ipAddress = null, details = null }) => {
    await ensureIntegrationSchema();
    const result = await query(
      `INSERT INTO integration_audit_logs
         (tenant_id, api_key_id, action, ticket_id, status_code, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, apiKeyId, action, ticketId, statusCode, ipAddress, details ? JSON.stringify(details) : null]
    );
    return result.insertId;
  },

  /**
   * Get audit logs for a tenant, optionally filtered by api_key_id.
   */
  getAuditLogs: async (tenantId, { apiKeyId, limit = 100 } = {}) => {
    await ensureIntegrationSchema();
    let sql = `
      SELECT al.*, ak.name as api_key_name
      FROM integration_audit_logs al
      LEFT JOIN api_keys ak ON al.api_key_id = ak.id
      WHERE al.tenant_id = ?
    `;
    const params = [tenantId];
    if (apiKeyId) {
      sql += ' AND al.api_key_id = ?';
      params.push(apiKeyId);
    }
    sql += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(limit);
    return await query(sql, params);
  },
};

module.exports = integrationModel;
