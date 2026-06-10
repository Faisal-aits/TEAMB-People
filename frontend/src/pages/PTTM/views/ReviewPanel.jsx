// frontend/src/pages/PTTM/views/ReviewPanel.jsx

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/PTTMContext';
import {
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiLayers,
  FiFolder,
  FiCalendar,
  FiMessageSquare,
  FiAlertTriangle,
  FiClipboard,
  FiMapPin,
  FiInbox,
} from 'react-icons/fi';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReviewPanel() {
  const app = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await app.getPendingReviewTasks();
      console.log('Tasks data:', data); // Debug: console mein dekhlo data ka structure
      setTasks(data);
    } catch {
      // error shown by context toast
    } finally {
      setLoading(false);
    }
  }, [app]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { load(); }, [app.tasks]);

  const handleApprove = async (taskId) => {
    setSubmitting(taskId);
    await app.reviewTask(taskId, 'approve', '');
    await load();
    setSubmitting(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setSubmitting(rejectModal.taskId);
    await app.reviewTask(rejectModal.taskId, 'reject', rejectModal.notes);
    await load();
    setSubmitting(null);
    setRejectModal(null);
  };

  return (
    <>
      <style>{css}</style>
      <div className="rp-container">

        {/* ── Stats Bar ── */}
        {!loading && tasks.length > 0 && (
          <div className="rp-stats-bar">
            <div className="rp-stat">
              <FiClock size={16} />
              <span><strong>{tasks.length}</strong> pending</span>
            </div>
            <button className="rp-refresh-btn" onClick={load}>
              <FiRefreshCw size={14} />
              Refresh
            </button>
          </div>
        )}

        {/* ── Body ── */}
        {loading ? (
          <div className="rp-empty">
            <div className="rp-spinner" />
            <p className="rp-empty-msg">Loading tasks…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="rp-empty">
            <div className="rp-empty-icon-wrap rp-empty-icon-wrap--success">
              <FiCheckCircle size={40} color="#22c55e" />
            </div>
            <h3 className="rp-empty-title">All caught up!</h3>
            <p className="rp-empty-msg">No tasks are pending your review right now.</p>
            <button className="rp-refresh-btn rp-refresh-btn--center" onClick={load}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>
        ) : (
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th className="rp-th"><FiClipboard size={13} style={{ marginRight: 6 }} />Task Details</th>
                  <th className="rp-th"><FiFolder size={13} style={{ marginRight: 6 }} />Project & Phase</th>
                  <th className="rp-th"><FiUser size={13} style={{ marginRight: 6 }} />Employee</th>
                  <th className="rp-th"><FiInbox size={13} style={{ marginRight: 6 }} />Submission</th>
                  <th className="rp-th rp-th--center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onApprove={() => handleApprove(task.id)}
                    onReject={() => setRejectModal({ taskId: task.id, notes: '' })}
                    isSubmitting={submitting === task.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Reject Modal ── */}
        {rejectModal && (
          <div className="rp-overlay" onClick={() => setRejectModal(null)}>
            <div className="rp-modal" onClick={e => e.stopPropagation()}>
              <div className="rp-modal-header">
                <div className="rp-modal-icon-wrap">
                  <FiXCircle size={22} color="#dc2626" />
                </div>
                <div>
                  <h3 className="rp-modal-title">Request Revision</h3>
                  <p className="rp-modal-sub">Explain what needs to be fixed before this can be approved.</p>
                </div>
              </div>
              <textarea
                className="rp-textarea"
                rows={4}
                placeholder="e.g. The output doesn't match the requirements. Please revise section 3."
                value={rejectModal.notes}
                onChange={e => setRejectModal(m => ({ ...m, notes: e.target.value }))}
                autoFocus
              />
              <div className="rp-modal-actions">
                <button className="rp-btn rp-btn--ghost" onClick={() => setRejectModal(null)}>Cancel</button>
                <button
                  className="rp-btn rp-btn--danger"
                  onClick={handleReject}
                  disabled={!rejectModal.notes.trim() || submitting}
                >
                  <FiXCircle size={14} />
                  {submitting ? 'Sending…' : 'Send Back'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Helper function to get employee name from different possible structures ── */
function getEmployeeName(task, app) {
  // Debug: Console mein dekhne ke liye
  console.log('Task object:', task);
  console.log('assignedUser:', task.assignedUser);
  console.log('assigned_to:', task.assigned_to);
  console.log('employee:', task.employee);
  console.log('user:', task.user);

  // Multiple possible paths check kar rahe hain
  if (task.assignedUser?.name) return task.assignedUser.name;
  if (task.assignedUser?.fullName) return task.assignedUser.fullName;
  if (task.assigned_to?.name) return task.assigned_to.name;
  if (task.assigned_to?.fullName) return task.assigned_to.fullName;
  if (task.employee?.name) return task.employee.name;
  if (task.employee?.fullName) return task.employee.fullName;
  if (task.user?.name) return task.user.name;
  if (task.user?.fullName) return task.user.fullName;
  if (task.assignedTo?.name) return task.assignedTo.name;

  // Agar direct property ho to
  if (task.employeeName) return task.employeeName;
  if (task.assignedName) return task.assignedName;

  // Fallback via app context users list
  if (app && task.assigned_user_id) {
    const name = app.userName(task.assigned_user_id);
    if (name) return name;
  }

  // Agar kuch nahi milta to '—' return karo
  return '—';
}

/* ─── Row Component ─────────────────────────────────────────────────────── */
function TaskRow({ task, onApprove, onReject, isSubmitting }) {
  const app = useApp();
  const employeeName = getEmployeeName(task, app);
  const projectName = task.Project?.name || task.project?.name || '—';
  const phaseName = task.Phase?.name || task.phase?.name || '—';

  return (
    <tr className="rp-tr">
      {/* Task Details */}
      <td className="rp-td">
        <span className="rp-badge">
          <FiClock size={10} />
          Under Review
        </span>
        <div className="rp-task-title">{task.task_title || task.title || '(Untitled Task)'}</div>
        {task.description && (
          <div className="rp-task-desc" title={task.description}>
            {task.description.length > 70
              ? task.description.substring(0, 70) + '…'
              : task.description}
          </div>
        )}
        <div className="rp-meta">
          <FiCalendar size={11} />
          Due: {task.date || task.due_date || '—'}
        </div>
      </td>

      {/* Project & Phase */}
      <td className="rp-td">
        <div className="rp-info-row">
          <FiFolder size={13} className="rp-info-icon rp-info-icon--blue" />
          <span className="rp-info-primary">{projectName}</span>
        </div>
        <div className="rp-info-row" style={{ marginTop: 6 }}>
          <FiMapPin size={13} className="rp-info-icon rp-info-icon--purple" />
          <span className="rp-info-secondary">{phaseName}</span>
        </div>
      </td>

      {/* Employee - Real time name show karega */}
      <td className="rp-td">
        <div className="rp-avatar-row">
          {/* <div className="rp-avatar">
            {employeeName !== '—' ? employeeName.charAt(0).toUpperCase() : <FiUser size={14} />}
          </div> */}
          <div className="rp-employee-name">{employeeName}</div>
        </div>
      </td>

      {/* Submission Info */}
      <td className="rp-td">
        <div className="rp-info-row">
          <FiCalendar size={12} className="rp-info-icon rp-info-icon--gray" />
          <span className="rp-date">{formatDate(task.submitted_at)}</span>
        </div>
        {task.remarks && (
          <div className="rp-info-row" style={{ marginTop: 6 }}>
            <FiMessageSquare size={12} className="rp-info-icon rp-info-icon--gray" />
            <span className="rp-remarks" title={task.remarks}>
              {task.remarks.length > 45 ? task.remarks.substring(0, 45) + '…' : task.remarks}
            </span>
          </div>
        )}
        {task.review_notes && (
          <div className="rp-prev-notes" title={task.review_notes}>
            <FiAlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Prior feedback: </strong>
              {task.review_notes.length > 45
                ? task.review_notes.substring(0, 45) + '…'
                : task.review_notes}
            </span>
          </div>
        )}
      </td>

      {/* Actions - Row mein buttons, sirf icons */}
      <td className="rp-td-actions">
        <div className="rp-action-row">
          <button
            className="rp-btn rp-btn--approve"
            onClick={onApprove}
            disabled={isSubmitting}
            title="Approve"
          >
            <FiCheckCircle size={18} />
          </button>
          <button
            className="rp-btn rp-btn--revise"
            onClick={onReject}
            disabled={isSubmitting}
            title="Revise"
          >
            <FiXCircle size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── CSS ────────────────────────────────────────────────────────────────── */
const css = `
  .rp-container {
    height: 100%;
    overflow-y: auto;
    padding: 24px;
    background: #f8fafc;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    box-sizing: border-box;
    color: #0f172a;
  }

  /* Stats bar */
  .rp-stats-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
    padding: 10px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .rp-stat {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    color: #64748b;
  }
  .rp-stat strong { color: #0f172a; }

  /* Refresh button */
  .rp-refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .rp-refresh-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
  .rp-refresh-btn--center { margin-top: 14px; }

  /* Empty state */
  .rp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    color: #64748b;
    text-align: center;
  }
  .rp-empty-icon-wrap {
    width: 72px; height: 72px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
  }
  .rp-empty-icon-wrap--success { background: #f0fdf4; }
  .rp-empty-title { margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #15803d; }
  .rp-empty-msg { margin: 0; font-size: 14px; color: #64748b; }

  /* Spinner */
  .rp-spinner {
    width: 36px; height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: rp-spin 0.75s linear infinite;
    margin-bottom: 14px;
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  /* Table */
  .rp-table-wrap {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  .rp-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
  }
  .rp-th {
    padding: 13px 18px;
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }
  .rp-th--center { text-align: center; }
  .rp-tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s;
  }
  .rp-tr:last-child { border-bottom: none; }
  .rp-tr:hover { background: #fafafa; }
  .rp-td {
    padding: 15px 18px;
    vertical-align: top;
  }
  .rp-td-actions {
    padding: 15px 18px;
    vertical-align: middle;
    text-align: center;
  }

  /* Badge */
  .rp-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    background: #fef9c3;
    color: #854d0e;
    border: 1px solid #fde68a;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 8px;
  }

  /* Task title & desc */
  .rp-task-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.4;
    margin-bottom: 5px;
  }
  .rp-task-desc {
    font-size: 12.5px;
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 8px;
    max-width: 280px;
  }
  .rp-meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  /* Info rows */
  .rp-info-row {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .rp-info-icon { flex-shrink: 0; }
  .rp-info-icon--blue  { color: #3b82f6; }
  .rp-info-icon--purple { color: #8b5cf6; }
  .rp-info-icon--gray  { color: #94a3b8; }
  .rp-info-primary  { font-size: 13px; font-weight: 600; color: #1e293b; }
  .rp-info-secondary { font-size: 12.5px; color: #64748b; }

  /* Avatar and Employee Name */
  .rp-avatar-row { display: flex; align-items: center; gap: 10px; }
  .rp-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rp-employee-name {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.4;
  }

  /* Dates & remarks */
  .rp-date { font-size: 12.5px; color: #475569; font-weight: 500; }
  .rp-remarks { font-size: 12px; color: #64748b; font-style: italic; }
  .rp-prev-notes {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 8px;
    padding: 7px 10px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 7px;
    font-size: 11.5px;
    color: #92400e;
    max-width: 260px;
    line-height: 1.5;
  }

  /* Action Buttons - Row mein */
  .rp-action-row {
    display: flex;
    flex-direction: row;
    gap: 8px;
    justify-content: center;
    align-items: center;
  }
  
  .rp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: 40px;
  }
  .rp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .rp-btn:not(:disabled):active { transform: scale(0.95); }

  .rp-btn--approve {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #fff;
    box-shadow: 0 2px 6px rgba(34,197,94,0.25);
  }
  .rp-btn--approve:not(:disabled):hover { 
    box-shadow: 0 4px 12px rgba(34,197,94,0.35);
    transform: translateY(-1px);
  }

  .rp-btn--revise {
    background: #fff;
    color: #dc2626;
    border: 1.5px solid #fca5a5;
  }
  .rp-btn--revise:not(:disabled):hover { 
    background: #fff1f2; 
    border-color: #f87171;
    transform: translateY(-1px);
  }

  .rp-btn--danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #fff;
    box-shadow: 0 2px 6px rgba(239,68,68,0.25);
  }
  .rp-btn--danger:disabled { opacity: 0.55; }

  .rp-btn--ghost {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  .rp-btn--ghost:hover { background: #f1f5f9; }

  /* Modal */
  .rp-overlay {
    position: fixed; inset: 0;
    background: rgba(15,23,42,0.5);
    backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    animation: rp-fade-in 0.15s ease;
  }
  .rp-modal {
    background: #fff;
    border-radius: 14px;
    padding: 28px 30px;
    width: 460px;
    max-width: 95vw;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    animation: rp-slide-up 0.2s ease;
  }
  .rp-modal-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }
  .rp-modal-icon-wrap {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: #fff1f2;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rp-modal-title { margin: 0 0 4px; font-size: 17px; font-weight: 700; color: #0f172a; }
  .rp-modal-sub { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
  .rp-textarea {
    width: 100%;
    padding: 10px 13px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    font-size: 13.5px;
    font-family: inherit;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    line-height: 1.6;
    color: #0f172a;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rp-textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .rp-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
  }

  @keyframes rp-fade-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes rp-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;