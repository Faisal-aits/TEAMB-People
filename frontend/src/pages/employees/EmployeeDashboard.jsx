import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlineReceiptPercent,
  HiOutlineUserCircle,
  HiOutlineUsers
} from 'react-icons/hi2';
import { MODULE_DEFAULT_TAB } from '../../contexts/ModuleAccessContext';
import { attendanceAPI, getIndiaDate } from '../../services/attendanceAPI';
import { employeeAPI } from '../../services/employeeAPI';
import { expenseAPI } from '../../services/expenseAPI';
import experienceLetterAPI from '../../services/experienceLetterAPI';
import incrementLetterAPI from '../../services/incrementLetterAPI';
import { leaveAPI } from '../../services/leaveAPI';
import offerLetterAPI from '../../services/offerLetterAPI';
import { reportAPI } from '../../services/reportAPI';
import resignationAPI from '../../services/resignationAPI';
import './EmployeeLayout.css';

const MODULE_META = {
  hr: {
    title: 'HR Module',
    description: 'Employees, attendance, leave, salary, and holidays.',
    icon: <HiOutlineUsers />,
  },
  hr_dashboard: {
    title: 'HR Dashboard',
    description: 'View HR summaries, activity, and workforce metrics.',
    icon: <HiOutlineClipboardDocumentList />,
  },
  employee_management: {
    title: 'Employee Management',
    description: 'Manage employee records, documents, and lifecycle actions.',
    icon: <HiOutlineUsers />,
  },
  attendance_management: {
    title: 'Attendance Management',
    description: 'Review attendance, locations, delays, and reports.',
    icon: <HiOutlineClock />,
  },
  leave_management: {
    title: 'Leave Management',
    description: 'Review leave requests and employee leave records.',
    icon: <HiOutlineCalendarDays />,
  },
  shift_management: {
    title: 'Shift Management',
    description: 'Manage employee shifts and schedule assignments.',
    icon: <HiOutlineArrowPath />,
  },
  salary_management: {
    title: 'Salary Management',
    description: 'Generate salaries, track payments, and review balances.',
    icon: <HiOutlineBanknotes />,
  },
  holiday_management: {
    title: 'Holiday Management',
    description: 'Maintain holidays and paid non-working days.',
    icon: <HiOutlineCalendarDays />,
  },
  ai_document_generator: {
    title: 'AI Document Generator',
    description: 'Create HR documents from approved templates.',
    icon: <HiOutlineDocumentText />,
  },
  offer_letters: {
    title: 'Offer Letters',
    description: 'Create, track, accept, and reject offer letters.',
    icon: <HiOutlineDocumentText />,
  },
  declarations: {
    title: 'Declaration Forms',
    description: 'Manage employee declaration documents.',
    icon: <HiOutlineDocumentText />,
  },
  resignations: {
    title: 'Resignation Requests',
    description: 'Review and process resignation requests.',
    icon: <HiOutlineExclamationTriangle />,
  },
  salary_slips: {
    title: 'Salary Slips',
    description: 'Generate and review employee salary slips.',
    icon: <HiOutlineReceiptPercent />,
  },
  experience_letters: {
    title: 'Experience Letters',
    description: 'Prepare and manage experience letters.',
    icon: <HiOutlineDocumentText />,
  },
  increment_letters: {
    title: 'Increment Letters',
    description: 'Prepare and manage increment letters.',
    icon: <HiOutlineCheckCircle />,
  },
  accounts: {
    title: 'Accounts Module',
    description: 'Billing, delivery, expenses, quotations, and settings.',
    icon: <HiOutlineBanknotes />,
  },
  billing_management: {
    title: 'Billing Management',
    description: 'Create and manage invoices and billing records.',
    icon: <HiOutlineBanknotes />,
  },
  delivery_management: {
    title: 'Delivery Management',
    description: 'Create and track delivery challans.',
    icon: <HiOutlineClipboardDocumentList />,
  },
  expense_management: {
    title: 'Expense Management',
    description: 'Review expenses, receipts, and payment statuses.',
    icon: <HiOutlineReceiptPercent />,
  },
  billing_settings: {
    title: 'Billing Settings',
    description: 'Configure billing details and document settings.',
    icon: <HiOutlineClipboardDocumentList />,
  },
  quotation_management: {
    title: 'Quotation Management',
    description: 'Create and manage customer quotations.',
    icon: <HiOutlineDocumentText />,
  },
  services: {
    title: 'Services Module',
    description: 'Clients, projects, and service management.',
    icon: <HiOutlineBriefcase />,
  },
  service_management: {
    title: 'Service Management',
    description: 'Manage clients, projects, and service work.',
    icon: <HiOutlineBriefcase />,
  },
  pttm: {
    title: 'PTTM',
    description: 'Track planning, tasks, timelines, and project progress.',
    icon: <HiOutlineClipboardDocumentList />,
  },
  employee_attendance: {
    title: 'My Attendance',
    description: 'Check in, check out, and review attendance history.',
    icon: <HiOutlineCalendarDays />,
  },
  employee_expense: {
    title: 'My Expense',
    description: 'Submit expenses and track reimbursement requests.',
    icon: <HiOutlineReceiptPercent />,
  },
  employee_projects: {
    title: 'My Projects & Tasks',
    description: 'Assigned projects, tasks, deadlines, and status.',
    icon: <HiOutlineBriefcase />,
  },
};

