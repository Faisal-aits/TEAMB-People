const express = require('express');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// ==================== ADMIN-ONLY ROUTES ====================
// All project management requires admin role

// GET /api/projects - Get all projects (ADMIN ONLY)
router.get('/', authMiddleware.requireAdmin, projectController.getAllProjects);

// GET /api/projects/stats - Get dashboard statistics (ADMIN ONLY)
router.get('/stats', authMiddleware.requireAdmin, projectController.getDashboardStats);

// GET /api/projects/managers - Get managers list (ADMIN ONLY)
router.get('/managers', authMiddleware.requireAdmin, projectController.getManagers);

// GET /api/projects/departments - Get departments list (ADMIN ONLY)
router.get('/departments', authMiddleware.requireAdmin, projectController.getDepartments);

// GET /api/projects/employees - Get employees for dropdown (ADMIN ONLY)
router.get('/employees', authMiddleware.requireAdmin, projectController.getProjectEmployees);

// GET /api/projects/:id - Get specific project (ADMIN ONLY)
router.get('/:id', authMiddleware.requireAdmin, projectController.getProjectById);

// POST /api/projects - Create new project (ADMIN ONLY)
router.post('/', authMiddleware.requireAdmin, projectController.createProject);

// PUT /api/projects/:id - Update project (ADMIN ONLY)
router.put('/:id', authMiddleware.requireAdmin, projectController.updateProject);

// DELETE /api/projects/:id - Delete project (ADMIN ONLY)
router.delete('/:id', authMiddleware.requireAdmin, projectController.deleteProject);

// PUT /api/projects/:projectId/phases/:phaseName - Update project phase (ADMIN ONLY)
router.put('/:projectId/phases/:phaseName', authMiddleware.requireAdmin, projectController.updateProjectPhase);

// POST /api/projects/:id/assign - Assign team to project (ADMIN ONLY)
router.post('/:id/assign', authMiddleware.requireAdmin, projectController.assignProjectTeam);

module.exports = router;