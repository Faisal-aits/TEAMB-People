// backend/routes/attendanceRoutes.js
const express = require('express');
const multer = require('multer');
const Attendance = require('./attendanceModel');
const { pool } = require('../../config/db');
const attendanceController = require('./attendanceController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');
// const AutoAbsentService = require('../services/autoAbsentService');
const router = express.Router();

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
router.get('/', requireModuleAccess('attendance_management', 'read'), attendanceController.getAllAttendance);

// GET /api/attendance/shifts - Get all shifts
router.get('/shifts', requireModuleAccess('attendance_management', 'read'), attendanceController.getShifts);

// GET /api/attendance/stats - Get attendance statistics
router.get('/stats', requireModuleAccess('attendance_management', 'read'), attendanceController.getAttendanceStats);

// POST /api/attendance/auto-checkout/run - Manually run auto check-out sweep
router.post('/auto-checkout/run', requireModuleAccess('attendance_management', 'write'), attendanceController.runAutoCheckout);

// GET /api/attendance/history/:employeeId - Get employee attendance history
router.get('/history/:employeeId', requireModuleAccess('attendance_management', 'read'), attendanceController.getEmployeeHistory);

// POST /api/attendance/:attendanceId/approve - Approve attendance
router.post('/:attendanceId/approve', requireModuleAccess('attendance_management', 'write'), attendanceController.approveAttendance);

// POST /api/attendance/:attendanceId/reject - Reject attendance (mark as leave)
router.post('/:attendanceId/reject', requireModuleAccess('attendance_management', 'write'), attendanceController.rejectAttendance);

// POST /api/attendance/mark - Manual attendance marking
router.post('/mark', requireModuleAccess('attendance_management', 'write'), attendanceController.markAttendance);

// ==================== EMPLOYEE-SPECIFIC ROUTES ====================

// GET /api/attendance/my/today - Get current user's today attendance
router.get('/my/today', attendanceController.getMyTodayAttendance);

// GET /api/attendance/my/auto-checkout - Get current user's auto check-out preference
router.get('/my/auto-checkout', attendanceController.getMyAutoCheckoutSetting);

// PUT /api/attendance/my/auto-checkout - Update current user's auto check-out preference
router.put('/my/auto-checkout', attendanceController.updateMyAutoCheckoutSetting);

// GET /api/attendance/my/history - Get current user's attendance history
router.get('/my/history', attendanceController.getMyHistory);

// POST /api/attendance/my/mark - Mark attendance for current user
router.post('/my/mark', attendanceController.markMyAttendance);

// ==================== NEW FACE RECOGNITION ROUTE ====================

// POST /api/attendance/identify-and-mark - Face detection and automatic attendance
router.post('/verify-my-face', upload.single('faceImage'), attendanceController.verifyMyFaceAndMarkAttendance);
router.post('/identify-and-mark', requireModuleAccess('attendance_management', 'write'), upload.single('faceImage'), attendanceController.identifyAndMarkAttendance);


// In your attendanceRoutes.js file, add this route
router.get('/percentage/:employeeId', requireModuleAccess('attendance_management', 'read'), attendanceController.getEmployeeAttendancePercentage);

// POST /api/attendance/mark-absent - Manually trigger absent marking (for testing/admin)
router.post('/mark-absent', requireModuleAccess('attendance_management', 'write'), async (req, res) => {
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
  requireModuleAccess('attendance_management', 'read'),
  attendanceController.getMonthlyAttendanceSummary
);
module.exports = router;