const DEFAULT_EMPLOYEE_MODULES = [
  { module_key: 'employee_attendance', name: 'My Attendance', access: 'write' },
  { module_key: 'employee_expense', name: 'My Expense', access: 'write' },
  { module_key: 'employee_projects', name: 'My Projects & Tasks', access: 'write' },
];

const numberFormat = new Intl.NumberFormat('en-IN');
const currencyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatNumber = (value) => numberFormat.format(Number(value || 0));
const formatCurrency = (value) => currencyFormat.format(Number(value || 0));

const getArray = (response, keys) => {
  const data = response?.data || {};
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const getSafeValue = (result, fallback = null) => (result.status === 'fulfilled' ? result.value : fallback);

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value) => value || '--';

const EmployeeDashboard = ({ user, navigateToTab, onOpenModule }) => {
  const currentUser = user || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    todayAttendance: null,
    attendanceHistory: [],
    leaves: [],
    expenses: [],
    documents: {
      offerLetters: 0,
      experienceLetters: 0,
      incrementLetters: 0,
      resignations: 0,
    },
    reports: [],
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const assignedModules = (currentUser.modules || []).filter((mod) => mod.access !== 'none');
  const assignedModuleKeys = new Set(assignedModules.map((mod) => mod.module_key));
  const modules = [
    ...DEFAULT_EMPLOYEE_MODULES.filter((mod) => !assignedModuleKeys.has(mod.module_key)),
    ...assignedModules,
  ];

  const loadDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [
        profileResult,
        todayResult,
        historyResult,
        leavesResult,
        expensesResult,
        offerResult,
        experienceResult,
        incrementResult,
        resignationResult,
        reportResult,
      ] = await Promise.allSettled([
        employeeAPI.getMyProfile(),
        attendanceAPI.getMyTodayAttendance(),
        attendanceAPI.getMyHistory(),
        leaveAPI.getMyLeaves(),
        expenseAPI.getMyExpenses(),
        offerLetterAPI.getMyOfferLetters(),
        experienceLetterAPI.getMyLetters(),
        incrementLetterAPI.getMyLetters(),
        resignationAPI.getMyRequests(),
        reportAPI.getMyReports(),
      ]);

      const profileResponse = getSafeValue(profileResult);
      const todayResponse = getSafeValue(todayResult);
      const historyResponse = getSafeValue(historyResult);
      const leavesResponse = getSafeValue(leavesResult);
      const expensesResponse = getSafeValue(expensesResult);
      const offerResponse = getSafeValue(offerResult);
      const experienceResponse = getSafeValue(experienceResult);
      const incrementResponse = getSafeValue(incrementResult);
      const resignationResponse = getSafeValue(resignationResult);
      const reportResponse = getSafeValue(reportResult);

      setDashboardData({
        profile: profileResponse?.data?.employee || null,
        todayAttendance: todayResponse?.data?.attendance || null,
        attendanceHistory: getArray(historyResponse, ['history', 'attendance']),
        leaves: getArray(leavesResponse, ['leaves']),
        expenses: getArray(expensesResponse, ['expenses']),
        documents: {
          offerLetters: getArray(offerResponse, ['letters']).length,
          experienceLetters: getArray(experienceResponse, ['data', 'letters']).length,
          incrementLetters: getArray(incrementResponse, ['data', 'letters']).length,
          resignations: getArray(resignationResponse, ['data', 'requests']).length,
        },
        reports: getArray(reportResponse, ['reports']),
      });
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError('Unable to load employee dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    const text = reportText.trim();
    if (!text) {
      setError('Please enter your report before submitting.');
      return;
    }

    try {
      setReportSubmitting(true);
      setError('');
      await reportAPI.createMyReport({
        report_date: getIndiaDate(),
        report_text: text,
      });
      setReportText('');
      setReportModalOpen(false);
      await loadDashboard(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(err.response?.data?.message || 'Unable to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleModuleClick = (mod) => {
    const moduleDefaults = {
      hr: 'attendance',
      accounts: 'billing',
      services: 'service',
      employee_attendance: 'employee-attendance',
      employee_expense: 'employee-expense',
      employee_projects: 'employee-projects',
    };
    const defaultTab = moduleDefaults[mod.module_key] || MODULE_DEFAULT_TAB[mod.module_key];

    if (defaultTab && onOpenModule) {
      onOpenModule(mod.module_key, defaultTab);
    } else if (defaultTab && navigateToTab) {
      navigateToTab(defaultTab);
    }
  };

  const handleAttendanceAction = async (type) => {
    const markAttendance = async (location = {}) => {
      try {
        const attendanceData = {
          type,
          date: getIndiaDate(),
          ...location,
        };
        await attendanceAPI.markMyAttendance(attendanceData);
        await loadDashboard(true);
      } catch (err) {
        setError(err.response?.data?.message || `Unable to ${type === 'check_in' ? 'check in' : 'check out'}.`);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          markAttendance({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Could not get your location. Please try again. Location is required to check in or out.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by this browser. Location is required to check in or out.');
    }
  };

  const attendanceSummary = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const currentMonthRecords = dashboardData.attendanceHistory.filter((record) => {
      const date = new Date(record.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    return {
      present: currentMonthRecords.filter((record) => ['Present', 'Delayed', 'Half Day'].includes(record.status)).length,
      delayed: currentMonthRecords.filter((record) => ['Delayed', 'Half Day'].includes(record.status)).length,
      absent: currentMonthRecords.filter((record) => record.status === 'Absent').length,
      total: currentMonthRecords.length,
    };
  }, [dashboardData.attendanceHistory]);

  const leaveSummary = useMemo(() => ({
    pending: dashboardData.leaves.filter((leave) => leave.status === 'Pending').length,
    approved: dashboardData.leaves.filter((leave) => leave.status === 'Approved').length,
    latest: dashboardData.leaves[0],
  }), [dashboardData.leaves]);

  const expenseSummary = useMemo(() => {
    const pending = dashboardData.expenses.filter((expense) => (expense.payment_status || 'pending') === 'pending');
    const paid = dashboardData.expenses.filter((expense) => expense.payment_status === 'paid');

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
      paidAmount: paid.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
      latest: dashboardData.expenses[0],
    };
  }, [dashboardData.expenses]);

  const profile = dashboardData.profile || {};
  const todayAttendance = dashboardData.todayAttendance || {};
  const isCheckedIn = Boolean(todayAttendance.check_in_time);
  const isCheckedOut = Boolean(todayAttendance.check_out_time);
  const totalDocuments = Object.values(dashboardData.documents).reduce((sum, value) => sum + Number(value || 0), 0);

  const summaryCards = [
    {
      label: 'Today Status',
      value: todayAttendance.status || 'Not Checked In',
      note: `${formatTime(todayAttendance.check_in_time)} in / ${formatTime(todayAttendance.check_out_time)} out`,
      icon: <HiOutlineClock />,
      tone: isCheckedIn ? 'green' : 'amber',
      tab: 'employee-attendance',
    },
    {
      label: 'This Month',
      value: `${formatNumber(attendanceSummary.present)} days`,
      note: `${formatNumber(attendanceSummary.delayed)} delayed, ${formatNumber(attendanceSummary.absent)} absent`,
      icon: <HiOutlineCalendarDays />,
      tone: 'blue',
      tab: 'employee-attendance',
    },
    {
      label: 'Leave Requests',
      value: formatNumber(leaveSummary.pending),
      note: `${formatNumber(leaveSummary.approved)} approved total`,
      icon: <HiOutlineClipboardDocumentList />,
      tone: 'amber',
      tab: 'employee-leave',
    },
    {
      label: 'Pending Expenses',
      value: formatCurrency(expenseSummary.pendingAmount),
      note: `${formatNumber(expenseSummary.pendingCount)} waiting reimbursement`,
      icon: <HiOutlineReceiptPercent />,
      tone: 'emerald',
      tab: 'employee-expense',
    },
  ];

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="employee-dashboard-loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      <header className="employee-home-header">
        <div>
          <span>Employee Overview</span>
          <h1>Welcome, {currentUser.first_name || 'User'}</h1>
          <p>{profile.position || profile.designation || 'Employee'}{profile.department_name ? `, ${profile.department_name}` : ''}</p>
        </div>
        <button type="button" className="employee-refresh-btn" onClick={() => loadDashboard(true)} disabled={refreshing}>
          <HiOutlineArrowPath />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>
        <button type="button" className="employee-report-btn" onClick={() => setReportModalOpen(true)}>
          <HiOutlinePencilSquare />
          Report
        </button>
      </header>

      {error && <div className="employee-dashboard-alert">{error}</div>}

      <section className="employee-overview-grid" aria-label="Employee overview">
        {summaryCards.map((card) => (
          <button key={card.label} type="button" className={`employee-overview-card ${card.tone}`} onClick={() => navigateToTab?.(card.tab)}>
            <span className="employee-overview-icon">{card.icon}</span>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </button>
        ))}
      </section>

      <section className="employee-home-layout">
        <div className="employee-home-main">
          <div className="employee-panel employee-attendance-panel">
            <div className="employee-panel-title">
              <div>
                <h2>Today's Attendance</h2>
                <p>{todayAttendance.date ? formatDate(todayAttendance.date) : 'Current work day'}</p>
              </div>
              <button type="button" onClick={() => navigateToTab?.('employee-attendance')}>Open Attendance</button>
            </div>

            <div className="employee-attendance-state">
              <div className={`employee-status-mark ${isCheckedIn ? 'active' : ''}`}>
                {isCheckedIn ? <HiOutlineCheckCircle /> : <HiOutlineExclamationTriangle />}
              </div>
              <div>
                <h3>{todayAttendance.status || 'Not Checked In'}</h3>
                <p>Check in: {formatTime(todayAttendance.check_in_time)} - Check out: {formatTime(todayAttendance.check_out_time)}</p>
              </div>
              <div className="employee-attendance-actions">
                <button type="button" onClick={() => handleAttendanceAction('check_in')} disabled={isCheckedIn}>
                  Check In
                </button>
                <button type="button" onClick={() => handleAttendanceAction('check_out')} disabled={!isCheckedIn || isCheckedOut}>
                  Check Out
                </button>
              </div>
            </div>

            <div className="employee-metric-row">
              <div><span>Present</span><strong>{formatNumber(attendanceSummary.present)}</strong></div>
              <div><span>Delayed</span><strong>{formatNumber(attendanceSummary.delayed)}</strong></div>
              <div><span>Absent</span><strong>{formatNumber(attendanceSummary.absent)}</strong></div>
              <div><span>Records</span><strong>{formatNumber(attendanceSummary.total)}</strong></div>
            </div>
          </div>

          <div className="employee-panel employee-record-panel">
            <div className="employee-panel-title">
              <div>
                <h2>My Records</h2>
                <p>Profile and HR documents available to you</p>
              </div>
            </div>

            <div className="employee-record-grid">
              <div><HiOutlineUserCircle /><span>Employee ID</span><strong>{profile.id || currentUser.employee_id || '-'}</strong></div>
              <div><HiOutlineDocumentText /><span>Documents</span><strong>{formatNumber(totalDocuments)}</strong></div>
              <div><HiOutlineBriefcase /><span>Joining Date</span><strong>{formatDate(profile.joining_date)}</strong></div>
              <div><HiOutlineBanknotes /><span>Paid Expenses</span><strong>{formatCurrency(expenseSummary.paidAmount)}</strong></div>
            </div>
          </div>
        </div>

        <aside className="employee-home-side">
          <div className="employee-panel employee-next-panel">
            <div className="employee-panel-title compact">
              <h2>Needs Attention</h2>
            </div>

            <div className="employee-action-list">
              {!isCheckedIn && (
                <button type="button" className="warning" onClick={() => handleAttendanceAction('check_in')}>
                  <span>Check in for today</span>
                  <HiOutlineClock />
                </button>
              )}
              {isCheckedIn && !isCheckedOut && (
                <button type="button" className="info" onClick={() => handleAttendanceAction('check_out')}>
                  <span>Check out before leaving</span>
                  <HiOutlineClock />
                </button>
              )}
              {leaveSummary.pending > 0 && (
                <button type="button" className="warning" onClick={() => navigateToTab?.('employee-leave')}>
                  <span>{formatNumber(leaveSummary.pending)} leave request pending</span>
                  <HiOutlineClipboardDocumentList />
                </button>
              )}
              {expenseSummary.pendingCount > 0 && (
                <button type="button" className="warning" onClick={() => navigateToTab?.('employee-expense')}>
                  <span>{formatNumber(expenseSummary.pendingCount)} expense pending</span>
                  <HiOutlineReceiptPercent />
                </button>
              )}
              {isCheckedIn && isCheckedOut && leaveSummary.pending === 0 && expenseSummary.pendingCount === 0 && (
                <div className="employee-all-clear">
                  <HiOutlineCheckCircle />
                  <span>No pending employee actions</span>
                </div>
              )}
            </div>
          </div>

          <div className="employee-panel employee-latest-panel">
            <div className="employee-panel-title compact">
              <h2>Latest Updates</h2>
            </div>

            <div className="employee-update-list">
              <button type="button" onClick={() => navigateToTab?.('employee-leave')}>
                <span>Latest leave</span>
                <strong>{leaveSummary.latest ? `${leaveSummary.latest.status} - ${formatDate(leaveSummary.latest.start_date)}` : 'No leave requests'}</strong>
              </button>
              <button type="button" onClick={() => navigateToTab?.('employee-expense')}>
                <span>Latest expense</span>
                <strong>{expenseSummary.latest ? `${formatCurrency(expenseSummary.latest.amount)} - ${expenseSummary.latest.payment_status || 'pending'}` : 'No expenses submitted'}</strong>
              </button>
            </div>
          </div>

          <div className="employee-panel employee-module-panel">
            <div className="employee-panel-title compact">
              <h2>Quick Access</h2>
            </div>

            <div className="employee-module-list">
              {modules.map((mod) => {
                const meta = MODULE_META[mod.module_key] || {
                  title: mod.name || mod.module_key?.toUpperCase() || 'Module',
                  description: 'Open module features.',
                  icon: <HiOutlineBriefcase />,
                };

                return (
                  <button key={mod.module_key} type="button" onClick={() => handleModuleClick(mod)}>
                    {meta.icon}
                    <span>
                      <strong>{meta.title}</strong>
                      <small>{meta.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      {reportModalOpen && (
        <div className="employee-report-modal-overlay" onClick={() => setReportModalOpen(false)} role="presentation">
          <div className="employee-report-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="employee-report-title">
            <div className="employee-report-modal-header">
              <div>
                <h2 id="employee-report-title">Submit Report</h2>
                <p>{formatDate(getIndiaDate())}</p>
              </div>
              <button type="button" onClick={() => setReportModalOpen(false)}>Close</button>
            </div>

            <form className="employee-report-form" onSubmit={handleSubmitReport}>
              <textarea
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
                placeholder="Write today's work, blockers, or casual update..."
                rows={5}
                maxLength={3000}
                required
              />
              <div className="employee-report-form-actions">
                <span>{reportText.length}/3000</span>
                <button type="submit" disabled={reportSubmitting}>
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>

            <div className="employee-report-history">
              <h3>Recent Reports</h3>
              {(dashboardData.reports || []).slice(0, 5).length === 0 ? (
                <p className="employee-report-empty">No reports submitted yet.</p>
              ) : (
                <div className="employee-report-history-list">
                  {(dashboardData.reports || []).slice(0, 5).map((report) => (
                    <article key={report.id} className="employee-report-history-item">
                      <div>
                        <strong>{formatDate(report.report_date)}</strong>
                        <p>{report.report_text}</p>
                      </div>
                      {report.admin_remark && (
                        <div className="employee-report-remark">
                          <span>Admin Remark</span>
                          <p>{report.admin_remark}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
