const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Employee = require('./employeeModel');
const { parseEmployeeUploadFile } = require('./employeeBulkUploadParser');
const { pool } = require('../../config/db');
const { sendBulkEmployeeCredentials } = require('../../services/mailService');
const {
  validateEmployeeRows,
  normalizeEmail,
  normalizeEmployeeId
} = require('./employeeBulkUploadValidator');

const generateSecurePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*';
  const all = upper + lower + digits + symbols;
  const required = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    digits[crypto.randomInt(digits.length)],
    symbols[crypto.randomInt(symbols.length)]
  ];
  const rest = Array.from({ length: 12 }, () => all[crypto.randomInt(all.length)]);
  return [...required, ...rest]
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
};

const hashRows = async (rows) => Promise.all(rows.map(async (row) => {
  const temporaryPassword = generateSecurePassword();
  return {
    ...row,
    temporary_password: temporaryPassword,
    password_hash: await bcrypt.hash(temporaryPassword, 10)
  };
}));

const processEmployeeBulkUpload = async (tenantId, file, settings = {}) => {
  const parsedFile = await parseEmployeeUploadFile(file);
  if (parsedFile.errors.length > 0) {
    return {
      success: false,
      totalRows: parsedFile.rows.length,
      insertedRows: 0,
      failedRows: parsedFile.rows.length,
      errors: parsedFile.errors.map((message) => ({ row: null, message }))
    };
  }

  const departments = await Employee.getDepartments(tenantId);
  const uploadedEmails = parsedFile.rows
    .map((row) => normalizeEmail(row.data.email))
    .filter(Boolean);
  const uploadedEmployeeIds = parsedFile.rows
    .map((row) => normalizeEmployeeId(row.data.employee_id))
    .filter(Boolean);

  const [existingEmails, existingEmployeeIds] = await Promise.all([
    Employee.getExistingEmails(uploadedEmails),
    Employee.getExistingEmployeeIds(tenantId, uploadedEmployeeIds)
  ]);

  const { validRows, errors } = validateEmployeeRows(
    parsedFile.rows,
    departments,
    existingEmails,
    existingEmployeeIds,
    settings
  );

  let inserted = [];
  if (validRows.length > 0) {
    const rowsWithPasswords = await hashRows(validRows);
    inserted = await Employee.bulkCreate(tenantId, rowsWithPasswords);

    // Build a lowercase-keyed Map for safe lookup (bulkCreate may return original-case email)
    const passwordMap = new Map(
      rowsWithPasswords.map((row) => [row.email.toLowerCase(), row])
    );

    // Fire-and-forget background job for emails to prevent HTTP blocking
    const employeesForEmail = inserted.map(employee => {
      const sourceRow = passwordMap.get(employee.email.toLowerCase());
      return {
        rowNumber: employee.rowNumber,
        employeeName: `${sourceRow.first_name} ${sourceRow.last_name}`.trim(),
        email: employee.email,
        password: sourceRow.temporary_password
      };
    });

    setTimeout(async () => {
      try {
        console.log(`[Background Job] Starting bulk credentials email for ${employeesForEmail.length} employees...`);
        const emailResults = await sendBulkEmployeeCredentials(tenantId, employeesForEmail);
        const failed = emailResults.filter(r => !r.success);
        if (failed.length > 0) {
          console.warn(`[Background Job] ${failed.length} credential emails failed to send.`, failed);
        } else {
          console.log(`[Background Job] Successfully sent all ${employeesForEmail.length} credential emails.`);
        }
      } catch (bulkEmailErr) {
        console.error('[Background Job] Bulk email sending crashed entirely:', bulkEmailErr);
      }
    }, 0);
  }

  return {
    success: errors.length === 0,
    totalRows: parsedFile.rows.length,
    insertedRows: inserted.length,
    failedRows: errors.length,
    errors,
    inserted: inserted.map((employee) => ({
      row: employee.rowNumber,
      employee_id: employee.employee_id,
      email: employee.email
    })),
    message: `Processed ${parsedFile.rows.length} rows. ${inserted.length} inserted. Use the email button in the employee list to send login credentials.`
  };
};

module.exports = {
  processEmployeeBulkUpload
};
