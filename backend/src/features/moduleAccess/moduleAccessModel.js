const { query } = require('../../config/db');
const { addForeignKeyIfMissing, addIndexIfMissing } = require('../../utils/schemaHelpers');

const MANAGEABLE_MODULES = ['hr', 'accounts', 'services'];

const moduleAccessModel = {
  async ensureSchema() {
    try {
      await query(`
        ALTER TABLE users
        ADD COLUMN last_active_at DATETIME NULL
      `);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

    await query(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT NOT NULL AUTO_INCREMENT,
        module_key VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        UNIQUE KEY uk_module_key (module_key)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_module_access (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        tenant_id INT NOT NULL,
        module_key VARCHAR(50) NOT NULL,
        access_level ENUM('none', 'read', 'write') NOT NULL DEFAULT 'none',
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_user_module (user_id, module_key),
        KEY idx_tenant_user (tenant_id, user_id)
      )
    `);

    await addIndexIfMissing('user_module_access', 'idx_user_module_module', 'INDEX idx_user_module_module (module_key)');
    await addIndexIfMissing('user_module_access', 'idx_user_module_updated_by', 'INDEX idx_user_module_updated_by (updated_by)');

    await addForeignKeyIfMissing(
      'user_module_access',
      'fk_user_module_access_user',
      'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    );
    await addForeignKeyIfMissing(
      'user_module_access',
      'fk_user_module_access_tenant',
      'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
    );
    await addForeignKeyIfMissing(
      'user_module_access',
      'fk_user_module_access_module',
      'FOREIGN KEY (module_key) REFERENCES modules(module_key) ON DELETE CASCADE'
    );
    await addForeignKeyIfMissing(
      'user_module_access',
      'fk_user_module_access_updated_by',
      'FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL'
    );

    for (const [moduleKey, name, sortOrder] of [
      ['hr', 'HR Module', 1],
      ['accounts', 'Accounts Module', 2],
      ['services', 'Services Module', 3],
    ]) {
      await query(
        `INSERT IGNORE INTO modules (module_key, name, sort_order) VALUES (?, ?, ?)`,
        [moduleKey, name, sortOrder]
      );
    }

    await addForeignKeyIfMissing(
      'user_module_access',
      'fk_user_module_access_module',
      'FOREIGN KEY (module_key) REFERENCES modules(module_key) ON DELETE CASCADE'
    );
  },

  async updateLastActive(userId) {
    await query('UPDATE users SET last_active_at = NOW() WHERE id = ?', [userId]);
  },

  async getModules() {
    const rows = await query(
      `SELECT module_key, name, sort_order FROM modules
       WHERE module_key IN (?, ?, ?)
       ORDER BY sort_order`,
      MANAGEABLE_MODULES
    );
    return rows;
  },

  async getUserAccessMap(userId, tenantId) {
    const rows = await query(
      `SELECT module_key, access_level FROM user_module_access
       WHERE user_id = ? AND tenant_id = ?`,
      [userId, tenantId]
    );
    const map = {};
    for (const row of rows) {
      map[row.module_key] = row.access_level;
    }
    return map;
  },

  async getModulesForUser(userId, tenantId, isAdmin) {
    const modules = await this.getModules();
    if (isAdmin) {
      return modules.map((m) => ({
        module_key: m.module_key,
        name: m.name,
        access: 'write',
      }));
    }

    const accessMap = await this.getUserAccessMap(userId, tenantId);
    return modules
      .map((m) => ({
        module_key: m.module_key,
        name: m.name,
        access: accessMap[m.module_key] || 'none',
      }))
      .filter((m) => m.access !== 'none');
  },

  async listUsersWithAccess(tenantId) {
    const users = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.position AS system_role,
              u.last_active_at, u.is_active,
              ed.position AS job_position
       FROM users u
       LEFT JOIN employee_details ed ON ed.employee_id = u.id
       WHERE u.tenant_id = ?
       ORDER BY u.first_name, u.last_name`,
      [tenantId]
    );

    const accessRows = await query(
      `SELECT user_id, module_key, access_level
       FROM user_module_access
       WHERE tenant_id = ?`,
      [tenantId]
    );

    const accessByUser = {};
    for (const row of accessRows) {
      if (!accessByUser[row.user_id]) accessByUser[row.user_id] = {};
      accessByUser[row.user_id][row.module_key] = row.access_level;
    }

    return users.map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      system_role: u.system_role,
      job_position: u.job_position || '—',
      last_active_at: u.last_active_at,
      is_active: u.is_active,
      module_access: accessByUser[u.id] || {},
    }));
  },

  async getUserModuleAccess(userId, tenantId) {
    const userRows = await query(
      'SELECT id, position FROM users WHERE id = ? AND tenant_id = ?',
      [userId, tenantId]
    );
    if (userRows.length === 0) return null;

    const modules = await this.getModules();
    const accessMap = await this.getUserAccessMap(userId, tenantId);

    return {
      user_id: userId,
      is_admin: userRows[0].position === 'admin',
      modules: modules.map((m) => ({
        module_key: m.module_key,
        name: m.name,
        access: userRows[0].position === 'admin' ? 'write' : (accessMap[m.module_key] || 'none'),
      })),
    };
  },

  async setUserModuleAccess(userId, tenantId, moduleAccessList, updatedBy) {
    for (const item of moduleAccessList) {
      const { module_key, access } = item;
      if (!MANAGEABLE_MODULES.includes(module_key)) continue;
      if (!['none', 'read', 'write'].includes(access)) continue;

      if (access === 'none') {
        await query(
          `DELETE FROM user_module_access WHERE user_id = ? AND tenant_id = ? AND module_key = ?`,
          [userId, tenantId, module_key]
        );
      } else {
        await query(
          `INSERT INTO user_module_access (user_id, tenant_id, module_key, access_level, updated_by)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE access_level = VALUES(access_level), updated_by = VALUES(updated_by)`,
          [userId, tenantId, module_key, access, updatedBy]
        );
      }
    }
  },
};

module.exports = moduleAccessModel;
