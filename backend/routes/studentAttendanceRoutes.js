// backend/routes/studentAttendanceRoutes.js
const express = require('express');
const studentAttendanceController = require('../controllers/studentAttendanceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Test route (public)
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Student attendance routes are working',
        timestamp: new Date().toISOString()
    });
});

// All other routes are protected
router.use(authMiddleware.verifyToken);

// ========== ADMIN/TEACHER ROUTES ==========

// GET /api/student-attendance - Get all student attendance records
router.get('/', studentAttendanceController.getAllStudentAttendance);

// GET /api/student-attendance/courses - Get courses list
router.get('/courses', studentAttendanceController.getCourses);

// GET /api/student-attendance/students - Get students by course
router.get('/students', studentAttendanceController.getStudentsByCourse);

// POST /api/student-attendance/bulk - Bulk mark student attendance
router.post('/bulk', studentAttendanceController.bulkMarkStudentAttendance);

// PUT /api/student-attendance/:id/status - Update attendance status
router.put('/:id/status', studentAttendanceController.updateAttendanceStatus);

// DELETE /api/student-attendance/:id - Delete student attendance
router.delete('/:id', studentAttendanceController.deleteStudentAttendance);

// ========== STUDENT ROUTES ==========

// GET /api/student-attendance/student/my-attendance - Get student's own attendance
router.get('/student/my-attendance', studentAttendanceController.getStudentSelfAttendance);

// GET /api/student-attendance/student/today - Get student's today's attendance
router.get('/student/today', studentAttendanceController.getStudentTodaysAttendance);

// POST /api/student-attendance/student/mark - Student marks own attendance
router.post('/student/mark', studentAttendanceController.markStudentSelfAttendance);

// PUT /api/student-attendance/student/checkout/:student_attendance_id - Student marks check-out
router.put('/student/checkout/:student_attendance_id', studentAttendanceController.markStudentCheckOut);

module.exports = router;