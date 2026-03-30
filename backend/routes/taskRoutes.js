// routes/taskRoutes.js
const express = require('express');
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// Task listing routes
router.get('/', taskController.getAllTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/blocked', taskController.getBlockedTasks);
router.get('/project/:projectId', taskController.getTasksByProject); // New route for project-specific tasks

// Task CRUD routes
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task assignment routes
router.put('/:id/assign-team-lead', taskController.assignToTeamLead);
router.put('/:id/assign-member', taskController.assignToMember);
router.post('/:id/bulk-assign', taskController.bulkAssignMembers);

// Task acceptance route
router.post('/:id/accept', taskController.acceptTask);

// Task comments routes
router.get('/:id/comments', taskController.getTaskComments);
router.post('/:id/comments', taskController.addTaskComment);

// Task time log routes
router.get('/:id/time-logs', taskController.getTimeLogs);
router.post('/:id/time-log', taskController.addTimeLog);

// Bulk operations
router.put('/bulk/status', taskController.bulkUpdateStatus);
router.put('/bulk/assign', taskController.bulkAssignTasks);

module.exports = router;