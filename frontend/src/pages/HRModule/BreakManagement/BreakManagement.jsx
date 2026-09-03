import React, { useState, useEffect } from 'react';
import { FaSync, FaExclamationTriangle, FaFileExport, FaHistory } from 'react-icons/fa';
import { breakAPI } from '../../../services/breakAPI';
import { employeeAPI } from '../../../services/employeeAPI';
import * as XLSX from 'xlsx';
import './BreakManagement.css';

const getTodayIST = () => {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).split(' ')[0];
};

const getMonthStartIST = () => {
  const today = getTodayIST();
  return `${today.substring(0, 7)}-01`;
};

const BreakManagement = () => {
  const [users, setUsers] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    date: getTodayIST(),
  });

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: getMonthStartIST(),
    endDate: getTodayIST(),
    department: ''
  });
  const [reportData, setReportData] = useState([]);

  // Employee History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeHistoryData, setEmployeeHistoryData] = useState([]);

  // Fetch departments (optional, if we want to populate the dropdown)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await employeeAPI.getDepartments();
        if (response.data && response.data.departments) {
          setDepartments(response.data.departments);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersResponse, breaksResponse] = await Promise.all([
        employeeAPI.getAll().catch(err => {
          console.error("Failed to fetch users", err);
          return { data: { users: [] } };
        }),
        breakAPI.getAllBreaks({
          startDate: filters.date,
          endDate: filters.date
        }).catch(err => {
          console.error("Failed to fetch breaks", err);
          return { data: { data: [] } };
        })
      ]);

      let allUsersList = [];
      if (usersResponse.data && usersResponse.data.users) {
        allUsersList = usersResponse.data.users;
      } else if (usersResponse.data && usersResponse.data.employees) {
        allUsersList = usersResponse.data.employees;
      } else if (Array.isArray(usersResponse.data)) {
        allUsersList = usersResponse.data;
      } else if (Array.isArray(usersResponse)) {
        allUsersList = usersResponse;
      }

      const activeUsers = (allUsersList || []).filter(user => {
        if (!user) return false;
        let isDeleted = false;
        if (user.deleted_at && user.deleted_at !== null) isDeleted = true;
        if (user.is_deleted === true || user.is_deleted === 1 || user.is_deleted === '1') isDeleted = true;
        if (user.deleted === true || user.deleted === 1) isDeleted = true;
        if (user.status === 'deleted' || user.status === 'inactive') isDeleted = true;
        const isInactive = (user.is_active === false || user.is_active === 0 || user.is_active === '0');
        return !isDeleted && !isInactive;
      });

      setUsers(activeUsers);

      const breaksData = breaksResponse.data?.data || [];
      setBreaks(breaksData);

      // Merge data
      const merged = activeUsers.map(user => {
        const userKeys = [user.employee_id, user.user_id, user.id, user.emp_id].filter(Boolean).map(String);
        
        // Find if user has a break record today
        const userBreaks = breaksData.filter(b => {
           const breakKeys = [b.employee_id, b.user_id, b.employee_detail_id, b.employee_code].filter(Boolean).map(String);
           return userKeys.some(key => breakKeys.includes(key));
        });

        const sortedBreaks = [...userBreaks].sort((a, b) => new Date(b.break_in_time) - new Date(a.break_in_time));
        const latestBreak = sortedBreaks.length > 0 ? sortedBreaks[0] : null;

        return {
          id: user.id || user.user_id || user.employee_id,
          employee_id: user.employee_id || user.id,
          first_name: user.first_name || user.name || '',
          last_name: user.last_name || '',
          department: user.department_name || user.department || 'Unknown',
          designation: user.position || user.designation || '-',
          
          break_in_time: latestBreak?.break_in_time || null,
          break_out_time: latestBreak?.break_out_time || null,
          duration_minutes: latestBreak ? (latestBreak.duration_minutes ?? '-') : '-',
          status: latestBreak?.status || 'Not Taken Yet',
          break_date: latestBreak?.break_date || filters.date,
          original_break_record: latestBreak
        };
      });

      setMergedData(merged);

    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeData();
  }, [filters]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleRefresh = () => {
    initializeData();
  };

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      if (!reportFilters.startDate || !reportFilters.endDate) {
        alert('Please select both start and end dates');
        setReportLoading(false);
        return;
      }

      const [usersResponse, breaksResponse] = await Promise.all([
        employeeAPI.getAll().catch(() => ({ data: { users: [] } })),
        breakAPI.getAllBreaks({
          startDate: reportFilters.startDate,
          endDate: reportFilters.endDate
        }).catch(() => ({ data: { data: [] } }))
      ]);

      let allUsersList = [];
      if (usersResponse.data && usersResponse.data.users) {
        allUsersList = usersResponse.data.users;
      } else if (usersResponse.data && usersResponse.data.employees) {
        allUsersList = usersResponse.data.employees;
      } else if (Array.isArray(usersResponse.data)) {
        allUsersList = usersResponse.data;
      } else if (Array.isArray(usersResponse)) {
        allUsersList = usersResponse;
      }

      const activeUsers = (allUsersList || []).filter(user => {
        if (!user) return false;
        let isDeleted = false;
        if (user.deleted_at && user.deleted_at !== null) isDeleted = true;
        const isInactive = (user.is_active === false || user.is_active === 0 || user.is_active === '0');
        return !isDeleted && !isInactive;
      });

      let filteredUsers = activeUsers;
      if (reportFilters.department) {
        filteredUsers = activeUsers.filter(user => 
          (user.department_name || user.department) === reportFilters.department
        );
      }

      const breaksData = breaksResponse.data?.data || [];

      // 1. Generate date range array
      const monthNamesShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dateRange = [];
      
      const startParts = reportFilters.startDate.split('-');
      const endParts = reportFilters.endDate.split('-');
      
      const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
      const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

      let curr = new Date(start);
      while (curr <= end) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        
        const dayNum = curr.getDate();
        const monthShort = monthNamesShort[curr.getMonth()];
        const yearNum = curr.getFullYear();
        
        const headerLabel = `${dayNum} ${monthShort} ${yearNum}`;
        dateRange.push({ dateKey, headerLabel });

        curr.setDate(curr.getDate() + 1);
      }

      // 2. Construct matrix rows for each employee
      const formattedReport = filteredUsers.map((user, index) => {
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || 'Unknown';
        const userKeys = [user.employee_id, user.user_id, user.id, user.emp_id].filter(Boolean).map(String);

        const row = {
          'SR NO': index + 1,
          'EMPLOYEE ID': user.employee_id || user.id || '-',
          'EMPLOYEE NAME': userName,
          'DEPARTMENT': user.department_name || user.department || '-'
        };

        let totalBreakMins = 0;
        let activeBreakDays = 0;

        dateRange.forEach(day => {
          // Find unique break records for this user on this day
          const dayBreaks = breaksData.filter(b => {
            if (!b.break_date) return false;
            let bDateStr = '';
            if (typeof b.break_date === 'string' && b.break_date.includes('T')) {
              bDateStr = b.break_date.split('T')[0];
            } else if (typeof b.break_date === 'string' && b.break_date.length >= 10) {
              bDateStr = b.break_date.substring(0, 10);
            } else {
              bDateStr = new Date(b.break_date).toISOString().split('T')[0];
            }

            if (bDateStr !== day.dateKey) return false;

            const bKeys = [b.employee_id, b.user_id, b.employee_detail_id, b.employee_code].filter(Boolean).map(String);
            return userKeys.some(k => bKeys.includes(k));
          });

          let dayMins = 0;
          dayBreaks.forEach(b => {
            let dur = parseInt(b.duration_minutes) || 0;
            if (dur === 0 && b.break_in_time && b.break_out_time) {
              dur = Math.round((new Date(b.break_out_time) - new Date(b.break_in_time)) / (1000 * 60)) || 0;
            }
            dayMins += dur;
          });

          if (dayBreaks.length > 0 && dayMins > 0) {
            row[day.headerLabel] = `${dayMins} mins`;
            totalBreakMins += dayMins;
            activeBreakDays++;
          } else {
            row[day.headerLabel] = '0';
          }
        });

        const avgMins = activeBreakDays > 0 ? (totalBreakMins / activeBreakDays).toFixed(1) : '0';

        row['TOTAL BREAK TIME (MINS)'] = `${totalBreakMins} mins`;
        row['AVG BREAK TIME (MINS)'] = `${avgMins} mins`;

        return row;
      });

      if (formattedReport.length === 0) {
        alert('No records found for the selected filters.');
        setReportData([]);
        return;
      }

      setReportData(formattedReport);

    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report: ' + (err.message || 'Unknown error'));
    } finally {
      setReportLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Breaks Report');
    XLSX.writeFile(workbook, `Break_Report_${reportFilters.startDate}_to_${reportFilters.endDate}.xlsx`);
  };

  const handleViewHistory = async (employee) => {
    try {
      setSelectedEmployee(employee);
      setIsHistoryModalOpen(true);
      setHistoryLoading(true);
      const targetId = employee.employee_id || employee.id;
      const response = await breakAPI.getEmployeeHistory(targetId);
      
      if (response.data && response.data.data) {
        setEmployeeHistoryData(response.data.data);
      } else {
        setEmployeeHistoryData([]);
      }
    } catch (err) {
      console.error('Error fetching employee history:', err);
      alert('Failed to fetch employee history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const exportEmployeeHistoryToExcel = () => {
    if (employeeHistoryData.length === 0) {
      alert('No history data to export');
      return;
    }
    const exportData = employeeHistoryData.map((b, idx) => ({
      'Sr No': idx + 1,
      'Date': b.break_date ? new Date(b.break_date).toLocaleDateString() : '-',
      'Break In': b.break_in_time ? new Date(b.break_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      'Break Out': b.break_out_time ? new Date(b.break_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      'Duration (Mins)': b.duration_minutes || '0',
      'Status': b.status || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${selectedEmployee?.first_name}_History`);
    XLSX.writeFile(workbook, `${selectedEmployee?.first_name}_${selectedEmployee?.last_name}_Breaks_History.xlsx`);
  };

  // Stats calculation
  const stats = {
    totalUsers: mergedData.length,
    activeBreaks: mergedData.filter(m => m.status?.toLowerCase() === 'active').length,
    completedBreaks: mergedData.filter(m => m.status?.toLowerCase() === 'completed').length,
    notTaken: mergedData.filter(m => m.status === 'Not Taken Yet').length
  };

  // Filtering
  const filteredData = mergedData.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${b.first_name} ${b.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (b.employee_id || '').toLowerCase().includes(q) ||
      (b.department || '').toLowerCase().includes(q)
    );
  });

  // Sorting
  const filteredAndSortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    let badgeClass = 'break-status-badge ';
    const normalized = (status || '').toLowerCase();
    
    if (normalized === 'active') badgeClass += 'break-status-active';
    else if (normalized === 'completed') badgeClass += 'break-status-completed';
    else badgeClass += 'break-status-not-taken';

    return <span className={badgeClass}>{status}</span>;
  };

  return (
    <div className="attendance-management-section">
      <div className="attendance-management-header">
        <h2>Break Management</h2>
        <div className="attendance-header-actions">
           <button className="attendance-action-btn btn-refresh" onClick={handleRefresh}>
            <FaSync className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="attendance-action-btn"
            onClick={() => setIsReportModalOpen(true)}
          >
            <FaFileExport /> Break Report
          </button>
        </div>
      </div>

      <div className="attendance-dashboard-stats">
        <div className="attendance-stat-card">
          <div className="attendance-stat-number" style={{color: '#3b82f6'}}>{stats.activeBreaks}</div>
          <div className="attendance-stat-label">Active Breaks</div>
        </div>
        <div className="attendance-stat-card">
          <div className="attendance-stat-number" style={{color: '#10b981'}}>{stats.completedBreaks}</div>
          <div className="attendance-stat-label">Completed Breaks</div>
        </div>
        <div className="attendance-stat-card">
          <div className="attendance-stat-number" style={{color: '#6b7280'}}>{stats.notTaken}</div>
          <div className="attendance-stat-label">Not Taken</div>
        </div>
        <div className="attendance-stat-card">
          <div className="attendance-stat-number">{stats.totalUsers}</div>
          <div className="attendance-stat-label">Total Users</div>
        </div>
      </div>

      <div className="attendance-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ backgroundColor: 'white' }}>
          <label style={{marginRight: '10px', backgroundColor: 'white'}}>Date:</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={(e) => setFilters({ date: e.target.value })}
            className="filter-date"
          />
        </div>
      </div>

      {error && (
        <div className="attendance-error" style={{color: 'red', marginBottom: '10px'}}>
          <FaExclamationTriangle /> {error}
        </div>
      )}

      <div className="attendance-table-container">
        <div className="attendance-table-wrapper">
          <table className="attendance-main-table">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('first_name')}>Employee Name {renderSortIcon('first_name')}</th>
                <th className="sortable-th" onClick={() => handleSort('department')}>Department {renderSortIcon('department')}</th>
                <th>Break In</th>
                <th>Break Out</th>
                <th className="sortable-th" onClick={() => handleSort('duration_minutes')}>Duration (Mins) {renderSortIcon('duration_minutes')}</th>
                <th className="sortable-th" onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center loading-cell" style={{textAlign: 'center', padding: '20px'}}>
                    <FaSync className="spinning" /> Loading data...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="employee-info">
                        <div className="employee-name">{b.first_name} {b.last_name}</div>
                      </div>
                    </td>
                    <td>{b.department}</td>
                    <td>{formatTime(b.break_in_time)}</td>
                    <td>{formatTime(b.break_out_time)}</td>
                    <td>{b.duration_minutes}</td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td>
                      <button
                        className="btn-page"
                        title="View History"
                        onClick={() => handleViewHistory(b)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4f46e5' }}
                      >
                        <FaHistory /> History
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center" style={{textAlign: 'center', padding: '20px'}}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredAndSortedData.length > 0 && (
        <div className="pagination-container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '16px 20px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb'}}>
          <div className="pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
          </div>
          <div className="pagination-controls" style={{display: 'flex', gap: '15px'}}>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="items-per-page-select"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <div className="pagination-buttons" style={{display: 'flex', gap: '5px'}}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="btn-page"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="btn-page"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal-content attendance-large-modal">
            <div className="attendance-modal-header">
              <h2>Break Report</h2>
              <button className="attendance-close-btn" onClick={() => setIsReportModalOpen(false)}>×</button>
            </div>
            <div className="attendance-details-content">
              <div className="attendance-form-section">
                <h3>Report Filters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '20px' }}>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500'}}>Start Date</label>
                    <input type="date" value={reportFilters.startDate} onChange={(e) => setReportFilters({ ...reportFilters, startDate: e.target.value })} style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500'}}>End Date</label>
                    <input type="date" value={reportFilters.endDate} onChange={(e) => setReportFilters({ ...reportFilters, endDate: e.target.value })} style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}} />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500'}}>Department</label>
                    <select value={reportFilters.department} onChange={(e) => setReportFilters({ ...reportFilters, department: e.target.value })} style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}>
                      <option value="">All Departments</option>
                      {departments.map(dept => <option key={dept.id || dept.name} value={dept.name}>{dept.name}</option>)}
                    </select>
                  </div>
                  <div style={{display: 'flex', alignItems: 'flex-end'}}>
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={reportLoading}
                      className="attendance-action-btn"
                      style={{width: '100%', justifyContent: 'center', height: '37px'}}
                    >
                      {reportLoading ? 'Generating...' : 'Generate Report'}
                    </button>
                  </div>
                </div>
              </div>
              
              {reportData.length > 0 && (
                <div className="attendance-form-section">
                  <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                    <button onClick={exportToExcel} className="attendance-action-btn" style={{ backgroundColor: '#10b981', color: 'white' }}>
                      <FaFileExport /> Export to Excel
                    </button>
                  </div>
                  <div className="attendance-table-wrapper" style={{maxHeight: '400px', overflow: 'auto'}}>
                    <table className="attendance-main-table">
                      <thead style={{position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1}}>
                        <tr>
                          {Object.keys(reportData[0]).map(key => (
                            <th key={key} style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: '12px', fontWeight: '600' }}>
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((row, idx) => (
                          <tr key={idx}>
                            {Object.entries(row).map(([key, val], i) => (
                              <td 
                                key={i} 
                                style={{ 
                                  whiteSpace: 'nowrap', 
                                  padding: '8px 14px',
                                  fontWeight: key.includes('MINS') ? '600' : 'normal',
                                  color: key.includes('AVG') ? '#2563eb' : key.includes('TOTAL') ? '#16a34a' : 'inherit'
                                }}
                              >
                                {val || '0'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee History Modal */}
      {isHistoryModalOpen && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal-content attendance-large-modal">
            <div className="attendance-modal-header">
              <h2>{selectedEmployee?.first_name} {selectedEmployee?.last_name} - Break History</h2>
              <button className="attendance-close-btn" onClick={() => setIsHistoryModalOpen(false)}>×</button>
            </div>
            <div className="attendance-details-content">
              {historyLoading ? (
                 <div style={{textAlign: 'center', padding: '20px'}}>
                   <FaSync className="spinning" /> Loading history...
                 </div>
              ) : (
                <div className="attendance-form-section">
                  <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                    <button onClick={exportEmployeeHistoryToExcel} className="attendance-action-btn" style={{ backgroundColor: '#10b981', color: 'white' }}>
                      <FaFileExport /> Export to Excel
                    </button>
                  </div>
                  {employeeHistoryData.length > 0 ? (
                    <div className="attendance-table-wrapper" style={{maxHeight: '400px', overflowY: 'auto'}}>
                      <table className="attendance-main-table">
                        <thead style={{position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1}}>
                          <tr>
                            <th>Date</th>
                            <th>Break In</th>
                            <th>Break Out</th>
                            <th>Duration (Mins)</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeHistoryData.map((b, idx) => (
                            <tr key={idx}>
                              <td>{b.break_date ? new Date(b.break_date).toLocaleDateString() : '-'}</td>
                              <td>{formatTime(b.break_in_time)}</td>
                              <td>{formatTime(b.break_out_time)}</td>
                              <td>{b.duration_minutes || '0'}</td>
                              <td>{getStatusBadge(b.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{textAlign: 'center', padding: '20px'}}>No break history found for this employee.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakManagement;
