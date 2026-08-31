const { pool } = require('../../config/db');
const { ensureProjectSchema } = require('../projects/projectSchema');
const {
  addColumnIfMissing,
  addForeignKeyIfMissing,
  addIndexIfMissing,
} = require('../../utils/schemaHelpers');

let schemaReady;

const ensureCrmSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          industry VARCHAR(120) NULL,
          contact_person VARCHAR(255) NULL,
          contact_email VARCHAR(255) NULL,
          contact_phone VARCHAR(50) NULL,
          location VARCHAR(255) NULL,
          assigned_manager VARCHAR(255) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'prospective',
          company VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_clients_tenant (tenant_id)
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS client_interactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_id INT NOT NULL,
          type VARCHAR(80) NULL,
          date DATE NULL,
          title VARCHAR(255) NULL,
          description TEXT NULL,
          participants JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_client_interactions_client (client_id)
        )
      `);

      await pool.execute(`
        CREATE TABLE IF NOT EXISTS industries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          name VARCHAR(120) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_industries_tenant_name (tenant_id, name)
        )
      `);

      await addColumnIfMissing('clients', 'company', 'company VARCHAR(255) NULL');
      await addColumnIfMissing('clients', 'assigned_manager_user_id', 'assigned_manager_user_id INT NULL');

      await addColumnIfMissing('client_interactions', 'tenant_id', 'tenant_id INT NULL AFTER id');
      await pool.execute(`
        UPDATE client_interactions ci
        JOIN clients c ON c.id = ci.client_id
        SET ci.tenant_id = c.tenant_id
        WHERE ci.tenant_id IS NULL
      `);

      await addIndexIfMissing('clients', 'idx_clients_industry', '(industry)');
      await addIndexIfMissing('clients', 'idx_clients_status', '(status)');
      await addIndexIfMissing('clients', 'idx_clients_assigned', '(assigned_manager)');

      // Foreign Keys
      await addForeignKeyIfMissing(
        'clients',
        'fk_clients_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'clients',
        'fk_clients_manager_user',
        'FOREIGN KEY (assigned_manager_user_id) REFERENCES users(id) ON DELETE SET NULL'
      );
      await addForeignKeyIfMissing(
        'client_interactions',
        'fk_client_interactions_client',
        'FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'industries',
        'fk_industries_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
    })();
  }

  return schemaReady;
};

module.exports = { ensureCrmSchema };
