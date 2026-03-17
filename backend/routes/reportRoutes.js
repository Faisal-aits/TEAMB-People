// backend/routes/reportRoutes.js
const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/reports - Get all reports
router.get('/', reportController.getAllReports);

// GET /api/reports/recent - Get recent reports (MUST BE BEFORE /:id)
router.get('/recent', reportController.getRecentReports);

// GET /api/reports/:id - Get specific report
router.get('/:id', reportController.getReport);

// POST /api/reports - Create new report
router.post('/', reportController.createReport);

// PUT /api/reports/:id - Update report
router.put('/:id', reportController.updateReport);

// DELETE /api/reports/:id - Delete report
router.delete('/:id', reportController.deleteReport);

module.exports = router;