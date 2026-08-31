const express = require('express');
const router = express.Router();
const breakController = require('./breakController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

router.use(authMiddleware.verifyToken);

// Employee Routes
router.post('/in', breakController.breakIn);
router.post('/out', breakController.breakOut);
router.get('/my-today', breakController.getMyTodayBreaks);
router.get('/my-history', breakController.getMyHistory);

// Admin Routes
router.get('/all', requireModuleAccess('attendance_management', 'read'), breakController.getAllBreaks);
router.get('/history/:employeeId', requireModuleAccess('attendance_management', 'read'), breakController.getEmployeeBreakHistory);

module.exports = router;
