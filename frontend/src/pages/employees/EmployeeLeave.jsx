// src/pages/employees/EmployeeLeave.jsx
import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/leaveAPI';
import * as XLSX from 'xlsx';
import { useTableControls } from '../../hooks/useTableControls';
import '../../styles/tableControls.css';
import './EmployeeLeave.css';

const LEAVE_SEARCH_FIELDS = ['created_at', 'leave_type', 'description', 'start_date', 'end_date', 'total_days', 'status', 'leave_id'];

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveFilterStatus, setLeaveFilterStatus] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myBalances, setMyBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  const [leaveFormData, setLeaveFormData] = useState({
    description: '',
    duration_type: 'single',
    start_date: '',
    end_date: '',
    leave_type: 'Casual',
  });

  // ==================== LEAVE FUNCTIONS ====================
  const getDefaultLeaveType = (types = leaveTypes) => types[0]?.name || 'Casual';

  const loadLeaveTypes = async () => {
    try {
      const response = await leaveAPI.getLeaveTypes();
      const types = (response.data?.leave_types || []).filter(t => String(t.name || '').trim().toLowerCase() !== 'unpaid');
      setLeaveTypes(types);
      setLeaveFormData(prev => {
        const hasCurrentType = types.some(type => type.name === prev.leave_type);
        return hasCurrentType ? prev : { ...prev, leave_type: getDefaultLeaveType(types) };
      });
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  };

  const loadCurrentEmployeeData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const user = JSON.parse(userData);
      if (user.id) {
        setCurrentUser({
          ...user,
          display_name: `${user.first_name} ${user.last_name}`
        });
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const loadMyLeaves = async () => {
    try {
      setLeaveLoading(true);
      const response = await leaveAPI.getMyLeaves();
      setLeaves(response.data.leaves || []);
      if (response.data.employee_id) {
        setCurrentUser(prev => ({
          ...prev,
          employee_id: response.data.employee_id
        }));

        try {
          const balRes = await leaveAPI.getMyBalances();
          setMyBalances(balRes.data?.balances || []);
        } catch (balErr) {
          console.error('Error fetching my balances:', balErr);
          setMyBalances([]);
        }
      }
    } catch (error) {
      console.error('Error loading my leaves:', error);
      alert('Error loading your leave data. Please try again.');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isPLType = (type) => {
    const norm = String(type || '').toUpperCase();
    return norm.startsWith('PL') || norm.includes('PRIVILEGE') || norm.includes('PLANNED');
  };

  const getMinStartDate = (leaveType) => {
    const today = new Date();
    if (isPLType(leaveType)) {
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + 7);
      return minDate.toISOString().split('T')[0];
    }
    return today.toISOString().split('T')[0];
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    
    const isSingle = leaveFormData.duration_type === 'single';
    const effectiveEndDate = isSingle ? leaveFormData.start_date : leaveFormData.end_date;
    
    if (!leaveFormData.description || !leaveFormData.start_date || !effectiveEndDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(leaveFormData.start_date) > new Date(effectiveEndDate)) {
      alert('End date cannot be before start date');
      return;
    }

    if (isPLType(leaveFormData.leave_type)) {
      const minAllowed = getMinStartDate(leaveFormData.leave_type);
      if (leaveFormData.start_date < minAllowed) {
        alert('PL (Paid Leave) must be requested at least 1 week (7 days) in advance.');
        return;
      }
    }

    if (!currentUser || !currentUser.id) {
      alert('User information not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveData = {
        description: leaveFormData.description,
        start_date: leaveFormData.start_date,
        end_date: effectiveEndDate,
        leave_type: leaveFormData.leave_type || 'Casual',
      };
      
      await leaveAPI.create(leaveData);
      
      setLeaveFormData({
        description: '',
        duration_type: 'single',
        start_date: '',
        end_date: '',
        leave_type: getDefaultLeaveType(),
      });
      
      setIsLeaveModalOpen(false);
      await loadMyLeaves();
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('? Error submitting leave request:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting leave request. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await leaveAPI.delete(leaveId);
        await loadMyLeaves();
        alert('Leave request deleted successfully!');
      } catch (error) {
        console.error('Error deleting leave:', error);
        alert('Error deleting leave request. Please try again.');
      }
    }
  };

  const handleExportLeaves = () => {
    try {
      const exportData = visibleLeaves.map(leave => ({
        'Applied Date': formatDate(leave.created_at),
        'Type': leave.leave_type || 'Casual',
        'Description': leave.description,
        'From Date': formatDate(leave.start_date),
        'To Date': formatDate(leave.end_date),
        'Total Days': `${leave.total_days} day(s)`,
        'Status': leave.status,
        'Leave ID': leave.leave_id,
        'Employee ID': leave.employee_id
      }));

      if (exportData.length === 0) {
        alert('No data to export!');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Requests');
      const fileName = `My_Leave_Requests_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('? Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const getLeaveStatusBadge = (status) => {
    const statusClasses = {
      'Approved': 'leave-status--approved',
      'Pending': 'leave-status--pending',
      'Rejected': 'leave-status--rejected'
    };
    return (
      <span className={`leave-status-badge ${statusClasses[status]}`} style={{ textTransform: 'uppercase' }}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredLeaves = leaveFilterStatus === 'All' 
    ? leaves 
    : leaves.filter(leave => leave.status === leaveFilterStatus);

  const {
    controlledRows: visibleLeaves,
    searchTerm: leaveSearch,
    setSearchTerm: setLeaveSearch,
    requestSort: requestLeaveSort,
    sortLabel: leaveSortLabel,
  } = useTableControls(filteredLeaves, LEAVE_SEARCH_FIELDS, { key: 'created_at', accessor: 'created_at', direction: 'desc' });

  useEffect(() => {
    loadCurrentEmployeeData();
    loadLeaveTypes();
    loadMyLeaves();
  }, []);

  // ==================== RENDER ====================
  if (leaveLoading) {
    return (
      <div className="leave-management-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-management-section">
      <div className="leave-management-header">
        <h2 className="leave-management-title">Leave Management</h2>
        <button 
          className="leave-add-btn"
          onClick={() => setIsLeaveModalOpen(true)}
          disabled={!currentUser}
        >
          <span className="leave-btn-icon">+</span>
          Apply for Leave
        </button>
      </div>

      {currentUser && myBalances.length > 0 && (
        <div className="leave-balances-grid">
          {myBalances.filter(b => String(b.leave_type || '').trim().toLowerCase() !== 'unpaid').map((bal) => (
            <div key={bal.leave_type} className="leave-balance-card">
              <div className="leave-balance-type">
                {bal.allocation_frequency && bal.allocation_frequency !== 'Yearly' && bal.allocation_frequency !== 'None'
                  ? `${bal.leave_type} (${bal.allocation_frequency})`
                  : bal.leave_type}
              </div>
              <div className="leave-balance-value">
                <span className="balance-remaining">{bal.remaining !== undefined ? bal.remaining : (bal.allocated - bal.used - bal.pending)}</span>
                <span className="balance-divider">/</span>
                <span className="balance-allocated">{bal.allocated}</span>
              </div>
              <div className="leave-balance-usage">
                Used: {bal.used} | Pending: {bal.pending}
              </div>
            </div>
          ))}
        </div>
      )}

      {!currentUser && (
        <div className="error-message">
          <p>Unable to load user information. Please contact administrator.</p>
        </div>
      )}

      <div className="leave-table-container glass-form-leave">
        <div className="leave-table-header">
          <h3 className="leave-table-title">My Leave Requests</h3>
          <div className="leave-table-actions">
            <input
              type="search"
              className="table-search-input"
              placeholder="Search leaves..."
              value={leaveSearch}
              onChange={(event) => setLeaveSearch(event.target.value)}
            />
            <select 
              className="leave-filter-select"
              value={leaveFilterStatus}
              onChange={(e) => setLeaveFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button 
              className="leave-export-btn" 
              onClick={handleExportLeaves}
              disabled={visibleLeaves.length === 0}
            >
              Export
            </button>
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="leave-records-table">
            <thead>
              <tr>
                <th className="leave-th-date sortable-th" onClick={() => requestLeaveSort('created_at', 'created_at')}>Applied Date{leaveSortLabel('created_at')}</th>
                <th className="sortable-th" onClick={() => requestLeaveSort('leave_type', 'leave_type')}>Type{leaveSortLabel('leave_type')}</th>
                <th className="leave-th-description sortable-th" onClick={() => requestLeaveSort('description', 'description')}>Description{leaveSortLabel('description')}</th>
                <th className="leave-th-from sortable-th" onClick={() => requestLeaveSort('start_date', 'start_date')}>From Date{leaveSortLabel('start_date')}</th>
                <th className="leave-th-to sortable-th" onClick={() => requestLeaveSort('end_date', 'end_date')}>To Date{leaveSortLabel('end_date')}</th>
                <th className="leave-th-days sortable-th" onClick={() => requestLeaveSort('total_days', 'total_days')}>Total Days{leaveSortLabel('total_days')}</th>
                <th className="leave-th-status sortable-th" onClick={() => requestLeaveSort('status', 'status')}>Status{leaveSortLabel('status')}</th>
                <th className="leave-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.map(leave => (
                <tr key={leave.leave_id} className="leave-table-row">
                  <td className="leave-td-date">
                    <div className="leave-date-cell">{formatDate(leave.created_at)}</div>
                  </td>
                  <td>
                    <span className={`leave-type-badge leave-type-${leave.leave_type?.toLowerCase() || 'casual'}`}>
                      {leave.leave_type || 'Casual'}
                    </span>
                  </td>
                  <td className="leave-td-description">
                    <div className="leave-description-cell">{leave.description}</div>
                  </td>
                  <td className="leave-td-from">
                    <div className="leave-date-cell">{formatDate(leave.start_date)}</div>
                  </td>
                  <td className="leave-td-to">
                    <div className="leave-date-cell">{formatDate(leave.end_date)}</div>
                  </td>
                  <td className="leave-td-days">
                    <div className="leave-days-cell">{leave.total_days} day(s)</div>
                  </td>
                  <td className="leave-td-status">
                    {getLeaveStatusBadge(leave.status)}
                  </td>
                  <td className="leave-td-actions">
                    {leave.status === 'Pending' && (
                      <button
                        className="leave-delete-btn"
                        onClick={() => handleDeleteLeave(leave.leave_id)}
                        title="Delete Leave Request"
                      >
                       <i className="fa-solid fa-trash-arrow-up"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleLeaves.length === 0 && (
          <div className="no-leaves">
            <div className="no-data-icon">??</div>
            <p>No leave requests found</p>
            <p className="no-data-subtext">
              {leaveFilterStatus !== 'All' || leaveSearch
                ? 'Try changing your search or status filter to see more results.'
                : 'Get started by applying for your first leave.'}
            </p>
            {leaveFilterStatus === 'All' && currentUser && (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="add-first-btn"
              >
                Apply for Leave
              </button>
            )}
          </div>
        )}
      </div>

      {/* Leave Modal */}
      {isLeaveModalOpen && (
        <div className="leave-modal-overlay">
          <div className="leave-modal-content">
            <div className="leave-modal-header">
              <h2 className="leave-modal-title">Apply for Leave</h2>
              <button 
                className="leave-modal-close"
                onClick={() => setIsLeaveModalOpen(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="leave-form">
              <div className="leave-form-group">
                <label className="leave-form-label">Employee Name</label>
                <input
                  type="text"
                  value={currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : ''}
                  disabled
                  className="leave-disabled-input"
                />
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">Employee ID</label>
                <input
                  type="text"
                  value={currentUser?.employee_id || 'Loading...'}
                  disabled
                  className="leave-disabled-input"
                />
                <small className="leave-helper-text">
                  Your employee ID will be automatically retrieved by the system
                </small>
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">Leave Type *</label>
                <select
                  name="leave_type"
                  value={leaveFormData.leave_type}
                  onChange={handleLeaveInputChange}
                  required
                  className="leave-form-select"
                >
                  {leaveTypes.length > 0 ? (
                    leaveTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.name === 'PL' ? 'PL (Quarterly)' : type.name === 'PSL' ? 'PSL (Yearly)' : type.name} Leave
                      </option>
                    ))
                  ) : (
                    <option value="Casual">Casual Leave</option>
                  )}
                </select>
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">Description *</label>
                <input
                  type="text"
                  name="description"
                  value={leaveFormData.description}
                  onChange={handleLeaveInputChange}
                  placeholder="Enter leave reason (e.g., Sick Leave, Vacation, Personal)"
                  required
                  className="leave-form-input"
                />
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">Duration Type</label>
                <div className="leave-duration-options" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="duration_type"
                      value="single"
                      checked={leaveFormData.duration_type === 'single'}
                      onChange={handleLeaveInputChange}
                    />
                    Single Day
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="duration_type"
                      value="multiple"
                      checked={leaveFormData.duration_type === 'multiple'}
                      onChange={handleLeaveInputChange}
                    />
                    Multiple Days
                  </label>
                </div>
              </div>

              <div className="leave-form-group">
                <label className="leave-form-label">{leaveFormData.duration_type === 'single' ? 'Date *' : 'From Date *'}</label>
                <input
                  type="date"
                  name="start_date"
                  value={leaveFormData.start_date}
                  onChange={handleLeaveInputChange}
                  required
                  className="leave-form-input"
                  min={getMinStartDate(leaveFormData.leave_type)}
                />
                {isPLType(leaveFormData.leave_type) && (
                  <small className="leave-helper-text" style={{ color: '#d97706', display: 'block', marginTop: '4px', fontWeight: '600' }}>
                    Note: PL (Paid Leave) must be requested at least 1 week (7 days) in advance.
                  </small>
                )}
              </div>

              {leaveFormData.duration_type === 'multiple' && (
                <div className="leave-form-group">
                  <label className="leave-form-label">To Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={leaveFormData.end_date}
                    onChange={handleLeaveInputChange}
                    required
                    className="leave-form-input"
                    min={leaveFormData.start_date || new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

              {leaveFormData.start_date && (leaveFormData.duration_type === 'single' || leaveFormData.end_date) && (
                <div className="leave-form-group">
                  <label className="leave-form-label">Total Days</label>
                  <input
                    type="text"
                    value={(() => {
                      if (leaveFormData.duration_type === 'single') return '1 day(s)';
                      const start = new Date(leaveFormData.start_date);
                      const end = new Date(leaveFormData.end_date);
                      const diffTime = Math.abs(end - start);
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 + ' day(s)';
                    })()}
                    disabled
                    className="leave-disabled-input"
                  />
                </div>
              )}

              <div className="leave-form-actions">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="leave-cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="leave-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeave;
