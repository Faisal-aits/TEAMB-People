const { pool } = require('../../config/db');
const { ensureProjectSchema } = require('../projects/projectSchema');
const {
  addColumnIfMissing,
  addForeignKeyIfMissing,
  addIndexIfMissing,
} = require('../../utils/schemaHelpers');

let schemaReady;

const ensureTicketSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      // First ensure the projects schema is configured
      await ensureProjectSchema();

      // Create tickets table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          project_id INT NULL,
          raised_by_user_id INT NOT NULL,
          title VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
          status VARCHAR(50) NOT NULL DEFAULT 'Open',
          assigned_to_user_id INT NULL,
          attachment_url VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await addColumnIfMissing('tickets', 'attachment_url', '`attachment_url` VARCHAR(255) NULL');

      // Create ticket_comments table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS ticket_comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          ticket_id INT NOT NULL,
          user_id INT NOT NULL,
          comment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add indexes
      await addIndexIfMissing('tickets', 'idx_tickets_tenant', 'INDEX idx_tickets_tenant (tenant_id)');
      await addIndexIfMissing('tickets', 'idx_tickets_project', 'INDEX idx_tickets_project (project_id)');
      await addIndexIfMissing('tickets', 'idx_tickets_raised_by', 'INDEX idx_tickets_raised_by (raised_by_user_id)');
      await addIndexIfMissing('tickets', 'idx_tickets_assigned_to', 'INDEX idx_tickets_assigned_to (assigned_to_user_id)');
      await addIndexIfMissing('ticket_comments', 'idx_comments_tenant', 'INDEX idx_comments_tenant (tenant_id)');
      await addIndexIfMissing('ticket_comments', 'idx_comments_ticket', 'INDEX idx_comments_ticket (ticket_id)');

      // Add foreign keys
      await addForeignKeyIfMissing(
        'tickets',
        'fk_tickets_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'tickets',
        'fk_tickets_project',
        'FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL'
      );
      await addForeignKeyIfMissing(
        'tickets',
        'fk_tickets_raised_by',
        'FOREIGN KEY (raised_by_user_id) REFERENCES users(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'tickets',
        'fk_tickets_assigned_to',
        'FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL'
      );

      await addForeignKeyIfMissing(
        'ticket_comments',
        'fk_comments_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'ticket_comments',
        'fk_comments_ticket',
        'FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'ticket_comments',
        'fk_comments_user',
        'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
      );
    })();
  }
  return schemaReady;
};

module.exports = { ensureTicketSchema };
