export const MAX_BULK_UPLOAD_ROWS = 5000;
export const MAX_BULK_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

export const BULK_UPLOAD_COLUMNS = [
  { key: 'employee_id', label: 'Emp Id', required: true, aliases: ['employee id', 'employee_id', 'employee code', 'employee_code', 'emp id', 'emp_id'] },
  { key: 'first_name', label: 'First Name', required: true, aliases: ['first name', 'firstname'] },
  { key: 'last_name', label: 'Last Name', required: true, aliases: ['last name', 'lastname'] },
  { key: 'full_name', label: 'Name Of Employees', required: false, aliases: ['name', 'employee name', 'employee_name', 'name of employee', 'name_of_employees'] },
  { key: 'email', label: 'Email', required: true, aliases: ['email address'] },
  { key: 'phone', label: 'Phone', required: false, aliases: ['mobile', 'mobile number'] },
  { key: 'department', label: 'Department', required: true, aliases: ['department name', 'department_name'] },
  { key: 'department_id', label: 'Department ID', required: false, aliases: ['department id'] },
  { key: 'position', label: 'Designation', required: true, aliases: ['position', 'designation', 'job title'] },
  { key: 'employment_type', label: 'Employment Type', required: true, aliases: ['employment type', 'employment_type', 'employee type'] },
  { key: 'joining_date', label: 'Joining Date', required: true, aliases: ['date of joining'] },
  { key: 'salary_during_probation', label: 'Salary During Probation (Monthly)', required: false, aliases: ['salary during probation', 'probation salary', 'salary_during_probation'] },
  { key: 'salary_after_probation', label: 'Salary After Probation (Monthly)', required: false, aliases: ['salary after probation', 'salary_after_probation'] },
  { key: 'salary', label: 'CTC', required: false, aliases: ['annual salary', 'annual ctc', 'ctc'] },
  { key: 'salary_basic', label: 'Basic', required: false, aliases: ['basic', 'basic salary', 'salary_basic'] },
  { key: 'salary_hra', label: 'HRA', required: false, aliases: ['hra', 'salary_hra'] },
  { key: 'salary_medical_allowance', label: 'Medical Allowance', required: false, aliases: ['medical allowance', 'medical_allowance', 'medical', 'salary_medical_allowance'] },
  { key: 'salary_travel_allowance', label: 'Travel Allowance', required: false, aliases: ['travel allowance', 'travel_allowance', 'travel', 'conveyance allowance', 'conveyance', 'salary_travel_allowance'] },
  { key: 'salary_other_allowance', label: 'Other Allowance', required: false, aliases: ['other', 'other allowance', 'other_allowance', 'special allowance', 'special', 'salary_other_allowance'] },
  { key: 'salary_gross', label: 'Gross', required: false, aliases: ['gross', 'gross salary', 'salary_gross'] },
  { key: 'salary_pf', label: 'PF', required: false, aliases: ['pf', 'provident fund', 'salary_pf'] },
  { key: 'salary_esic', label: 'ESIC', required: false, aliases: ['esic', 'esi', 'salary_esic'] },
  { key: 'salary_professional_tax', label: 'P.Tax', required: false, aliases: ['p.tax', 'ptax', 'p tax', 'professional tax', 'professional_tax', 'pt', 'salary_professional_tax'] },
  { key: 'salary_lwf', label: 'LWF', required: false, aliases: ['lwf', 'labor welfare fund', 'labour welfare fund', 'salary_lwf'] },
  { key: 'salary_total_deduction', label: 'Total Deduction', required: false, aliases: ['total deduction', 'total deductions', 'salary_total_deduction'] },
  { key: 'salary_net', label: 'Net Salary', required: false, aliases: ['net salary', 'net pay', 'salary_net'] },
  { key: 'employer_pf', label: 'Employer PF 13%', required: false, aliases: ['employer pf 13%', 'employer pf', 'employer_pf'] },
  { key: 'employer_esic', label: 'Employer ESIC 3.25%', required: false, aliases: ['employer esic 3.25%', 'employer esic', 'employer esi', 'employer_esic'] },
  { key: 'last_working_date', label: 'Last Working Date', required: false, aliases: ['last working date', 'last_working_date', 'last date'] },
  { key: 'date_of_birth', label: 'Date of Birth', required: false, aliases: ['dob'] },
  { key: 'address', label: 'Address', required: false, aliases: [] },
  { key: 'emergency_contact', label: 'Emergency Contact', required: false, aliases: [] },
  { key: 'bank_account_number', label: 'Bank Account Number', required: false, aliases: ['account number'] },
  { key: 'ifsc_code', label: 'IFSC Code', required: false, aliases: ['ifsc'] },
  { key: 'pan_number', label: 'PAN Number', required: false, aliases: ['pan'] },
  { key: 'aadhar_number', label: 'Aadhar Number', required: false, aliases: ['aadhaar number', 'aadhaar', 'aadhar'] },
  { key: 'is_active', label: 'Status', required: false, aliases: ['active', 'is_active'] }
];

export const REQUIRED_BULK_UPLOAD_COLUMNS = BULK_UPLOAD_COLUMNS
  .filter((column) => column.required)
  .map((column) => column.key);

export const BULK_UPLOAD_SAMPLE_ROW = {
  employee_id: 'TEAMB01',
  first_name: 'John',
  last_name: 'Patel',
  email: 'asha.patel@example.com',
  phone: '+91 9876543210',
  department: 'HR',
  position: 'HR Executive',
  employment_type: 'Full-time',
  joining_date: '2026-05-23',
  salary_during_probation: '15000',
  salary_after_probation: '22000'
};
