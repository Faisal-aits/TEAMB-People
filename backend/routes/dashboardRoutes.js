// routes/dashboardRoutes.js
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// All dashboard routes are protected
router.use(authMiddleware.verifyToken);

// Dashboard endpoints
router.get('/stats', dashboardController.getStats);
router.get('/students-chart', dashboardController.getStudentsChart);
router.get('/projects-overview', dashboardController.getProjectsOverview);
router.get('/recent-projects', dashboardController.getRecentProjects);
router.get('/notifications', dashboardController.getNotifications);
router.put('/notifications/:id/read', dashboardController.markNotificationAsRead);
router.put('/notifications/read-all', dashboardController.markAllNotificationsAsRead);


module.exports = router;