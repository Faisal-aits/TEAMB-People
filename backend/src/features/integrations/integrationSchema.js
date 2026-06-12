const { pool } = require('../../config/db');
const {
  addColumnIfMissing,
  addForeignKeyIfMissing,
  addIndexIfMissing,
} = require('../../utils/schemaHelpers');

let schemaReady;

const ensureIntegrationSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      // Create api_keys table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          project_id INT NULL,
          name VARCHAR(100) NOT NULL,
          api_key VARCHAR(255) NOT NULL UNIQUE,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create integration_audit_logs table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS integration_audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          api_key_id INT NOT NULL,
          action VARCHAR(100) NOT NULL,
          ticket_id INT NULL,
          status_code INT NOT NULL,
          ip_address VARCHAR(45) NULL,
          details TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migration helpers for existing databases
      await addColumnIfMissing('api_keys', 'project_id', '`project_id` INT NULL COMMENT \'Project associated with this API key\' AFTER tenant_id');

      // Indexes on api_keys
      await addIndexIfMissing('api_keys', 'idx_api_keys_tenant', 'INDEX idx_api_keys_tenant (tenant_id)');
      await addIndexIfMissing('api_keys', 'idx_api_keys_project', 'INDEX idx_api_keys_project (project_id)');
      await addIndexIfMissing('api_keys', 'idx_api_keys_key', 'INDEX idx_api_keys_key (api_key)');
      await addIndexIfMissing('api_keys', 'idx_api_keys_status', 'INDEX idx_api_keys_status (status)');

      // Indexes on integration_audit_logs
      await addIndexIfMissing('integration_audit_logs', 'idx_audit_tenant', 'INDEX idx_audit_tenant (tenant_id)');
      await addIndexIfMissing('integration_audit_logs', 'idx_audit_key', 'INDEX idx_audit_key (api_key_id)');
      await addIndexIfMissing('integration_audit_logs', 'idx_audit_ticket', 'INDEX idx_audit_ticket (ticket_id)');

      // Foreign keys
      await addForeignKeyIfMissing(
        'api_keys',
        'fk_api_keys_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'api_keys',
        'fk_api_keys_project',
        'FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL'
      );
      await addForeignKeyIfMissing(
        'integration_audit_logs',
        'fk_audit_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'integration_audit_logs',
        'fk_audit_api_key',
        'FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE'
      );
    })();
  }
  return schemaReady;
};

module.exports = { ensureIntegrationSchema };
