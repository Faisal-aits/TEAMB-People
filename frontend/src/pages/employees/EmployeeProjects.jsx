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
                    <tr key={task.id}>
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
                        <span className={`employee-task-status ${getStatusClass(task.status)}`}>
                          {task.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmployeeProjects;
