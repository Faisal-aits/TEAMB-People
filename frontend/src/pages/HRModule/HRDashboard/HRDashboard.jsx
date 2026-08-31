import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineUserGroup,
  HiOutlineUsers
} from 'react-icons/hi2';
import dashboardAPI from '../../../services/dashboardAPI';
import { employeeAPI } from '../../../services/employeeAPI';
import './HRDashboard.css';

const emptyOverview = {
  hr: {},
  documents: {},
  actions: [],
  recentActivity: []
};

const numberFormat = new Intl.NumberFormat('en-IN');
const formatNumber = (value) => numberFormat.format(Number(value || 0));

const formatTimeAgo = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 8) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const HRDashboard = ({ navigateToTab }) => {
  const [overview, setOverview] = useState(emptyOverview);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [resOverview, resEmployees] = await Promise.allSettled([
        dashboardAPI.getHrOverview(),
        employeeAPI.getAll()
      ]);

      if (resOverview.status === 'fulfilled') {
        setOverview(resOverview.value.data?.overview || emptyOverview);
      } else {
        setError('Unable to load HR dashboard.');
        setOverview(emptyOverview);
      }

      if (resEmployees.status === 'fulfilled') {
        const empList = resEmployees.value.data?.employees || resEmployees.value.data || [];
        setEmployees(Array.isArray(empList) ? empList : []);
      }
    } catch (err) {
      console.error('Failed to load HR dashboard:', err);
      setError('Unable to load HR dashboard.');
      setOverview(emptyOverview);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const present = Number(overview.hr?.presentToday || 0);
  const absent = Number(overview.hr?.absentToday || 0);
  const leave = Number(overview.hr?.leaveToday || 0);
  const totalMarked = present + absent + leave;
  const presentPercent = totalMarked ? Math.round((present / totalMarked) * 100) : 0;
  const profileGapCount = Number(overview.hr?.missingEmployeeProfiles || 0);

  const cleanList = (list) => (Array.isArray(list) ? list.map((s) => String(s || '').trim()).filter(Boolean) : []);

  const allEmployeeNames = useMemo(() => {
    return employees.map((emp) => {
      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      return name || emp.full_name || emp.email || (emp.employee_id ? `Employee #${emp.employee_id}` : 'Employee');
    }).map((s) => String(s || '').trim()).filter(Boolean);
  }, [employees]);

  const presentList = useMemo(() => {
    const fromServer = cleanList(overview.hr?.presentEmployees);
    if (fromServer.length) return fromServer;
    if (present > 0) return Array.from({ length: present }, (_, i) => `Employee #${i + 1}`);
    return [];
  }, [overview.hr?.presentEmployees, present]);

  const absentList = useMemo(() => {
    const fromServer = cleanList(overview.hr?.absentEmployees);
    if (fromServer.length) return fromServer;
    if (absent > 0) return Array.from({ length: absent }, (_, i) => `Employee #${i + 1}`);
    return [];
  }, [overview.hr?.absentEmployees, absent]);

  const leaveList = useMemo(() => {
    const fromServer = cleanList(overview.hr?.leaveEmployees);
    if (fromServer.length) return fromServer;
    if (leave > 0) return Array.from({ length: leave }, (_, i) => `Employee #${i + 1}`);
    return [];
  }, [overview.hr?.leaveEmployees, leave]);

  const halfDayList = useMemo(() => {
    const fromServer = cleanList(overview.hr?.halfDayEmployees);
    if (fromServer.length) return fromServer;
    const halfDayCount = Number(overview.hr?.halfDayToday || 0);
    if (halfDayCount > 0) return Array.from({ length: halfDayCount }, (_, i) => `Employee #${i + 1}`);
    return [];
  }, [overview.hr?.halfDayEmployees, overview.hr?.halfDayToday]);

  const hrActions = useMemo(
    () => (overview.actions || [])
      .filter((action) => ['leave', 'employee', 'resignation'].includes(action.tab))
      .filter((action) => Number(action.value || 0) > 0),
    [overview.actions]
  );

  const recentHrActivity = useMemo(
    () => (overview.recentActivity || [])
      .filter((item) => ['leave', 'employee'].includes(item.tab))
      .slice(0, 6),
    [overview.recentActivity]
  );

  const summaryCards = [
    {
      label: 'Active Employees',
      value: formatNumber(overview.hr?.activeEmployees),
      note: `${formatNumber(overview.hr?.missingEmployeeProfiles)} incomplete profiles`,
      icon: <HiOutlineUsers />,
      tab: 'employee',
      tone: 'blue'
    },
    {
      label: 'Salary Records',
      value: formatNumber(overview.documents?.salaryRecords),
      note: `${formatNumber(overview.documents?.resignationPending)} resignations pending`,
      icon: <HiOutlineBanknotes />,
      tab: 'salary',
      tone: 'emerald'
    }
  ];

  const documentRows = [
    { label: 'Offer Letters', value: overview.documents?.offerLetters, tab: 'offerletter' },
    { label: 'Salary Slips', value: overview.documents?.salaryRecords, tab: 'salaryslip' },
    { label: 'Experience Letters', value: overview.documents?.experienceLetters, tab: 'experienceletters' },
    { label: 'Increment Letters', value: overview.documents?.incrementLetters, tab: 'incrementletters' },
    { label: 'Resignations', value: overview.documents?.resignationPending, tab: 'resignation' }
  ];

  const quickActions = [
    { label: 'Employee Records', tab: 'employee', icon: <HiOutlineUserGroup /> },
    { label: 'Attendance', tab: 'attendance', icon: <HiOutlineCalendarDays /> },
    { label: 'Leave Requests', tab: 'leave', icon: <HiOutlineClipboardDocumentList /> },
    { label: 'Salary', tab: 'salary', icon: <HiOutlineBanknotes /> },
    { label: 'Offer Letter', tab: 'offerletter', icon: <HiOutlineDocumentText /> },
    { label: 'Holidays', tab: 'holiday', icon: <HiOutlineCheckCircle /> }
  ];

  if (loading) {
    return (
      <div className="hr-dashboard">
        <div className="hr-dashboard-loading">Loading HR dashboard...</div>
      </div>
    );
  }

  return (
    <div className="hr-dashboard">
      <header className="hr-dashboard-header">
        <div>
          <h1>HR Dashboard</h1>
        </div>
        <button type="button" className="hr-refresh-btn" onClick={() => loadOverview(true)} disabled={refreshing}>
          <HiOutlineArrowPath />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </header>

      {error && <div className="hr-dashboard-alert">{error}</div>}

      <section className="hr-dashboard-layout">
        <div className="hr-dashboard-main">
          <div className="hr-panel hr-attendance-panel">
            <div className="hr-panel-title">
              <div>
                <h2>Attendance</h2>
                <p>{presentPercent}% present across current attendance records</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('attendance')}>Open Attendance</button>
            </div>

            <div className="hr-attendance-meter" style={{ '--present': `${presentPercent}%` }}>
              <span />
            </div>

            <div className="hr-metric-grid">
              <div className="hr-metric-card">
                <span>Present</span>
                <strong>{formatNumber(present)}</strong>
                <div className="hr-tooltip">
                  <div className="hr-tooltip-header">Present Employees</div>
                  {presentList.length ? (
                    <ul>
                      {presentList.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hr-tooltip-empty">No employees present</div>
                  )}
                </div>
              </div>

              <div className="hr-metric-card">
                <span>Absent</span>
                <strong>{formatNumber(absent)}</strong>
                <div className="hr-tooltip">
                  <div className="hr-tooltip-header">Absent Employees</div>
                  {absentList.length ? (
                    <ul>
                      {absentList.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hr-tooltip-empty">No absent employees</div>
                  )}
                </div>
              </div>

              <div className="hr-metric-card">
                <span>On Leave</span>
                <strong>{formatNumber(leave)}</strong>
                <div className="hr-tooltip">
                  <div className="hr-tooltip-header">Employees On Leave</div>
                  {leaveList.length ? (
                    <ul>
                      {leaveList.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hr-tooltip-empty">No employees on leave</div>
                  )}
                </div>
              </div>

              <div className="hr-metric-card">
                <span>Half Day</span>
                <strong>{formatNumber(overview.hr?.halfDayToday)}</strong>
                <div className="hr-tooltip">
                  <div className="hr-tooltip-header">Half Day Employees</div>
                  {halfDayList.length ? (
                    <ul>
                      {halfDayList.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="hr-tooltip-empty">No half day employees</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="hr-panel hr-summary-panel">
            <div className="hr-panel-title">
              <div>
                <h2>Overview & Statistics</h2>
                <p>Key metrics for active employees and salary records</p>
              </div>
            </div>

            <div className="hr-summary-grid">
              {summaryCards.map((card) => (
                <button key={card.label} type="button" className={`hr-summary-card ${card.tone}`} onClick={() => navigateToTab?.(card.tab)}>
                  <span className="hr-summary-icon">{card.icon}</span>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.note}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="hr-panel hr-documents-panel">
            <div className="hr-panel-title">
              <div>
                <h2>HR Documents</h2>
                <p>Generated records and pending employee exits</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('offerletter')}>Create Document</button>
            </div>

            <div className="hr-document-grid">
              {documentRows.map((row) => (
                <button key={row.label} type="button" onClick={() => navigateToTab?.(row.tab)}>
                  <span>{row.label}</span>
                  <strong>{formatNumber(row.value)}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="hr-panel hr-quick-panel">
            <div className="hr-panel-title compact">
              <h2>Quick Actions</h2>
            </div>

            <div className="hr-quick-grid">
              {quickActions.map((action) => (
                <button key={action.label} type="button" onClick={() => navigateToTab?.(action.tab)}>
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="hr-dashboard-side">
          {profileGapCount > 0 && (
            <div className="hr-panel hr-profile-panel">
              <div className="hr-profile-icon">
                <HiOutlineExclamationTriangle />
              </div>
              <div>
                <h2>{formatNumber(profileGapCount)} Employee Profiles Need Details</h2>
                <p>Complete position, salary, and bank details before payroll or document generation.</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('employee')}>Review Profiles</button>
            </div>
          )}
          <div className="hr-panel hr-action-panel">
            <div className="hr-panel-title compact">
              <h2>Needs HR Action</h2>
              <span>{hrActions.length}</span>
            </div>

            <div className="hr-action-list">
              {(hrActions.length ? hrActions : [{ label: 'No pending HR actions', value: 0, severity: 'ok' }]).map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`hr-action-row ${action.severity}`}
                  onClick={() => action.tab && navigateToTab?.(action.tab)}
                >
                  <span>{action.label}</span>
                  <strong>{formatNumber(action.value)}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="hr-panel hr-activity-panel">
            <div className="hr-panel-title compact">
              <h2>Recent HR Activity</h2>
            </div>

            <div className="hr-activity-list">
              {recentHrActivity.length === 0 ? (
                <div className="hr-empty-state">
                  <HiOutlineDocumentText />
                  <span>No recent HR activity yet</span>
                </div>
              ) : (
                recentHrActivity.map((item, index) => (
                  <button key={`${item.type}-${index}`} type="button" onClick={() => item.tab && navigateToTab?.(item.tab)}>
                    <span className={`hr-activity-dot ${item.type}`} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{formatTimeAgo(item.created_at)}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default HRDashboard;
