// backend/src/features/attendance/regularizationController.js
const Regularization = require('./regularizationModel');
const Notification = require('../notifications/notificationModel');
const { pool } = require('../../config/db');

const regularizationController = {

  // ─── SETTINGS ────────────────────────────────────────────────────────────────

  /**
   * GET /api/attendance/regularization/settings
   * Admin: get monthly limit and enabled flag.
   */
  getSettings: async (req, res) => {
    try {
      const settings = await Regularization.getSettings(req.tenantId);
      res.json({ success: true, settings });
    } catch (error) {
      console.error('getSettings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  },

  /**
   * PUT /api/attendance/regularization/settings
   * Admin: update monthly_limit and/or is_enabled.
   */
  updateSettings: async (req, res) => {
    try {
      const { monthly_limit, is_enabled } = req.body;

      if (monthly_limit !== undefined && (isNaN(monthly_limit) || monthly_limit < 0)) {
        return res.status(400).json({ success: false, message: 'monthly_limit must be a non-negative number' });
      }

      const settings = await Regularization.upsertSettings(req.tenantId, {
        monthly_limit: monthly_limit ?? 4,
        is_enabled: is_enabled !== undefined ? (is_enabled ? 1 : 0) : 1,
      });

      res.json({ success: true, message: 'Settings updated successfully', settings });
    } catch (error) {
      console.error('updateSettings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  },

  // ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

  /**
   * GET /api/attendance/regularization
   * Admin: list all requests with optional filters.
   */
  getAll: async (req, res) => {
    try {
      const { status, employee_id, month, year, start_date, end_date } = req.query;
      const requests = await Regularization.getAllRequests(req.tenantId, {
        status,
        employee_id,
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        start_date,
        end_date,
      });
      const statistics = await Regularization.getStatistics(req.tenantId);
      res.json({ success: true, requests, statistics });
    } catch (error) {
      console.error('getAll regularization error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch regularization requests' });
    }
  },

  /**
   * GET /api/attendance/regularization/stats
   * Admin: aggregate stats.
   */
  getStats: async (req, res) => {
    try {
      const statistics = await Regularization.getStatistics(req.tenantId);
      res.json({ success: true, statistics });
    } catch (error) {
      console.error('getStats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
  },

  /**
   * POST /api/attendance/regularization/:id/approve
   * Admin: approve a request and auto-update attendance.
   */
  approve: async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_remarks } = req.body;
      const reviewedBy = req.user.id;

      const updated = await Regularization.approveRequest(
        req.tenantId,
        parseInt(id),
        reviewedBy,
        admin_remarks
      );
      
      const [[reqUser]] = await pool.execute(SELECT u.id as user_id FROM tb_regularizations r JOIN employee_details ed ON ed.id = r.employee_id JOIN users u ON u.id = ed.employee_id WHERE r.id = ? AND r.tenant_id = ?, [parseInt(id), req.tenantId]);
      if (reqUser && reqUser.user_id) {
          await Notification.create(req.tenantId, reqUser.user_id, 'attendance', 'Attendance Correction Approved', Your attendance correction request for  was approved., parseInt(id));
      }

      res.json({ success: true, message: 'Request approved and attendance updated', request: updated });
    } catch (error) {
      console.error('approve regularization error:', error);
      const status = error.message === 'Request not found' ? 404
        : error.message === 'Request is not pending' ? 409 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/attendance/regularization/:id/reject
   * Admin: reject a request.
   */
  reject: async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_remarks } = req.body;
      const reviewedBy = req.user.id;

      const updated = await Regularization.rejectRequest(
        req.tenantId,
        parseInt(id),
        reviewedBy,
        admin_remarks
      );

      const [[reqUser]] = await pool.execute(SELECT u.id as user_id FROM tb_regularizations r JOIN employee_details ed ON ed.id = r.employee_id JOIN users u ON u.id = ed.employee_id WHERE r.id = ? AND r.tenant_id = ?, [parseInt(id), req.tenantId]);
      if (reqUser && reqUser.user_id) {
          await Notification.create(req.tenantId, reqUser.user_id, 'attendance', 'Attendance Correction Rejected', Your attendance correction request for  was rejected., parseInt(id));
      }

      res.json({ success: true, message: 'Request rejected', request: updated });
    } catch (error) {
      console.error('reject regularization error:', error);
      const status = error.message === 'Request not found' ? 404
        : error.message === 'Request is not pending' ? 409 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  },

  /**
   * DELETE /api/attendance/regularization/:id
   * Admin: delete a request record.
   */
  deleteRequest: async (req, res) => {
    try {
      const deleted = await Regularization.deleteRequest(req.tenantId, parseInt(req.params.id));
      if (!deleted) return res.status(404).json({ success: false, message: 'Request not found' });
      res.json({ success: true, message: 'Request deleted' });
    } catch (error) {
      console.error('deleteRequest error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete request' });
    }
  },

  // ─── EMPLOYEE ROUTES ──────────────────────────────────────────────────────────

  /**
   * GET /api/attendance/regularization/my
   * Employee: get their own requests.
   */
  getMyRequests: async (req, res) => {
    try {
      const employeeId = await getEmployeeIdFromUser(req.user.id, req.tenantId);
      if (!employeeId) return res.status(400).json({ success: false, message: 'Employee record not found' });

      const requests = await Regularization.getMyRequests(req.tenantId, employeeId);
      res.json({ success: true, requests });
    } catch (error) {
      console.error('getMyRequests error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch your requests' });
    }
  },

  /**
   * GET /api/attendance/regularization/my/usage
   * Employee: get current month usage vs limit.
   */
  getMyMonthlyUsage: async (req, res) => {
    try {
      const employeeId = await getEmployeeIdFromUser(req.user.id, req.tenantId);
      if (!employeeId) return res.status(400).json({ success: false, message: 'Employee record not found' });

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [settings, used] = await Promise.all([
        Regularization.getSettings(req.tenantId),
        Regularization.getMonthlyRequestCount(req.tenantId, employeeId, month, year),
      ]);

      res.json({
        success: true,
        usage: {
          used: parseInt(used),
          limit: settings.monthly_limit,
          remaining: Math.max(0, settings.monthly_limit - parseInt(used)),
          is_enabled: !!settings.is_enabled,
          month,
          year,
        },
      });
    } catch (error) {
      console.error('getMyMonthlyUsage error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch usage info' });
    }
  },

  /**
   * POST /api/attendance/regularization
   * Employee: submit a new regularization request.
   */
  create: async (req, res) => {
    try {
      const employeeId = await getEmployeeIdFromUser(req.user.id, req.tenantId);
      if (!employeeId) return res.status(400).json({ success: false, message: 'Employee record not found' });

      const {
        request_date,
        requested_check_in,
        requested_check_out,
        requested_status,
        reason,
      } = req.body;

      // Validate required fields
      if (!request_date || !reason) {
        return res.status(400).json({ success: false, message: 'request_date and reason are required' });
      }

      // Check if feature is enabled
      const settings = await Regularization.getSettings(req.tenantId);
      if (!settings.is_enabled) {
        return res.status(403).json({
          success: false,
          message: 'Attendance regularization is currently disabled by the administrator',
        });
      }

      // Check monthly limit
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const used = await Regularization.getMonthlyRequestCount(req.tenantId, employeeId, month, year);

      if (parseInt(used) >= settings.monthly_limit) {
        return res.status(429).json({
          success: false,
          message: `Monthly regularization limit reached (${settings.monthly_limit} requests per month). Please contact HR.`,
          limit: settings.monthly_limit,
          used: parseInt(used),
        });
      }

      // Find matching attendance record if exists
      const [attRows] = await pool.execute(
        `SELECT attendance_id as id FROM tb_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ? LIMIT 1`,
        [req.tenantId, employeeId, request_date]
      );
      const attendance_id = attRows.length > 0 ? attRows[0].id : null;

      const newRequest = await Regularization.createRequest(req.tenantId, {
        employee_id: employeeId,
        attendance_id,
        request_date,
        requested_check_in: requested_check_in || null,
        requested_check_out: requested_check_out || null,
        requested_status: requested_status || null,
        reason,
      });

      await Notification.notifyAdmins(req.tenantId, 'attendance', 'New Attendance Correction', A new attendance correction was requested for ., newRequest.id);

      res.status(201).json({
        success: true,
        message: 'Regularization request submitted successfully',
        request: newRequest,
        usage: {
          used: parseInt(used) + 1,
          limit: settings.monthly_limit,
          remaining: Math.max(0, settings.monthly_limit - parseInt(used) - 1),
        },
      });
    } catch (error) {
      console.error('create regularization error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit regularization request' });
    }
  },
};

// ─── HELPER ───────────────────────────────────────────────────────────────────

async function getEmployeeIdFromUser(userId, tenantId) {
  const [rows] = await pool.execute(
    `SELECT id FROM employee_details WHERE employee_id = ? AND tenant_id = ?`,
    [userId, tenantId]
  );
  return rows.length > 0 ? rows[0].id : null;
}

module.exports = regularizationController;
