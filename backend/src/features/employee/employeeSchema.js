const { pool } = require('../../config/db');

let schemaReady;

const ignoreDuplicateColumn = (error) => {
  if (error.code !== 'ER_DUP_FIELDNAME') throw error;
};

const addColumnIfMissing = async (table, definition) => {
  try {
    await pool.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (error) {
    ignoreDuplicateColumn(error);
  }
};

const ensureEmployeeSchema = () => {
  if (!schemaReady) {
    schemaReady = (async () => {
      await addColumnIfMissing('employee_details', "employment_type VARCHAR(50) NULL");
      await addColumnIfMissing('employee_details', "last_working_date DATE NULL");
      await addColumnIfMissing('employee_details', "salary_basic DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_hra DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_medical_allowance DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_travel_allowance DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_other_allowance DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_gross DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_pf DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_esic DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_professional_tax DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_lwf DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_total_deduction DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "salary_net DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "employer_pf DECIMAL(12,2) NOT NULL DEFAULT 0");
      await addColumnIfMissing('employee_details', "employer_esic DECIMAL(12,2) NOT NULL DEFAULT 0");
    })();
  }

  return schemaReady;
};

module.exports = { ensureEmployeeSchema };
