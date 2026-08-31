// src/pages/HRModule/AttendanceManagement/RegularizationManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaCog, FaCheck, FaTimes, FaTrash, FaFilter,
  FaClipboardList, FaCheckCircle, FaTimesCircle, FaClock, FaListAlt, FaSave,
} from 'react-icons/fa';
import { regularizationAPI } from '../../../services/regularizationAPI';
import './RegularizationManagement.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (val) => (val ? String(val) : '—');
const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ─── Toast Component ─────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  return (
    <div className={`reg-toast ${type}`}>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Action Modal ────────────────────────────────────────────────────────────
function ActionModal({ request, action, onConfirm, onClose, loading }) {
  const [remarks, setRemarks] = useState('');
  if (!request) return null;

  const isApprove = action === 'approve';
  const title = isApprove ? 'Approve Request' : 'Reject Request';

  return (
    <div className="reg-modal-overlay" onClick={onClose}>
      <div className="reg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reg-modal-header">
          <h3>{title}</h3>
          <button className="reg-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="reg-modal-body">
          {/* Request Details */}
          <div className="reg-detail-row">
            <span className="label">Employee</span>
            <span className="value">{request.first_name} {request.last_name}</span>
          </div>
          <div className="reg-detail-row">
            <span className="label">Requested Date</span>
            <span className="value">{fmtDate(request.request_date)}</span>
          </div>
          <div className="reg-detail-grid">
            <div className="reg-detail-row">
              <span className="label">Check-In</span>
              <span className="value">{fmtDateTime(request.requested_check_in)}</span>
            </div>
            <div className="reg-detail-row">
              <span className="label">Check-Out</span>
              <span className="value">{fmtDateTime(request.requested_check_out)}</span>
            </div>
          </div>
          {request.requested_status && (
            <div className="reg-detail-row">
              <span className="label">Requested Status</span>
              <span className="value">{request.requested_status}</span>
            </div>
          )}
          <div className="reg-detail-row">
            <span className="label">Reason</span>
            <span className="value">{request.reason}</span>
          </div>

          {/* Remarks */}
          <div className="reg-detail-row">
            <span className="label">
              Admin Remarks {isApprove ? '(optional)' : '(required)'}
            </span>
            <textarea
              className="reg-modal-textarea"
              placeholder={isApprove
                ? 'Add a note for the employee (optional)...'
                : 'Provide a reason for rejection...'}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="reg-modal-footer">
          <button className="reg-modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className={`reg-modal-confirm-btn ${isApprove ? 'approve-confirm' : 'reject-confirm'}`}
            onClick={() => onConfirm(request.id, remarks)}
            disabled={loading || (!isApprove && !remarks.trim())}
          >
            {loading ? '…' : isApprove ? <><FaCheck /> Approve</> : <><FaTimes /> Reject</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const RegularizationManagement = () => {
  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [settings, setSettings] = useState({ monthly_limit: 4, is_enabled: true });
  const [settingsDraft, setSettingsDraft] = useState({ monthly_limit: 4, is_enabled: true });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [modalData, setModalData] = useState({ open: false, request: null, action: null });

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, settingsRes] = await Promise.all([
        regularizationAPI.getAll({ status: statusFilter }),
        regularizationAPI.getSettings(),
      ]);
      if (reqRes.data?.success) {
        setRequests(reqRes.data.requests || []);
        setStatistics(reqRes.data.statistics || {});
      }
      if (settingsRes.data?.success) {
        const s = settingsRes.data.settings;
        setSettings(s);
        setSettingsDraft({ monthly_limit: s.monthly_limit, is_enabled: !!s.is_enabled });
      }
    } catch (err) {
      console.error('Fetch regularization data error:', err);
      showToast('Failed to load attendance correction data', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Settings Save ──────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await regularizationAPI.updateSettings({
        monthly_limit: parseInt(settingsDraft.monthly_limit),
        is_enabled: settingsDraft.is_enabled ? 1 : 0,
      });
      if (res.data?.success) {
        setSettings(res.data.settings);
        showToast('Settings saved successfully');
      }
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  // ─── Approve / Reject ───────────────────────────────────────────────────────
  const handleAction = async (id, remarks) => {
    try {
      setActionLoading(true);
      const { action } = modalData;
      const res = action === 'approve'
        ? await regularizationAPI.approve(id, remarks)
        : await regularizationAPI.reject(id, remarks);

      if (res.data?.success) {
        showToast(action === 'approve' ? 'Request approved ✓' : 'Request rejected');
        setModalData({ open: false, request: null, action: null });
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance correction request? This cannot be undone.')) return;
    try {
      await regularizationAPI.deleteRequest(id);
      showToast('Request deleted');
      fetchData();
    } catch {
      showToast('Failed to delete request', 'error');
    }
  };

  // ─── Filtered rows ──────────────────────────────────────────────────────────
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      (r.employee_id || '').toLowerCase().includes(q) ||
      (r.department_name || '').toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q)
    );
  });

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="reg-section">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="reg-header">
        <div className="reg-header-left">
          <h2>Attendance Correction</h2>
          <p>Review and manage employee attendance correction requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="reg-stats-grid">
        <div className="reg-stat-card total">
          <div className="stat-icon"><FaListAlt /></div>
          <span className="stat-number">{statistics.total || 0}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="reg-stat-card pending">
          <div className="stat-icon"><FaClock /></div>
          <span className="stat-number">{statistics.pending || 0}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="reg-stat-card approved">
          <div className="stat-icon"><FaCheckCircle /></div>
          <span className="stat-number">{statistics.approved || 0}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="reg-stat-card rejected">
          <div className="stat-icon"><FaTimesCircle /></div>
          <span className="stat-number">{statistics.rejected || 0}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="reg-settings-card">
        <h3><FaCog /> Monthly Request Settings</h3>
        <div className="reg-settings-row">
          <div className="reg-settings-field">
            <label>Monthly Limit (per employee)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={settingsDraft.monthly_limit}
              onChange={(e) => setSettingsDraft((p) => ({ ...p, monthly_limit: e.target.value }))}
            />
          </div>

          <div className="reg-toggle-wrapper">
            <label>Feature Status</label>
            <label className="reg-toggle">
              <input
                type="checkbox"
                checked={!!settingsDraft.is_enabled}
                onChange={(e) => setSettingsDraft((p) => ({ ...p, is_enabled: e.target.checked }))}
              />
              <span className="reg-toggle-track" />
              <span className="reg-toggle-label">
                {settingsDraft.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <button
            className="reg-settings-save-btn"
            onClick={handleSaveSettings}
            disabled={settingsLoading}
          >
            <FaSave /> {settingsLoading ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="reg-table-card">
        <div className="reg-table-header">
          <h3><FaClipboardList style={{ marginRight: '0.4rem' }} />Attendance Correction Requests</h3>
          <div className="reg-filters">
            {/* Status tabs */}
            <div className="reg-filter-tabs">
              {['all', 'Pending', 'Approved', 'Rejected'].map((s) => (
                <button
                  key={s}
                  className={`reg-filter-tab ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
            {/* Search */}
            <input
              type="text"
              placeholder="Search employee, reason…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: '200px' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="reg-loading">
            <div className="reg-spinner" />
            <p>Loading requests…</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="reg-empty">
            <div className="reg-empty-icon">📋</div>
            <p>No attendance correction requests found</p>
          </div>
        ) : (
          <div className="reg-table-wrapper">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Request Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Requested Status</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="reg-employee-info">
                        <span className="name">{r.first_name} {r.last_name}</span>
                        <span className="meta">{r.employee_id} · {r.department_name || r.position}</span>
                      </div>
                    </td>
                    <td>{fmtDate(r.request_date)}</td>
                    <td>{fmtDateTime(r.requested_check_in)}</td>
                    <td>{fmtDateTime(r.requested_check_out)}</td>
                    <td>{fmt(r.requested_status)}</td>
                    <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                      {r.reason}
                    </td>
                    <td>
                      <span className={`reg-badge ${r.status.toLowerCase()}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.reviewed_by_name
                        ? <><span style={{ fontSize: '0.775rem' }}>{r.reviewed_by_name}</span><br />
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{fmtDate(r.reviewed_at)}</span></>
                        : '—'
                      }
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {fmtDate(r.created_at)}
                    </td>
                    <td>
                      <div className="reg-action-btns">
                        {r.status === 'Pending' && (
                          <>
                            <button
                              className="reg-btn approve"
                              title="Approve"
                              onClick={() => setModalData({ open: true, request: r, action: 'approve' })}
                            >
                              <FaCheck />
                            </button>
                            <button
                              className="reg-btn reject"
                              title="Reject"
                              onClick={() => setModalData({ open: true, request: r, action: 'reject' })}
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        <button
                          className="reg-btn delete"
                          title="Delete"
                          onClick={() => handleDelete(r.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {modalData.open && (
        <ActionModal
          request={modalData.request}
          action={modalData.action}
          loading={actionLoading}
          onConfirm={handleAction}
          onClose={() => setModalData({ open: false, request: null, action: null })}
        />
      )}
    </div>
  );
};

export default RegularizationManagement;
