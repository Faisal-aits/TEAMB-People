import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { reportAPI } from '../../services/reportAPI';
import './ReportsManagement.css';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const today = () => new Date().toISOString().slice(0, 10);

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    employee_id: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  const loadReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [reportsResult, employeesResult] = await Promise.allSettled([
        reportAPI.getReports(filters),
        reportAPI.getReportEmployees(),
      ]);

      if (reportsResult.status === 'fulfilled') {
        setReports(reportsResult.value.data?.reports || reportsResult.value.data?.data || []);
      } else {
        setReports([]);
        setError('Unable to load reports.');
      }

      if (employeesResult.status === 'fulfilled') {
        setEmployees(employeesResult.value.data?.employees || employeesResult.value.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load reports.');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) => {
      const text = [
        report.employee_name,
        report.employee_email,
        report.report_text,
        report.admin_remark,
        report.report_date,
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(query);
    });
  }, [reports, searchTerm]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ date_from: '', date_to: '', employee_id: '' });
    setSearchTerm('');
  };

  const openRemarkModal = (report) => {
    setSelectedReport(report);
    setRemarkText(report.admin_remark || '');
  };

  const closeRemarkModal = () => {
    setSelectedReport(null);
    setRemarkText('');
  };

  const saveRemark = async () => {
    if (!selectedReport) return;
    try {
      setSavingRemark(true);
      const response = await reportAPI.updateRemark(selectedReport.id, remarkText);
      const updated = response.data?.report || response.data?.data;
      setReports((prev) => prev.map((report) => report.id === selectedReport.id ? { ...report, ...updated } : report));
      closeRemarkModal();
    } catch (err) {
      console.error('Failed to save remark:', err);
      setError(err.response?.data?.message || 'Unable to save remark.');
    } finally {
      setSavingRemark(false);
    }
  };

  const exportReports = () => {
    if (filteredReports.length === 0) {
      setError('No reports available to export.');
      return;
    }

    const rows = filteredReports.map((report) => ({
      Date: formatDate(report.report_date),
      Employee: report.employee_name,
      Email: report.employee_email,
      Report: report.report_text,
      Remark: report.admin_remark || '',
      Submitted: report.created_at ? new Date(report.created_at).toLocaleString('en-IN') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 24 },
      { wch: 28 },
      { wch: 64 },
      { wch: 44 },
      { wch: 22 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
    XLSX.writeFile(workbook, `Employee_Reports_${today()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="reports-management">
        <div className="reports-loading">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="reports-management">
      <header className="reports-header">
        <div>
          <span>Admin Reports</span>
          <h1>Employee Reports</h1>
        </div>
        <div className="reports-header-actions">
          <button type="button" className="reports-secondary-btn" onClick={() => loadReports(true)} disabled={refreshing}>
            <HiOutlineArrowPath />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
          <button type="button" className="reports-primary-btn" onClick={exportReports}>
            <HiOutlineArrowDownTray />
            Export
          </button>
        </div>
      </header>

      {error && <div className="reports-alert">{error}</div>}

      <section className="reports-filters">
        <label>
          <span>From</span>
          <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
        </label>
        <label>
          <span>To</span>
          <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
        </label>
        <label>
          <span>Employee</span>
          <select name="employee_id" value={filters.employee_id} onChange={handleFilterChange}>
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name || employee.email}
              </option>
            ))}
          </select>
        </label>
        <label className="reports-search">
          <span>Search</span>
          <div>
            <HiOutlineMagnifyingGlass />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search report or remark..."
            />
          </div>
        </label>
        <button type="button" className="reports-clear-btn" onClick={clearFilters}>Clear</button>
      </section>

      <section className="reports-table-panel">
        <div className="reports-table-title">
          <div>
            <h2>Reports</h2>
            <p>{filteredReports.length} of {reports.length}</p>
          </div>
        </div>

        <div className="reports-table-wrap">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Report</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="reports-empty">
                      <HiOutlineDocumentText />
                      <span>No reports found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>{formatDate(report.report_date)}</td>
                    <td>
                      <div className="reports-employee-cell">
                        <strong>{report.employee_name}</strong>
                        <span>{report.employee_email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="reports-text-cell">{report.report_text}</div>
                    </td>
                    <td>
                      {report.admin_remark ? (
                        <div className="reports-remark-cell">{report.admin_remark}</div>
                      ) : (
                        <span className="reports-muted">No remark</span>
                      )}
                    </td>
                    <td>
                      <button type="button" className="reports-remark-btn" onClick={() => openRemarkModal(report)}>
                        <HiOutlineChatBubbleLeftRight />
                        Remark
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReport && (
        <div className="reports-modal-overlay" onClick={closeRemarkModal} role="presentation">
          <div className="reports-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="report-remark-title">
            <div className="reports-modal-header">
              <div>
                <h2 id="report-remark-title">Report Remark</h2>
                <p>{selectedReport.employee_name} - {formatDate(selectedReport.report_date)}</p>
              </div>
              <button type="button" onClick={closeRemarkModal}>Close</button>
            </div>
            <div className="reports-modal-body">
              <div className="reports-original-report">
                <span>Report</span>
                <p>{selectedReport.report_text}</p>
              </div>
              <label>
                <span>Remark</span>
                <textarea
                  value={remarkText}
                  onChange={(event) => setRemarkText(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Write a remark for the employee..."
                />
              </label>
            </div>
            <div className="reports-modal-actions">
              <span>{remarkText.length}/2000</span>
              <button type="button" onClick={saveRemark} disabled={savingRemark}>
                {savingRemark ? 'Saving...' : 'Save Remark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
