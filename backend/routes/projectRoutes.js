const express = require('express');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/projects - Get all projects
router.get('/', projectController.getAllProjects);

// GET /api/projects/stats - Get dashboard statistics
router.get('/stats', projectController.getDashboardStats);

// GET /api/projects/managers - Get managers list
router.get('/managers', projectController.getManagers);

// GET /api/projects/departments - Get departments list
router.get('/departments', projectController.getDepartments);

// GET /api/projects/employees - Get employees for dropdown
router.get('/employees', projectController.getProjectEmployees);

// GET /api/projects/:id - Get specific project
router.get('/:id', projectController.getProjectById);

// POST /api/projects - Create new project
router.post('/', projectController.createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', projectController.updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', projectController.deleteProject);

// PUT /api/projects/:projectId/phases/:phaseName - Update project phase
router.put('/:projectId/phases/:phaseName', projectController.updateProjectPhase);

// POST /api/projects/:id/assign - Assign team to project
router.post('/:id/assign', projectController.assignProjectTeam);

module.exports = router;