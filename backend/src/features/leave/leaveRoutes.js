// backend/src/features/leave/leaveRoutes.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const leaveController = require('./leaveController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

const router = express.Router();

// Configure multer — in-memory storage; files saved to disk in controller
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) or PDF documents are allowed'), false);
        }
    }
});

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
router.get('/:leaveId/document', requireModuleAccess('leave_management', 'read'), leaveController.getDocument);
router.get('/', requireModuleAccess('leave_management', 'read'), leaveController.getAllLeaves);

// POST /api/leaves - Create new leave request (employee)
// Accepts optional 'medical_document' file field for Sick/Maternity leaves
router.post('/', upload.single('medical_document'), leaveController.createLeave);

// POST /api/leaves/:leaveId/approve - Approve leave request (admin)
router.post('/:leaveId/approve', requireModuleAccess('leave_management', 'write'), leaveController.approveLeave);

// POST /api/leaves/:leaveId/reject - Reject leave request (admin)
router.post('/:leaveId/reject', requireModuleAccess('leave_management', 'write'), leaveController.rejectLeave);

// DELETE /api/leaves/:leaveId - Delete leave request
router.delete('/:leaveId', requireModuleAccess('leave_management', 'write'), leaveController.deleteLeave);

module.exports = router;
