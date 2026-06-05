// src/pages/employees/EmployeeLeave.jsx
import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../services/leaveAPI';
import * as XLSX from 'xlsx';
import { useTableControls } from '../../hooks/useTableControls';
import '../../styles/tableControls.css';
import './EmployeeLeave.css';

const LEAVE_SEARCH_FIELDS = ['created_at', 'description', 'start_date', 'end_date', 'total_days', 'status', 'leave_id'];

// Leave types that require/recommend a medical certificate
const MEDICAL_LEAVE_TYPES = ['Sick', 'Maternity'];

const LEAVE_TYPES = [
  { value: 'Casual', label: 'Casual Leave' },
  { value: 'Sick', label: 'Sick Leave (Medical Certificate recommended)' },
  { value: 'Maternity', label: 'Maternity Leave (Medical Certificate required)' },
  { value: 'Earned', label: 'Earned / Privilege Leave' },
  { value: 'Unpaid', label: 'Unpaid Leave' },
  { value: 'Compensatory', label: 'Compensatory Leave' },
];

const EmployeeLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveFilterStatus, setLeaveFilterStatus] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [leaveFormData, setLeaveFormData] = useState({
    leave_type: 'Casual',
    description: '',
    start_date: '',
    end_date: '',
  });

  // For file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // ==================== LEAVE FUNCTIONS ====================
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
      
      // Fetch leaves
      try {
        const response = await leaveAPI.getMyLeaves();
        setLeaves(response.data.leaves || []);
        if (response.data.employee_id) {
          setCurrentUser(prev => ({
            ...prev,
            employee_id: response.data.employee_id
          }));
        }
      } catch (err) {
        console.error('Error loading leaves:', err);
      }
      
      // Fetch balances
      try {
        const response = await leaveAPI.getMyBalances();
        setBalances(response.data.balances || []);
      } catch (err) {
        console.error('Error loading balances:', err);
      }
      
    } catch (error) {
      console.error('Error loading my leaves data:', error);
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

    // Clear file if switching away from medical leave type
    if (name === 'leave_type' && !MEDICAL_LEAVE_TYPES.includes(value)) {
      setSelectedFile(null);
      setFileError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only JPEG, PNG, GIF, WebP images or PDF files are allowed.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setFileError('File size must not exceed 10 MB.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    
    if (!leaveFormData.description || !leaveFormData.start_date || !leaveFormData.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(leaveFormData.start_date) > new Date(leaveFormData.end_date)) {
      alert('End date cannot be before start date');
      return;
    }

    if (!currentUser || !currentUser.id) {
      alert('User information not found. Please log in again.');
      return;
    }

    if (fileError) {
      alert('Please fix the file error before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append('leave_type', leaveFormData.leave_type);
        payload.append('description', leaveFormData.description);
        payload.append('start_date', leaveFormData.start_date);
        payload.append('end_date', leaveFormData.end_date);
        payload.append('medical_document', selectedFile);
      } else {
        payload = {
          leave_type: leaveFormData.leave_type,
          description: leaveFormData.description,
          start_date: leaveFormData.start_date,
          end_date: leaveFormData.end_date
        };
      }
      
      await leaveAPI.create(payload);
      
      setLeaveFormData({
        leave_type: 'Casual',
        description: '',
        start_date: '',
        end_date: '',
      });
      setSelectedFile(null);
      setFileError('');
      
      setIsLeaveModalOpen(false);
      await loadMyLeaves();
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting leave request:', error);
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
        <h2 className="leave-management-title">My Leave</h2>
        <button 
          className="leave-add-btn"
          onClick={() => setIsLeaveModalOpen(true)}
          disabled={!currentUser}
        >
          <span className="leave-btn-icon">+</span>
          Apply for Leave
        </button>
      </div>

      {!currentUser && (
        <div className="error-message">
          <p>Unable to load user information. Please contact administrator.</p>
        </div>
      )}

      {/* Leave Balances Section */}
      {balances && balances.length > 0 && (
        <div className="leave-balances-container">
          <div className="leave-balances-header-compact">
            <h3 className="leave-balances-title-compact">Remaining Leaves</h3>
          </div>
          <div className="leave-balances-grid-compact">
            {balances.map((bal) => {
              const allocated = bal.allocated || 0;
              const used = bal.used || 0;
              const pending = bal.pending || 0;
              const remaining = bal.remaining || 0;
              const totalTaken = used + pending;
              const progressPercent = allocated > 0 ? Math.min(100, (totalTaken / allocated) * 100) : 0;
              
              let cardThemeClass = 'theme-casual';
              if (bal.leave_type.toLowerCase().includes('sick')) cardThemeClass = 'theme-sick';
              else if (bal.leave_type.toLowerCase().includes('maternity')) cardThemeClass = 'theme-maternity';
              else if (bal.leave_type.toLowerCase().includes('earned')) cardThemeClass = 'theme-earned';
              else if (bal.leave_type.toLowerCase().includes('unpaid')) cardThemeClass = 'theme-unpaid';
              else if (bal.leave_type.toLowerCase().includes('compensatory')) cardThemeClass = 'theme-compensatory';

              return (
                <div key={bal.leave_type} className={`leave-balance-card-compact ${cardThemeClass}`} title={`Allocated: ${allocated} | Used: ${used} | Pending: ${pending}`}>
                  <div className="leave-balance-card-left">
                    <span className="leave-balance-type-compact">{bal.leave_type}</span>
                    <span className="leave-balance-progress-text-compact">
                      {totalTaken} of {allocated} used
                    </span>
                  </div>
                  <div className="leave-balance-card-right">
                    <span className="leave-balance-remaining-num-compact">{remaining}</span>
                    <span className="leave-balance-remaining-label-compact">days left</span>
                  </div>
                  <div className="leave-balance-progress-bar-compact">
                    <div 
                      className="leave-balance-progress-fill-compact" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="leave-table-container glass-form-leave">
        <div className="leave-table-header">
          <h3 className="leave-table-title">My Leave Requests</h3>
          <div className="leave-table-actions">
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
                <th className="leave-th-date">Applied Date</th>
                <th className="leave-th-type">Leave Type</th>
                <th className="leave-th-description">Description</th>
                <th className="leave-th-from">From Date</th>
                <th className="leave-th-to">To Date</th>
                <th className="leave-th-days">Total Days</th>
                <th className="leave-th-status">Status</th>
                <th className="leave-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeaves.map(leave => (
                <tr key={leave.leave_id} className="leave-table-row">
                  <td className="leave-td-date">
                    <div className="leave-date-cell">{formatDate(leave.created_at)}</div>
                  </td>
                  <td className="leave-td-type">
                    <div className="leave-type-cell">
                      {leave.leave_type || 'Casual'}
                      {leave.has_document ? (
                        <span className="leave-doc-badge" title="Medical document attached" style={{ marginLeft: '6px' }}>📎</span>
                      ) : null}
                    </div>
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
                ?
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

              {/* Leave Type Select */}
              <div className="leave-form-group">
                <label htmlFor="leave-type-select" className="leave-form-label">Leave Type *</label>
                <select
                  id="leave-type-select"
                  name="leave_type"
                  value={leaveFormData.leave_type}
                  onChange={handleLeaveInputChange}
                  required
                  className="leave-form-select"
                >
                  {LEAVE_TYPES.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
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
                <label className="leave-form-label">From Date *</label>
                <input
                  type="date"
                  name="start_date"
                  value={leaveFormData.start_date}
                  onChange={handleLeaveInputChange}
                  required
                  className="leave-form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

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

              {leaveFormData.start_date && leaveFormData.end_date && (
                <div className="leave-form-group">
                  <label className="leave-form-label">Total Days</label>
                  <input
                    type="text"
                    value={(() => {
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

              {/* Medical Document Upload — shown only for Sick / Maternity */}
              {MEDICAL_LEAVE_TYPES.includes(leaveFormData.leave_type) && (
                <div className="leave-form-group">
                  <label htmlFor="leave-medical-doc" className="leave-form-label">
                    Medical Certificate
                    {leaveFormData.leave_type === 'Maternity' ? ' *' : ' (recommended)'}
                  </label>
                  <div className="leave-file-upload-wrapper">
                    <input
                      id="leave-medical-doc"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="leave-file-input"
                    />
                    {selectedFile && (
                      <div className="leave-file-selected">
                        <span>📎 {selectedFile.name}</span>
                        <span className="leave-file-size">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          className="leave-file-remove-btn"
                          onClick={() => {
                            setSelectedFile(null);
                            document.getElementById('leave-medical-doc').value = '';
                          }}
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {fileError && (
                      <p className="leave-file-error">{fileError}</p>
                    )}
                    <small className="leave-helper-text">
                      Accepted formats: JPEG, PNG, GIF, WebP, PDF &bull; Max size: 10 MB
                    </small>
                  </div>
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
