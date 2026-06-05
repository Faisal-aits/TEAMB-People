import React, { useState, useEffect } from 'react';
import './Leave.css';
import { leaveAPI } from '../../../services/leaveAPI';
import * as XLSX from 'xlsx';

// Leave types that require (or strongly recommend) a medical certificate
const MEDICAL_LEAVE_TYPES = ['Sick', 'Maternity'];

const LEAVE_TYPES = [
  { value: 'Casual', label: 'Casual Leave' },
  { value: 'Sick', label: 'Sick Leave (Medical Certificate recommended)' },
  { value: 'Maternity', label: 'Maternity Leave (Medical Certificate required)' },
  { value: 'Earned', label: 'Earned / Privilege Leave' },
  { value: 'Unpaid', label: 'Unpaid Leave' },
  { value: 'Compensatory', label: 'Compensatory Leave' },
];

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: 'Casual',
    description: '',
    start_date: '',
    end_date: '',
  });

  // For file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');

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
      setLoading(true);
      const response = await leaveAPI.getMyLeaves();
      setLeaves(response.data.leaves || []);
      if (response.data.employee_id) {
        setCurrentUser(prev => ({
          ...prev,
          employee_id: response.data.employee_id
        }));
      }
    } catch (error) {
      console.error('Error loading my leaves:', error);
      alert('Error loading your leave data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredLeaves.map(leave => ({
        'Applied Date': formatDate(leave.created_at),
        'Leave Type': leave.leave_type || 'Casual',
        'Description': leave.description,
        'From Date': formatDate(leave.start_date),
        'To Date': formatDate(leave.end_date),
        'Total Days': `${leave.total_days} day(s)`,
        'Status': leave.status,
        'Has Document': leave.has_document ? 'Yes' : 'No',
        'Leave ID': leave.leave_id,
      }));

      if (exportData.length === 0) {
        alert('No data to export!');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const wscols = [
        { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Requests');
      const fileName = `My_Leave_Requests_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  useEffect(() => {
    loadCurrentEmployeeData();
    loadMyLeaves();
  }, [filterStatus]);

  const isMedicalLeave = MEDICAL_LEAVE_TYPES.includes(formData.leave_type);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
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
        // Send as multipart FormData when a file is attached
        payload = new FormData();
        payload.append('leave_type', formData.leave_type);
        payload.append('description', formData.description);
        payload.append('start_date', formData.start_date);
        payload.append('end_date', formData.end_date);
        payload.append('medical_document', selectedFile);
      } else {
        // Plain JSON otherwise
        payload = {
          leave_type: formData.leave_type,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
        };
      }

      await leaveAPI.create(payload);

      // Reset form
      setFormData({ leave_type: 'Casual', description: '', start_date: '', end_date: '' });
      setSelectedFile(null);
      setFileError('');
      setIsModalOpen(false);

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

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Approved': 'leave-status--approved',
      'Pending': 'leave-status--pending',
      'Rejected': 'leave-status--rejected'
    };
    return (
      <span className={`leave-status-badge ${statusClasses[status]}`}>
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

  const filteredLeaves = filterStatus === 'All'
    ? leaves
    : leaves.filter(leave => leave.status === filterStatus);

  if (loading) {
    return (
      <div className="leave-management-section" id="leave-management-section">
        <div className="leave-management-header">
          <h2 className="leave-management-title">Leave Management</h2>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-management-section" id="leave-management-section">
      <div className="leave-management-header">
        <h2 className="leave-management-title">Leave Management</h2>
        <button
          className="leave-add-btn"
          id="leave-add-btn"
          onClick={() => setIsModalOpen(true)}
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

      <div className="leave-table-container glass-form-leave">
        <div className="leave-table-header">
          <h3 className="leave-table-title">My Leave Requests</h3>
          <div className="leave-table-actions">
            <select
              className="leave-filter-select"
              id="leave-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button
              className="leave-export-btn"
              id="leave-export-btn"
              onClick={handleExport}
              disabled={filteredLeaves.length === 0}
            >
              Export
            </button>
          </div>
        </div>

        <table className="leave-records-table" id="leave-records-table">
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
            {filteredLeaves.map(leave => (
              <tr key={leave.leave_id} className="leave-table-row">
                <td className="leave-td-date">
                  <div className="leave-date-cell">{formatDate(leave.created_at)}</div>
                </td>
                <td className="leave-td-type">
                  <div className="leave-type-cell">
                    {leave.leave_type || 'Casual'}
                    {leave.has_document ? (
                      <span className="leave-doc-badge" title="Medical document attached">📎</span>
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
                  {getStatusBadge(leave.status)}
                </td>
                <td className="leave-td-actions">
                  {leave.status === 'Pending' && (
                    <button
                      className="leave-delete-btn"
                      onClick={() => handleDeleteLeave(leave.leave_id)}
                      title="Delete Leave Request"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeaves.length === 0 && (
          <div className="no-leaves">
            <div className="no-data-icon">📅</div>
            <p>No leave requests found</p>
            <p className="no-data-subtext">
              {filterStatus !== 'All'
                ? 'Try changing your status filter to see more results.'
                : 'Get started by applying for your first leave.'}
            </p>
            {filterStatus === 'All' && currentUser && (
              <button onClick={() => setIsModalOpen(true)} className="add-first-btn">
                Apply for Leave
              </button>
            )}
          </div>
        )}
      </div>

      {/* Apply for Leave Modal */}
      {isModalOpen && (
        <div className="leave-modal-overlay" id="leave-modal-overlay">
          <div className="leave-modal-content">
            <div className="leave-modal-header">
              <h2 className="leave-modal-title">Apply for Leave</h2>
              <button
                className="leave-modal-close"
                id="leave-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="leave-form" id="leave-form">
              {/* Employee Name */}
              <div className="leave-form-group">
                <label htmlFor="leave-employee-name" className="leave-form-label">Employee Name</label>
                <input
                  id="leave-employee-name"
                  type="text"
                  value={currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : ''}
                  disabled
                  className="leave-disabled-input"
                />
              </div>

              {/* Employee ID */}
              <div className="leave-form-group">
                <label htmlFor="leave-user-id" className="leave-form-label">Employee ID</label>
                <input
                  id="leave-user-id"
                  type="text"
                  value={currentUser?.employee_id || 'Loading...'}
                  disabled
                  className="leave-disabled-input"
                />
                <small className="leave-helper-text">
                  Your employee ID will be automatically retrieved by the system
                </small>
              </div>

              {/* Leave Type */}
              <div className="leave-form-group">
                <label htmlFor="leave-type-select" className="leave-form-label">Leave Type *</label>
                <select
                  id="leave-type-select"
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleInputChange}
                  required
                  className="leave-form-input"
                >
                  {LEAVE_TYPES.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="leave-form-group">
                <label htmlFor="leave-description" className="leave-form-label">Description *</label>
                <input
                  id="leave-description"
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief reason for leave"
                  required
                  className="leave-form-input"
                />
              </div>

              {/* From Date */}
              <div className="leave-form-group">
                <label htmlFor="leave-from-date" className="leave-form-label">From Date *</label>
                <input
                  id="leave-from-date"
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="leave-form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* To Date */}
              <div className="leave-form-group">
                <label htmlFor="leave-to-date" className="leave-form-label">To Date *</label>
                <input
                  id="leave-to-date"
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className="leave-form-input"
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Total Days Preview */}
              {formData.start_date && formData.end_date && (
                <div className="leave-form-group">
                  <label className="leave-form-label">Total Days</label>
                  <input
                    type="text"
                    value={(() => {
                      const start = new Date(formData.start_date);
                      const end = new Date(formData.end_date);
                      const diffTime = Math.abs(end - start);
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 + ' day(s)';
                    })()}
                    disabled
                    className="leave-disabled-input"
                  />
                </div>
              )}

              {/* Medical Document Upload — shown only for Sick / Maternity */}
              {isMedicalLeave && (
                <div className="leave-form-group">
                  <label htmlFor="leave-medical-doc" className="leave-form-label">
                    Medical Certificate
                    {formData.leave_type === 'Maternity' ? ' *' : ' (recommended)'}
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
                        📎 <span>{selectedFile.name}</span>
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
                  onClick={() => setIsModalOpen(false)}
                  className="leave-cancel-btn"
                  id="leave-cancel-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="leave-submit-btn"
                  id="leave-submit-btn"
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

export default LeaveManagement;