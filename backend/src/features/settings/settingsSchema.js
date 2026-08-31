// backend/src/features/settings/settingsSchema.js
const { pool } = require('../../config/db');
const { addColumnIfMissing } = require('../../utils/schemaHelpers');

let schemaReady;

const ensureSettingsSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      // company_settings table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS company_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          setting_key VARCHAR(100) NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_company_setting (tenant_id, setting_key),
          INDEX idx_company_settings_tenant (tenant_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      // notifications table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          user_id INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          reference_id VARCHAR(100),
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_notifications_user (tenant_id, user_id, is_read),
          INDEX idx_notifications_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      // employee_documents table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS employee_documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          employee_id VARCHAR(50) NOT NULL,
          document_type VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          file_url VARCHAR(500),
          is_sent TINYINT(1) DEFAULT 0,
          metadata JSON,
          generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_emp_docs_employee (tenant_id, employee_id),
          INDEX idx_emp_docs_type (document_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      try {
        await pool.execute(`ALTER TABLE employee_documents MODIFY COLUMN document_type VARCHAR(100) NOT NULL`);
      } catch (e) {
        // Ignore if already VARCHAR(100)
      }

      // Probation columns on employee_details
      await addColumnIfMissing(
        'employee_details',
        'is_on_probation',
        'is_on_probation TINYINT(1) DEFAULT 0'
      );
      await addColumnIfMissing(
        'employee_details',
        'probation_end_date',
        'probation_end_date DATE NULL'
      );
      await addColumnIfMissing(
        'employee_details',
        'salary_after_probation',
        'salary_after_probation DECIMAL(15,2) NULL'
      );
      await addColumnIfMissing(
        'employee_details',
        'salary_during_probation',
        'salary_during_probation DECIMAL(15,2) NULL'
      );

    })();
  }
  return schemaReady;
};

module.exports = { ensureSettingsSchema };
