import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { employeeAPI } from '../../services/employeeAPI';
import './BulkUploadModal.css';
import {
  BULK_UPLOAD_COLUMNS,
  BULK_UPLOAD_SAMPLE_ROW,
  MAX_BULK_UPLOAD_FILE_SIZE,
  MAX_BULK_UPLOAD_ROWS,
  REQUIRED_BULK_UPLOAD_COLUMNS
} from './bulkUploadConfig';

const allowedExtensions = {
  csv: ['.csv'],
  xlsx: ['.xlsx']
};

const normalizeHeader = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[\s-]+/g, '_');

const aliasToColumn = BULK_UPLOAD_COLUMNS.reduce((map, column) => {
  map.set(normalizeHeader(column.key), column.key);
  map.set(normalizeHeader(column.label), column.key);
  column.aliases.forEach((alias) => map.set(normalizeHeader(alias), column.key));
  return map;
}, new Map());

const canonicalizeHeader = (header) => aliasToColumn.get(normalizeHeader(header)) || null;

const sanitizeCell = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).trim();
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

const parseCsvText = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((cells) => cells.some((value) => String(value || '').trim() !== ''));
};

const validateHeaders = (headers) => {
  const errors = [];
  const seen = new Set();

  headers.forEach((header) => {
    if (!String(header || '').trim()) return;
    const canonical = canonicalizeHeader(header);
    if (!canonical) {
      errors.push(`Invalid column "${header}"`);
      return;
    }
    if (seen.has(canonical)) {
      errors.push(`Duplicate column "${header}"`);
      return;
    }
    seen.add(canonical);
  });

  REQUIRED_BULK_UPLOAD_COLUMNS.forEach((requiredColumn) => {
    if (!seen.has(requiredColumn)) errors.push(`Missing required column "${requiredColumn}"`);
  });

  return errors;
};

const rowsFromGrid = (gridRows) => {
  const headerIndex = gridRows.findIndex((row) => row.some((cell) => String(cell || '').trim() !== ''));
  if (headerIndex === -1) {
    return { headers: [], rows: [], errors: ['Uploaded file is empty'] };
  }

  const headers = gridRows[headerIndex].map(sanitizeCell);
  const headerErrors = validateHeaders(headers);
  if (headerErrors.length > 0) return { headers, rows: [], errors: headerErrors };

  const rows = gridRows.slice(headerIndex + 1)
    .map((cells, index) => {
      const data = {};
      headers.forEach((header, headerCellIndex) => {
        const canonical = canonicalizeHeader(header);
        if (!canonical) return;
        data[canonical] = sanitizeCell(cells[headerCellIndex]);
      });

      // Default department to BIM (or BEAM) if missing, empty or '-'
      const dept = String(data.department || '').trim().toLowerCase();
      if (!dept || dept === '-' || dept === 'beam' || dept === 'bim') {
        data.department = 'BIM';
      }

      // Automatically normalize date formats to YYYY-MM-DD
      if (data.joining_date) data.joining_date = normalizeDate(data.joining_date);
      if (data.last_working_date) data.last_working_date = normalizeDate(data.last_working_date);
      if (data.date_of_birth) data.date_of_birth = normalizeDate(data.date_of_birth);

      return { rowNumber: headerIndex + index + 2, data };
    })
    .filter((row) => Object.values(row.data).some((value) => String(value || '').trim() !== ''));

  return { headers, rows, errors: [] };
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-()\s]{7,20}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const validatePreviewRows = (rows) => {
  const seenEmails = new Set();
  const seenEmployeeIds = new Set();
  const errors = [];

  rows.forEach(({ rowNumber, data }) => {
    const rowErrors = [];

    REQUIRED_BULK_UPLOAD_COLUMNS.forEach((field) => {
      if (!String(data[field] || '').trim()) rowErrors.push(`${field} is required`);
    });

    const email = String(data.email || '').trim().toLowerCase();
    if (email && !emailRegex.test(email)) rowErrors.push('Invalid email');
    if (email && seenEmails.has(email)) rowErrors.push('Duplicate email in file');
    if (email) seenEmails.add(email);

    const employeeId = String(data.employee_id || '').trim().toUpperCase();
    if (employeeId && employeeId.length > 20) rowErrors.push('employee_id must be 20 characters or less');
    if (employeeId && seenEmployeeIds.has(employeeId)) rowErrors.push('Duplicate employee_id in file');
    if (employeeId) seenEmployeeIds.add(employeeId);

    const phone = String(data.phone || '').trim();
    if (phone && !phoneRegex.test(phone)) rowErrors.push('Invalid phone number');

    const emergencyContact = String(data.emergency_contact || '').trim();
    if (emergencyContact && !phoneRegex.test(emergencyContact)) rowErrors.push('Invalid emergency contact');

    [
      ['salary', 'CTC'],
      ['salary_basic', 'Basic'],
      ['salary_hra', 'HRA'],
      ['salary_medical_allowance', 'Medical Allowance'],
      ['salary_travel_allowance', 'Travel Allowance'],
      ['salary_other_allowance', 'Other']
    ].forEach(([field, label]) => {
      const value = String(data[field] || '').replace(/,/g, '').trim();
      if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        rowErrors.push(`${label} must be a valid positive number`);
      }
    });

    if (!data.department || data.department === '-' || ['beam', 'bim'].includes(String(data.department).trim().toLowerCase())) {
      data.department = 'BIM';
    }

    ['joining_date', 'last_working_date', 'date_of_birth'].forEach((field) => {
      if (data[field]) {
        data[field] = normalizeDate(data[field]);
      }
      const value = String(data[field] || '').trim();
      if (value && !dateRegex.test(value)) rowErrors.push(`${field} must use YYYY-MM-DD`);
    });

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; '), data });
    }
  });

  return errors;
};

