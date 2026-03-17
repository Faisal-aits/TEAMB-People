import React, { useState, useEffect } from 'react';
import './Salary.css';
import { salaryAPI } from '../../../services/salaryAPI';
import * as XLSX from 'xlsx';

const SalaryManagement = () => {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [payslipPreview, setPayslipPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPayslip, setIsGeneratingPayslip] = useState(false);

  const [filters, setFilters] = useState({
    employee: '',
    department: '',
    month: '',
    year: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    employee_id: '',
    department_id: '',
    basic_salary: '',
    allowances: {
      hra: '',
      transport: '',
      medical: '',
      special: ''
    },
    deductions: {
      tax: '',
      provident_fund: '',
      insurance: '',
      loan: ''
    },
    payment_date: '',
    month: '',
    year: '',
    payment_frequency: 'Monthly',
    status: 'pending'
  });

  const [editFormData, setEditFormData] = useState({
    employee_id: '',
    department_id: '',
    basic_salary: '',
    allowances: {
      hra: '',
      transport: '',
      medical: '',
      special: ''
    },
    deductions: {
      tax: '',
      provident_fund: '',
      insurance: '',
      loan: ''
    },
    payment_date: '',
    month: '',
    year: '',
    payment_frequency: 'Monthly',
    status: 'pending'
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch salary records, employees, and departments in parallel
      const [recordsResponse, employeesResponse, departmentsResponse] = await Promise.all([
        salaryAPI.getAll(),
        salaryAPI.getEmployees(),
        salaryAPI.getDepartments()
      ]);
      
      setSalaryRecords(recordsResponse.data.salaryRecords || []);
      setEmployees(employeesResponse.data.employees || []);
      setDepartments(departmentsResponse.data.departments || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load salary records. Please try again.');
      setSalaryRecords([]);
      setEmployees([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('allowances.')) {
      const allowanceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        allowances: {
          ...prev.allowances,
          [allowanceField]: value ? parseInt(value) : 0
        }
      }));
    } else if (name.startsWith('deductions.')) {
      const deductionField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        deductions: {
          ...prev.deductions,
          [deductionField]: value ? parseInt(value) : 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('allowances.')) {
      const allowanceField = name.split('.')[1];
      setEditFormData(prev => ({
        ...prev,
        allowances: {
          ...prev.allowances,
          [allowanceField]: value ? parseInt(value) : 0
        }
      }));
    } else if (name.startsWith('deductions.')) {
      const deductionField = name.split('.')[1];
      setEditFormData(prev => ({
        ...prev,
        deductions: {
          ...prev.deductions,
          [deductionField]: value ? parseInt(value) : 0
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEmployeeSelect = (e) => {
    const selectedEmployee = employees.find(emp => emp.id === e.target.value);
    if (selectedEmployee) {
      setFormData(prev => ({
        ...prev,
        employee_id: selectedEmployee.id,
        department_id: selectedEmployee.department_id,
        basic_salary: selectedEmployee.salary || ''
      }));
    }
  };

  const calculateNetSalary = (basic, allowances, deductions) => {
    const totalAllowances = Object.values(allowances).reduce((sum, amount) => sum + (parseInt(amount) || 0), 0);
    const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + (parseInt(amount) || 0), 0);
    return (parseInt(basic) || 0) + totalAllowances - totalDeductions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.basic_salary || !formData.month || !formData.year) {
      alert('Please fill in all required fields');
      return;
    }

    const netSalary = calculateNetSalary(formData.basic_salary, formData.allowances, formData.deductions);

    const salaryData = {
      employee_id: formData.employee_id,
      department_id: formData.department_id,
      basic_salary: parseInt(formData.basic_salary),
      allowances: {
        hra: parseInt(formData.allowances.hra) || 0,
        transport: parseInt(formData.allowances.transport) || 0,
        medical: parseInt(formData.allowances.medical) || 0,
        special: parseInt(formData.allowances.special) || 0
      },
      deductions: {
        tax: parseInt(formData.deductions.tax) || 0,
        provident_fund: parseInt(formData.deductions.provident_fund) || 0,
        insurance: parseInt(formData.deductions.insurance) || 0,
        loan: parseInt(formData.deductions.loan) || 0
      },
      net_salary: netSalary,
      payment_date: formData.payment_date,
      month: formData.month,
      year: formData.year,
      payment_frequency: formData.payment_frequency,
      status: formData.status
    };

    try {
      await salaryAPI.create(salaryData);
      
      // Refresh salary records
      await fetchData();
      
      // Reset form
      setFormData({
        employee_id: '',
        department_id: '',
        basic_salary: '',
        allowances: {
          hra: '',
          transport: '',
          medical: '',
          special: ''
        },
        deductions: {
          tax: '',
          provident_fund: '',
          insurance: '',
          loan: ''
        },
        payment_date: '',
        month: '',
        year: '',
        payment_frequency: 'Monthly',
        status: 'pending'
      });
      
      setIsModalOpen(false);
      alert('Salary record added successfully!');
    } catch (err) {
      console.error('Failed to create salary record:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create salary record. Please try again.';
      alert(errorMessage);
    }
  };

  const handleViewRecord = async (record) => {
    try {
      // Fetch full salary record details
      const response = await salaryAPI.getById(record.id);
      setSelectedRecord(response.data.salaryRecord);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch salary record details:', err);
      // Fallback: use basic record data
      setSelectedRecord(record);
      setIsViewModalOpen(true);
    }
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    
    // Fixed: Proper timezone handling for date inputs
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        
        // Handle timezone offset to get the correct date
        // Get the date components in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };

    setEditFormData({
      employee_id: record.employee_id,
      department_id: record.department_id,
      basic_salary: record.basic_salary,
      allowances: { ...record.allowances },
      deductions: { ...record.deductions },
      payment_date: formatDateForInput(record.payment_date), // Fixed this line
      month: record.month,
      year: record.year,
      payment_frequency: record.payment_frequency,
      status: record.status
    });
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    
    if (!editFormData.employee_id || !editFormData.basic_salary || !editFormData.month || !editFormData.year) {
      alert('Please fill in all required fields');
      return;
    }

    const netSalary = calculateNetSalary(editFormData.basic_salary, editFormData.allowances, editFormData.deductions);

    const salaryData = {
      employee_id: editFormData.employee_id,
      department_id: editFormData.department_id,
      basic_salary: parseInt(editFormData.basic_salary),
      allowances: {
        hra: parseInt(editFormData.allowances.hra) || 0,
        transport: parseInt(editFormData.allowances.transport) || 0,
        medical: parseInt(editFormData.allowances.medical) || 0,
        special: parseInt(editFormData.allowances.special) || 0
      },
      deductions: {
        tax: parseInt(editFormData.deductions.tax) || 0,
        provident_fund: parseInt(editFormData.deductions.provident_fund) || 0,
        insurance: parseInt(editFormData.deductions.insurance) || 0,
        loan: parseInt(editFormData.deductions.loan) || 0
      },
      net_salary: netSalary,
      payment_date: editFormData.payment_date,
      month: editFormData.month,
      year: editFormData.year,
      payment_frequency: editFormData.payment_frequency,
      status: editFormData.status
    };

    try {
      await salaryAPI.update(selectedRecord.id, salaryData);

      // Refresh salary records
      await fetchData();

      setIsEditModalOpen(false);
      setSelectedRecord(null);
      alert('Salary record updated successfully!');
    } catch (err) {
      console.error('Failed to update salary record:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update salary record. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteClick = (record) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      await salaryAPI.delete(selectedRecord.id);
      
      // Refresh salary records
      await fetchData();
      
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedRecord(null);
      alert('Salary record deleted successfully!');
    } catch (err) {
      console.error('Failed to delete salary record:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete salary record. Please try again.';
      alert(errorMessage);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGeneratePayslip = async (record) => {
    try {
      setIsGeneratingPayslip(true);
      
      // Download PDF directly
      const response = await salaryAPI.generatePayslip(record.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${record.employee_name}-${record.month}-${record.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`Payslip downloaded successfully for ${record.employee_name}`);
    } catch (err) {
      console.error('Failed to generate payslip:', err);
      alert('Failed to generate payslip. Please try again.');
    } finally {
      setIsGeneratingPayslip(false);
    }
  };

  const handlePayslipPreview = async (record) => {
    try {
      setIsGeneratingPayslip(true);
      const response = await salaryAPI.generatePayslipPreview(record.id);
      
      if (response.data.success) {
        setPayslipPreview({
          base64: response.data.data.base64,
          filename: response.data.data.filename,
          employeeName: record.employee_name,
          month: record.month,
          year: record.year
        });
        setIsPayslipModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to generate payslip preview:', err);
      alert('Failed to generate payslip preview. Please try again.');
    } finally {
      setIsGeneratingPayslip(false);
    }
  };

  const handleDownloadPayslip = () => {
    if (payslipPreview) {
      // Convert base64 to blob and download
      const byteCharacters = atob(payslipPreview.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = payslipPreview.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const handlePrintPayslip = () => {
    if (payslipPreview) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Payslip</title>
            <style>
              body { margin: 0; padding: 20px; }
              iframe { width: 100%; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe src="data:application/pdf;base64,${payslipPreview.base64}"></iframe>
            <script>
              setTimeout(() => {
                window.focus();
                window.print();
              }, 1000);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleSendPayslipEmail = async (record) => {
    const email = prompt(`Enter email address to send payslip to ${record.employee_name}:`, '');
    
    if (email && email.includes('@')) {
      try {
        await salaryAPI.sendPayslipEmail(record.id, { email });
        alert(`Payslip sent successfully to ${email}`);
      } catch (err) {
        console.error('Failed to send payslip email:', err);
        alert('Failed to send payslip email. Please try again.');
      }
    } else if (email) {
      alert('Please enter a valid email address.');
    }
  };
  const handleExport = () => {
    try {
      // If no data to export
      if (filteredRecords.length === 0) {
        alert('No salary records to export!');
        return;
      }

      // Prepare data for export
      const exportData = filteredRecords.map(record => ({
        'Employee ID': record.employee_id,
        'Employee Name': record.employee_name,
        'Department': record.department_name,
        'Designation': record.designation,
        'Month': record.month,
        'Year': record.year,
        'Basic Salary': record.basic_salary,
        'HRA': record.allowances.hra,
        'Transport': record.allowances.transport,
        'Medical': record.allowances.medical,
        'Special': record.allowances.special,
        'Total Allowances': getTotalAllowances(record.allowances),
        'Tax': record.deductions.tax,
        'Provident Fund': record.deductions.provident_fund,
        'Insurance': record.deductions.insurance,
        'Loan': record.deductions.loan,
        'Total Deductions': getTotalDeductions(record.deductions),
        'Net Salary': record.net_salary,
        'Payment Date': formatDate(record.payment_date),
        'Payment Frequency': record.payment_frequency,
        'Status': record.status.toUpperCase()
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const wscols = [
        { wch: 15 },  // Employee ID
        { wch: 25 },  // Employee Name
        { wch: 20 },  // Department
        { wch: 20 },  // Designation
        { wch: 15 },  // Month
        { wch: 10 },  // Year
        { wch: 15 },  // Basic Salary
        { wch: 12 },  // HRA
        { wch: 12 },  // Transport
        { wch: 12 },  // Medical
        { wch: 12 },  // Special
        { wch: 18 },  // Total Allowances
        { wch: 12 },  // Tax
        { wch: 18 },  // Provident Fund
        { wch: 12 },  // Insurance
        { wch: 12 },  // Loan
        { wch: 18 },  // Total Deductions
        { wch: 15 },  // Net Salary
        { wch: 15 },  // Payment Date
        { wch: 18 },  // Payment Frequency
        { wch: 12 }   // Status
      ];
      worksheet['!cols'] = wscols;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Records');

      // Generate file name with current date
      const fileName = `Salary_Records_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Export to Excel
      XLSX.writeFile(workbook, fileName);
      
      console.log('✅ Export successful:', fileName);
      alert(`Exported ${filteredRecords.length} salary records successfully!`);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };
  // Dashboard Statistics
  const dashboardStats = {
    totalRecords: salaryRecords.length,
    totalPaid: salaryRecords.filter(record => record.status === 'paid').length,
    totalPending: salaryRecords.filter(record => record.status === 'pending').length,
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalAllowances = (allowances) => {
    return Object.values(allowances).reduce((sum, amount) => sum + amount, 0);
  };

  const getTotalDeductions = (deductions) => {
    return Object.values(deductions).reduce((sum, amount) => sum + amount, 0);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = ['2024', '2023', '2022', '2021'];
  const paymentFrequencies = ['Monthly', 'Biweekly', 'Weekly'];

  // Filter records based on search and filters
  const filteredRecords = salaryRecords.filter(record => {
    if (searchTerm && !record.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.employee && record.employee_id !== filters.employee) {
      return false;
    }
    if (filters.department && record.department_id !== filters.department) {
      return false;
    }
    if (filters.month && record.month !== filters.month) {
      return false;
    }
    if (filters.year && record.year !== filters.year) {
      return false;
    }
    return true;
  });

  // Render payslip actions component
  const renderPayslipActions = (record) => (
    <div className="salary-payslip-actions">
      <button
        type="button"
        onClick={() => handlePayslipPreview(record)}
        className="salary-payslip-preview-btn"
        disabled={isGeneratingPayslip}
      >
        {isGeneratingPayslip ? 'Generating...' : 'Preview Payslip'}
      </button>
      <button
        type="button"
        onClick={() => handleGeneratePayslip(record)}
        className="salary-payslip-download-btn"
        disabled={isGeneratingPayslip}
      >
        {isGeneratingPayslip ? 'Generating...' : 'Download Payslip'}
      </button>
      <button
        type="button"
        onClick={() => handleSendPayslipEmail(record)}
        className="salary-payslip-email-btn"
      >
        Email Payslip
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="salary-management-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading salary records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salary-management-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Salary Records</h3>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-management-container">
      {/* Header */}
      <div className="salary-management-header">
        <h2 className="salary-management-title">Salary Management</h2>
        <button 
          className="salary-add-record-btn"
          onClick={() => setIsModalOpen(true)}
        >
          <span className="salary-btn-icon">+</span>
          Add Salary Record
        </button>
      </div>

      {/* Overview Dashboard */}
      <div className="salary-dashboard-stats">
        <div className="salary-stat-card">
          <div className="salary-stat-number">{dashboardStats.totalRecords}</div>
          <div className="salary-stat-label">Total Records</div>
        </div>
        <div className="salary-stat-card">
          <div className="salary-stat-number">{dashboardStats.totalPaid}</div>
          <div className="salary-stat-label">Total Paid</div>
        </div>
        <div className="salary-stat-card">
          <div className="salary-stat-number">{dashboardStats.totalPending}</div>
          <div className="salary-stat-label">Total Pending</div>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="salary-records-container salary-glass-form">
        <div className="salary-table-header">
          <h3 className="salary-table-title">Salary Records</h3>
          <div className="salary-table-actions">
            <input
              type="text"
              placeholder="Search employees..."
              className="salary-filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="salary-filter-select"
              value={filters.employee}
              onChange={(e) => handleFilterChange('employee', e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <select 
              className="salary-filter-select"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <select 
              className="salary-filter-select"
              value={filters.month}
              onChange={(e) => handleFilterChange('month', e.target.value)}
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select 
              className="salary-filter-select"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button className="salary-export-btn" onClick={handleExport} disabled={filteredRecords.length === 0}>Export</button>
          </div>
        </div>
        
        <div className="salary-table-wrapper">
          <table className="salary-records-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Payment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id}>
                  <td>
                    <div className="salary-employee-cell">
                      <div 
                        className="salary-employee-name clickable"
                        onClick={() => handleViewRecord(record)}
                      >
                        {record.employee_name}
                      </div>
                      <div className="salary-employee-id">
                        ID: {record.employee_id}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="salary-department-cell">
                      <div className="salary-department-name">{record.department_name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="salary-designation-cell">
                      <div className="salary-designation-name">{record.designation}</div>
                    </div>
                  </td>
                  <td>
                    <div className="salary-amount-cell">
                      {formatCurrency(record.basic_salary)}
                    </div>
                  </td>
                  <td>
                    <div className="salary-amount-cell">
                      {formatCurrency(getTotalAllowances(record.allowances))}
                    </div>
                  </td>
                  <td>
                    <div className="salary-amount-cell">
                      {formatCurrency(getTotalDeductions(record.deductions))}
                    </div>
                  </td>
                  <td>
                    <div className="salary-amount-cell">
                      {formatCurrency(record.net_salary)}
                    </div>
                  </td>
                  <td>
                    <div className="salary-date-cell">
                      {formatDate(record.payment_date)}
                    </div>
                  </td>
                  <td>
                    <div className={`salary-status-badge salary-status-${record.status}`}>
                      {record.status === 'paid' ? 'PAID' : 'PENDING'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="salary-no-records">
            <div className="salary-no-data-icon">💰</div>
            <p className="salary-no-data-text">No salary records found</p>
            <p className="salary-no-data-subtext">
              {searchTerm || filters.employee || filters.department || filters.month || filters.year
                ? 'Try changing your filters to see more results.'
                : 'Get started by adding your first salary record.'}
            </p>
            {!searchTerm && !filters.employee && !filters.department && !filters.month && !filters.year && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="salary-add-first-btn"
              >
                Add First Record
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Salary Record Modal */}
      {isModalOpen && (
        <div className="salary-modal-overlay">
          <div className="salary-modal-content salary-large-modal">
            <div className="salary-modal-header">
              <h2 className="salary-modal-title">Add New Salary Record</h2>
              <button 
                className="salary-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="salary-record-form">
              <div className="salary-form-section">
                <h3 className="salary-section-title">Employee Information</h3>
                <div className="salary-form-row-four">
                  <div className="salary-form-group">
                    <label className="salary-form-label">Employee *</label>
                    <select
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleEmployeeSelect}
                      required
                      className="salary-form-select"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Department</label>
                    <select
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleInputChange}
                      className="salary-form-select"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Basic Salary *</label>
                    <input
                      type="number"
                      name="basic_salary"
                      value={formData.basic_salary}
                      onChange={handleInputChange}
                      placeholder="Enter basic salary"
                      required
                      className="salary-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Salary Period</h3>
                <div className="salary-form-row-five">
                  <div className="salary-form-group">
                    <label className="salary-form-label">Month *</label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      required
                      className="salary-form-select"
                    >
                      <option value="">Select Month</option>
                      {months.map(month => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Year *</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      className="salary-form-select"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Payment Frequency</label>
                    <select
                      name="payment_frequency"
                      value={formData.payment_frequency}
                      onChange={handleInputChange}
                      className="salary-form-select"
                    >
                      {paymentFrequencies.map(freq => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="salary-form-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Allowances</h3>
                <div className="salary-form-row-four">
                  <div className="salary-form-group">
                    <label className="salary-form-label">HRA</label>
                    <input
                      type="number"
                      name="allowances.hra"
                      value={formData.allowances.hra}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Transport</label>
                    <input
                      type="number"
                      name="allowances.transport"
                      value={formData.allowances.transport}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Medical</label>
                    <input
                      type="number"
                      name="allowances.medical"
                      value={formData.allowances.medical}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Special</label>
                    <input
                      type="number"
                      name="allowances.special"
                      value={formData.allowances.special}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Deductions</h3>
                <div className="salary-form-row-four">
                  <div className="salary-form-group">
                    <label className="salary-form-label">Tax</label>
                    <input
                      type="number"
                      name="deductions.tax"
                      value={formData.deductions.tax}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Provident Fund</label>
                    <input
                      type="number"
                      name="deductions.provident_fund"
                      value={formData.deductions.provident_fund}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Insurance</label>
                    <input
                      type="number"
                      name="deductions.insurance"
                      value={formData.deductions.insurance}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Loan</label>
                    <input
                      type="number"
                      name="deductions.loan"
                      value={formData.deductions.loan}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="salary-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Salary Summary</h3>
                <div className="salary-summary-line">
                  <div className="salary-summary-item">
                    <span>Basic:</span>
                    <span>{formatCurrency(parseInt(formData.basic_salary) || 0)}</span>
                  </div>
                  <div className="salary-summary-item">
                    <span>+ Allowances:</span>
                    <span>{formatCurrency(getTotalAllowances(formData.allowances))}</span>
                  </div>
                  <div className="salary-summary-item">
                    <span>- Deductions:</span>
                    <span>{formatCurrency(getTotalDeductions(formData.deductions))}</span>
                  </div>
                  <div className="salary-summary-item salary-total-item">
                    <span>= Net:</span>
                    <span>{formatCurrency(calculateNetSalary(formData.basic_salary, formData.allowances, formData.deductions))}</span>
                  </div>
                </div>
              </div>

              <div className="salary-form-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="salary-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="salary-submit-btn"
                >
                  Create Salary Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Salary Record Modal */}
      {isViewModalOpen && selectedRecord && (
        <div className="salary-modal-overlay">
          <div className="salary-modal-content salary-large-modal">
            <div className="salary-modal-header">
              <h2 className="salary-modal-title">Salary Details - {selectedRecord.employee_name}</h2>
              <button 
                className="salary-close-btn"
                onClick={() => setIsViewModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="salary-details-content">
              <div className="salary-form-section">
                <h3 className="salary-section-title">Employee Information</h3>
                <div className="salary-details-grid-single">
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Employee Name</label>
                    <span className="salary-detail-value">{selectedRecord.employee_name}</span>
                  </div>
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Employee ID</label>
                    <span className="salary-detail-value">{selectedRecord.employee_id}</span>
                  </div>
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Department</label>
                    <span className="salary-detail-value">{selectedRecord.department_name}</span>
                  </div>
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Designation</label>
                    <span className="salary-detail-value">{selectedRecord.designation}</span>
                  </div>
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Payment Period</label>
                    <span className="salary-detail-value">{selectedRecord.month} {selectedRecord.year}</span>
                  </div>
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Payment Frequency</label>
                    <span className="salary-detail-value">{selectedRecord.payment_frequency}</span>
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Salary Breakdown</h3>
                
                <div className="salary-compact-breakdown">
                  <div className="salary-breakdown-column">
                    <h4 className="salary-breakdown-title">Earnings</h4>
                    <div className="salary-breakdown-line">
                      <span>Basic Salary</span>
                      <span>{formatCurrency(selectedRecord.basic_salary)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>HRA</span>
                      <span>{formatCurrency(selectedRecord.allowances.hra)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>Transport</span>
                      <span>{formatCurrency(selectedRecord.allowances.transport)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>Medical</span>
                      <span>{formatCurrency(selectedRecord.allowances.medical)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>Special</span>
                      <span>{formatCurrency(selectedRecord.allowances.special)}</span>
                    </div>
                    <div className="salary-breakdown-line salary-total-line">
                      <span>Total Allowances</span>
                      <span>{formatCurrency(getTotalAllowances(selectedRecord.allowances))}</span>
                    </div>
                  </div>
                  
                  <div className="salary-breakdown-column">
                    <h4 className="salary-breakdown-title">Deductions</h4>
                    <div className="salary-breakdown-line">
                      <span>Income Tax</span>
                      <span>{formatCurrency(selectedRecord.deductions.tax)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>Provident Fund</span>
                      <span>{formatCurrency(selectedRecord.deductions.provident_fund)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>Insurance</span>
                      <span>{formatCurrency(selectedRecord.deductions.insurance)}</span>
                    </div>
                    <div className="salary-breakdown-line">
                      <span>Loan Recovery</span>
                      <span>{formatCurrency(selectedRecord.deductions.loan)}</span>
                    </div>
                    <div className="salary-breakdown-line salary-total-line">
                      <span>Total Deductions</span>
                      <span>{formatCurrency(getTotalDeductions(selectedRecord.deductions))}</span>
                    </div>
                  </div>
                </div>
                
                <div className="salary-simple-summary">
                  <div className="salary-summary-line-simple">
                    <span>Gross Salary:</span>
                    <span>{formatCurrency(selectedRecord.basic_salary + getTotalAllowances(selectedRecord.allowances))}</span>
                  </div>
                  <div className="salary-summary-line-simple">
                    <span>Total Deductions:</span>
                    <span>{formatCurrency(getTotalDeductions(selectedRecord.deductions))}</span>
                  </div>
                  <div className="salary-summary-line-simple salary-net-salary">
                    <span>Net Salary:</span>
                    <span>{formatCurrency(selectedRecord.net_salary)}</span>
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Payment Information</h3>
                <div className="salary-details-grid-single">
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Payment Date</label>
                    <span className="salary-detail-value">{formatDate(selectedRecord.payment_date)}</span>
                  </div>
                  <div className="salary-detail-item">
                    <label className="salary-detail-label">Payment Status</label>
                    <span className={`salary-status-badge salary-status-${selectedRecord.status}`}>
                      {selectedRecord.status === 'paid' ? 'PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payslip Actions Section */}
              <div className="salary-form-section">
                <h3 className="salary-section-title">Payslip Actions</h3>
                {renderPayslipActions(selectedRecord)}
              </div>

              <div className="salary-form-actions">
                <button
                  type="button"
                  onClick={() => handleEditRecord(selectedRecord)}
                  className="salary-edit-action-btn"
                >
                  Edit Record
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(selectedRecord)}
                  className="salary-delete-action-btn"
                >
                  Delete Record
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="salary-cancel-btn"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Salary Record Modal */}
      {isEditModalOpen && selectedRecord && (
        <div className="salary-modal-overlay">
          <div className="salary-modal-content salary-large-modal">
            <div className="salary-modal-header">
              <h2 className="salary-modal-title">Edit Salary Record</h2>
              <button 
                className="salary-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="salary-record-form">
              <div className="salary-form-section">
                <h3 className="salary-section-title">Employee Information</h3>
                <div className="salary-form-row-four">
                  <div className="salary-form-group">
                    <label className="salary-form-label">Employee *</label>
                    <select
                      name="employee_id"
                      value={editFormData.employee_id}
                      onChange={handleEditInputChange}
                      required
                      className="salary-form-select"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.position})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Department</label>
                    <select
                      name="department_id"
                      value={editFormData.department_id}
                      onChange={handleEditInputChange}
                      className="salary-form-select"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Basic Salary *</label>
                    <input
                      type="number"
                      name="basic_salary"
                      value={editFormData.basic_salary}
                      onChange={handleEditInputChange}
                      required
                      className="salary-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Salary Period</h3>
                <div className="salary-form-row-five">
                  <div className="salary-form-group">
                    <label className="salary-form-label">Month *</label>
                    <select
                      name="month"
                      value={editFormData.month}
                      onChange={handleEditInputChange}
                      required
                      className="salary-form-select"
                    >
                      <option value="">Select Month</option>
                      {months.map(month => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Year *</label>
                    <select
                      name="year"
                      value={editFormData.year}
                      onChange={handleEditInputChange}
                      required
                      className="salary-form-select"
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Payment Frequency</label>
                    <select
                      name="payment_frequency"
                      value={editFormData.payment_frequency}
                      onChange={handleEditInputChange}
                      className="salary-form-select"
                    >
                      {paymentFrequencies.map(freq => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Payment Date</label>
                    <input
                      type="date"
                      name="payment_date"
                      value={editFormData.payment_date}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Status</label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      className="salary-form-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Allowances</h3>
                <div className="salary-form-row-four">
                  <div className="salary-form-group">
                    <label className="salary-form-label">HRA</label>
                    <input
                      type="number"
                      name="allowances.hra"
                      value={editFormData.allowances.hra}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Transport</label>
                    <input
                      type="number"
                      name="allowances.transport"
                      value={editFormData.allowances.transport}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Medical</label>
                    <input
                      type="number"
                      name="allowances.medical"
                      value={editFormData.allowances.medical}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Special</label>
                    <input
                      type="number"
                      name="allowances.special"
                      value={editFormData.allowances.special}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Deductions</h3>
                <div className="salary-form-row-four">
                  <div className="salary-form-group">
                    <label className="salary-form-label">Tax</label>
                    <input
                      type="number"
                      name="deductions.tax"
                      value={editFormData.deductions.tax}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Provident Fund</label>
                    <input
                      type="number"
                      name="deductions.provident_fund"
                      value={editFormData.deductions.provident_fund}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Insurance</label>
                    <input
                      type="number"
                      name="deductions.insurance"
                      value={editFormData.deductions.insurance}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                  <div className="salary-form-group">
                    <label className="salary-form-label">Loan</label>
                    <input
                      type="number"
                      name="deductions.loan"
                      value={editFormData.deductions.loan}
                      onChange={handleEditInputChange}
                      className="salary-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="salary-form-section">
                <h3 className="salary-section-title">Salary Summary</h3>
                <div className="salary-summary-line">
                  <div className="salary-summary-item">
                    <span>Basic:</span>
                    <span>{formatCurrency(parseInt(editFormData.basic_salary) || 0)}</span>
                  </div>
                  <div className="salary-summary-item">
                    <span>+ Allowances:</span>
                    <span>{formatCurrency(getTotalAllowances(editFormData.allowances))}</span>
                  </div>
                  <div className="salary-summary-item">
                    <span>- Deductions:</span>
                    <span>{formatCurrency(getTotalDeductions(editFormData.deductions))}</span>
                  </div>
                  <div className="salary-summary-item salary-total-item">
                    <span>= Net:</span>
                    <span>{formatCurrency(calculateNetSalary(editFormData.basic_salary, editFormData.allowances, editFormData.deductions))}</span>
                  </div>
                </div>
              </div>

              <div className="salary-form-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="salary-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="salary-submit-btn"
                >
                  Update Salary Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedRecord && (
        <div className="salary-modal-overlay">
          <div className="salary-modal-content">
            <div className="salary-modal-header">
              <h2 className="salary-modal-title">Delete Salary Record</h2>
              <button 
                className="salary-close-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="salary-delete-confirmation">
              <div className="salary-delete-icon">⚠️</div>
              <h3 className="salary-delete-title">
                Delete Salary Record?
              </h3>
              <p className="salary-delete-message">
                Are you sure you want to delete the salary record for <strong>{selectedRecord.employee_name}</strong> 
                for <strong>{selectedRecord.month} {selectedRecord.year}</strong>? 
                This action cannot be undone.
              </p>

              <div className="salary-delete-actions">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="salary-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRecord}
                  className="salary-delete-action-btn"
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Preview Modal */}
      {isPayslipModalOpen && payslipPreview && (
        <div className="salary-modal-overlay">
          <div className="salary-modal-content salary-large-modal">
            <div className="salary-modal-header">
              <h2 className="salary-modal-title">
                Payslip Preview - {payslipPreview.employeeName}
              </h2>
              <button 
                className="salary-close-btn"
                onClick={() => setIsPayslipModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="salary-payslip-preview">
              <div className="payslip-preview-actions">
                <button
                  onClick={handleDownloadPayslip}
                  className="salary-payslip-download-btn"
                >
                  Download PDF
                </button>
                <button
                  onClick={handlePrintPayslip}
                  className="salary-payslip-print-btn"
                >
                  Print
                </button>
                <button
                  onClick={() => setIsPayslipModalOpen(false)}
                  className="salary-cancel-btn"
                >
                  Close
                </button>
              </div>
              
              <div className="payslip-preview-container">
                <iframe 
                  src={`data:application/pdf;base64,${payslipPreview.base64}`}
                  title="Payslip Preview"
                  className="payslip-iframe"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;