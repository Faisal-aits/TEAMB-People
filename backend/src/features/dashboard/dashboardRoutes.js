const express = require('express');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const { pool } = require('../../config/db');
const { tableExists } = require('../../utils/schemaHelpers');

const router = express.Router();

const runRows = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('Dashboard query skipped:', error.message);
    return [];
  }
};

const countRows = async (sql, params) => {
  const rows = await runRows(sql, params);
  return Number(rows[0]?.total || 0);
};

const sumRows = async (sql, params) => {
  const rows = await runRows(sql, params);
  return Number(rows[0]?.total || 0);
};

const firstRow = async (sql, params) => {
  const rows = await runRows(sql, params);
  return rows[0] || {};
};

const hasTable = async (tableName) => {
  try {
    return await tableExists(tableName);
  } catch (error) {
    console.warn('Dashboard table check skipped:', error.message);
    return false;
  }
};

const formatCurrency = (value) => Number(value || 0);

const getIndiaDate = (date = new Date()) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const getIndiaMonthStart = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  return `${year}-${month}-01`;
};

const normalizeAttendanceStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'present') return 'Present';
  if (value === 'delayed' || value === 'late') return 'Delayed';
  if (value === 'half day' || value === 'half-day') return 'Half Day';
  if (value === 'on leave' || value === 'leave') return 'On Leave';
  if (value === 'absent') return 'Absent';
  return status || 'Absent';
};

const canAccessHrDashboard = async (req, res, next) => {
  const role = req.user?.role || req.user?.position || req.user?.role_name;
  if (role === 'admin' || role === 'hr') {
    return next();
  }

  const rows = await runRows(
    `SELECT access_level
     FROM user_module_access
     WHERE tenant_id = ?
       AND user_id = ?
       AND module_key IN ('hr', 'hr_dashboard')
       AND access_level <> 'none'
     LIMIT 1`,
    [req.tenantId, req.user?.id]
  );

  if (rows.length > 0) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Dashboard access required' });
};

