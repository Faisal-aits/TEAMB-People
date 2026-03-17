// backend/routes/leaveRoutes.js
const express = require('express');
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== LEAVE ROUTES ====================

// GET /api/leaves - Get all leave requests (admin)
router.get('/', leaveController.getAllLeaves);

// GET /api/leaves/my - Get current user's leaves (employee)
router.get('/my', leaveController.getMyLeaves);

// GET /api/leaves/stats - Get leave statistics
router.get('/stats', leaveController.getLeaveStats);

// GET /api/leaves/history/:employeeId - Get employee attendance history
router.get('/history/:employeeId', leaveController.getEmployeeAttendanceHistory);

// POST /api/leaves - Create new leave request (employee)
router.post('/', leaveController.createLeave);

// POST /api/leaves/:leaveId/approve - Approve leave request (admin)
router.post('/:leaveId/approve', leaveController.approveLeave);

// POST /api/leaves/:leaveId/reject - Reject leave request (admin)
router.post('/:leaveId/reject', leaveController.rejectLeave);

// DELETE /api/leaves/:leaveId - Delete leave request
router.delete('/:leaveId', leaveController.deleteLeave);

module.exports = router;