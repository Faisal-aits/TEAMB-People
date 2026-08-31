// backend/src/features/settings/settingsModel.js
const { pool } = require('../../config/db');

const Settings = {
  get: async (tenantId, key) => {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM company_settings WHERE tenant_id = ? AND setting_key = ?',
      [tenantId, key]
    );
    return rows.length > 0 ? rows[0].setting_value : null;
  },

  set: async (tenantId, key, value) => {
    await pool.execute(
      `INSERT INTO company_settings (tenant_id, setting_key, setting_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [tenantId, key, String(value)]
    );
  },

  getAll: async (tenantId) => {
    const [rows] = await pool.execute(
      'SELECT setting_key, setting_value FROM company_settings WHERE tenant_id = ?',
      [tenantId]
    );
    const result = {};
    for (const row of rows) {
      result[row.setting_key] = row.setting_value;
    }
    return result;
  }
};

module.exports = Settings;