const buildCsv = (errors) => {
  const headers = ['row', 'message', ...BULK_UPLOAD_COLUMNS.map((column) => column.key)];
  const escapeCell = (value) => {
    const safeValue = String(value ?? '');
    return /[",\n\r]/.test(safeValue) ? `"${safeValue.replace(/"/g, '""')}"` : safeValue;
  };
  const rows = errors.map((error) => [
    error.row || '',
    error.message || '',
    ...BULK_UPLOAD_COLUMNS.map((column) => error.data?.[column.key] || '')
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
};

const BulkUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const fileInputRef = useRef(null);
  const [activeType, setActiveType] = useState('csv');
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [toast, setToast] = useState(null);

  const invalidRows = useMemo(
    () => new Set(validationErrors.map((error) => error.row)),
    [validationErrors]
  );

  if (!isOpen) return null;

  const resetFileState = () => {
    setFile(null);
    setParsedRows([]);
    setHeaders([]);
    setValidationErrors([]);
    setFileErrors([]);
    setUploadProgress(0);
    setUploadResult(null);
    setToast(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeModal = () => {
    resetFileState();
    setShowInfo(false);
    onClose();
  };

  const parseFile = async (selectedFile) => {
    const extension = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    const errors = [];

    if (!allowedExtensions[activeType].includes(extension)) {
      errors.push(`Please select a ${activeType.toUpperCase()} file for the active upload type`);
    }

    if (selectedFile.size > MAX_BULK_UPLOAD_FILE_SIZE) {
      errors.push(`File size must be ${Math.floor(MAX_BULK_UPLOAD_FILE_SIZE / 1024 / 1024)}MB or less`);
    }

    if (selectedFile.size === 0) {
      errors.push('Please upload a non-empty file');
    }

    if (errors.length > 0) {
      setFileErrors(errors);
      setFile(selectedFile);
      setParsedRows([]);
      setValidationErrors([]);
      return;
    }

    let parsed;
    if (extension === '.csv') {
      const text = (await selectedFile.text()).replace(/^\uFEFF/, '');
      parsed = rowsFromGrid(parseCsvText(text));
    } else {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = sheetName ? workbook.Sheets[sheetName] : null;
      const grid = worksheet
        ? XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '', dateNF: 'yyyy-mm-dd' })
        : [];
      parsed = rowsFromGrid(grid);
    }

    if (parsed.rows.length > MAX_BULK_UPLOAD_ROWS) {
      parsed.errors.push(`Maximum ${MAX_BULK_UPLOAD_ROWS} rows are allowed`);
    }

    if (parsed.rows.length === 0 && parsed.errors.length === 0) {
      parsed.errors.push('Uploaded file does not contain employee rows');
    }

    setFile(selectedFile);
    setHeaders(parsed.headers);
    setParsedRows(parsed.rows);
    setFileErrors(parsed.errors);
    setValidationErrors(parsed.errors.length > 0 ? [] : validatePreviewRows(parsed.rows));
    setUploadProgress(0);
    setUploadResult(null);
    setToast(null);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 6000);
  };

  const getUploadFailureMessage = (error) => {
    const data = error.response?.data;
    const firstError = data?.errors?.[0]?.message;
    return data?.message || firstError || error.message || 'Upload failed. Please try again.';
  };

  const downloadDemoExcel = () => {
    const headerRow = BULK_UPLOAD_COLUMNS.map((column) => column.label);
    const sampleRow = BULK_UPLOAD_COLUMNS.map((column) => BULK_UPLOAD_SAMPLE_ROW[column.key] ?? '');
    const instructionRows = [
      ['Use the Employees sheet for upload data.'],
      ['Required columns: Emp Id, First Name, Last Name, Email, Designation, Employment Type, Joining Date.'],
      ['Department defaults to BIM (or BEAM) if left blank.'],
      ['Dates can use YYYY-MM-DD (e.g. 2026-05-23), DD-MM-YYYY, or standard Excel date format.'],
      ['Salary During Probation = employee basic (in-hand) salary during probation.'],
      ['Salary After Probation = employee basic (in-hand) salary after probation.'],
      ['All salary allowances (HRA, Medical, Travel, Other) and Probation Months are optional.'],
      ['Complete SMTP configuration before uploading because credentials are emailed to employees.']
    ];

    const workbook = XLSX.utils.book_new();
    const employeeSheet = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
    employeeSheet['!cols'] = BULK_UPLOAD_COLUMNS.map((column) => ({
      wch: Math.max(column.label.length + 4, 16)
    }));

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionRows);
    instructionsSheet['!cols'] = [{ wch: 96 }];

    XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employees');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
    XLSX.writeFile(workbook, 'employee-bulk-upload-demo.xlsx');
  };

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) await parseFile(selectedFile);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const selectedFile = event.dataTransfer.files?.[0];
    if (selectedFile) await parseFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || fileErrors.length > 0) return;

    try {
      setUploading(true);
      setUploadProgress(10);
      const response = await employeeAPI.bulkUploadFile(file, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });

      setUploadProgress(100);
      setUploadResult(response.data);
      if (response.data?.failedRows > 0 || response.data?.errors?.length > 0) {
        const errorMessages = Array.from(new Set(response.data.errors.map(e => e.message)));
        const duplicateErrors = errorMessages.filter(msg => msg.includes('already exists'));
        
        if (duplicateErrors.length > 0) {
          alert(`Failed to add some employees: ${duplicateErrors.join(' and ')}`);
        }
        
        showToast('warning', response.data.message || 'Upload completed with some failed rows. Check the details below.');
      } else {
        showToast('success', response.data?.message || 'Employees uploaded successfully.');
      }
      await onUploadComplete?.();
    } catch (error) {
      const data = error.response?.data;
      const failureMessage = getUploadFailureMessage(error);
      const errorMessages = Array.from(new Set(data?.errors?.map(e => e.message) || []));
      const duplicateErrors = errorMessages.filter(msg => msg.includes('already exists'));
      
      if (duplicateErrors.length > 0) {
        alert(`Failed to upload: ${duplicateErrors.join(' and ')}`);
      } else if (data?.message && data.message.includes('already exists')) {
        alert(`Failed to upload: ${data.message}`);
      }

      setUploadResult(data || {
        success: false,
        totalRows: parsedRows.length,
        insertedRows: 0,
        failedRows: parsedRows.length,
        message: failureMessage,
        errors: [{ row: null, message: failureMessage }]
      });
      showToast('error', failureMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadFailedRowsReport = () => {
    const errors = uploadResult?.errors?.length ? uploadResult.errors : validationErrors;
    if (!errors.length) return;

    const blob = new Blob([buildCsv(errors)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee-bulk-upload-failed-rows.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const previewColumns = BULK_UPLOAD_COLUMNS
    .filter((column) => headers.some((header) => canonicalizeHeader(header) === column.key))
    .slice(0, 8);
  const canUpload = file && fileErrors.length === 0 && parsedRows.length > 0 && !uploading;
  const resultErrors = uploadResult?.errors || [];
  const uploadFailed = uploadResult && (
    uploadResult.success === false ||
    Number(uploadResult.failedRows || 0) > 0 ||
    resultErrors.length > 0
  );
  const uploadTitle = uploadResult
    ? uploadResult.insertedRows > 0 && uploadFailed
      ? 'Upload completed with issues'
      : uploadFailed
        ? 'Upload failed'
        : 'Upload successful'
    : '';

  return (
    <div className="modal-overlay">
      <div className="modal-content1 bulk-upload-modal">
        {toast && (
          <div className={`bulk-toast bulk-toast-${toast.type}`}>
            <i className={toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}></i>
            <span>{toast.message}</span>
          </div>
        )}
        <div className="modal-header bulk-upload-header">
          <div>
            <h2><i className="fas fa-cloud-upload-alt"></i> Bulk Upload Employees</h2>
            <p>Upload CSV or XLSX files, preview rows, and insert valid employee records.</p>
          </div>
          <button className="close-btn" onClick={closeModal} type="button">x</button>
        </div>

        <div className="bulk-upload-body">
          <div className="bulk-upload-toolbar">
            <div className="bulk-upload-tabs" role="tablist" aria-label="Upload file type">
              <button
                type="button"
                className={activeType === 'csv' ? 'active' : ''}
                onClick={() => {
                  setActiveType('csv');
                  resetFileState();
                }}
              >
                <i className="fas fa-file-csv"></i> CSV
              </button>
              <button
                type="button"
                className={activeType === 'xlsx' ? 'active' : ''}
                onClick={() => {
                  setActiveType('xlsx');
                  resetFileState();
                }}
              >
                <i className="fas fa-file-excel"></i> XLSX
              </button>
            </div>

            <div className="bulk-upload-actions">
              <button type="button" className="bulk-info-btn" onClick={() => setShowInfo(true)}>
                <i className="fas fa-info-circle"></i> Info
              </button>
              <button type="button" className="bulk-info-btn bulk-template-btn" onClick={downloadDemoExcel}>
                <i className="fas fa-download"></i> Demo Excel
              </button>
            </div>
          </div>

          <div
            className={`bulk-dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <i className="fas fa-file-upload"></i>
            <h3>{file ? file.name : `Drop your ${activeType.toUpperCase()} file here`}</h3>
            <p>Maximum {Math.floor(MAX_BULK_UPLOAD_FILE_SIZE / 1024 / 1024)}MB and {MAX_BULK_UPLOAD_ROWS} rows</p>
            <input
              ref={fileInputRef}
              id="bulk-upload-input"
              type="file"
              accept={activeType === 'csv' ? '.csv,text/csv' : '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
              onChange={handleFileSelect}
              hidden
            />
            <button type="button" className="submit-btn" onClick={() => fileInputRef.current?.click()}>
              <i className="fas fa-folder-open"></i> Browse File
            </button>
          </div>

          {fileErrors.length > 0 && (
            <div className="bulk-alert bulk-alert-error">
              {fileErrors.map((error) => <div key={error}>{error}</div>)}
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="bulk-preview-panel">
              <div className="bulk-preview-summary">
                <span><strong>{parsedRows.length}</strong> total rows</span>
                <span><strong>{validationErrors.length}</strong> rows need attention</span>
                <span><strong>{Math.max(parsedRows.length - validationErrors.length, 0)}</strong> rows ready</span>
              </div>

              <div className="bulk-preview-table-wrap">
                <table className="bulk-preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      {previewColumns.map((column) => <th key={column.key}>{column.label}</th>)}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 10).map((row) => {
                      const rowErrors = validationErrors.filter((error) => error.row === row.rowNumber);
                      return (
                        <tr key={row.rowNumber} className={invalidRows.has(row.rowNumber) ? 'invalid-row' : ''}>
                          <td>{row.rowNumber}</td>
                          {previewColumns.map((column) => (
                            <td key={column.key}>{row.data[column.key] || '-'}</td>
                          ))}
                          <td>{rowErrors.length ? rowErrors.map((error) => error.message).join('; ') : 'Ready'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploading && (
            <div className="bulk-progress">
              <div className="bulk-progress-bar" style={{ width: `${uploadProgress}%` }} />
              <span>{uploadProgress}%</span>
            </div>
          )}

          {uploadResult && (
            <div className={`bulk-result ${uploadFailed ? 'has-failures' : 'success'}`}>
              <h4>{uploadTitle}</h4>
              <div className="bulk-result-grid">
                <span>Total: {uploadResult.totalRows}</span>
                <span>Inserted: {uploadResult.insertedRows}</span>
                <span>Failed: {uploadResult.failedRows}</span>
              </div>
              {resultErrors.length > 0 && (
                <div className="bulk-error-list">
                  {resultErrors.slice(0, 8).map((error, index) => (
                    <div key={`${error.row || 'file'}-${index}`}>
                      Row {error.row || '-'}: {error.message}
                    </div>
                  ))}
                </div>
              )}
              {resultErrors.length > 0 && (
                <button type="button" className="cancel-btn" onClick={downloadFailedRowsReport}>
                  <i className="fas fa-download"></i> Download Failed Rows
                </button>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer bulk-upload-footer">
          <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
          {(validationErrors.length > 0 || resultErrors.length > 0) && (
            <button type="button" className="cancel-btn" onClick={downloadFailedRowsReport}>
              <i className="fas fa-download"></i> Failed Rows Report
            </button>
          )}
          <button type="button" className="submit-btn" disabled={!canUpload} onClick={handleUpload}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="modal-overlay nested-modal">
          <div className="modal-content1 bulk-info-modal">
            <div className="modal-header">
              <h2><i className="fas fa-info-circle"></i> Upload Requirements</h2>
              <button className="close-btn" type="button" onClick={() => setShowInfo(false)}>x</button>
            </div>
            <div className="bulk-info-content">
              <section>
                <h3>Required Columns</h3>
                <ul>
                  {BULK_UPLOAD_COLUMNS.filter((column) => column.required).map((column) => (
                    <li key={column.key}>{column.key}</li>
                  ))}
                </ul>
              </section>
              <section>
                <div>
                    <h3>Accepted Formats</h3>
                    <p>.csv and .xlsx files up to {Math.floor(MAX_BULK_UPLOAD_FILE_SIZE / 1024 / 1024)}MB.</p>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <h3>Limits</h3>
                  <p>Maximum Rows: {MAX_BULK_UPLOAD_ROWS}</p>
                </div>
              </section>

              <section>
                <h3>Validation Rules</h3>
                <ul>
                  <li>Email must be valid and unique.</li>
                  <li>Employee ID, first name, last name, email, department, designation, employment type, joining date, salary during probation, and salary after probation are required.</li>
                  <li>Phone fields accept digits, spaces, +, -, and parentheses.</li>
                  <li>Dates must use YYYY-MM-DD format (e.g. 2026-05-23).</li>
                  <li>Department must already exist in the system or use a valid Department ID.</li>
                  <li><strong>Salary During Probation</strong> — employee basic (in-hand) salary during probation.</li>
                  <li><strong>Salary After Probation</strong> — employee basic (in-hand) salary after probation.</li>
                  <li>All allowances (HRA, Medical, Travel, Other), probation months, and CTC are optional.</li>
                  <li>Gross, PF, ESIC, P.Tax, LWF, deductions, net salary, and employer contributions are calculated by the system.</li>
                  <li>Duplicate columns, unsupported headers, and duplicate rows are rejected.</li>
                </ul>
              </section>
              <section>
                <h3>Sample Row</h3>
                <div className="sample-row">
                  {Object.entries(BULK_UPLOAD_SAMPLE_ROW).map(([key, value]) => (
                    <span key={key}><strong>{key}</strong>: {value}</span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadModal;
