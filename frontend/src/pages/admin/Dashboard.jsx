import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineExclamationTriangle,
  HiOutlineUserGroup,
  HiOutlineUsers
} from 'react-icons/hi2';
import { dashboardAPI } from '../../services/dashboardAPI';
import './Dashboard.css';

const emptyOverview = {
  kpis: {},
  hr: {},
  accounts: {},
  services: {},
  pttm: {},
  access: {},
  documents: {},
  setupHealth: [],
  actions: [],
  recentActivity: []
};

const numberFormat = new Intl.NumberFormat('en-IN');
const currencyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatNumber = (value) => numberFormat.format(Number(value || 0));
const formatCurrency = (value) => currencyFormat.format(Number(value || 0));

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

const Dashboard = ({ user, navigateToTab }) => {
  const [overview, setOverview] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const response = await dashboardAPI.getOverview();
      setOverview(response.data?.overview || emptyOverview);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      setError('Unable to load dashboard overview.');
      setOverview(emptyOverview);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const pendingActions = useMemo(
    () => (overview.actions || []).filter((action) => Number(action.value || 0) > 0),
    [overview.actions]
  );

  const completedSetup = (overview.setupHealth || []).filter((item) => item.complete).length;
  const incompleteSetup = (overview.setupHealth || []).filter((item) => !item.complete);
  const setupTotal = (overview.setupHealth || []).length;
  const setupPercent = setupTotal ? Math.round((completedSetup / setupTotal) * 100) : 0;
  const present = Number(overview.hr?.presentToday || 0);
  const absent = Number(overview.hr?.absentToday || 0);
  const leave = Number(overview.hr?.leaveToday || 0);
  const totalToday = present + absent + leave;
  const presentPercent = totalToday ? Math.round((present / totalToday) * 100) : 0;

  const kpis = [
    {
      label: 'Total Employees',
      value: formatNumber(overview.kpis?.totalEmployees),
      note: `${formatNumber(overview.hr?.activeEmployees)} active`,
      icon: <HiOutlineUsers />,
      tab: 'employee',
      tone: 'blue'
    },
    {
      label: 'Present Today',
      value: formatNumber(overview.kpis?.presentToday),
      note: `${formatNumber(overview.hr?.delayedToday)} delayed`,
      icon: <HiOutlineCalendarDays />,
      tab: 'attendance',
      tone: 'green'
    },
    {
      label: 'On Leave',
      value: formatNumber(overview.kpis?.leaveToday),
      note: `${formatNumber(overview.kpis?.pendingLeaves)} pending requests`,
      icon: <HiOutlineClipboardDocumentList />,
      tab: 'leave',
      tone: 'amber'
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(overview.kpis?.invoiceRevenue),
      note: `${formatNumber(overview.accounts?.invoicesThisMonth)} invoices this month`,
      icon: <HiOutlineBanknotes />,
      tab: 'billing',
      tone: 'emerald'
    },
    {
      label: 'Pending Payments',
      value: formatNumber(overview.kpis?.pendingInvoices),
      note: `${formatNumber(overview.accounts?.pendingExpenses)} expenses pending`,
      icon: <HiOutlineExclamationTriangle />,
      tab: 'billing',
      tone: 'red'
    }
  ];

  const quickActions = [
    { label: 'Add Employee', tab: 'employee', icon: <HiOutlineUsers /> },
    { label: 'Offer Letter', tab: 'offerletter', icon: <HiOutlineDocumentText /> },
    { label: 'Create Invoice', tab: 'billing', icon: <HiOutlineBanknotes /> },
    { label: 'Review Leaves', tab: 'leave', icon: <HiOutlineCalendarDays /> },
    { label: 'Branding', tab: 'branding', icon: <HiOutlineCog6Tooth /> },
    { label: 'PTTM Tasks', tab: 'pttm', icon: <HiOutlineBriefcase /> }
  ];

  if (loading) {
    return (
      <div className="admin-cockpit">
        <div className="dashboard-loading">Loading admin overview...</div>
      </div>
    );
  }

  return (
    <div className="admin-cockpit">
      <header className="cockpit-header">
        <div>
          <span className="dashboard-kicker">Admin Overview</span>
          <h1>Good to see you{user?.first_name ? `, ${user.first_name}` : ''}</h1>
        </div>
        <button className="refresh-btn" type="button" onClick={() => loadOverview(true)} disabled={refreshing}>
          <HiOutlineArrowPath />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
      </header>

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="kpi-grid" aria-label="System overview">
        {kpis.map((item) => (
          <button key={item.label} type="button" className={`kpi-card ${item.tone}`} onClick={() => navigateToTab?.(item.tab)}>
            <span className="kpi-icon">{item.icon}</span>
            <span className="kpi-label">{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.note}</small>
          </button>
        ))}
      </section>

      <section className="cockpit-layout">
        <div className="cockpit-main">
          <div className="dashboard-panel hr-panel">
            <div className="panel-title">
              <div>
                <h2>Today in HR</h2>
                <p>{presentPercent}% present across marked attendance</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('attendance')}>Open Attendance</button>
            </div>

            <div className="attendance-meter" style={{ '--present': `${presentPercent}%` }}>
              <span />
            </div>

            <div className="metric-row">
              <div><span>Present</span><strong>{formatNumber(present)}</strong></div>
              <div><span>Absent</span><strong>{formatNumber(absent)}</strong></div>
              <div><span>On Leave</span><strong>{formatNumber(leave)}</strong></div>
              <div><span>Half Day</span><strong>{formatNumber(overview.hr?.halfDayToday)}</strong></div>
            </div>
          </div>

          <div className="dashboard-panel accounts-panel">
            <div className="panel-title">
              <div>
                <h2>Accounts Snapshot</h2>
                <p>Invoices, quotations, and expense pressure</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('billing')}>Open Accounts</button>
            </div>

            <div className="accounts-grid">
              <div>
                <span>Invoices This Month</span>
                <strong>{formatNumber(overview.accounts?.invoicesThisMonth)}</strong>
              </div>
              <div>
                <span>Invoice Revenue</span>
                <strong>{formatCurrency(overview.accounts?.invoiceRevenue)}</strong>
              </div>
              <div>
                <span>Open Quotations</span>
                <strong>{formatNumber(overview.accounts?.quotationsPending)}</strong>
              </div>
              <div>
                <span>Monthly Expenses</span>
                <strong>{formatCurrency(overview.accounts?.expensesThisMonth)}</strong>
              </div>
            </div>
          </div>

          <div className="dashboard-panel documents-panel">
            <div className="panel-title">
              <div>
                <h2>Documents & Workflows</h2>
                <p>HR documents and resignation workload</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('employee')}>Open Employees</button>
            </div>

            <div className="document-grid">
              <div><span>Offer Letters</span><strong>{formatNumber(overview.documents?.offerLetters)}</strong></div>
              <div><span>Salary Records</span><strong>{formatNumber(overview.documents?.salaryRecords)}</strong></div>
              <div><span>Experience Letters</span><strong>{formatNumber(overview.documents?.experienceLetters)}</strong></div>
              <div><span>Increment Letters</span><strong>{formatNumber(overview.documents?.incrementLetters)}</strong></div>
              <div className="wide"><span>Pending Resignations</span><strong>{formatNumber(overview.documents?.resignationPending)}</strong></div>
            </div>
          </div>

          <div className="dashboard-panel module-panel">
            <div className="panel-title">
              <div>
                <h2>Module Health</h2>
                <p>Services, tasking, and access overview</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('modulemanagement')}>Manage Access</button>
            </div>

            <div className="module-grid">
              <div><HiOutlineUserGroup /><span>Clients</span><strong>{formatNumber(overview.services?.clientsTotal)}</strong></div>
              <div><HiOutlineBriefcase /><span>Active Services</span><strong>{formatNumber(overview.services?.activeServices)}</strong></div>
              <div><HiOutlineClipboardDocumentList /><span>Open Tasks</span><strong>{formatNumber(overview.pttm?.openTasks)}</strong></div>
              <div><HiOutlineExclamationTriangle /><span>Overdue Tasks</span><strong>{formatNumber(overview.pttm?.overdueTasks)}</strong></div>
              <div><HiOutlineUsers /><span>Active Access</span><strong>{formatNumber(overview.access?.activeUsers)}</strong></div>
              <div><HiOutlineDocumentText /><span>Read Only</span><strong>{formatNumber(overview.access?.readOnlyUsers)}</strong></div>
            </div>
          </div>
        </div>

        <aside className="cockpit-side">
          <div className="dashboard-panel action-panel">
            <div className="panel-title compact">
              <h2>Needs Attention</h2>
              <span>{pendingActions.length || 0}</span>
            </div>

            <div className="action-list">
              {(pendingActions.length ? pendingActions : [{ label: 'No urgent items', value: 0, severity: 'ok' }]).map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`action-row ${action.severity}`}
                  onClick={() => action.tab && navigateToTab?.(action.tab)}
                >
                  <span>{action.label}</span>
                  <strong>{formatNumber(action.value)}</strong>
                </button>
              ))}
            </div>
          </div>

          {incompleteSetup.length > 0 && (
            <div className="dashboard-panel setup-panel">
              <div className="panel-title compact">
                <h2>Setup Health</h2>
                <span>{setupPercent}%</span>
              </div>

              <div className="setup-progress">
                <span style={{ width: `${setupPercent}%` }} />
              </div>

              <div className="setup-list">
                {incompleteSetup.map((item) => (
                  <button key={item.key} type="button" onClick={() => navigateToTab?.(item.action)}>
                    <HiOutlineExclamationTriangle className="warn-icon" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="dashboard-panel activity-panel">
            <div className="panel-title compact">
              <h2>Recent Activity</h2>
            </div>

            <div className="activity-list">
              {(overview.recentActivity || []).length === 0 ? (
                <div className="empty-activity">
                  <HiOutlineEnvelope />
                  <span>No recent activity yet</span>
                </div>
              ) : (
                overview.recentActivity.map((item, index) => (
                  <button key={`${item.type}-${index}`} type="button" onClick={() => item.tab && navigateToTab?.(item.tab)}>
                    <span className={`activity-dot ${item.type}`} />
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

export default Dashboard;
