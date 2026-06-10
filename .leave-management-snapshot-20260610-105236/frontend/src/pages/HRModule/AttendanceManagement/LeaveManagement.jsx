// src/pages/dashboard/admin/LeaveManagement.jsx
import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes, FaCalendarCheck, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { leaveAPI } from '../../../services/leaveAPI';
import { useTableControls } from '../../../hooks/useTableControls';
import './LeaveManagement.css';
import '../../../styles/tableControls.css';

const LEAVE_SEARCH_FIELDS = ['employee_name', 'employee_code', 'description', 'status', 'start_date', 'end_date'];

const LeaveManagement = () => {
  // ==================== LEAVE MANAGEMENT STATE ====================
  const [leaveData, setLeaveData] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    leave_type: 'all'
  });
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Expandable row state for balances drawer
  const [expandedLeaveId, setExpandedLeaveId] = useState(null);
  const [employeeBalances, setEmployeeBalances] = useState({});
  const [balancesLoading, setBalancesLoading] = useState({});

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Leave Statistics
  const [leaveStats, setLeaveStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    approvedDays: 0
  });

  // Attendance History Statistics
  const [attendanceHistoryStats, setAttendanceHistoryStats] = useState({
    totalPresent: 0,
    totalDelayed: 0,
    totalLeaves: 0
  });

  // Load initial data
  useEffect(() => {
    loadLeaveData();
  }, [filters]);

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getAll(filters);

      // Safely extract data with fallbacks
      const leaves = response.data?.leaves || [];
      const statistics = response.data?.statistics || {};

      // Calculate approved days
      const approvedDays = leaves
        .filter(l => l.status === 'Approved')
        .reduce((sum, l) => sum + (l.total_days || 0), 0);

      setLeaveData(leaves);
      setLeaveStats({
        totalPending: statistics.pending || 0,
        totalApproved: statistics.approved || 0,
        totalRejected: statistics.rejected || 0,
        approvedDays: approvedDays
      });
    } catch (error) {
      console.error('Error loading leave data:', error);

      setLeaveData([]);
      setLeaveStats({
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        approvedDays: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const response = await leaveAPI.getLeaveTypes();
      const types = response.data?.leave_types || [];
      setLeaveTypes(types);

      const activeTypeNames = new Set(types.filter(type => type.is_active).map(type => type.name));
      if (filters.leave_type !== 'all' && !activeTypeNames.has(filters.leave_type)) {
        setFilters(prev => ({ ...prev, leave_type: 'all' }));
      }
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  };


  const loadEmployeeAttendanceHistory = async (employeeId) => {
    try {
      const response = await leaveAPI.getEmployeeAttendanceHistory(employeeId);
      const history = response.data?.history || [];
      const statistics = response.data?.statistics || {};

      setAttendanceHistory(history);
      setAttendanceHistoryStats({
        totalPresent: statistics.present || 0,
        totalDelayed: statistics.delayed || 0,
        totalLeaves: statistics.on_leave || 0
      });
    } catch (error) {
      console.error('Error loading employee attendance history:', error);

      setAttendanceHistory([]);
      setAttendanceHistoryStats({
        totalPresent: 0,
        totalDelayed: 0,
        totalLeaves: 0
      });
    }
  };

  // Leave Functions
  const handleApproveLeave = async (leaveId) => {
    try {
      await leaveAPI.approve(leaveId);
      showToast('Leave approved successfully!', 'success');
      loadLeaveData();

      // Update balance drawer for this employee if expanded
      const leaveItem = leaveData.find(item => item.leave_id === leaveId);
      if (leaveItem && employeeBalances[leaveItem.employee_id]) {
        loadEmployeeBalances(leaveItem.employee_id);
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      const errorMessage = error.response?.data?.message || 'Error approving leave. Please try again.';
      showToast(errorMessage, 'danger');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await leaveAPI.reject(leaveId);
      setIsRejectConfirmOpen(false);
      showToast('Leave rejected successfully!', 'success');
      loadLeaveData();

      const leaveItem = leaveData.find(item => item.leave_id === leaveId);
      if (leaveItem && employeeBalances[leaveItem.employee_id]) {
        loadEmployeeBalances(leaveItem.employee_id);
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      const errorMessage = error.response?.data?.message || 'Error rejecting leave. Please try again.';
      showToast(errorMessage, 'danger');
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      await leaveAPI.delete(leaveId);
      setIsDeleteConfirmOpen(false);
      showToast('Leave request deleted successfully!', 'success');
      loadLeaveData();

      const leaveItem = leaveData.find(item => item.leave_id === leaveId);
      if (leaveItem && employeeBalances[leaveItem.employee_id]) {
        loadEmployeeBalances(leaveItem.employee_id);
      }
    } catch (error) {
      console.error('Error deleting leave:', error);
      const errorMessage = error.response?.data?.message || 'Error deleting leave. Please try again.';
      showToast(errorMessage, 'danger');
    }
  };

  // State for approve modal
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState('');

  const handleOpenApproveModal = (leaveId) => {
    setSelectedLeaveId(leaveId);
    // Reset category selection when opening modal
    setSelectedCategory('');
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    try {
      await leaveAPI.approve(selectedLeaveId, { category: selectedCategory });
      showToast('Leave approved successfully!', 'success');
      setIsApproveModalOpen(false);
      loadLeaveData();
    } catch (error) {
      console.error('Error approving leave with category:', error);
      const errorMessage = error.response?.data?.message || 'Error approving leave. Please try again.';
      showToast(errorMessage, 'danger');
    }
  };

  // Replace quick approve usage
  const handleQuickApprove = async (leaveId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      // Open modal for category selection
      handleOpenApproveModal(leaveId);
    }
  };

  const handleQuickReject = (leave, e) => {
    e.stopPropagation();
    setSelectedEmployee(leave);
    setIsRejectConfirmOpen(true);
  };

  const handleQuickDelete = (leave, e) => {
    e.stopPropagation();
    setSelectedEmployee(leave);
    setIsDeleteConfirmOpen(true);
  };

  const toggleRowExpand = (leaveId, employeeId) => {
    // Toggle expansion: collapse if same row, otherwise expand new row
    setExpandedLeaveId(prev => (prev === leaveId ? null : leaveId));
    // Load balances for the employee if not already fetched
    if (!employeeBalances[employeeId]) {
      loadEmployeeBalances(employeeId);
    }
  };

  const loadEmployeeBalances = async (employeeId) => {
    try {
      setBalancesLoading(prev => ({ ...prev, [employeeId]: true }));
      const response = await leaveAPI.getBalances(employeeId);
      setEmployeeBalances(prev => ({ ...prev, [employeeId]: response.data?.balances || [] }));
    } catch (error) {
      console.error('Error loading employee balances:', error);
    } finally {
      setBalancesLoading(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleViewAttendanceHistory = async (employee) => {
    setSelectedEmployee(employee);
    await loadEmployeeAttendanceHistory(employee.employee_id);
    setIsLeaveModalOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusBadgeClass = (status) => {
    const statusConfig = {
      'Approved': 'leave-status-active',
      'Rejected': 'leave-status-inactive',
      'Pending': 'leave-status-delayed',
      'Present': 'leave-status-active',
      'Delayed': 'leave-status-delayed',
      'On Leave': 'leave-status-inactive'
    };

    return (
      <span className={`leave-status-badge ${statusConfig[status] || 'leave-status-inactive'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '0 days';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const {
    controlledRows: visibleLeaves,
    requestSort,
    searchTerm,
    setSearchTerm,
    sortLabel,
  } = useTableControls(leaveData, LEAVE_SEARCH_FIELDS, { key: 'start_date', accessor: 'start_date', direction: 'desc' });

  if (loading) {
    return (
      <div className="leave-management-section">
        <div className="loading-container">
          <div>Loading leave data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-management-section" id="leave-management-main">
      {/* Header */}
      <div className="leave-management-header">
        <h2 id="leave-management-title">Leave Management</h2>
        <div className="leave-filters header-actions">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={filters.leave_type}
            onChange={(e) => handleFilterChange('leave_type', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Leave Types</option>
            {leaveTypes.filter(type => type.is_active).map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Statistics Cards */}
      <div className="leave-dashboard-stats">
        <div className="leave-stat-card" id="leave-stat-pending">
          <div className="leave-stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-color)' }}>
            <FaClock />
          </div>
          <div className="leave-stat-info">
            <div className="leave-stat-number">{leaveStats.totalPending}</div>
            <div className="leave-stat-label">Pending Requests</div>
          </div>
        </div>
        <div className="leave-stat-card" id="leave-stat-approved">
          <div className="leave-stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-color)' }}>
            <FaCheckCircle />
          </div>
          <div className="leave-stat-info">
            <div className="leave-stat-number">{leaveStats.totalApproved}</div>
            <div className="leave-stat-label">Approved Requests</div>
          </div>
        </div>
        <div className="leave-stat-card" id="leave-stat-rejected">
          <div className="leave-stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-color)' }}>
            <FaTimesCircle />
          </div>
          <div className="leave-stat-info">
            <div className="leave-stat-number">{leaveStats.totalRejected}</div>
            <div className="leave-stat-label">Rejected Requests</div>
          </div>
        </div>
        <div className="leave-stat-card" id="leave-stat-approved-days">
          <div className="leave-stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <FaCalendarCheck />
          </div>
          <div className="leave-stat-info">
            <div className="leave-stat-number">{leaveStats.approvedDays}</div>
            <div className="leave-stat-label">Approved Days</div>
          </div>
        </div>
      </div>

      {/* ==================== LEAVE MANAGEMENT SECTION ==================== */}
      <div className="leave-table-container leave-glass-form">
        {/* Leave Table Header */}
        <div className="leave-table-header">
          <h3 id="leave-table-title">Leave Requests</h3>
        </div>
        <div className="table-toolbar">
          <input
            className="table-search-input"
            type="search"
            placeholder="Search employee, ID, reason, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Leave Table - Spread to full width */}
        <div className="leave-table-wrapper">
          <table className="leave-main-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th className="sortable-th" style={{ width: '20%' }} onClick={() => requestSort('employee_name', 'employee_name')}>Employee Name{sortLabel('employee_name')}</th>
                <th style={{ width: '10%' }}>Type</th>
                <th className="sortable-th" style={{ width: '20%' }} onClick={() => requestSort('description', 'description')}>Description{sortLabel('description')}</th>
                <th className="sortable-th" style={{ width: '15%' }} onClick={() => requestSort('start_date', 'start_date')}>From - To{sortLabel('start_date')}</th>
                <th className="sortable-th" style={{ width: '8%' }} onClick={() => requestSort('total_days', 'total_days')}>Duration{sortLabel('total_days')}</th>
                <th className="sortable-th" style={{ width: '12%' }} onClick={() => requestSort('status', 'status')}>Status{sortLabel('status')}</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.map(leave => (
                <React.Fragment key={leave.leave_id}>
                  <tr>
                    <td style={{ width: '20%' }}>
                      <div className="leave-name-cell">
                        <div
                          className="leave-name-text leave-clickable"
                          onClick={() => handleViewAttendanceHistory(leave)}
                        >
                          {leave.employee_name}
                        </div>
                        <div className="leave-employee-id">
                          ID: {leave.employee_code} | <span className="leave-balances-toggle" onClick={(e) => { e.stopPropagation(); toggleRowExpand(leave.leave_id, leave.employee_id); }}>
                            {expandedLeaveId === leave.leave_id ? 'Hide Balances' : 'Show Balances'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ width: '10%', verticalAlign: 'middle' }}>
                      <span className={`leave-type-badge leave-type-${leave.leave_type?.toLowerCase() || 'casual'}`}>
                        {leave.leave_type || 'Casual'}
                      </span>
                    </td>
                    <td style={{ width: '20%' }}>
                      <div className="leave-description-cell">
                        {leave.description || '-'}
                      </div>
                    </td>
                    <td style={{ width: '15%' }}>
                      <div className="leave-duration-cell">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </div>
                    </td>
                    <td style={{ width: '8%' }}>
                      <div className="leave-days-cell">
                        {leave.total_days || calculateDuration(leave.start_date, leave.end_date)}
                      </div>
                    </td>
                    <td style={{ width: '12%' }}>
                      {getStatusBadgeClass(leave.status)}
                    </td>
                    <td style={{ width: '15%' }}>
                      <div className="leave-actions-container">
                        {leave.status === 'Pending' && (
                          <>
                            <button
                              onClick={(e) => handleQuickApprove(leave.leave_id, e)}
                              className="leave-action-btn leave-approve-btn quick-action"
                              title="Approve Leave"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => handleQuickReject(leave, e)}
                              className="leave-action-btn leave-reject-btn quick-action"
                              title="Reject Leave"
                            >
                              Reject
                            </button>
                            <button
                              onClick={(e) => handleQuickDelete(leave, e)}
                              className="leave-action-btn leave-delete-btn quick-action"
                              title="Delete Leave"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {leave.status !== 'Pending' && (
                          <span className="leave-processed-text">
                            Processed on {formatDate(leave.approved_at)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedLeaveId === leave.leave_id && (
                    <tr className="leave-balances-row">
                      <td colSpan="7">
                        <div className="leave-balances-drawer">
                          <h4 className="balances-drawer-title">Leave Balances ({new Date().getFullYear()})</h4>
                          {balancesLoading[leave.employee_id] ? (
                            <div className="balances-loading">Loading balances...</div>
                          ) : (
                            (() => {
                              const balances = employeeBalances[leave.employee_id] || [];
                              const totalUsed = balances.reduce((sum, bal) => sum + (bal.used || 0), 0);
                              const limitExceeded = totalUsed > 2;
                              return (
                                <div className={limitExceeded ? "monthly-limit-note monthly-limit-exceeded" : "monthly-limit-note monthly-limit-ok"}>
                                  Monthly leave limit (2 days): {limitExceeded ? `Exceeded (${totalUsed} days used)` : `Within limit (${totalUsed} days used)`}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {visibleLeaves.length === 0 && (
          <div className="no-leaves ">
            <div className="no-data-icon">📋</div>
            <p>No leave requests found</p>
            <p className="no-data-subtext">
              {filters.status !== 'all'
                ? 'Try changing your filters to see more results.'
                : 'No leave requests available.'}
            </p>
          </div>
        )}
      </div>

      {/* ==================== REJECT CONFIRMATION MODAL ==================== */}
      {isRejectConfirmOpen && selectedEmployee && (
        <div className="leave-modal-overlay">
          <div className="leave-modal-content">
            <div className="leave-delete-confirmation">
              <div className="leave-delete-icon">
                <FaExclamationTriangle />
              </div>
              <h3 className="leave-delete-title">
                Reject Leave Request?
              </h3>
              <p className="leave-delete-message">
                Are you sure you want to reject the leave request from <strong>{selectedEmployee.employee_name}</strong>?
                This action will mark the leave as rejected and notify the employee.
              </p>

              <div className="leave-delete-actions">
                <button
                  type="button"
                  onClick={() => setIsRejectConfirmOpen(false)}
                  className="leave-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectLeave(selectedEmployee.leave_id)}
                  className="leave-reject-btn"
                >
                  Reject Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {isDeleteConfirmOpen && selectedEmployee && (
        <div className="leave-modal-overlay">
          <div className="leave-modal-content">
            <div className="leave-delete-confirmation">
              <div className="leave-delete-icon">
                <FaExclamationTriangle />
              </div>
              <h3 className="leave-delete-title">
                Delete Leave Request?
              </h3>
              <p className="leave-delete-message">
                Are you sure you want to delete the leave request from <strong>{selectedEmployee.employee_name}</strong>?
                This action cannot be undone and the leave request will be permanently removed from the system.
              </p>

              <div className="leave-delete-actions">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="leave-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteLeave(selectedEmployee.leave_id)}
                  className="leave-delete-btn"
                >
                  Delete Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== APPROVE CONFIRMATION MODAL ==================== */}

      {isApproveModalOpen && selectedLeaveId && (
        <div className="leave-modal-overlay">
          <div className="leave-modal-content leave-approve-confirmation">
            <div className="leave-delete-confirmation">
              <div className="leave-approve-icon">
                <FaCheckCircle />
              </div>
              <h3 className="leave-delete-title">Approve Leave Request</h3>
              <p className="leave-delete-message">
                Please select the leave category before approving.
              </p>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="leave-approve-select-box"
              >
                <option value="" disabled>Select Category</option>
                {leaveTypes.filter(type => type.is_active).map(type => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
              <div className="leave-delete-actions" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="leave-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  className="leave-approve-btn"
                  disabled={!selectedCategory}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ==================== ATTENDANCE HISTORY MODAL ==================== */}
      {isLeaveModalOpen && selectedEmployee && (
        <div className="leave-modal-overlay">
          <div className="leave-modal-content leave-large-modal">
            <div className="leave-modal-header">
              <h2 id="leave-view-modal-title">Attendance History - {selectedEmployee.employee_name}</h2>
              <button
                className="leave-close-btn"
                id="leave-view-close"
                onClick={() => setIsLeaveModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="leave-details-content">
              {/* Attendance History Cards - Spread */}
              <div className="leave-dashboard-stats" style={{ marginBottom: '1.5rem' }}>
                <div className="leave-stat-card" id="leave-history-stat-present" style={{ flex: '1', minWidth: '200px' }}>
                  <div className="leave-stat-number">{attendanceHistoryStats.totalPresent}</div>
                  <div className="leave-stat-label">Present (Total)</div>
                </div>
                <div className="leave-stat-card" id="leave-history-stat-delayed" style={{ flex: '1', minWidth: '200px' }}>
                  <div className="leave-stat-number">{attendanceHistoryStats.totalDelayed}</div>
                  <div className="leave-stat-label">Delayed (Total)</div>
                </div>
                <div className="leave-stat-card" id="leave-history-stat-leaves" style={{ flex: '1', minWidth: '200px' }}>
                  <div className="leave-stat-number">{attendanceHistoryStats.totalLeaves}</div>
                  <div className="leave-stat-label">Leaves (Total)</div>
                </div>
              </div>

              {/* Attendance History Table - Spread */}
              <div className="leave-form-section">
                <h3 className="leave-section-title">Attendance History</h3>
                <div className="leave-table-wrapper">
                  <table className="leave-main-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>Date</th>
                        <th style={{ width: '40%' }}>Description</th>
                        <th style={{ width: '30%' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(record => (
                        <tr key={record.history_id}>
                          <td style={{ width: '30%' }}>
                            <div className="leave-date-cell">
                              {formatDate(record.date)}
                            </div>
                          </td>
                          <td style={{ width: '40%' }}>
                            <div className="leave-description-cell">
                              {record.description || 'No description'}
                            </div>
                          </td>
                          <td style={{ width: '30%' }}>
                            {getStatusBadgeClass(record.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="leave-form-actions">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="leave-cancel-btn"
                  id="leave-modal-close"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? <FaCheck /> : <FaTimes />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
