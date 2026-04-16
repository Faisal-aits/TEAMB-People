const express = require('express');
const internshipController = require('../controllers/internshipController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== ADMIN-ONLY ROUTES ====================
// All internship management requires admin role

// GET /api/internships - Get all internships (ADMIN ONLY)
router.get('/', authMiddleware.requireAdmin, internshipController.getAllInternships);

// GET /api/internships/:id - Get internship by ID (ADMIN ONLY)
router.get('/:id', authMiddleware.requireAdmin, internshipController.getInternship);

// POST /api/internships - Create new internship (ADMIN ONLY)
router.post('/', authMiddleware.requireAdmin, internshipController.createInternship);

// PUT /api/internships/:id - Update internship (ADMIN ONLY)
router.put('/:id', authMiddleware.requireAdmin, internshipController.updateInternship);

// DELETE /api/internships/:id - Delete internship (ADMIN ONLY)
router.delete('/:id', authMiddleware.requireAdmin, internshipController.deleteInternship);

// GET /api/internships/:id/applicants - Get applicants (ADMIN ONLY)
router.get('/:id/applicants', authMiddleware.requireAdmin, internshipController.getApplicants);

// GET /api/internships/:id/interns - Get assigned interns (ADMIN ONLY)
router.get('/:id/interns', authMiddleware.requireAdmin, internshipController.getAssignedInterns);

// GET /api/internships/:id/tasks - Get tasks (ADMIN ONLY)
router.get('/:id/tasks', authMiddleware.requireAdmin, internshipController.getTasks);

// POST /api/internships/tasks - Create task (ADMIN ONLY)
router.post('/tasks', authMiddleware.requireAdmin, internshipController.createTask);

// PUT /api/internships/tasks/:taskId - Update task status (ADMIN ONLY)
router.put('/tasks/:taskId', authMiddleware.requireAdmin, internshipController.updateTaskStatus);

// DELETE /api/internships/tasks/:taskId - Delete task (ADMIN ONLY)
router.delete('/tasks/:taskId', authMiddleware.requireAdmin, internshipController.deleteTask);

// PUT /api/internships/applicants/:applicationId - Update applicant status (ADMIN ONLY)
router.put('/applicants/:applicationId', authMiddleware.requireAdmin, internshipController.updateApplicantStatus);

// POST /api/internships/applicants - Add applicant (ADMIN ONLY)
router.post('/applicants', authMiddleware.requireAdmin, internshipController.addApplicant);

// POST /api/internships/interns - Add assigned intern (ADMIN ONLY)
router.post('/interns', authMiddleware.requireAdmin, internshipController.addAssignedIntern);

module.exports = router;