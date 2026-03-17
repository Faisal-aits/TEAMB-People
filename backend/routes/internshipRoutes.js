const express = require('express');
const internshipController = require('../controllers/internshipController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// GET /api/internships - Get all internships
router.get('/', internshipController.getAllInternships);

// GET /api/internships/:id - Get internship by ID
router.get('/:id', internshipController.getInternship);

// POST /api/internships - Create new internship
router.post('/', internshipController.createInternship);

// PUT /api/internships/:id - Update internship
router.put('/:id', internshipController.updateInternship);

// DELETE /api/internships/:id - Delete internship
router.delete('/:id', internshipController.deleteInternship);

// GET /api/internships/:id/applicants - Get applicants
router.get('/:id/applicants', internshipController.getApplicants);

// GET /api/internships/:id/interns - Get assigned interns
router.get('/:id/interns', internshipController.getAssignedInterns);

// GET /api/internships/:id/tasks - Get tasks
router.get('/:id/tasks', internshipController.getTasks);

// POST /api/internships/tasks - Create task
router.post('/tasks', internshipController.createTask);

// PUT /api/internships/tasks/:taskId - Update task status
router.put('/tasks/:taskId', internshipController.updateTaskStatus);

// DELETE /api/internships/tasks/:taskId - Delete task
router.delete('/tasks/:taskId', internshipController.deleteTask);

// PUT /api/internships/applicants/:applicationId - Update applicant status
router.put('/applicants/:applicationId', internshipController.updateApplicantStatus);

// POST /api/internships/applicants - Add applicant
router.post('/applicants', internshipController.addApplicant);

// POST /api/internships/interns - Add assigned intern
router.post('/interns', internshipController.addAssignedIntern);

module.exports = router;