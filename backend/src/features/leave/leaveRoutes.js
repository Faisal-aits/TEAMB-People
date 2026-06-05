// backend/src/features/leave/leaveRoutes.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const leaveController = require('./leaveController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

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
router.get('/types', leaveController.getLeaveTypes);
router.get('/balances/my', leaveController.getMyBalances);
router.get('/balances/:employeeId', requireAdmin, leaveController.getLeaveBalances);
router.get('/my', leaveController.getMyLeaves);
router.get('/stats', requireAdmin, leaveController.getLeaveStats);
router.get('/history/:employeeId', requireAdmin, leaveController.getEmployeeAttendanceHistory);
router.get('/:leaveId/document', requireAdmin, leaveController.getDocument);
router.get('/', requireAdmin, leaveController.getAllLeaves);

// POST /api/leaves - Create new leave request (employee)
// Accepts optional 'medical_document' file field for Sick/Maternity leaves
router.post('/', upload.single('medical_document'), leaveController.createLeave);

// POST /api/leaves/:leaveId/approve - Approve leave request (admin)
router.post('/:leaveId/approve', requireAdmin, leaveController.approveLeave);

// POST /api/leaves/:leaveId/reject - Reject leave request (admin)
router.post('/:leaveId/reject', requireAdmin, leaveController.rejectLeave);

// DELETE /api/leaves/:leaveId - Delete leave request
router.delete('/:leaveId', requireAdmin, leaveController.deleteLeave);

module.exports = router;
