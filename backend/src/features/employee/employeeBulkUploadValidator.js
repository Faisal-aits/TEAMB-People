const { REQUIRED_BULK_UPLOAD_COLUMNS } = require('./employeeBulkUploadConfig');
const { calculatePayroll, parseMoney } = require('./employeePayroll');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-()\s]{7,20}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const aadharRegex = /^\d{12}$/;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeEmployeeId = (employeeId) => String(employeeId || '').trim().toUpperCase();
const splitFullName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: '', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '-' };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ')
  };
};

const isValidDate = (value) => {
  if (!value) return true;
  if (!dateRegex.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const parseBoolean = (value) => {
  if (value === '' || value === null || value === undefined) return true;
  const normalized = String(value).trim().toLowerCase();
  if (['active', 'true', 'yes', '1'].includes(normalized)) return true;
  if (['inactive', 'false', 'no', '0'].includes(normalized)) return false;
  return null;
};

const validateEmployeeRows = (rows, departments, existingEmails, existingEmployeeIds) => {
  const errors = [];
  const validRows = [];
  const fileEmails = new Set();
  const fileEmployeeIds = new Set();
  const departmentById = new Map(departments.map((department) => [String(department.id), department.id]));
  const departmentByName = new Map(departments.map((department) => [
    String(department.name || '').trim().toLowerCase(),
    department.id
  ]));

  rows.forEach(({ rowNumber, data }) => {
    const rowErrors = [];
    const normalized = {};

    REQUIRED_BULK_UPLOAD_COLUMNS.forEach((field) => {
      if (!String(data[field] || '').trim()) {
        rowErrors.push(`${field} is required`);
      }
    });

    const nameParts = splitFullName(data.full_name);
    normalized.first_name = String(data.first_name || nameParts.first_name).trim();
    normalized.last_name = String(data.last_name || nameParts.last_name).trim();
    normalized.email = normalizeEmail(data.email);

    if (normalized.email && !emailRegex.test(normalized.email)) {
      rowErrors.push('Invalid email');
    }

    if (normalized.email && fileEmails.has(normalized.email)) {
      rowErrors.push('Duplicate email in uploaded file');
    }

    if (normalized.email && existingEmails.has(normalized.email)) {
      rowErrors.push('Email already exists');
    }

    if (normalized.email) fileEmails.add(normalized.email);

    normalized.employee_id = normalizeEmployeeId(data.employee_id);
    if (normalized.employee_id && normalized.employee_id.length > 20) {
      rowErrors.push('employee_id must be 20 characters or less');
    }

    if (normalized.employee_id && fileEmployeeIds.has(normalized.employee_id)) {
      rowErrors.push('Duplicate employee_id in uploaded file');
    }

    if (normalized.employee_id && existingEmployeeIds.has(normalized.employee_id)) {
      rowErrors.push('Employee ID already exists');
    }

    if (normalized.employee_id) fileEmployeeIds.add(normalized.employee_id);

    normalized.phone = String(data.phone || '').trim();
    if (normalized.phone && !phoneRegex.test(normalized.phone)) {
      rowErrors.push('Invalid phone number');
    }

    normalized.emergency_contact = String(data.emergency_contact || '').trim();
    if (normalized.emergency_contact && !phoneRegex.test(normalized.emergency_contact)) {
      rowErrors.push('Invalid emergency contact number');
    }

    const numericFields = [
      ['salary', 'CTC'],
      ['salary_basic', 'Basic'],
      ['salary_hra', 'HRA'],
      ['salary_medical_allowance', 'Medical Allowance'],
      ['salary_travel_allowance', 'Travel Allowance'],
      ['salary_other_allowance', 'Other']
    ];

    numericFields.forEach(([field, label]) => {
      const rawValue = String(data[field] || '').trim();
      if (!rawValue) {
        normalized[field] = 0;
        return;
      }

      const value = parseMoney(rawValue);
      if (rawValue && (!Number.isFinite(Number(rawValue.replace(/,/g, ''))) || value < 0)) {
        rowErrors.push(`${label} must be a valid positive number`);
      }
      normalized[field] = value;
    });

    normalized.joining_date = String(data.joining_date || '').trim();
    if (!isValidDate(normalized.joining_date)) {
      rowErrors.push('joining_date must use YYYY-MM-DD format');
    }

    normalized.last_working_date = String(data.last_working_date || '').trim();
    if (!isValidDate(normalized.last_working_date)) {
      rowErrors.push('last_working_date must use YYYY-MM-DD format');
    }

    normalized.date_of_birth = String(data.date_of_birth || '').trim();
    if (!isValidDate(normalized.date_of_birth)) {
      rowErrors.push('date_of_birth must use YYYY-MM-DD format');
    }

    normalized.ifsc_code = String(data.ifsc_code || '').trim().toUpperCase();
    if (normalized.ifsc_code && !ifscRegex.test(normalized.ifsc_code)) {
      rowErrors.push('Invalid IFSC code');
    }

    normalized.pan_number = String(data.pan_number || '').trim().toUpperCase();
    if (normalized.pan_number && !panRegex.test(normalized.pan_number)) {
      rowErrors.push('Invalid PAN number');
    }

    normalized.aadhar_number = String(data.aadhar_number || '').replace(/\s/g, '');
    if (normalized.aadhar_number && !aadharRegex.test(normalized.aadhar_number)) {
      rowErrors.push('Aadhar number must be 12 digits');
    }

    let departmentId = null;
    const uploadedDepartmentId = String(data.department_id || '').trim();
    const uploadedDepartment = String(data.department || '').trim();
    if (uploadedDepartmentId) {
      departmentId = departmentById.get(uploadedDepartmentId) || null;
    } else if (uploadedDepartment) {
      departmentId = departmentByName.get(uploadedDepartment.toLowerCase()) || null;
    }

    if (!departmentId) {
      rowErrors.push('Department was not found. Please create it first or use a valid Department ID');
    }

    normalized.employment_type = String(data.employment_type || '').trim();

    const parsedIsActive = parseBoolean(data.is_active);
    if (parsedIsActive === null) {
      rowErrors.push('is_active/status must be active, inactive, true, false, yes, no, 1, or 0');
    }

    const cleanRow = {
      ...normalized,
      phone: normalized.phone || null,
      emergency_contact: normalized.emergency_contact || null,
      department_id: departmentId,
      position: String(data.position || '').trim() || null,
      employment_type: normalized.employment_type || null,
      salary_basic: normalized.salary_basic,
      salary_hra: normalized.salary_hra,
      salary_medical_allowance: normalized.salary_medical_allowance,
      salary_travel_allowance: normalized.salary_travel_allowance,
      salary_other_allowance: normalized.salary_other_allowance,
      ...calculatePayroll(normalized),
      joining_date: normalized.joining_date || null,
      last_working_date: normalized.last_working_date || null,
      date_of_birth: normalized.date_of_birth || null,
      address: String(data.address || '').trim() || null,
      bank_account_number: String(data.bank_account_number || '').trim() || null,
      ifsc_code: normalized.ifsc_code || null,
      pan_number: normalized.pan_number || null,
      aadhar_number: normalized.aadhar_number || null,
      employee_id: normalized.employee_id || null,
      is_active: parsedIsActive === null ? true : parsedIsActive,
      status: parsedIsActive === false ? 'inactive' : 'active',
      sourceRow: data,
      rowNumber
    };

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        message: rowErrors.join('; '),
        data
      });
    } else {
      validRows.push(cleanRow);
    }
  });

  return { validRows, errors };
};

module.exports = {
  validateEmployeeRows,
  normalizeEmail,
  normalizeEmployeeId
};
