// backend/src/features/notifications/notificationRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const Notification = require('./notificationModel');

router.use(authMiddleware.verifyToken);

// GET /api/notifications — get notifications for the logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenantId || 1;
    const notifications = await Notification.getForUser(tenantId, userId);
    const unreadCount = await Notification.getUnreadCount(tenantId, userId);
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await Notification.markAllRead(req.tenantId || 1, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.markRead(req.tenantId || 1, req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

module.exports = router;
