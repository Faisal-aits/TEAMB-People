const express = require('express');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== ADMIN-ONLY ROUTES ====================
// All course management requires admin role

// GET /api/courses - Get all courses (ADMIN ONLY)
router.get('/', authMiddleware.requireAdmin, courseController.getAllCourses);

// GET /api/courses/:id - Get course by ID (ADMIN ONLY)
router.get('/:id', authMiddleware.requireAdmin, courseController.getCourse);

// POST /api/courses - Create new course (ADMIN ONLY)
router.post('/', authMiddleware.requireAdmin, courseController.createCourse);

// PUT /api/courses/:id - Update course (ADMIN ONLY)
router.put('/:id', authMiddleware.requireAdmin, courseController.updateCourse);

// DELETE /api/courses/:id - Delete course (ADMIN ONLY)
router.delete('/:id', authMiddleware.requireAdmin, courseController.deleteCourse);

// GET /api/courses/:id/students - Get enrolled students (ADMIN ONLY)
router.get('/:id/students', authMiddleware.requireAdmin, courseController.getEnrolledStudents);

module.exports = router;