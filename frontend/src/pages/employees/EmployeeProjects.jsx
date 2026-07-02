import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineArrowPath,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { projectAPI } from '../../services/projectAPI';
import './EmployeeProjects.css';

const numberFormat = new Intl.NumberFormat('en-IN');

const getList = (response, key) => {
  const payload = response?.data;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const formatNumber = (value) => numberFormat.format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'No deadline';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const isCompleted = (task) => normalizeText(task.status) === 'completed';

const isOverdue = (task) => {
  if (isCompleted(task)) return false;
  const dueDate = getDateValue(task.due_date || task.date);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

const getStatusClass = (status) =>
  normalizeText(status || 'pending').replace(/[^a-z0-9]+/g, '-');

const EmployeeProjects = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const loadWork = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [projectsResult, tasksResult] = await Promise.allSettled([
        projectAPI.getMyProjects(),
        projectAPI.getMyTasks(),
      ]);

      if (projectsResult.status === 'fulfilled') {
        setProjects(getList(projectsResult.value, 'projects'));
      } else {
        setProjects([]);
      }

      if (tasksResult.status === 'fulfilled') {
        setTasks(getList(tasksResult.value, 'tasks'));
      } else {
        setTasks([]);
      }

      if (projectsResult.status === 'rejected' || tasksResult.status === 'rejected') {
        setError('Some assigned work could not be loaded.');
      }
    } catch (err) {
      console.error('Failed to load assigned work:', err);
      setError('Unable to load assigned work.');
      setProjects([]);
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWork();
  }, [loadWork]);

  const handleRowClick = (task) => {
    setSelectedTask(task);
    setEditStatus(task.status || 'Pending');
    setEditRemarks(task.remarks || '');
    setModalMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    if (!selectedTask) return;
    setModalSubmitting(true);
    setModalMessage({ type: '', text: '' });
    try {
      await projectAPI.updateTaskStatusAndRemarks(selectedTask.id, editStatus, editRemarks);
      setModalMessage({ type: 'success', text: 'Task updated successfully!' });
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? { ...t, status: editStatus, remarks: editRemarks } : t))
      );
    } catch (err) {
      console.error(err);
      setModalMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update task.' });
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!selectedTask) return;
    setModalSubmitting(true);
    setModalMessage({ type: '', text: '' });
    try {
      // First save status and remarks
      await projectAPI.updateTaskStatusAndRemarks(selectedTask.id, editStatus, editRemarks);
      // Then submit for review
      const res = await projectAPI.submitForReview(selectedTask.id);
      
      const updatedTask = res.data?.data || res.data || {};
      const newStatus = updatedTask.status || 'Under Review';
      const newReviewStatus = updatedTask.review_status || 'Pending Review';
      const submittedAt = updatedTask.submitted_at || new Date().toISOString();

      setModalMessage({ type: 'success', text: 'Task submitted for review successfully!' });
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                status: newStatus,
                remarks: editRemarks,
                review_status: newReviewStatus,
                submitted_at: submittedAt,
              }
            : t
        )
      );

      setSelectedTask((prev) => ({
        ...prev,
        status: newStatus,
        remarks: editRemarks,
        review_status: newReviewStatus,
        submitted_at: submittedAt,
      }));
    } catch (err) {
      console.error(err);
      setModalMessage({ type: 'error', text: err.response?.data?.error || 'Failed to submit task for review.' });
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleQuickSubmit = async (e, task) => {
    e.stopPropagation();
    if (!window.confirm('Submit this task for review?')) return;
    try {
      setError('');
      const res = await projectAPI.submitForReview(task.id);
      const updatedTask = res.data?.data || res.data || {};
      const newStatus = updatedTask.status || 'Under Review';
      const newReviewStatus = updatedTask.review_status || 'Pending Review';
      const submittedAt = updatedTask.submitted_at || new Date().toISOString();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: newStatus,
                review_status: newReviewStatus,
                submitted_at: submittedAt,
              }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit task for review.');
    }
  };

  const summary = useMemo(() => {
    const activeTasks = tasks.filter((task) => !isCompleted(task));
    const completedTasks = tasks.filter(isCompleted);
    const overdueTasks = tasks.filter(isOverdue);
    const nextTask = [...activeTasks]
      .filter((task) => getDateValue(task.due_date || task.date))
      .sort((a, b) => getDateValue(a.due_date || a.date) - getDateValue(b.due_date || b.date))[0];

    return {
      projectCount: projects.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      nextTask,
    };
  }, [projects, tasks]);

  const statusOptions = useMemo(() => {
    const values = new Set(tasks.map((task) => task.status || 'Pending').filter(Boolean));
    return ['All', ...Array.from(values).sort()];
  }, [tasks]);

  const taskCountByProject = useMemo(() => {
    return tasks.reduce((map, task) => {
      const projectId = String(task.project_id || task.project?.id || '');
      if (!projectId) return map;
      map[projectId] = (map[projectId] || 0) + 1;
      return map;
    }, {});
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = normalizeText(searchTerm);
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;

      const searchable = [
        task.task_title,
        task.title,
        task.description,
        task.status,
        task.project_name,
        task.project?.name,
        task.phase_name,
        task.phase?.name,
        task.team_name,
        task.team?.name,
        task.remarks,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(query);
    });
  }, [searchTerm, statusFilter, tasks]);

  const summaryCards = [
    {
      label: 'Projects',
      value: summary.projectCount,
      note: 'Assigned project list',
      icon: <HiOutlineBriefcase />,
      tone: 'blue',
    },
    {
      label: 'Active Tasks',
      value: summary.activeTasks,
      note: `${formatNumber(summary.overdueTasks)} overdue`,
      icon: <HiOutlineClock />,
      tone: summary.overdueTasks > 0 ? 'amber' : 'green',
    },
    {
      label: 'Completed',
      value: summary.completedTasks,
      note: 'Finished assignments',
      icon: <HiOutlineCheckCircle />,
      tone: 'green',
    },
    {
      label: 'Next Due',
      value: summary.nextTask ? formatDate(summary.nextTask.due_date || summary.nextTask.date) : 'None',
      note: summary.nextTask?.task_title || summary.nextTask?.title || 'No upcoming tasks',
      icon: <HiOutlineCalendarDays />,
      tone: 'blue',
    },
  ];

  if (loading) {
    return (
      <div className="employee-projects">
        <div className="employee-projects-loading">Loading assigned work...</div>
      </div>
    );
  }

  return (
    <div className="employee-projects">
      <header className="employee-projects-header">
        <div>
          <span>Employee Work</span>
          <h1>My Projects & Tasks</h1>
        </div>
        <button type="button" className="employee-projects-refresh" onClick={() => loadWork(true)} disabled={refreshing}>
          <HiOutlineArrowPath />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </header>

      {error && <div className="employee-projects-alert">{error}</div>}

      <section className="employee-projects-summary" aria-label="Assigned work summary">
        {summaryCards.map((card) => (
          <div key={card.label} className={`employee-projects-card ${card.tone}`}>
            <span className="employee-projects-card-icon">{card.icon}</span>
            <span>{card.label}</span>
            <strong>{typeof card.value === 'number' ? formatNumber(card.value) : card.value}</strong>
            <small>{card.note}</small>
          </div>
        ))}
      </section>

      <section className="employee-projects-grid">
        <div className="employee-projects-panel">
          <div className="employee-projects-panel-title">
            <div>
              <h2>Projects</h2>
              <p>{formatNumber(projects.length)} assigned</p>
            </div>
          </div>

          <div className="employee-project-list">
            {projects.length === 0 ? (
              <div className="employee-projects-empty">
                <HiOutlineBriefcase />
                <span>No assigned projects found.</span>
              </div>
            ) : (
              projects.map((project) => {
                const projectId = String(project.id || project.project_id || '');
                return (
                  <article key={projectId || project.name} className="employee-project-item">
                    <div>
                      <h3>{project.name || project.project_name || 'Untitled Project'}</h3>
                      <p>{project.department || project.client_name || 'General'}</p>
                    </div>
                    <div className="employee-project-item-meta">
                      <span className={`employee-task-status ${getStatusClass(project.status || 'Active')}`}>
                        {project.status || 'Active'}
                      </span>
                      <span>{formatNumber(taskCountByProject[projectId] || 0)} tasks</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="employee-projects-panel employee-tasks-panel">
          <div className="employee-projects-panel-title tasks-title">
            <div>
              <h2>Tasks</h2>
              <p>{formatNumber(filteredTasks.length)} of {formatNumber(tasks.length)}</p>
            </div>
            <div className="employee-projects-toolbar">
              <label className="employee-projects-search">
                <HiOutlineMagnifyingGlass />
                <input
                  type="search"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="employee-tasks-table-wrap">
            <table className="employee-tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Phase</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="employee-projects-empty table-empty">
                        <HiOutlineClipboardDocumentList />
                        <span>No assigned tasks found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="employee-task-row-interactive" onClick={() => handleRowClick(task)}>
                      <td>
                        <div className="employee-task-title">
                          <strong>{task.task_title || task.title || 'Untitled Task'}</strong>
                          {task.description && <span>{task.description}</span>}
                          {isOverdue(task) && (
                            <small className="employee-task-overdue">
                              <HiOutlineExclamationTriangle />
                              Overdue
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{task.project_name || task.project?.name || '-'}</td>
                      <td>{task.phase_name || task.phase?.name || task.team_name || task.team?.name || '-'}</td>
                      <td>{formatDate(task.due_date || task.date)}</td>
                      <td>
                        <div className="employee-status-cell">
                          <span className={`employee-task-status ${getStatusClass(task.status)}`}>
                            {task.status || 'Pending'}
                          </span>
                          {task.review_status === 'Pending Review' && (
                            <span className="employee-review-badge pending">Awaiting Review</span>
                          )}
                          {task.review_status === 'Rejected' && (
                            <span className="employee-review-badge rejected">Revision Required</span>
                          )}
                          {task.review_status === 'Approved' && (
                            <span className="employee-review-badge approved">Approved</span>
                          )}
                          {((task.status === 'In Progress' || task.status === 'Pending') && task.review_status !== 'Pending Review' && task.review_status !== 'Approved' && task.status !== 'Under Review' && task.status !== 'Completed') && (
                            <button
                              type="button"
                              className="employee-quick-submit-btn"
                              onClick={(e) => handleQuickSubmit(e, task)}
                              title="Submit task for review"
                            >
                              ➤ Submit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selectedTask && (
        <div className="employee-modal-overlay" onClick={() => { if (!modalSubmitting) setSelectedTask(null); loadWork(true); }}>
          <div className="employee-modal" onClick={(e) => e.stopPropagation()}>
            <header className="employee-modal-header">
              <div>
                <h2>Task Details</h2>
                <p className="employee-modal-subtitle">{selectedTask.project?.name || selectedTask.project_name || 'No Project'}</p>
              </div>
              <button type="button" className="employee-modal-close" onClick={() => { if (!modalSubmitting) setSelectedTask(null); loadWork(true); }}>
                <HiOutlineXMark />
              </button>
            </header>

            {modalMessage.text && (
              <div className={`employee-modal-alert ${modalMessage.type}`}>
                {modalMessage.type === 'success' ? <HiOutlineCheckCircle /> : <HiOutlineExclamationTriangle />}
                <span>{modalMessage.text}</span>
              </div>
            )}

            <div className="employee-modal-body">
              {/* Revision notes if task is rejected */}
              {selectedTask.review_status === 'Rejected' && (
                <div className="employee-modal-revision-notes">
                  <div className="revision-header">
                    <HiOutlineExclamationTriangle />
                    <span>Revision Feedback from Team Leader</span>
                  </div>
                  <p className="revision-text">{selectedTask.review_notes || 'Please revise this task according to guidelines.'}</p>
                </div>
              )}

              {/* Awaiting Review banner */}
              {(selectedTask.review_status === 'Pending Review' || selectedTask.status === 'Under Review') && (
                <div className="employee-modal-review-banner">
                  <HiOutlineClock />
                  <span>This task is currently under review and cannot be edited.</span>
                </div>
              )}

              {/* Completed/Approved banner */}
              {(selectedTask.status === 'Completed' || selectedTask.review_status === 'Approved') && (
                <div className="employee-modal-completed-banner">
                  <HiOutlineCheckCircle />
                  <span>This task has been completed and reviewed, and is locked.</span>
                </div>
              )}

              <div className="employee-modal-grid">
                <div className="grid-item">
                  <label>Task Title</label>
                  <p>{selectedTask.title || selectedTask.task_title}</p>
                </div>
                <div className="grid-item">
                  <label>Phase</label>
                  <p>{selectedTask.phase?.name || selectedTask.phase_name || '-'}</p>
                </div>
                <div className="grid-item">
                  <label>Team</label>
                  <p>{selectedTask.team?.name || selectedTask.team_name || '-'}</p>
                </div>
                <div className="grid-item">
                  <label>Due Date</label>
                  <p>{formatDate(selectedTask.due_date || selectedTask.date)}</p>
                </div>
                {selectedTask.description && (
                  <div className="grid-item full-width">
                    <label>Description</label>
                    <p className="description-text">{selectedTask.description}</p>
                  </div>
                )}
              </div>

              <div className="employee-modal-edit-fields">
                <div className="edit-group">
                  <label htmlFor="task-status-select">Status</label>
                  <select
                    id="task-status-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={selectedTask.review_status === 'Pending Review' || selectedTask.status === 'Under Review' || selectedTask.status === 'Completed' || selectedTask.review_status === 'Approved' || modalSubmitting}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Started">Not Started</option>
                    <option value="On Going">On Going</option>
                  </select>
                </div>

                <div className="edit-group">
                  <label htmlFor="task-remarks-textarea">My Remarks / Submission Comments</label>
                  <textarea
                    id="task-remarks-textarea"
                    rows={3}
                    placeholder="Describe your progress, links to work, or notes here..."
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    disabled={selectedTask.review_status === 'Pending Review' || selectedTask.status === 'Under Review' || selectedTask.status === 'Completed' || selectedTask.review_status === 'Approved' || modalSubmitting}
                  />
                </div>
              </div>
            </div>

            <footer className="employee-modal-footer">
              <button
                type="button"
                className="employee-btn-secondary"
                onClick={() => { setSelectedTask(null); loadWork(true); }}
                disabled={modalSubmitting}
              >
                Close
              </button>
              {selectedTask.review_status !== 'Pending Review' && 
               selectedTask.status !== 'Under Review' && 
               selectedTask.status !== 'Completed' && 
               selectedTask.review_status !== 'Approved' && (
                <>
                  <button
                    type="button"
                    className="employee-btn-primary"
                    onClick={handleSave}
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="employee-btn-submit-review"
                    onClick={handleSubmitForReview}
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </>
              )}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProjects;
