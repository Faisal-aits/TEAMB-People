const MAX_BULK_UPLOAD_ROWS = 5000;
const MAX_BULK_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

const BULK_UPLOAD_COLUMNS = [
  {
    key: 'employee_id',
    label: 'Emp Id',
    required: true,
    aliases: ['employee id', 'employee_id', 'employee code', 'employee_code', 'emp id', 'emp_id']
  },
  {
    key: 'full_name',
    label: 'Name Of Employees',
    required: false,
    aliases: ['name', 'employee name', 'employee_name', 'name of employee', 'name_of_employees']
  },
  {
    key: 'first_name',
    label: 'First Name',
    required: true,
    aliases: ['first name', 'firstname', 'first_name']
  },
  {
    key: 'last_name',
    label: 'Last Name',
    required: true,
    aliases: ['last name', 'lastname', 'last_name']
  },
  {
    key: 'email',
    label: 'Email',
    required: true,
    aliases: ['email', 'email address', 'email_address']
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    aliases: ['phone', 'mobile', 'mobile number', 'phone_number']
  },
  {
    key: 'position',
    label: 'Designation',
    required: true,
    aliases: ['position', 'designation', 'job title', 'job_title']
  },
  {
    key: 'department',
    label: 'Department',
    required: false,
    aliases: ['department', 'department name', 'department_name']
  },
  {
    key: 'department_id',
    label: 'Department ID',
    required: false,
    aliases: ['department id', 'department_id']
  },
  {
    key: 'salary',
    label: 'CTC',
    required: false,
    aliases: ['salary', 'annual salary', 'annual ctc', 'ctc']
  },
  {
    key: 'employment_type',
    label: 'Employment Type',
    required: true,
    aliases: ['employment type', 'employment_type', 'employee type']
  },
  {
    key: 'salary_basic',
    label: 'Basic',
    required: false,
    aliases: ['basic', 'basic salary', 'salary_basic']
  },
  {
    key: 'salary_hra',
    label: 'HRA',
    required: false,
    aliases: ['hra', 'salary_hra']
  },
  {
    key: 'salary_medical_allowance',
    label: 'Medical Allowance',
    required: false,
    aliases: ['medical allowance', 'medical_allowance', 'medical', 'salary_medical_allowance']
  },
  {
    key: 'salary_travel_allowance',
    label: 'Travel Allowance',
    required: false,
    aliases: ['travel allowance', 'travel_allowance', 'travel', 'conveyance allowance', 'conveyance', 'salary_travel_allowance']
  },
  {
    key: 'salary_other_allowance',
    label: 'Other',
    required: false,
    aliases: ['other', 'other allowance', 'other_allowance', 'special allowance', 'special', 'salary_other_allowance']
  },
  {
    key: 'salary_gross',
    label: 'Gross',
    required: false,
    aliases: ['gross', 'gross salary', 'salary_gross']
  },
  {
    key: 'salary_pf',
    label: 'PF',
    required: false,
    aliases: ['pf', 'provident fund', 'salary_pf']
  },
  {
    key: 'salary_esic',
    label: 'ESIC',
    required: false,
    aliases: ['esic', 'esi', 'salary_esic']
  },
  {
    key: 'salary_professional_tax',
    label: 'P.Tax',
    required: false,
    aliases: ['p.tax', 'ptax', 'p tax', 'professional tax', 'professional_tax', 'pt', 'salary_professional_tax']
  },
  {
    key: 'salary_lwf',
    label: 'LWF',
    required: false,
    aliases: ['lwf', 'labor welfare fund', 'labour welfare fund', 'salary_lwf']
  },
  {
    key: 'salary_total_deduction',
    label: 'Total Deduction',
    required: false,
    aliases: ['total deduction', 'total deductions', 'salary_total_deduction']
  },
  {
    key: 'salary_net',
    label: 'Net Salary',
    required: false,
    aliases: ['net salary', 'net pay', 'salary_net']
  },
  {
    key: 'employer_pf',
    label: 'Employer PF 13%',
    required: false,
    aliases: ['employer pf 13%', 'employer pf', 'employer_pf']
  },
  {
    key: 'employer_esic',
    label: 'Employer ESIC 3.25%',
    required: false,
    aliases: ['employer esic 3.25%', 'employer esic', 'employer esi', 'employer_esic']
  },
  {
    key: 'joining_date',
    label: 'Joining Date',
    required: true,
    aliases: ['joining date', 'joining_date', 'date of joining', 'date_of_joining']
  },
  {
    key: 'last_working_date',
    label: 'Last Working Date',
    required: false,
    aliases: ['last working date', 'last_working_date', 'last date']
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    required: false,
    aliases: ['date of birth', 'date_of_birth', 'dob']
  },
  {
    key: 'address',
    label: 'Address',
    required: false,
    aliases: ['address']
  },
  {
    key: 'emergency_contact',
    label: 'Emergency Contact',
    required: false,
    aliases: ['emergency contact', 'emergency_contact']
  },
  {
    key: 'bank_account_number',
    label: 'Bank Account Number',
    required: false,
    aliases: ['bank account number', 'bank_account_number', 'account number', 'account_number']
  },
  {
    key: 'ifsc_code',
    label: 'IFSC Code',
    required: false,
    aliases: ['ifsc code', 'ifsc_code', 'ifsc']
  },
  {
    key: 'pan_number',
    label: 'PAN Number',
    required: false,
    aliases: ['pan number', 'pan_number', 'pan']
  },
  {
    key: 'aadhar_number',
    label: 'Aadhar Number',
    required: false,
    aliases: ['aadhar number', 'aadhar_number', 'aadhaar number', 'aadhaar_number', 'aadhaar', 'aadhar']
  },
  {
    key: 'is_active',
    label: 'Is Active',
    required: false,
    aliases: ['is active', 'is_active', 'active', 'status']
  },
  {
    key: 'salary_during_probation',
    label: 'Salary During Probation (Monthly)',
    required: false,
    aliases: ['salary during probation', 'probation salary', 'salary during probation (monthly)']
  },
  {
    key: 'salary_after_probation',
    label: 'Salary After Probation (Monthly)',
    required: false,
    aliases: ['salary after probation', 'salary after probation (monthly)']
  }
];

const REQUIRED_BULK_UPLOAD_COLUMNS = BULK_UPLOAD_COLUMNS
  .filter((column) => column.required)
  .map((column) => column.key);

const ALLOWED_BULK_UPLOAD_EXTENSIONS = ['.csv', '.xlsx'];
const ALLOWED_BULK_UPLOAD_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream'
];

module.exports = {
  MAX_BULK_UPLOAD_ROWS,
  MAX_BULK_UPLOAD_FILE_SIZE,
  BULK_UPLOAD_COLUMNS,
  REQUIRED_BULK_UPLOAD_COLUMNS,
  ALLOWED_BULK_UPLOAD_EXTENSIONS,
  ALLOWED_BULK_UPLOAD_MIME_TYPES
};
