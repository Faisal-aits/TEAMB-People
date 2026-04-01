// routes/teamRoutes.js
const express = require('express');
const teamController = require('../controllers/teamController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// Team management routes
router.get('/', teamController.getAllTeams);
router.post('/', teamController.createTeam);
router.get('/:id', teamController.getTeamById);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

// Team member routes
router.get('/:teamId/members', teamController.getTeamMembers);
router.post('/members', teamController.addTeamMember);
router.delete('/:teamId/members/:employeeId', teamController.removeTeamMember);
router.post('/:id/members/bulk', teamController.bulkAddMembers);

// Employee team routes
router.get('/employee/:employeeId', teamController.getTeamsByEmployee);

module.exports = router;