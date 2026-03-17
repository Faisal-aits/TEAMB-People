const express = require('express');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// GET /api/courses - Get all courses
router.get('/', courseController.getAllCourses);

// GET /api/courses/:id - Get course by ID
router.get('/:id', courseController.getCourse);

// POST /api/courses - Create new course
router.post('/', courseController.createCourse);

// PUT /api/courses/:id - Update course
router.put('/:id', courseController.updateCourse);

// DELETE /api/courses/:id - Delete course
router.delete('/:id', courseController.deleteCourse);

// GET /api/courses/:id/students - Get enrolled students
router.get('/:id/students', courseController.getEnrolledStudents);

module.exports = router;