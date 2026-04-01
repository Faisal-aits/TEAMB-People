// routes/dailyReportRoutes.js
const express = require('express');
const dailyReportController = require('../controllers/dailyReportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// Report listing routes
router.get('/', dailyReportController.getAllReports);
router.get('/my-reports', dailyReportController.getMyReports);
router.get('/date-range/:start_date/:end_date', dailyReportController.getReportsByDateRange);

// Report CRUD routes
router.post('/', dailyReportController.createReport);
router.get('/:id', dailyReportController.getReportById);
router.put('/:id', dailyReportController.updateReport);
router.delete('/:id', dailyReportController.deleteReport);

// Report workflow routes
router.post('/:id/submit', dailyReportController.submitReport);
router.put('/:id/review', dailyReportController.reviewReport);

module.exports = router;