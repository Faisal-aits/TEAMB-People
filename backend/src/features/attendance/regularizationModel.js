// backend/src/features/attendance/regularizationModel.js
const { pool } = require('../../config/db');

const RegularizationModel = {
  // ─── SETTINGS ────────────────────────────────────────────────────────────────

  /**
   * Get regularization settings for a tenant.
   * Returns defaults if not configured yet.
   */
  async getSettings(tenantId) {
    const [rows] = await pool.execute(
      `SELECT * FROM attendance_regularization_settings WHERE tenant_id = ?`,
      [tenantId]
    );
    if (rows.length > 0) return rows[0];
    // Return default settings if not configured
    return { tenant_id: tenantId, monthly_limit: 4, is_enabled: 1 };
  },

  /**
   * Create or update settings for a tenant.
   */
  async upsertSettings(tenantId, { monthly_limit, is_enabled }) {
    await pool.execute(
      `INSERT INTO attendance_regularization_settings (tenant_id, monthly_limit, is_enabled)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit), is_enabled = VALUES(is_enabled)`,
      [tenantId, monthly_limit, is_enabled]
    );
    return this.getSettings(tenantId);
  },

  // ─── REQUEST COUNT ────────────────────────────────────────────────────────────

  /**
   * Count requests made by an employee in the given month/year.
   * All non-deleted requests count (including Rejected).
   */
  async getMonthlyRequestCount(tenantId, employeeId, month, year) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM attendance_regularization_requests
       WHERE tenant_id = ?
         AND employee_id = ?
         AND MONTH(created_at) = ?
         AND YEAR(created_at) = ?`,
      [tenantId, employeeId, month, year]
    );
    return rows[0].count;
  },

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  /**
   * Create a new regularization request.
   */
  async createRequest(tenantId, {
    employee_id,
    attendance_id,
    request_date,
    requested_check_in,
    requested_check_out,
    requested_status,
    reason
  }) {
    const [result] = await pool.execute(
      `INSERT INTO attendance_regularization_requests
         (tenant_id, employee_id, attendance_id, request_date,
          requested_check_in, requested_check_out, requested_status, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        employee_id,
        attendance_id || null,
        request_date,
        requested_check_in || null,
        requested_check_out || null,
        requested_status || null,
        reason
      ]
    );
    return this.getRequestById(tenantId, result.insertId);
  },

  /**
   * Get all regularization requests for a tenant with optional filters.
   */
  async getAllRequests(tenantId, { status, employee_id, month, year, start_date, end_date } = {}) {
    let query = `
      SELECT
        r.*,
        eu.first_name, eu.last_name, eu.email, e.position, e.department_id,
        d.name AS department_name,
        CONCAT(u.first_name, ' ', u.last_name) AS reviewed_by_name
      FROM attendance_regularization_requests r
      LEFT JOIN employee_details e ON r.employee_id = e.id AND r.tenant_id = e.tenant_id
      LEFT JOIN users eu ON e.employee_id = eu.id
      LEFT JOIN departments d ON e.department_id = d.id AND e.tenant_id = d.tenant_id
      LEFT JOIN users u ON r.reviewed_by = u.id
      WHERE r.tenant_id = ?
    `;
    const params = [tenantId];

    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    if (employee_id) {
      query += ` AND r.employee_id = ?`;
      params.push(employee_id);
    }
    if (month) {
      query += ` AND MONTH(r.request_date) = ?`;
      params.push(month);
    }
    if (year) {
      query += ` AND YEAR(r.request_date) = ?`;
      params.push(year);
    }
    if (start_date) {
      query += ` AND r.request_date >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND r.request_date <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Get requests for a specific employee.
   */
  async getMyRequests(tenantId, employeeId) {
    const [rows] = await pool.execute(
      `SELECT
         r.*,
         CONCAT(u.first_name, ' ', u.last_name) AS reviewed_by_name
       FROM attendance_regularization_requests r
       LEFT JOIN users u ON r.reviewed_by = u.id
       WHERE r.tenant_id = ? AND r.employee_id = ?
       ORDER BY r.created_at DESC`,
      [tenantId, employeeId]
    );
    return rows;
  },

  /**
   * Get a single request by ID.
   */
  async getRequestById(tenantId, id) {
    const [rows] = await pool.execute(
      `SELECT
         r.*,
         eu.first_name, eu.last_name, eu.email, e.position,
         CONCAT(u.first_name, ' ', u.last_name) AS reviewed_by_name
       FROM attendance_regularization_requests r
       LEFT JOIN employee_details e ON r.employee_id = e.id AND r.tenant_id = e.tenant_id
       LEFT JOIN users eu ON e.employee_id = eu.id
       LEFT JOIN users u ON r.reviewed_by = u.id
       WHERE r.id = ? AND r.tenant_id = ?`,
      [id, tenantId]
    );
    return rows[0] || null;
  },

  /**
   * Approve a regularization request.
   * Auto-updates the tb_attendance record (or creates a new one).
   */
  async approveRequest(tenantId, id, reviewedBy, adminRemarks) {
    const request = await this.getRequestById(tenantId, id);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'Pending') throw new Error('Request is not pending');

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update request status
      await connection.execute(
        `UPDATE attendance_regularization_requests
         SET status = 'Approved', admin_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ? AND tenant_id = ?`,
        [adminRemarks || null, reviewedBy, id, tenantId]
      );

      // Auto-update or create the attendance record
      if (request.attendance_id) {
        // Update existing record
        const updates = [];
        const vals = [];

        if (request.requested_check_in) {
          updates.push('check_in = ?');
          vals.push(request.requested_check_in);
        }
        if (request.requested_check_out) {
          updates.push('check_out = ?');
          vals.push(request.requested_check_out);
        }
        if (request.requested_status) {
          updates.push('status = ?');

          vals.push(request.requested_status);
        }
        updates.push("regularization_status = 'Approved'");

        if (updates.length > 0) {
          vals.push(request.attendance_id, tenantId);
          await connection.execute(
            `UPDATE tb_attendance SET ${updates.join(', ')} WHERE attendance_id = ? AND tenant_id = ?`,
            vals
          );
        }
      } else {
        // No existing record — create one
        
        // 1. Get the shift_id for the employee
        const [shiftRows] = await connection.execute(
          `SELECT default_shift_id FROM employee_details WHERE id = ? AND tenant_id = ?`,
          [request.employee_id, tenantId]
        );
        let shiftId = shiftRows.length > 0 ? shiftRows[0].default_shift_id : null;
        
        if (!shiftId) {
          // Fallback to tenant's default shift
          const [defaultShiftRows] = await connection.execute(
            `SELECT shift_id FROM tb_shifts WHERE tenant_id = ? AND is_default = TRUE LIMIT 1`,
            [tenantId]
          );
          shiftId = defaultShiftRows.length > 0 ? defaultShiftRows[0].shift_id : null;
        }

        await connection.execute(
          `INSERT INTO tb_attendance
             (tenant_id, employee_id, shift_id, date, check_in, check_out, status, regularization_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')`,
          [
            tenantId,
            request.employee_id,
            shiftId, // Can be null if still not found, but DB will complain if it's strictly NOT NULL without default, usually shift_id is required
            request.request_date,
            request.requested_check_in || null,
            request.requested_check_out || null,
            request.requested_status || 'Present'
          ]
        );
      }

      await connection.commit();
      return this.getRequestById(tenantId, id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Reject a regularization request.
   */
  async rejectRequest(tenantId, id, reviewedBy, adminRemarks) {
    const request = await this.getRequestById(tenantId, id);
    if (!request) throw new Error('Request not found');
    if (request.status !== 'Pending') throw new Error('Request is not pending');

    await pool.execute(
      `UPDATE attendance_regularization_requests
       SET status = 'Rejected', admin_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [adminRemarks || null, reviewedBy, id, tenantId]
    );
    return this.getRequestById(tenantId, id);
  },

  /**
   * Delete a regularization request (admin only).
   */
  async deleteRequest(tenantId, id) {
    const [result] = await pool.execute(
      `DELETE FROM attendance_regularization_requests WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    return result.affectedRows > 0;
  },

  // ─── STATISTICS ───────────────────────────────────────────────────────────────

  /**
   * Get aggregate statistics for dashboard.
   */
  async getStatistics(tenantId) {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'Pending')  AS pending,
         SUM(status = 'Approved') AS approved,
         SUM(status = 'Rejected') AS rejected
       FROM attendance_regularization_requests
       WHERE tenant_id = ?`,
      [tenantId]
    );
    return rows[0];
  },
};

module.exports = RegularizationModel;
