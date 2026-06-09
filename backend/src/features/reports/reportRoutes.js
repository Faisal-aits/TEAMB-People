const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const reportController = require('./reportController');
const reportModel = require('./reportModel');

router.use(verifyToken);

router.get('/my', reportController.getMyReports);
router.post('/my', reportController.createMyReport);

router.use(requireAdmin);

router.get('/employees', reportController.getEmployees);
router.get('/', reportController.getReports);
router.put('/:id/remark', reportController.updateRemark);

router.ensureSchema = reportModel.ensureReportSchema;

module.exports = router;
