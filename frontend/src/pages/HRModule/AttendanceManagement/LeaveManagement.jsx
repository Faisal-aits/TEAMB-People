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
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: '',
    max_days: '',
    is_paid: true
  });
  const [policySaving, setPolicySaving] = useState(false);

  // Expandable row state for balances drawer
  const [expandedRows, setExpandedRows] = useState(new Set());
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
      const response = await leaveAPI.getLeaveTypeSettings();
      const types = response.data?.leave_types || [];
      setLeaveTypes(types);

      const activeTypeNames = new Set(types.filter(type => type.is_active).map(type => type.name));
      if (filters.leave_type !== 'all' && !activeTypeNames.has(filters.leave_type)) {
        setFilters(prev => ({ ...prev, leave_type: 'all' }));
      }
    } catch (error) {
      console.error('Error loading leave type settings:', error);
      showToast('Error loading leave policy settings.', 'danger');
    }
  };

  const handleLeaveTypeDraftChange = (typeId, key, value) => {
    setLeaveTypes(prev => prev.map(type => (
      type.id === typeId ? { ...type, [key]: value } : type
    )));
  };

  const handleSaveLeaveType = async (type) => {
    const maxDays = Number.parseInt(type.max_days, 10);
    if (!Number.isInteger(maxDays) || maxDays < 0 || maxDays > 365) {
      showToast('Annual days must be between 0 and 365.', 'danger');
      return;
    }

    try {
      setPolicySaving(true);
      await leaveAPI.updateLeaveType(type.id, {
        max_days: maxDays,
        is_paid: Boolean(type.is_paid),
        is_active: Boolean(type.is_active)
      });
      showToast('Leave policy updated.', 'success');
      await loadLeaveTypes();
      setEmployeeBalances({});
    } catch (error) {
      console.error('Error saving leave type:', error);
      const errorMessage = error.response?.data?.message || 'Error saving leave type.';
      showToast(errorMessage, 'danger');
    } finally {
      setPolicySaving(false);
    }
  };

  const handleCreateLeaveType = async (event) => {
    event.preventDefault();
    const name = leaveTypeForm.name.trim();
    const maxDays = Number.parseInt(leaveTypeForm.max_days, 10);

    if (!name) {
      showToast('Leave type name is required.', 'danger');
      return;
    }

    if (!Number.isInteger(maxDays) || maxDays < 0 || maxDays > 365) {
      showToast('Annual days must be between 0 and 365.', 'danger');
      return;
    }

    try {
      setPolicySaving(true);
      await leaveAPI.createLeaveType({
        name,
        max_days: maxDays,
        is_paid: leaveTypeForm.is_paid
      });
      setLeaveTypeForm({ name: '', max_days: '', is_paid: true });
      showToast('Leave type added.', 'success');
      await loadLeaveTypes();
      setEmployeeBalances({});
    } catch (error) {
      console.error('Error creating leave type:', error);
      const errorMessage = error.response?.data?.message || 'Error creating leave type.';
      showToast(errorMessage, 'danger');
    } finally {
      setPolicySaving(false);
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

  const handleQuickApprove = async (leaveId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      await handleApproveLeave(leaveId);
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

  const toggleRowExpand = async (employeeId, e) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
        if (!employeeBalances[employeeId]) {
          loadEmployeeBalances(employeeId);
        }
      }
      return next;
    });
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

      <div className="leave-table-container leave-glass-form">
        <div className="leave-table-header">
          <h3>Leave Policy Settings</h3>
        </div>
        <div className="leave-details-content">
          <form style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '12px' }} onSubmit={handleCreateLeaveType}>
            <input
              type="text"
              value={leaveTypeForm.name}
              onChange={(event) => setLeaveTypeForm(prev => ({ ...prev, name: event.target.value }))}
              placeholder="Leave type"
              className="leave-filter-input"
              disabled={policySaving}
            />
            <input
              type="number"
              min="0"
              max="365"
              value={leaveTypeForm.max_days}
              onChange={(event) => setLeaveTypeForm(prev => ({ ...prev, max_days: event.target.value }))}
              placeholder="Annual days"
              className="leave-filter-input"
              style={{ width: '120px' }}
              disabled={policySaving}
            />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={leaveTypeForm.is_paid}
                onChange={(event) => setLeaveTypeForm(prev => ({ ...prev, is_paid: event.target.checked }))}
                disabled={policySaving}
              />
              Paid
            </label>
            <button type="submit" className="leave-submit-btn" disabled={policySaving}>
              Add Type
            </button>
          </form>

          <div className="leave-table-wrapper">
            <table className="leave-main-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Annual Days</th>
                  <th>Paid</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map(type => (
                  <tr key={type.id}>
                    <td>
                      <span className={`leave-type-badge leave-type-${type.name?.toLowerCase() || 'custom'}`}>
                        {type.name}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={type.max_days}
                        onChange={(event) => handleLeaveTypeDraftChange(type.id, 'max_days', event.target.value)}
                        className="leave-filter-input"
                        style={{ width: '120px' }}
                        disabled={policySaving}
                      />
                    </td>
                    <td>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(type.is_paid)}
                          onChange={(event) => handleLeaveTypeDraftChange(type.id, 'is_paid', event.target.checked ? 1 : 0)}
                          disabled={policySaving}
                        />
                        Paid
                      </label>
                    </td>
                    <td>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(type.is_active)}
                          onChange={(event) => handleLeaveTypeDraftChange(type.id, 'is_active', event.target.checked ? 1 : 0)}
                          disabled={policySaving}
                        />
                        Active
                      </label>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="leave-edit-btn"
                        style={{ padding: '0.45rem 0.9rem', borderRadius: '6px' }}
                        onClick={() => handleSaveLeaveType(type)}
                        disabled={policySaving}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <table className="leave-main-table" style={{ width: '100%'}}>
            <thead>
              <tr>
                <th className="sortable-th" style={{width: '20%'}} onClick={() => requestSort('employee_name', 'employee_name')}>Employee Name{sortLabel('employee_name')}</th>
                <th style={{width: '10%'}}>Type</th>
                <th className="sortable-th" style={{width: '20%'}} onClick={() => requestSort('description', 'description')}>Description{sortLabel('description')}</th>
                <th className="sortable-th" style={{width: '15%'}} onClick={() => requestSort('start_date', 'start_date')}>From - To{sortLabel('start_date')}</th>
                <th className="sortable-th" style={{width: '8%'}} onClick={() => requestSort('total_days', 'total_days')}>Duration{sortLabel('total_days')}</th>
                <th className="sortable-th" style={{width: '12%'}} onClick={() => requestSort('status', 'status')}>Status{sortLabel('status')}</th>
                <th style={{width: '15%'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.map(leave => (
                <React.Fragment key={leave.leave_id}>
                  <tr>
                    <td style={{width: '20%'}}>
                      <div className="leave-name-cell">
                        <div 
                          className="leave-name-text leave-clickable"
                          onClick={() => handleViewAttendanceHistory(leave)}
                        >
                          {leave.employee_name}
                        </div>
                        <div className="leave-employee-id">
                          ID: {leave.employee_code} | <span className="leave-balances-toggle" onClick={(e) => toggleRowExpand(leave.employee_id, e)}>
                            {expandedRows.has(leave.employee_id) ? 'Hide Balances' : 'Show Balances'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{width: '10%', verticalAlign: 'middle'}}>
                      <span className={`leave-type-badge leave-type-${leave.leave_type?.toLowerCase() || 'casual'}`}>
                        {leave.leave_type || 'Casual'}
                      </span>
                    </td>
                    <td style={{width: '20%'}}>
                      <div className="leave-description-cell">
                        {leave.description || '-'}
                      </div>
                    </td>
                    <td style={{width: '15%'}}>
                      <div className="leave-duration-cell">
                        {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                      </div>
                    </td>
                    <td style={{width: '8%'}}>
                      <div className="leave-days-cell">
                        {leave.total_days || calculateDuration(leave.start_date, leave.end_date)}
                      </div>
                    </td>
                    <td style={{width: '12%'}}>
                      {getStatusBadgeClass(leave.status)}
                    </td>
                    <td style={{width: '15%'}}>
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
                  {expandedRows.has(leave.employee_id) && (
                    <tr className="leave-balances-row">
                      <td colSpan="7">
                        <div className="leave-balances-drawer">
                          <h4 className="balances-drawer-title">Leave Balances ({new Date().getFullYear()})</h4>
                          {balancesLoading[leave.employee_id] ? (
                            <div className="balances-loading">Loading balances...</div>
                          ) : (
                            <div className="balances-grid-drawer">
                              {(employeeBalances[leave.employee_id] || []).map(bal => (
                                <div key={bal.leave_type} className="balance-drawer-pill">
                                  <span className="balance-drawer-name">{bal.leave_type}</span>
                                  <span className="balance-drawer-value">
                                    <strong>{bal.allocated - bal.used - bal.pending}</strong> / {bal.allocated} remaining
                                  </span>
                                  <span className="balance-drawer-breakdown">
                                    (Used: {bal.used}, Pending: {bal.pending})
                                  </span>
                                </div>
                              ))}
                            </div>
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
              <div className="leave-dashboard-stats" style={{marginBottom: '1.5rem'}}>
                <div className="leave-stat-card" id="leave-history-stat-present" style={{flex: '1', minWidth: '200px'}}>
                  <div className="leave-stat-number">{attendanceHistoryStats.totalPresent}</div>
                  <div className="leave-stat-label">Present (Total)</div>
                </div>
                <div className="leave-stat-card" id="leave-history-stat-delayed" style={{flex: '1', minWidth: '200px'}}>
                  <div className="leave-stat-number">{attendanceHistoryStats.totalDelayed}</div>
                  <div className="leave-stat-label">Delayed (Total)</div>
                </div>
                <div className="leave-stat-card" id="leave-history-stat-leaves" style={{flex: '1', minWidth: '200px'}}>
                  <div className="leave-stat-number">{attendanceHistoryStats.totalLeaves}</div>
                  <div className="leave-stat-label">Leaves (Total)</div>
                </div>
              </div>

              {/* Attendance History Table - Spread */}
              <div className="leave-form-section">
                <h3 className="leave-section-title">Attendance History</h3>
                <div className="leave-table-wrapper">
                  <table className="leave-main-table" style={{tableLayout: 'fixed', width: '100%'}}>
                    <thead>
                      <tr>
                        <th style={{width: '30%'}}>Date</th>
                        <th style={{width: '40%'}}>Description</th>
                        <th style={{width: '30%'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(record => (
                        <tr key={record.history_id}>
                          <td style={{width: '30%'}}>
                            <div className="leave-date-cell">
                              {formatDate(record.date)}
                            </div>
                          </td>
                          <td style={{width: '40%'}}>
                            <div className="leave-description-cell">
                              {record.description || 'No description'}
                            </div>
                          </td>
                          <td style={{width: '30%'}}>
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
