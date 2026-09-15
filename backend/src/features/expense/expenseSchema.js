const { pool } = require('../../config/db');
const { addForeignKeyIfMissing } = require('../../utils/schemaHelpers');

let schemaReady;

const ensureExpenseSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      // 1. Create expense_categories table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS expense_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          limit_amount DECIMAL(10,2) DEFAULT 0.00,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_expense_categories_tenant (tenant_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);

      // 2. Create expenses table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tenant_id INT NOT NULL,
          user_id INT NOT NULL,
          category_id INT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          description TEXT,
          image VARCHAR(255) NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          payment_status ENUM('pending', 'paid', 'rejected') DEFAULT 'pending',
          approved_by INT NULL,
          approved_at TIMESTAMP NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_expenses_tenant (tenant_id),
          KEY idx_expenses_user (user_id),
          KEY idx_expenses_category (category_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);

      // 3. Add foreign keys safely if missing
      await addForeignKeyIfMissing(
        'expense_categories',
        'fk_expense_categories_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );

      await addForeignKeyIfMissing(
        'expenses',
        'fk_expenses_tenant',
        'FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE'
      );
    })().catch((err) => {
      console.error('Failed to ensure expense schema:', err);
    });
  }

  return schemaReady;
};

module.exports = { ensureExpenseSchema };
