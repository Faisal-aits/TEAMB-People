// backend/routes/attendanceRoutes.js
const express = require('express');
const multer = require('multer');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const AutoAbsentService = require('../services/autoAbsentService');
const router = express.Router();

// Configure multer for file uploads (for face recognition)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== EXISTING ROUTES ====================

// GET /api/attendance - Get all attendance records
router.get('/', attendanceController.getAllAttendance);

// GET /api/attendance/shifts - Get all shifts
router.get('/shifts', attendanceController.getShifts);

// GET /api/attendance/stats - Get attendance statistics
router.get('/stats', attendanceController.getAttendanceStats);

// GET /api/attendance/history/:employeeId - Get employee attendance history
router.get('/history/:employeeId', attendanceController.getEmployeeHistory);

// POST /api/attendance/:attendanceId/approve - Approve attendance
router.post('/:attendanceId/approve', attendanceController.approveAttendance);

// POST /api/attendance/:attendanceId/reject - Reject attendance (mark as leave)
router.post('/:attendanceId/reject', attendanceController.rejectAttendance);

// POST /api/attendance/mark - Manual attendance marking
router.post('/mark', attendanceController.markAttendance);

// ==================== EMPLOYEE-SPECIFIC ROUTES ====================

// GET /api/attendance/my/today - Get current user's today attendance
router.get('/my/today', attendanceController.getMyTodayAttendance);

// GET /api/attendance/my/history - Get current user's attendance history
router.get('/my/history', attendanceController.getMyHistory);

// POST /api/attendance/my/mark - Mark attendance for current user
router.post('/my/mark', attendanceController.markMyAttendance);

// ==================== NEW FACE RECOGNITION ROUTE ====================

// POST /api/attendance/identify-and-mark - Face detection and automatic attendance
router.post('/verify-my-face', upload.single('faceImage'), attendanceController.verifyMyFaceAndMarkAttendance);
router.post('/identify-and-mark', upload.single('faceImage'), attendanceController.identifyAndMarkAttendance);


// In your attendanceRoutes.js file, add this route
router.get('/percentage/:employeeId', attendanceController.getEmployeeAttendancePercentage);

// POST /api/attendance/mark-absent - Manually trigger absent marking (for testing/admin)
router.post('/mark-absent', async (req, res) => {
    try {
        const result = await AutoAbsentService.markAbsentForToday();
        res.json({
            success: true,
            message: `Auto absent marking completed. Marked ${result.markedCount} employees as absent.`,
            ...result
        });
    } catch (error) {
        console.error('Error marking absent:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking absent employees'
        });
    }
});
// Get monthly attendance summary for salary calculation
router.get('/summary/:employeeId', 
    authMiddleware.verifyToken, 
    attendanceController.getMonthlyAttendanceSummary
);
module.exports = router;