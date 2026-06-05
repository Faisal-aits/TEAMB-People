const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Employee = require('./employeeModel');
const { parseEmployeeUploadFile } = require('./employeeBulkUploadParser');
const { sendEmployeeCredentials } = require('../../services/mailService');
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

const processEmployeeBulkUpload = async (tenantId, file) => {
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
    existingEmployeeIds
  );

  let inserted = [];
  if (validRows.length > 0) {
    const rowsWithPasswords = await hashRows(validRows);
    inserted = await Employee.bulkCreate(tenantId, rowsWithPasswords);
    const passwordByEmail = new Map(rowsWithPasswords.map((row) => [row.email, row.temporary_password]));

    try {
      for (const employee of inserted) {
        const sourceRow = rowsWithPasswords.find((row) => row.email === employee.email);
        await sendEmployeeCredentials(tenantId, {
          employeeName: `${sourceRow.first_name} ${sourceRow.last_name}`.trim(),
          email: employee.email,
          password: passwordByEmail.get(employee.email)
        });
      }
    } catch (emailError) {
      await Promise.allSettled(inserted.map((employee) => Employee.hardDelete(tenantId, employee.employee_id)));
      throw new Error('Bulk upload was rolled back because credential email could not be sent: ' + emailError.message);
    }
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
    message: `Processed ${parsedFile.rows.length} rows. ${inserted.length} inserted, ${errors.length} failed.`
  };
};

module.exports = {
  processEmployeeBulkUpload
};
