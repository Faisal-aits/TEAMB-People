// src/pages/employees/EmployeeRegularization.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { regularizationAPI } from '../../services/regularizationAPI';
import './EmployeeRegularization.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};
const fmtDT = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const STATUS_REQUESTED = [
  { value: '', label: 'Select status (optional)' },
  { value: 'Present', label: 'Present' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Delayed', label: 'Delayed' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cls = status?.toLowerCase() === 'pending' ? 'badge-pending'
    : status?.toLowerCase() === 'approved' ? 'badge-approved'
    : 'badge-rejected';
  return <span className={`emp-reg-badge ${cls}`}>{status}</span>;
}

// ─── Usage Indicator ──────────────────────────────────────────────────────────
function UsageIndicator({ usage }) {
  if (!usage) return null;
  const pct = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  const color = pct >= 100 ? '#dc2626' : pct >= 75 ? '#f59e0b' : '#10b981';

  return (
    <div className="emp-reg-usage-card">
      <div className="usage-top">
        <span className="usage-label">Monthly Requests Used</span>
        <span className="usage-count" style={{ color }}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="usage-bar-track">
        <div
          className="usage-bar-fill"
          style={{ width: `${Math.min(100, pct)}%`, background: color }}
        />
      </div>
      <p className="usage-hint">
        {usage.remaining > 0
          ? `You have ${usage.remaining} request${usage.remaining > 1 ? 's' : ''} remaining this month.`
          : 'You have reached your monthly attendance correction limit.'}
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeRegularization = () => {
  const [requests, setRequests] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    request_date: '',
    requested_check_in: '',
    requested_check_out: '',
    requested_status: '',
    reason: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [myRes, usageRes] = await Promise.all([
        regularizationAPI.getMyRequests(),
        regularizationAPI.getMyMonthlyUsage(),
      ]);
      if (myRes.data?.success) setRequests(myRes.data.requests || []);
      if (usageRes.data?.success) setUsage(usageRes.data.usage);
    } catch (err) {
      console.error('Fetch regularization error:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Validate ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!form.request_date) errors.request_date = 'Date is required';
    if (!form.reason.trim()) errors.reason = 'Reason is required';
    if (form.request_date) {
      const req = new Date(form.request_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (req > today) errors.request_date = 'Cannot request for a future date';
    }
    if (form.requested_check_in && form.requested_check_out) {
      if (form.requested_check_in >= form.requested_check_out) {
        errors.requested_check_out = 'Check-out must be after check-in';
      }
    }
    return errors;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    try {
      setSubmitting(true);
      // Build datetime strings (combine date + time)
      const payload = {
        request_date: form.request_date,
        reason: form.reason.trim(),
        requested_status: form.requested_status || undefined,
      };
      if (form.requested_check_in) {
        payload.requested_check_in = `${form.request_date}T${form.requested_check_in}:00`;
      }
      if (form.requested_check_out) {
        payload.requested_check_out = `${form.request_date}T${form.requested_check_out}:00`;
      }

      const res = await regularizationAPI.create(payload);
      if (res.data?.success) {
        showToast('Attendance correction request submitted successfully!');
        setShowForm(false);
        setForm({ request_date: '', requested_check_in: '', requested_check_out: '', requested_status: '', reason: '' });
        setFormErrors({});
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit request';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (formErrors[field]) setFormErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filteredRequests = requests.filter((r) =>
    filterStatus === 'all' ? true : r.status?.toLowerCase() === filterStatus.toLowerCase()
  );

  const limitReached = usage && usage.remaining <= 0;
  const featureDisabled = usage && !usage.is_enabled;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="emp-reg-section">
      {/* Toast */}
      {toast && (
        <div className={`emp-reg-toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="emp-reg-header">
        <div>
          <h2>Attendance Correction</h2>
          <p>Request corrections to your attendance records</p>
        </div>
        {!featureDisabled && (
          <button
            className={`emp-reg-submit-btn ${limitReached ? 'disabled' : ''}`}
            onClick={() => !limitReached && setShowForm(!showForm)}
            disabled={limitReached || loading}
            title={limitReached ? 'Monthly limit reached' : 'Submit new request'}
          >
            {showForm ? '✕ Cancel' : '+ New Request'}
          </button>
        )}
      </div>

      {featureDisabled && (
        <div className="emp-reg-disabled-notice">
          ⚠ Attendance Correction is currently disabled by the administrator.
        </div>
      )}

      {/* Usage Indicator */}
      {usage && <UsageIndicator usage={usage} />}

      {/* Submission Form */}
      {showForm && !featureDisabled && (
        <div className="emp-reg-form-card">
          <h3>New Attendance Correction Request</h3>
          <form onSubmit={handleSubmit}>
            <div className="emp-reg-form-grid">
              {/* Date */}
              <div className="emp-reg-field">
                <label>Attendance Date <span className="req">*</span></label>
                <input
                  type="date"
                  value={form.request_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFormChange('request_date', e.target.value)}
                />
                {formErrors.request_date && <span className="emp-reg-error">{formErrors.request_date}</span>}
              </div>

              {/* Requested Status */}
              <div className="emp-reg-field">
                <label>Requested Status</label>
                <select
                  value={form.requested_status}
                  onChange={(e) => handleFormChange('requested_status', e.target.value)}
                >
                  {STATUS_REQUESTED.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Check-In */}
              <div className="emp-reg-field">
                <label>Correct Check-In Time</label>
                <input
                  type="time"
                  value={form.requested_check_in}
                  onChange={(e) => handleFormChange('requested_check_in', e.target.value)}
                />
              </div>

              {/* Check-Out */}
              <div className="emp-reg-field">
                <label>Correct Check-Out Time</label>
                <input
                  type="time"
                  value={form.requested_check_out}
                  onChange={(e) => handleFormChange('requested_check_out', e.target.value)}
                />
                {formErrors.requested_check_out && (
                  <span className="emp-reg-error">{formErrors.requested_check_out}</span>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="emp-reg-field full-width">
              <label>Reason for Attendance Correction <span className="req">*</span></label>
              <textarea
                rows={3}
                placeholder="Explain why you need to correct your attendance…"
                value={form.reason}
                onChange={(e) => handleFormChange('reason', e.target.value)}
              />
              {formErrors.reason && <span className="emp-reg-error">{formErrors.reason}</span>}
            </div>

            <div className="emp-reg-form-footer">
              <button
                type="button"
                className="emp-reg-cancel-btn"
                onClick={() => { setShowForm(false); setFormErrors({}); }}
              >
                Cancel
              </button>
              <button type="submit" className="emp-reg-confirm-btn" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests History */}
      <div className="emp-reg-list-card">
        <div className="emp-reg-list-header">
          <h3>My Attendance Correction Requests</h3>
          <div className="emp-reg-filter-tabs">
            {['all', 'Pending', 'Approved', 'Rejected'].map((s) => (
              <button
                key={s}
                className={`emp-reg-tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="emp-reg-loading">
            <div className="emp-reg-spinner" />
            <p>Loading your requests…</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="emp-reg-empty">
            <div className="empty-icon">📋</div>
            <p>No {filterStatus !== 'all' ? filterStatus.toLowerCase() : ''} requests found</p>
          </div>
        ) : (
          <div className="emp-reg-cards">
            {filteredRequests.map((r) => (
              <div className="emp-reg-request-card" key={r.id}>
                <div className="rc-top">
                  <div>
                    <span className="rc-date">{fmtDate(r.request_date)}</span>
                    {r.requested_status && (
                      <span className="rc-req-status">→ {r.requested_status}</span>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <div className="rc-times">
                  {r.requested_check_in && (
                    <span className="rc-time-chip">
                      <span className="chip-label">In</span> {fmtDT(r.requested_check_in)}
                    </span>
                  )}
                  {r.requested_check_out && (
                    <span className="rc-time-chip">
                      <span className="chip-label">Out</span> {fmtDT(r.requested_check_out)}
                    </span>
                  )}
                </div>

                <p className="rc-reason">"{r.reason}"</p>

                {r.admin_remarks && (
                  <div className="rc-admin-remarks">
                    <span className="rc-remarks-label">Admin:</span> {r.admin_remarks}
                  </div>
                )}

                <div className="rc-footer">
                  <span className="rc-submitted">Submitted: {fmtDate(r.created_at)}</span>
                  {r.reviewed_by_name && (
                    <span className="rc-reviewed">
                      Reviewed by {r.reviewed_by_name} · {fmtDate(r.reviewed_at)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRegularization;
