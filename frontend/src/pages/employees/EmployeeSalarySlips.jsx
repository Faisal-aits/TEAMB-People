import React, { useState, useEffect } from 'react';
import { salaryAPI } from '../../services/salaryAPI';
import { 
  HiOutlineCash, 
  HiOutlineSearch, 
  HiOutlineEye, 
  HiOutlinePrinter,
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineClock
} from 'react-icons/hi';
import './EmployeeSalarySlips.css';
import { API_BASE_URL, getFileUrl } from '../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const API_URL = API_BASE_URL;

const EmployeeSalarySlips = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchMySalarySlips();
  }, []);

  const fetchMySalarySlips = async () => {
    try {
      setLoading(true);
      const response = await salaryAPI.getMySalarySlips();
      if (response.data.success) {
        const dbSalaries = response.data.salaries || [];
        const docSlips = response.data.documents || [];

        const formattedDocSlips = docSlips.map(doc => {
          let meta = {};
          try {
            meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {});
          } catch (e) {}

          let monthVal = meta.month || '';
          let yearVal = meta.year || '';

          if (!monthVal && doc.title) {
            const parts = doc.title.split(' ');
            if (parts.length >= 2) {
              const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase().startsWith(parts[0].toLowerCase()));
              if (monthIdx !== -1) monthVal = monthIdx + 1;
              yearVal = parseInt(parts[1]) || yearVal;
            }
          }

          const uploadDateStr = (doc.generated_at || doc.created_at) 
            ? new Date(doc.generated_at || doc.created_at).toLocaleDateString('en-GB') 
            : '';

          return {
            id: meta.salary_record_id || `doc-${doc.id}`,
            month: monthVal || 7,
            year: yearVal || 2026,
            basic_salary: meta.basicSalary || meta.generatedSalary || 0,
            gross_salary: meta.grossSalary || meta.basicSalary || meta.generatedSalary || 0,
            deduction_amount: meta.deductionAmount || 0,
            net_salary: meta.netSalary || meta.generatedSalary || 0,
            payment_status: 'paid',
            upload_date: uploadDateStr,
            first_name: meta.fullName?.split(' ')[0] || '',
            last_name: meta.fullName?.split(' ')[1] || '',
            position: meta.designation || '',
            department_name: meta.department || '',
            is_document: true,
            doc_file_url: doc.file_url,
            title: doc.title || `${MONTH_NAMES[(monthVal || 7) - 1]} ${yearVal || 2026}`
          };
        });

        const docMap = {};
        formattedDocSlips.forEach(d => {
          if (d.id) docMap[String(d.id)] = d.doc_file_url;
          if (d.month && d.year) docMap[`${d.year}-${d.month}`] = d.doc_file_url;
        });

        const mergedDbSalaries = dbSalaries.map(s => ({
          ...s,
          doc_file_url: s.doc_file_url || docMap[String(s.id)] || docMap[`${s.year}-${s.month_number}`] || null
        }));

        const existingIds = new Set(mergedDbSalaries.map(s => String(s.id)));
        const uniqueDocSlips = formattedDocSlips.filter(d => !existingIds.has(String(d.id)));

        setSalaries([...mergedDbSalaries, ...uniqueDocSlips]);
      }
    } catch (error) {
      console.error('Error fetching salary slips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = async (slip) => {
    try {
      setDetailLoading(true);
      let activeSlip = { ...slip };
      if (!activeSlip.is_document && typeof activeSlip.id === 'number') {
        const response = await salaryAPI.getSalarySlip(activeSlip.id);
        if (response.data.success && response.data.salary_slip) {
          activeSlip = { ...activeSlip, ...response.data.salary_slip };
        }
      }
      setSelectedSlip(activeSlip);
    } catch (error) {
      console.error('Error loading slip detail:', error);
      setSelectedSlip(slip);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const getMonthName = (m, y) => {
    if (!m) return '';
    return `${MONTH_NAMES[parseInt(m) - 1] || m} ${y || ''}`;
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    if (s === 'paid') {
      return <span className="slip-status-badge slip-status--paid"><HiOutlineCheckCircle /> PAID</span>;
    }
    if (s === 'partial') {
      return <span className="slip-status-badge slip-status--partial"><HiOutlineClock /> PARTIAL</span>;
    }
    return <span className="slip-status-badge slip-status--pending"><HiOutlineClock /> PENDING</span>;
  };

  const filteredSalaries = salaries.filter(s => {
    const period = getMonthName(s.month, s.year).toLowerCase();
    const status = String(s.payment_status || 'pending').toLowerCase();
    const searchMatch = period.includes(searchTerm.toLowerCase()) || 
                        String(s.net_salary).includes(searchTerm);
    const filterMatch = statusFilter === 'All' || status === statusFilter.toLowerCase();
    return searchMatch && filterMatch;
  });

  const latestNetSalary = salaries[0] ? salaries[0].net_salary : 0;
  const totalPaid = salaries.reduce((acc, curr) => acc + (parseFloat(curr.paid_amount) || 0), 0);

  const triggerFileDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'salary_slip.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error, falling back to direct link:', err);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', fileName || 'salary_slip.pdf');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="employee-salary-slips-page">
      <div className="salary-page-header">
        <div>
          <h2>My Salary & Payslips</h2>
          <p>View and download your monthly salary slips and payment records.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="salary-summary-grid">
        <div className="salary-summary-card blue">
          <div className="card-icon"><HiOutlineCash /></div>
          <div className="card-info">
            <span>Latest Net Salary</span>
            <strong>{formatCurrency(latestNetSalary)}</strong>
            <small>{salaries[0] ? getMonthName(salaries[0].month, salaries[0].year) : 'No records'}</small>
          </div>
        </div>

        <div className="salary-summary-card green">
          <div className="card-icon"><HiOutlineCash /></div>
          <div className="card-info">
            <span>Total Paid Amount</span>
            <strong>{formatCurrency(totalPaid)}</strong>
            <small>Cumulative disbursements</small>
          </div>
        </div>

        <div className="salary-summary-card amber">
          <div className="card-icon"><HiOutlineDocumentText /></div>
          <div className="card-info">
            <span>Payslips Available</span>
            <strong>{salaries.length}</strong>
            <small>Monthly generated records</small>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="salary-table-container">
        <div className="table-controls">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search month, year, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="salary-loading">Loading your salary slips...</div>
        ) : filteredSalaries.length === 0 ? (
          <div className="salary-empty-state">
            <HiOutlineDocumentText className="empty-icon" />
            <h3>No salary slips found</h3>
            <p>{searchTerm || statusFilter !== 'All' ? 'Try adjusting your filters.' : 'Your salary slips will appear here once generated by HR.'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="salary-slips-table">
              <thead>
                <tr>
                  <th>Title / Month</th>
                  <th>Upload Date</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.map((slip) => (
                  <tr key={slip.id} className="salary-row">
                    <td className="td-period">
                      <strong>{slip.title || getMonthName(slip.month, slip.year)}</strong>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {slip.upload_date || (slip.created_at ? new Date(slip.created_at).toLocaleDateString('en-GB') : '-')}
                    </td>
                    <td>{formatCurrency(slip.gross_salary)}</td>
                    <td className="td-deduction">{formatCurrency(slip.deduction_amount)}</td>
                    <td className="td-net">
                      <strong>{formatCurrency(slip.net_salary)}</strong>
                    </td>
                    <td>{getStatusBadge(slip.payment_status)}</td>
                    <td className="td-actions" style={{ textAlign: 'center' }}>
                      {slip.doc_file_url || slip.is_document || String(slip.payment_status).toLowerCase() === 'paid' ? (
                        <button
                          className="btn-action-view"
                          onClick={() => handleViewSlip(slip)}
                          title="View Payslip"
                        >
                          <HiOutlineEye /> View
                        </button>
                      ) : (
                        <span style={{ padding: '6px 12px', background: '#f1f5f9', color: '#64748b', borderRadius: '6px', fontSize: '12px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <HiOutlineClock /> Not Generated Yet
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Slip Detail Modal */}
      {selectedSlip && (
        <div className="slip-modal-overlay" onClick={() => setSelectedSlip(null)}>
          <div className="slip-modal-card" style={selectedSlip.doc_file_url ? { width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' } : {}} onClick={(e) => e.stopPropagation()}>
            <div className="slip-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
                  {selectedSlip.doc_file_url ? <><i className="fas fa-file-pdf"></i> Document Preview</> : `Payslip for ${getMonthName(selectedSlip.month, selectedSlip.year)}`}
                </h3>
                {!selectedSlip.doc_file_url && <p>Official Salary Statement</p>}
              </div>
              <div className="modal-header-actions">
                {selectedSlip.doc_file_url ? (
                  <button className="btn-print" onClick={() => triggerFileDownload(getFileUrl(selectedSlip.doc_file_url), `${selectedSlip.title || 'Salary_Slip'}.pdf`)}>
                    <HiOutlinePrinter /> Download
                  </button>
                ) : (
                  <button className="btn-print" onClick={handlePrintSlip}>
                    <HiOutlinePrinter /> Print / Save PDF
                  </button>
                )}
                <button className="btn-close" onClick={() => setSelectedSlip(null)}>
                  <HiOutlineX />
                </button>
              </div>
            </div>

            <div className="slip-modal-body" id="printable-payslip">
              {detailLoading ? (
                <div className="slip-loading">Loading statement details...</div>
              ) : selectedSlip.doc_file_url ? (
                <div style={{ width: '100%', height: '550px' }}>
                  <iframe
                    src={`${getFileUrl(selectedSlip.doc_file_url)}#toolbar=0`}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                    title="Salary Slip Document"
                  />
                </div>
              ) : (
                <>
                  <div className="payslip-header-info">
                    <div className="company-info">
                      <h2>Team B People</h2>
                      <p>Employee Payroll & Salary Slip</p>
                    </div>
                    <div className="slip-period-badge">
                      <span>Statement Period</span>
                      <strong>{getMonthName(selectedSlip.month, selectedSlip.year)}</strong>
                    </div>
                  </div>

                  <div className="employee-details-grid">
                    <div>
                      <span>Employee Name:</span>
                      <strong>{selectedSlip.first_name ? `${selectedSlip.first_name} ${selectedSlip.last_name || ''}` : 'Employee'}</strong>
                    </div>
                    <div>
                      <span>Position / Designation:</span>
                      <strong>{selectedSlip.position || 'Employee'}</strong>
                    </div>
                    <div>
                      <span>Department:</span>
                      <strong>{selectedSlip.department_name || 'General'}</strong>
                    </div>
                    <div>
                      <span>Bank Account:</span>
                      <strong>{selectedSlip.bank_account_number || 'N/A'}</strong>
                    </div>
                    <div>
                      <span>Payment Status:</span>
                      <div>{getStatusBadge(selectedSlip.payment_status)}</div>
                    </div>
                    <div>
                      <span>Payment Date:</span>
                      <strong>{selectedSlip.payment_date ? new Date(selectedSlip.payment_date).toLocaleDateString('en-IN') : 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="breakdown-tables-grid">
                    {/* Earnings Table */}
                    <div className="breakdown-box">
                      <h4>Earnings</h4>
                      <table className="breakdown-table">
                        <tbody>
                          <tr>
                            <td>Basic Salary</td>
                            <td className="amount">{formatCurrency(selectedSlip.basic_salary)}</td>
                          </tr>
                          <tr>
                            <td>House Rent Allowance (HRA)</td>
                            <td className="amount">{formatCurrency(selectedSlip.hra_amount || (selectedSlip.basic_salary * 0.4))}</td>
                          </tr>
                          <tr>
                            <td>Special / Other Allowances</td>
                            <td className="amount">{formatCurrency(selectedSlip.allowances_amount || 0)}</td>
                          </tr>
                          <tr className="total-row">
                            <td>Total Gross Earnings</td>
                            <td className="amount">{formatCurrency(selectedSlip.gross_salary)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Deductions Table */}
                    <div className="breakdown-box">
                      <h4>Deductions</h4>
                      <table className="breakdown-table">
                        <tbody>
                          <tr>
                            <td>Attendance / Leave Deductions</td>
                            <td className="amount">{formatCurrency(selectedSlip.deduction_amount || 0)}</td>
                          </tr>
                          <tr>
                            <td>Professional Tax / Other</td>
                            <td className="amount">{formatCurrency(selectedSlip.other_deductions || 0)}</td>
                          </tr>
                          <tr className="total-row">
                            <td>Total Deductions</td>
                            <td className="amount">{formatCurrency(selectedSlip.deduction_amount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Net Payable Banner */}
                  <div className="net-payable-banner">
                    <div>
                      <span>Net Payable Salary</span>
                      <p>Gross Earnings minus Total Deductions</p>
                    </div>
                    <div className="net-amount">
                      {formatCurrency(selectedSlip.net_salary)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSalarySlips;
