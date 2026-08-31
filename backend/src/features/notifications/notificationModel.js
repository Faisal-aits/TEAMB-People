// backend/src/features/notifications/notificationModel.js
const { pool } = require('../../config/db');

const Notification = {
  create: async (tenantId, userId, type, title, message = '', referenceId = null) => {
    const [result] = await pool.execute(
      `INSERT INTO notifications (tenant_id, user_id, type, title, message, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, type, title, message, referenceId]
    );
    return result.insertId;
  },

  getForUser: async (tenantId, userId, limit = 50) => {
    const limitNum = Number(limit) || 50;
    const [rows] = await pool.execute(
      `SELECT id, type, title, message, reference_id, is_read, created_at
       FROM notifications
       WHERE tenant_id = ? AND user_id = ?
       ORDER BY created_at DESC
       LIMIT ${limitNum}`,
      [tenantId, userId]
    );
    return rows;
  },

  getUnreadCount: async (tenantId, userId) => {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM notifications WHERE tenant_id = ? AND user_id = ? AND is_read = 0`,
      [tenantId, userId]
    );
    return rows[0]?.count || 0;
  },

  markRead: async (tenantId, id, userId) => {
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND tenant_id = ? AND user_id = ?`,
      [id, tenantId, userId]
    );
  },

  markAllRead: async (tenantId, userId) => {
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE tenant_id = ? AND user_id = ?`,
      [tenantId, userId]
    );
  }
};

module.exports = Notification;
