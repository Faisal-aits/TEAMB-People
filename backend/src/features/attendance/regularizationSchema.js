// backend/src/features/attendance/regularizationSchema.js
const { pool } = require('../../config/db');
const { addForeignKeyIfMissing } = require('../../utils/schemaHelpers');

let schemaReady;

const ensureRegularizationSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      // 1. Create attendance_regularization_settings table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS attendance_regularization_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL UNIQUE,
          monthly_limit INT NOT NULL DEFAULT 4,
          is_enabled TINYINT(1) NOT NULL DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_reg_settings_tenant
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);

      // 2. Create attendance_regularization_requests table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS attendance_regularization_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          employee_id VARCHAR(20) NOT NULL,
          attendance_id INT NULL,
          request_date DATE NOT NULL,
          requested_check_in DATETIME NULL,
          requested_check_out DATETIME NULL,
          requested_status VARCHAR(30) NULL,
          reason TEXT NOT NULL,
          status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
          admin_remarks TEXT NULL,
          reviewed_by INT NULL,
          reviewed_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_reg_tenant (tenant_id),
          INDEX idx_reg_employee (employee_id),
          INDEX idx_reg_status (status),
          INDEX idx_reg_date (request_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);

      // 3. Add FK for tenant and employee
      await addForeignKeyIfMissing(
        'attendance_regularization_requests',
        'fk_reg_requests_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
      await addForeignKeyIfMissing(
        'attendance_regularization_requests',
        'fk_reg_requests_employee',
        'FOREIGN KEY (employee_id) REFERENCES employee_details(id) ON DELETE CASCADE'
      );

      // 4. Migrate employee_id from INT to VARCHAR if we broke it earlier
      const [colInfo] = await pool.execute(
        `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'attendance_regularization_requests'
           AND COLUMN_NAME = 'employee_id'`
      );
      if (colInfo.length > 0 && colInfo[0].DATA_TYPE.toLowerCase() === 'int') {
        console.log('[schema] Reverting employee_id column from INT to VARCHAR...');
        
        try {
          await pool.execute('ALTER TABLE attendance_regularization_requests DROP FOREIGN KEY fk_reg_requests_employee');
        } catch (e) { }

        await pool.execute(
          `ALTER TABLE attendance_regularization_requests MODIFY COLUMN employee_id VARCHAR(20) NOT NULL`
        );
        
        await addForeignKeyIfMissing(
          'attendance_regularization_requests',
          'fk_reg_requests_employee',
          'FOREIGN KEY (employee_id) REFERENCES employee_details(id) ON DELETE CASCADE'
        );
        console.log('[schema] employee_id reversion complete');
      }

      console.log('[schema] Regularization schema ready');
    })();
  }

  return schemaReady;
};

module.exports = { ensureRegularizationSchema };