const getDashboardAttendanceSummary = async (tenantId, date) => {
  const [employees, attendanceRows, leaveRows] = await Promise.all([
    runRows(
      `SELECT ed.id AS hr_code, ed.id AS employee_id, u.id AS user_id, u.id AS id,
              TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS full_name,
              u.first_name,
              u.last_name,
              u.email
       FROM employee_details ed
       JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
       WHERE ed.tenant_id = ?
         AND COALESCE(u.is_active, 1) = 1
         AND LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted')`,
      [tenantId]
    ),
    runRows(
      `SELECT a.employee_id, ed.id AS hr_employee_code, ed.employee_id AS user_id, u.id AS u_user_id,
              TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS full_name,
              a.status, a.is_half_day
       FROM tb_attendance a
       LEFT JOIN employee_details ed ON (a.employee_id = ed.id OR a.employee_id = ed.employee_id)
       LEFT JOIN users u ON (u.id = ed.employee_id OR u.id = a.employee_id)
       WHERE (a.date = ? OR DATE(a.date) = ?) AND (a.tenant_id = ? OR ed.tenant_id = ? OR u.tenant_id = ?)`,
      [date, date, tenantId, tenantId, tenantId]
    ),
    runRows(
      `SELECT lr.employee_id AS hr_employee_code, ed.employee_id AS user_id
       FROM leave_requests lr
       JOIN employee_details ed ON ed.id = lr.employee_id AND ed.tenant_id = lr.tenant_id
       JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
       WHERE lr.tenant_id = ?
         AND LOWER(lr.status) = 'approved'
         AND ? BETWEEN lr.start_date AND lr.end_date
         AND COALESCE(u.is_active, 1) = 1
         AND LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted')`,
      [tenantId, date]
    ),
  ]);

  const attendanceByKey = new Map();
  attendanceRows.forEach((record) => {
    [record.hr_employee_code, record.employee_id, record.user_id, record.u_user_id]
      .filter(Boolean)
      .forEach((key) => attendanceByKey.set(String(key).trim(), record));
  });

  const leaveByKey = new Set();
  leaveRows.forEach((record) => {
    [record.hr_employee_code, record.user_id]
      .filter(Boolean)
      .forEach((key) => leaveByKey.add(String(key).trim()));
  });

  const summary = {
    totalUsers: employees.length,
    presentToday: 0,
    delayedToday: 0,
    absentToday: 0,
    leaveToday: 0,
    halfDayToday: 0,
    pendingToday: 0,
    presentList: [],
    absentList: [],
    leaveList: [],
    halfDayList: [],
  };

  employees.forEach((employee) => {
    const record = [employee.hr_code, employee.employee_id, employee.user_id, employee.id]
      .filter(Boolean)
      .map((key) => attendanceByKey.get(String(key).trim()))
      .find(Boolean);

    const rawName = String(record?.full_name || employee.full_name || '').trim();
    const firstLast = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const email = String(employee.email || '').trim();
    const empName = rawName || firstLast || email || `Employee #${employee.hr_code || employee.user_id || 'X'}`;

    const isOnApprovedLeave = [employee.employee_id, employee.user_id, employee.id]
      .filter(Boolean)
      .some((key) => leaveByKey.has(String(key).trim()));

    if (!record && isOnApprovedLeave) {
      summary.leaveToday += 1;
      summary.leaveList.push(empName);
      return;
    }

    const status = normalizeAttendanceStatus(record?.status || (record ? 'Present' : 'Absent'));
    const isHalfDay = status === 'Half Day';

    if (isOnApprovedLeave && status === 'Absent') {
      summary.leaveToday += 1;
      summary.leaveList.push(empName);
      return;
    }

    if (isHalfDay) {
      summary.halfDayToday += 1;
      summary.presentToday += 1;
      summary.halfDayList.push(empName);
      summary.presentList.push(empName);
      return;
    }

    if (status === 'Present' || status === 'Delayed') {
      summary.presentToday += 1;
      summary.presentList.push(empName);
      if (status === 'Delayed') summary.delayedToday += 1;
      return;
    }

    if (status === 'On Leave') {
      summary.leaveToday += 1;
      summary.leaveList.push(empName);
      return;
    }

    if (status === 'Absent') {
      summary.absentToday += 1;
      summary.absentList.push(empName);
      return;
    }

    summary.pendingToday += 1;
  });

  return summary;
};

router.use(verifyToken);

