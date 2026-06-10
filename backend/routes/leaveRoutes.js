// backend/routes/leaveRoutes.js
const express = require('express');
const multer = require('multer');
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for medical document uploads
// Accepts images (JPEG, PNG, GIF, WebP) and PDFs up to 10 MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) or PDF documents are allowed'), false);
        }
    }
});

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== MIXED ACCESS ROUTES ====================

// GET /api/leaves - Get all leave requests (ADMIN ONLY)
router.get('/', authMiddleware.requireAdmin, leaveController.getAllLeaves);

// GET /api/leaves/my - Get current user's leaves (EMPLOYEE)
router.get('/my', leaveController.getMyLeaves);

// GET /api/leaves/stats - Get leave statistics (ADMIN ONLY)
router.get('/stats', authMiddleware.requireAdmin, leaveController.getLeaveStats);

// GET /api/leaves/history/:employeeId - Get employee attendance history (ADMIN ONLY)
router.get('/history/:employeeId', authMiddleware.requireAdmin, leaveController.getEmployeeAttendanceHistory);

// GET /api/leaves/:leaveId/document - View/stream medical document (ADMIN ONLY)
router.get('/:leaveId/document', authMiddleware.requireAdmin, leaveController.getDocument);

// POST /api/leaves - Create new leave request (EMPLOYEE)
// Accepts optional 'medical_document' file field for Sick/Maternity leaves
router.post('/', upload.single('medical_document'), leaveController.createLeave);

// POST /api/leaves/:leaveId/approve - Approve leave request (ADMIN ONLY)
router.post('/:leaveId/approve', authMiddleware.requireAdmin, leaveController.approveLeave);

// POST /api/leaves/:leaveId/reject - Reject leave request (ADMIN ONLY)
router.post('/:leaveId/reject', authMiddleware.requireAdmin, leaveController.rejectLeave);

// DELETE /api/leaves/:leaveId - Delete leave request (ADMIN ONLY)
router.delete('/:leaveId', authMiddleware.requireAdmin, leaveController.deleteLeave);

module.exports = router;