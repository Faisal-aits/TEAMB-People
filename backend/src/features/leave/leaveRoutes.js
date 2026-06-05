// backend/routes/leaveRoutes.js
const express = require('express');
const leaveController = require('./leaveController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== LEAVE ROUTES ====================

// Specific routes first to prevent wildcard clashes
router.get('/types', leaveController.getLeaveTypes);
router.get('/balances/my', leaveController.getMyBalances);
router.get('/balances/:employeeId', requireAdmin, leaveController.getLeaveBalances);
router.get('/my', leaveController.getMyLeaves);
router.get('/stats', requireAdmin, leaveController.getLeaveStats);
router.get('/history/:employeeId', requireAdmin, leaveController.getEmployeeAttendanceHistory);
router.get('/', requireAdmin, leaveController.getAllLeaves);

// POST /api/leaves - Create new leave request (employee)
router.post('/', leaveController.createLeave);

// POST /api/leaves/:leaveId/approve - Approve leave request (admin)
router.post('/:leaveId/approve', requireAdmin, leaveController.approveLeave);

// POST /api/leaves/:leaveId/reject - Reject leave request (admin)
router.post('/:leaveId/reject', requireAdmin, leaveController.rejectLeave);

// DELETE /api/leaves/:leaveId - Delete leave request
router.delete('/:leaveId', requireAdmin, leaveController.deleteLeave);

module.exports = router;