const getOverview = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = getIndiaDate();
    const monthStartDate = getIndiaMonthStart();

    const [
      totalEmployees,
      activeEmployees,
      missingEmployeeProfiles,
      attendanceToday,
      leaveToday,
      pendingLeaves,
      invoicesThisMonth,
      invoiceRevenue,
      pendingInvoices,
      quotationsPending,
      expensesThisMonth,
      pendingExpenses,
      clientsTotal,
      activeServices,
      openPttmTasks,
      overduePttmTasks,
      activeUsers,
      readOnlyUsers,
      offerLetters,
      salaryRecords,
      experienceLetters,
      incrementLetters,
      resignationPending,
      brandingStatus,
      bankStatus,
      gstStatus,
      smtpStatus,
    ] = await Promise.all([
      countRows(
        `SELECT COUNT(*) as total
         FROM employee_details ed
         JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
         WHERE ed.tenant_id = ?
           AND COALESCE(u.is_active, 1) = 1
           AND LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted')`,
        [tenantId]
      ),
      countRows(
        `SELECT COUNT(*) as total
         FROM employee_details ed
         JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
         WHERE ed.tenant_id = ?
           AND COALESCE(u.is_active, 1) = 1
           AND LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted')`,
        [tenantId]
      ),
      countRows(
        `SELECT COUNT(*) as total
         FROM employee_details ed
         JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
         WHERE ed.tenant_id = ?
           AND COALESCE(u.is_active, 1) = 1
           AND LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted')
           AND (ed.position IS NULL OR ed.position = '' OR ed.salary IS NULL OR ed.salary <= 0
             OR ed.bank_account_number IS NULL OR ed.bank_account_number = '')`,
        [tenantId]
      ),
      getDashboardAttendanceSummary(tenantId, today),
      countRows(
        `SELECT COUNT(*) as total
         FROM leave_requests
         WHERE tenant_id = ? AND LOWER(status) = 'approved' AND ? BETWEEN start_date AND end_date`,
        [tenantId, today]
      ),
      countRows("SELECT COUNT(*) as total FROM leave_requests WHERE tenant_id = ? AND LOWER(status) = 'pending'", [tenantId]),
      countRows('SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ? AND invoice_date >= ?', [tenantId, monthStartDate]),
      sumRows('SELECT SUM(total_after_tax) as total FROM invoices WHERE tenant_id = ? AND invoice_date >= ?', [tenantId, monthStartDate]),
      countRows("SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ? AND LOWER(status) NOT IN ('paid', 'cancelled')", [tenantId]),
      countRows("SELECT COUNT(*) as total FROM quotations WHERE tenant_id = ? AND LOWER(status) NOT IN ('approved', 'accepted', 'converted', 'rejected', 'cancelled')", [tenantId]),
      sumRows('SELECT SUM(amount) as total FROM expenses WHERE tenant_id = ? AND submitted_at >= ?', [tenantId, monthStartDate]),
      countRows("SELECT COUNT(*) as total FROM expenses WHERE tenant_id = ? AND LOWER(COALESCE(payment_status, status, 'pending')) = 'pending'", [tenantId]),
      countRows('SELECT COUNT(*) as total FROM clients WHERE tenant_id = ?', [tenantId]),
      countRows("SELECT COUNT(*) as total FROM services WHERE tenant_id = ? AND LOWER(status) IN ('active', 'in progress', 'ongoing', 'on going')", [tenantId]),
      countRows("SELECT COUNT(*) as total FROM pttm_tasks WHERE tenant_id = ? AND LOWER(COALESCE(status, '')) <> 'completed'", [tenantId]),
      countRows("SELECT COUNT(*) as total FROM pttm_tasks WHERE tenant_id = ? AND LOWER(COALESCE(status, '')) <> 'completed' AND date IS NOT NULL AND date <> '' AND date < ?", [tenantId, today]),
      countRows(
        `SELECT COUNT(DISTINCT uma.user_id) as total
         FROM user_module_access uma
         JOIN users u ON u.id = uma.user_id AND u.tenant_id = uma.tenant_id
         LEFT JOIN employee_details ed ON ed.employee_id = u.id AND ed.tenant_id = u.tenant_id
         WHERE uma.tenant_id = ?
           AND uma.access_level <> 'none'
           AND COALESCE(u.is_active, 1) = 1
           AND (ed.id IS NULL OR LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted'))`,
        [tenantId]
      ),
      countRows(
        `SELECT COUNT(DISTINCT uma.user_id) as total
         FROM user_module_access uma
         JOIN users u ON u.id = uma.user_id AND u.tenant_id = uma.tenant_id
         LEFT JOIN employee_details ed ON ed.employee_id = u.id AND ed.tenant_id = u.tenant_id
         WHERE uma.tenant_id = ?
           AND uma.access_level = 'read'
           AND COALESCE(u.is_active, 1) = 1
           AND (ed.id IS NULL OR LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted'))`,
        [tenantId]
      ),
      countRows('SELECT COUNT(*) as total FROM offer_letters WHERE tenant_id = ?', [tenantId]),
      countRows('SELECT COUNT(*) as total FROM tb_salary_records WHERE tenant_id = ?', [tenantId]),
      countRows('SELECT COUNT(*) as total FROM experience_letters WHERE tenant_id = ?', [tenantId]),
      countRows('SELECT COUNT(*) as total FROM increment_letters WHERE tenant_id = ?', [tenantId]),
      countRows("SELECT COUNT(*) as total FROM resignation_requests WHERE tenant_id = ? AND LOWER(status) = 'pending'", [tenantId]),
      firstRow(
        `SELECT
           company_name, company_email, company_phone, company_address,
           logo_url, signature_url, stamp_url
         FROM tenant_branding WHERE tenant_id = ? LIMIT 1`,
        [tenantId]
      ),
      firstRow("SELECT account_holder, account_number, bank_name, ifsc_code FROM service_settings WHERE tenant_id = ? AND setting_type = 'bank' LIMIT 1", [tenantId]),
      firstRow("SELECT gstin, pan_number, tax_rate FROM service_settings WHERE tenant_id = ? AND setting_type = 'gst' LIMIT 1", [tenantId]),
      firstRow("SELECT smtp_host, smtp_user, smtp_from_email, smtp_password FROM service_settings WHERE tenant_id = ? AND setting_type = 'smtp' LIMIT 1", [tenantId]),
    ]);

    const dashboardActiveEmployees = Number(attendanceToday.totalUsers ?? activeEmployees ?? 0);
    const presentToday = Number(attendanceToday.presentToday || 0);
    const delayedToday = Number(attendanceToday.delayedToday || 0);
    const halfDayToday = Number(attendanceToday.halfDayToday || 0);
    const absentToday = Number(attendanceToday.absentToday || 0);
    const attendanceLeaveToday = Number(attendanceToday.leaveToday || 0);
    const approvedLeaveToday = Number(leaveToday || 0);
    const leaveTodayTotal = Math.max(attendanceLeaveToday, approvedLeaveToday);

    const isComplete = (record, fields) => fields.every((field) => String(record?.[field] || '').trim());
    const setupHealth = [
      {
        key: 'branding',
        label: 'Branding profile',
        complete: isComplete(brandingStatus, ['company_name', 'company_email', 'company_phone', 'company_address', 'logo_url', 'signature_url', 'stamp_url']),
        action: 'branding',
      },
      {
        key: 'billing',
        label: 'Bank details',
        complete: isComplete(bankStatus, ['account_holder', 'account_number', 'bank_name', 'ifsc_code']),
        action: 'billingsettings',
      },
      {
        key: 'gst',
        label: 'GST profile',
        complete: isComplete(gstStatus, ['gstin', 'pan_number', 'tax_rate']),
        action: 'billingsettings',
      },
      {
        key: 'smtp',
        label: 'SMTP email',
        complete: isComplete(smtpStatus, ['smtp_host', 'smtp_user', 'smtp_from_email', 'smtp_password']),
        action: 'smtpconfig',
      },
    ];

    const actions = [
      { label: 'Pending leave approvals', value: pendingLeaves, tab: 'leave', severity: pendingLeaves > 0 ? 'warning' : 'ok' },
      { label: 'Pending expenses', value: pendingExpenses, tab: 'expenses', severity: pendingExpenses > 0 ? 'warning' : 'ok' },
      { label: 'Unpaid or draft invoices', value: pendingInvoices, tab: 'billing', severity: pendingInvoices > 0 ? 'warning' : 'ok' },
      { label: 'Open quotations', value: quotationsPending, tab: 'quotation', severity: quotationsPending > 0 ? 'info' : 'ok' },
      { label: 'Pending resignations', value: resignationPending, tab: 'resignation', severity: resignationPending > 0 ? 'danger' : 'ok' },
      { label: 'Incomplete employee profiles', value: missingEmployeeProfiles, tab: 'employee', severity: missingEmployeeProfiles > 0 ? 'warning' : 'ok' },
      { label: 'Overdue PTTM tasks', value: overduePttmTasks, tab: 'pttm', severity: overduePttmTasks > 0 ? 'danger' : 'ok' },
    ];

    const recentActivityQueries = [];
    if (await hasTable('employee_details')) {
      recentActivityQueries.push(runRows(
        `SELECT 'employee' as type, CONCAT('Employee added: ', COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as title,
                u.created_at as created_at, 'employee' as tab
         FROM employee_details ed
         LEFT JOIN users u ON u.id = ed.employee_id
         WHERE ed.tenant_id = ? ORDER BY u.created_at DESC LIMIT 5`,
        [tenantId]
      ));
    }
    if (await hasTable('invoices')) {
      recentActivityQueries.push(runRows(
        `SELECT 'invoice' as type, CONCAT('Invoice ', invoice_no, ' created') as title,
                created_at, 'billing' as tab
         FROM invoices WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5`,
        [tenantId]
      ));
    }
    if (await hasTable('leave_requests')) {
      recentActivityQueries.push(runRows(
        `SELECT 'leave' as type, CONCAT('Leave request ', LOWER(status)) as title,
                created_at, 'leave' as tab
         FROM leave_requests WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5`,
        [tenantId]
      ));
    }
    if (await hasTable('pttm_tasks')) {
      recentActivityQueries.push(runRows(
        `SELECT 'task' as type, CONCAT('Task: ', COALESCE(task_title, 'Untitled')) as title,
                created_at, 'pttm' as tab
         FROM pttm_tasks WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5`,
        [tenantId]
      ));
    }

    const recentActivity = (await Promise.all(recentActivityQueries))
      .flat()
      .filter((item) => item.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    res.json({
      success: true,
      overview: {
        kpis: {
          totalEmployees,
          presentToday,
          leaveToday: leaveTodayTotal,
          pendingLeaves,
          invoiceRevenue: formatCurrency(invoiceRevenue),
          pendingInvoices,
        },
        hr: {
          activeEmployees: dashboardActiveEmployees,
          presentToday,
          absentToday,
          delayedToday,
          halfDayToday,
          pendingAttendanceToday: Number(attendanceToday.pendingToday || 0),
          leaveToday: leaveTodayTotal,
          approvedLeaveToday,
          pendingLeaves,
          missingEmployeeProfiles,
          presentEmployees: attendanceToday.presentList || [],
          absentEmployees: attendanceToday.absentList || [],
          leaveEmployees: attendanceToday.leaveList || [],
          halfDayEmployees: attendanceToday.halfDayList || [],
        },
        accounts: {
          invoicesThisMonth,
          invoiceRevenue: formatCurrency(invoiceRevenue),
          pendingInvoices,
          quotationsPending,
          expensesThisMonth: formatCurrency(expensesThisMonth),
          pendingExpenses,
        },
        services: {
          clientsTotal,
          activeServices,
        },
        pttm: {
          openTasks: openPttmTasks,
          overdueTasks: overduePttmTasks,
        },
        access: {
          activeUsers,
          readOnlyUsers,
        },
        documents: {
          offerLetters,
          salaryRecords,
          experienceLetters,
          incrementLetters,
          resignationPending,
        },
        setupHealth,
        actions,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard overview' });
  }
};

router.get('/hr-overview', canAccessHrDashboard, getOverview);
router.use(requireAdmin);
router.get('/overview', getOverview);

const percentSegments = (rows, fallbackColors) => {
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);

  if (!total) {
    return [];
  }

  return rows.map((row, index) => {
    const colorSet = fallbackColors[index % fallbackColors.length];

    return {
      label: row.label || 'Unknown',
      percentage: Math.round((Number(row.count || 0) / total) * 100),
      color: colorSet.color,
      hoverColor: colorSet.hoverColor,
      count: Number(row.count || 0),
    };
  });
};

router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const [employees, offersSent, projects, services] = await Promise.all([
      countRows(
        `SELECT COUNT(*) as total
         FROM employee_details ed
         JOIN users u ON u.id = ed.employee_id AND u.tenant_id = ed.tenant_id
         WHERE ed.tenant_id = ?
           AND COALESCE(u.is_active, 1) = 1
           AND LOWER(COALESCE(ed.status, 'active')) NOT IN ('inactive', 'deleted')`,
        [tenantId]
      ),
      countRows(
        `SELECT COUNT(*) as total
         FROM offer_letters ol
         JOIN users u ON ol.employee_id = u.id
         WHERE u.tenant_id = ?`,
        [tenantId]
      ),
      countRows('SELECT COUNT(*) as total FROM projects WHERE tenant_id = ?', [tenantId]),
      countRows('SELECT COUNT(*) as total FROM services WHERE tenant_id = ?', [tenantId]),
    ]);

    res.json({
      stats: [
        { title: 'EMPLOYEES', value: employees, subtitle: 'Active team records', percentage: '', secondaryValue: '', secondaryLabel: '', color: '#6366f1' },
        { title: 'OFFERS_SENT', value: offersSent, subtitle: 'Generated offer letters', percentage: '', secondaryValue: '', secondaryLabel: '', color: '#10b981' },
        { title: 'PROJECTS', value: projects, subtitle: 'Client projects', percentage: '', secondaryValue: services, secondaryLabel: 'services', color: '#3b82f6' },
        { title: 'INTERNSHIPS', value: '0', secondaryValue: '0', secondaryLabel: 'pending', color: '#f59e0b' },
      ],
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

router.get('/projects-overview', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const [projectRows, serviceRows] = await Promise.all([
      runRows(
        `SELECT COALESCE(status, 'Unknown') as label, COUNT(*) as count
         FROM projects
         WHERE tenant_id = ?
         GROUP BY COALESCE(status, 'Unknown')`,
        [tenantId]
      ),
      runRows(
        `SELECT COALESCE(status, 'Unknown') as label, COUNT(*) as count
         FROM services
         WHERE tenant_id = ?
         GROUP BY COALESCE(status, 'Unknown')`,
        [tenantId]
      ),
    ]);

    const projectColors = [
      { color: '#3b82f6', hoverColor: '#2563eb' },
      { color: '#10b981', hoverColor: '#059669' },
      { color: '#f59e0b', hoverColor: '#d97706' },
      { color: '#ef4444', hoverColor: '#dc2626' },
    ];

    const serviceColors = [
      { color: '#8b5cf6', hoverColor: '#7c3aed' },
      { color: '#14b8a6', hoverColor: '#0d9488' },
      { color: '#f97316', hoverColor: '#ea580c' },
      { color: '#64748b', hoverColor: '#475569' },
    ];

    const projectTotal = projectRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const serviceTotal = serviceRows.reduce((sum, row) => sum + Number(row.count || 0), 0);

    res.json({
      projects: {
        segments: percentSegments(projectRows, projectColors),
        total: `${projectTotal} Projects`,
      },
      digitalMarketing: {
        segments: [],
        total: '0 Campaigns',
      },
      services: {
        segments: percentSegments(serviceRows, serviceColors),
        total: `${serviceTotal} Services`,
      },
    });
  } catch (error) {
    console.error('Get dashboard projects overview error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard overview' });
  }
});

router.get('/recent-projects', async (req, res) => {
  try {
    const rows = await runRows(
      `SELECT p.*, c.name as client_name
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id AND c.tenant_id = p.tenant_id
       WHERE p.tenant_id = ?
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [req.tenantId]
    );

    res.json({ projects: rows });
  } catch (error) {
    console.error('Get recent projects error:', error);
    res.status(500).json({ message: 'Failed to fetch recent projects' });
  }
});

router.get('/notifications', async (req, res) => {
  res.json({ notifications: [] });
});

router.put('/notifications/read-all', async (req, res) => {
  res.json({ success: true });
});

router.put('/notifications/:id/read', async (req, res) => {
  res.json({ success: true });
});

router.get('/reports', async (req, res) => {
  res.json({ reports: [] });
});

router.get('/students-chart', async (req, res) => {
  res.json({ labels: [], data: [] });
});

module.exports = router;
