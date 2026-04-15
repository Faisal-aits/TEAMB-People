// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');



// All routes are protected
router.use(authMiddleware.verifyToken);

// ========== GET Routes ==========
router.get('/', taskController.getAllTasks);                           // Get all tasks
router.get('/my-tasks', taskController.getMyTasks);                     // Get my tasks
router.get('/overdue', taskController.getOverdueTasks);                 // Get overdue tasks
router.get('/blocked', taskController.getBlockedTasks);                 // Get blocked tasks
router.get('/project/:projectId', taskController.getTasksByProject);    // Get tasks by project
router.get('/:id', taskController.getTaskById);                         // Get single task
router.get('/:id/comments', taskController.getTaskComments);            // Get task comments
router.get('/:id/time-logs', taskController.getTimeLogs);               // Get task time logs

// ========== POST Routes ==========
router.post('/', taskController.createTask);                            // Create task
router.post('/:id/comments', taskController.addTaskComment);            // Add comment
router.post('/:id/time-logs', taskController.addTimeLog);               // Add time log
router.post('/:id/accept', taskController.acceptTask);                  // Accept task
router.post('/bulk/update-status', taskController.bulkUpdateStatus);    // Bulk update status
router.post('/bulk/assign-tasks', taskController.bulkAssignTasks);      // Bulk assign tasks

// ========== PUT Routes ==========
router.put('/:id', taskController.updateTask);                          // Update task
router.put('/:id/assign-team-lead', taskController.assignToTeamLead);   // Assign to team lead
router.put('/:id/assign-member', taskController.assignToMember);        // Assign to member
router.put('/:id/bulk-assign-members', taskController.bulkAssignMembers); // Bulk assign members

// ========== DELETE Routes ==========
router.delete('/:id', taskController.deleteTask);                       // Delete task

module.exports = router;