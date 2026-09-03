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

const MONTH_NAME_TO_NUMBER = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

const normalizeDate = (value) => {
  if (value === null || value === undefined) return '';

  // 1. Native Date Object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  let str = String(value).trim();
  if (!str || str === '-' || str === 'null' || str === 'undefined') return '';

  // 2. Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 3. YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. Day-Month-Year with Month Name (e.g. "23-May-2026", "23 May 2026", "01-Sep-2026")
  const namedMonthMatch = str.match(/^(\d{1,2})[-/\s]([A-Za-z]+)[-/\s](\d{2,4})$/);
  if (namedMonthMatch) {
    const d = namedMonthMatch[1].padStart(2, '0');
    const mon = namedMonthMatch[2].toLowerCase();
    let y = namedMonthMatch[3];
    if (y.length === 2) y = `20${y}`;
    const m = MONTH_NAME_TO_NUMBER[mon];
    if (m) return `${y}-${m}-${d}`;
  }

  // 5. Month-Day-Year with Month Name (e.g. "May 23, 2026", "Sep 1 2026")
  const monFirstMatch = str.match(/^([A-Za-z]+)[-/\s](\d{1,2})[,\s]+(\d{2,4})$/);
  if (monFirstMatch) {
    const mon = monFirstMatch[1].toLowerCase();
    const d = monFirstMatch[2].padStart(2, '0');
    let y = monFirstMatch[3];
    if (y.length === 2) y = `20${y}`;
    const m = MONTH_NAME_TO_NUMBER[mon];
    if (m) return `${y}-${m}-${d}`;
  }

  // 6. Day-Month-Year Numeric: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, D-M-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    let dayNum = parseInt(dmyMatch[1], 10);
    let monthNum = parseInt(dmyMatch[2], 10);
    let y = dmyMatch[3];
    if (y.length === 2) y = `20${y}`;

    // If monthNum > 12 and dayNum <= 12, the input was MM-DD-YYYY
    if (monthNum > 12 && dayNum <= 12) {
      const temp = dayNum;
      dayNum = monthNum;
      monthNum = temp;
    }

    const d = String(dayNum).padStart(2, '0');
    const m = String(monthNum).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 7. Excel Serial Number (e.g. 45234 or "45234.00")
  if (/^\d{4,5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (num > 1000 && num < 90000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  // 8. General Date parsing fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str;
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

const validateEmployeeRows = (rows, departments, existingEmails, existingEmployeeIds, settings = {}) => {
  const salaryFormat = settings.salary_format || 'Monthly';
  const enableProbationValue = settings.enable_probation !== undefined ? settings.enable_probation : true;
  const enableProbationStr = String(enableProbationValue).toLowerCase();
  const enableProbation = enableProbationStr === 'true' || enableProbationStr === '1';
  const settingsProbationMonths = parseInt(settings.probation_months !== undefined ? settings.probation_months : '4', 10) || 0;
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

    normalized.joining_date = normalizeDate(data.joining_date);
    if (!isValidDate(normalized.joining_date)) {
      rowErrors.push('joining_date must use YYYY-MM-DD format');
    }

    normalized.last_working_date = normalizeDate(data.last_working_date);
    if (!isValidDate(normalized.last_working_date)) {
      rowErrors.push('last_working_date must use YYYY-MM-DD format');
    }

    normalized.date_of_birth = normalizeDate(data.date_of_birth);
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
    if (uploadedDepartmentId && uploadedDepartmentId !== '-') {
      departmentId = departmentById.get(uploadedDepartmentId) || null;
    } else if (uploadedDepartment && uploadedDepartment !== '-') {
      departmentId = departmentByName.get(uploadedDepartment.toLowerCase()) || null;
    }

    if (!departmentId && (uploadedDepartment.toLowerCase() === 'beam' || uploadedDepartment.toLowerCase() === 'bim' || !uploadedDepartment || uploadedDepartment === '-')) {
      const defaultDept = departments.find(d => ['bim', 'beam'].includes(String(d.name || '').toLowerCase())) || departments[0];
      if (defaultDept) {
        departmentId = defaultDept.id;
      }
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
      is_on_probation: false,
      probation_end_date: null,
      salary_during_probation: null,
      salary_after_probation: null,
      sourceRow: data,
      rowNumber
    };

    const probationMonthsInput = String(data.probation_months || '').trim();
    let finalProbationMonths = 0;

    if (probationMonthsInput) {
      const months = parseInt(probationMonthsInput, 10);
      if (Number.isNaN(months) || months < 0) {
        rowErrors.push('Probation Period (Months) must be a positive number');
      } else {
        finalProbationMonths = months;
      }
    } else if (enableProbation && salaryFormat === 'Monthly') {
      finalProbationMonths = settingsProbationMonths;
    }

    if (finalProbationMonths > 0) {
      cleanRow.is_on_probation = true;

      if (cleanRow.joining_date) {
        const joiningDateObj = new Date(cleanRow.joining_date);
        joiningDateObj.setMonth(joiningDateObj.getMonth() + finalProbationMonths);
        cleanRow.probation_end_date = joiningDateObj.toISOString().slice(0, 10);
      }
    }

    if (enableProbation && salaryFormat === 'Monthly') {
      const rawSalDuring = String(data.salary_during_probation || '').trim();
      const rawSalAfter = String(data.salary_after_probation || '').trim();

      if (!rawSalDuring) {
        rowErrors.push('Salary During Probation is required when probation is enabled and salary format is Monthly');
      }
      if (!rawSalAfter) {
        rowErrors.push('Salary After Probation is required when probation is enabled and salary format is Monthly');
      }

      const salDuring = parseMoney(rawSalDuring);
      const salAfter = parseMoney(rawSalAfter);

      if (rawSalDuring && salDuring < 0) rowErrors.push('Salary During Probation must be a positive number');
      if (rawSalAfter && salAfter < 0) rowErrors.push('Salary After Probation must be a positive number');

      cleanRow.salary_during_probation = salDuring;
      cleanRow.salary_after_probation = salAfter;
    } else if (probationMonthsInput && parseInt(probationMonthsInput, 10) > 0) {
      // If probation is not globally enabled/monthly, but user provided probation months manually
      const salDuring = parseMoney(String(data.salary_during_probation || '').trim());
      const salAfter = parseMoney(String(data.salary_after_probation || '').trim());
      
      if (salDuring < 0) rowErrors.push('Salary During Probation must be a positive number');
      if (salAfter < 0) rowErrors.push('Salary After Probation must be a positive number');
      
      cleanRow.salary_during_probation = salDuring;
      cleanRow.salary_after_probation = salAfter;
    }

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
