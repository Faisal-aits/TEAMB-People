const express = require('express');
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// GET /api/students - Get all students
router.get('/', studentController.getAllStudents);

// GET /api/students/:id - Get student by ID
router.get('/:id', studentController.getStudent);

// POST /api/students - Create new student
router.post('/', studentController.createStudent);

// PUT /api/students/:id - Update student
router.put('/:id', studentController.updateStudent);

// DELETE /api/students/:id - Delete student
router.delete('/:id', studentController.deleteStudent);

// GET /api/students/:id/courses - Get student courses
router.get('/:id/courses', studentController.getStudentCourses);

module.exports = router;