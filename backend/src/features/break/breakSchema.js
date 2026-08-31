const { pool } = require('../../config/db');

let schemaReady;

const ensureBreakSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        const createBreaksTable = `
          CREATE TABLE IF NOT EXISTS tb_breaks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            employee_id VARCHAR(50) NOT NULL,
            break_date DATE NOT NULL,
            break_in_time DATETIME NOT NULL,
            break_out_time DATETIME NULL,
            duration_minutes INT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant_employee_date (tenant_id, employee_id, break_date)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        
        await pool.query(createBreaksTable);
        console.log('tb_breaks table ensured.');
      } catch (error) {
        console.error('Error ensuring break schema:', error);
        throw error;
      }
    })();
  }
  return schemaReady;
};

module.exports = { ensureBreakSchema };
