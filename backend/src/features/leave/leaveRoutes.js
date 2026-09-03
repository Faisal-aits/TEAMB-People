// backend/routes/leaveRoutes.js
const express = require('express');
const leaveController = require('./leaveController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== LEAVE ROUTES ====================

// Specific routes first to prevent wildcard clashes
router.get('/types/settings', requireModuleAccess('leave_management', 'read'), leaveController.getLeaveTypeSettings);
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', requireModuleAccess('leave_management', 'write'), leaveController.createLeaveType);
router.put('/types/:typeId', requireModuleAccess('leave_management', 'write'), leaveController.updateLeaveType);
router.get('/balances/my', leaveController.getMyBalances);
router.get('/balances/:employeeId', requireModuleAccess('leave_management', 'read'), leaveController.getLeaveBalances);
router.get('/my', leaveController.getMyLeaves);
router.get('/stats', requireModuleAccess('leave_management', 'read'), leaveController.getLeaveStats);
router.get('/history/:employeeId', requireModuleAccess('leave_management', 'read'), leaveController.getEmployeeAttendanceHistory);
router.get('/', requireModuleAccess('leave_management', 'read'), leaveController.getAllLeaves);

// POST /api/leaves - Create new leave request (employee)
router.post('/', leaveController.createLeave);

// POST /api/leaves/:leaveId/approve - Approve leave request (admin)
router.post('/:leaveId/approve', requireModuleAccess('leave_management', 'write'), leaveController.approveLeave);

// POST /api/leaves/:leaveId/reject - Reject leave request (admin)
router.post('/:leaveId/reject', requireModuleAccess('leave_management', 'write'), leaveController.rejectLeave);

// DELETE /api/leaves/:leaveId - Delete leave request
router.delete('/:leaveId', leaveController.deleteLeave);

module.exports = router;
