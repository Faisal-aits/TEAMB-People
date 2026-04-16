const express = require('express');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== ADMIN-ONLY ROUTES ====================
// All student management requires admin role

// GET /api/students - Get all students (ADMIN ONLY)
router.get('/', authMiddleware.requireAdmin, studentController.getAllStudents);

// GET /api/students/:id - Get student by ID (ADMIN ONLY)
router.get('/:id', authMiddleware.requireAdmin, studentController.getStudent);

// POST /api/students - Create new student (ADMIN ONLY)
router.post('/', authMiddleware.requireAdmin, studentController.createStudent);

// PUT /api/students/:id - Update student (ADMIN ONLY)
router.put('/:id', authMiddleware.requireAdmin, studentController.updateStudent);

// DELETE /api/students/:id - Delete student (ADMIN ONLY)
router.delete('/:id', authMiddleware.requireAdmin, studentController.deleteStudent);

// GET /api/students/:id/courses - Get student courses (ADMIN ONLY)
router.get('/:id/courses', authMiddleware.requireAdmin, studentController.getStudentCourses);

module.exports = router;