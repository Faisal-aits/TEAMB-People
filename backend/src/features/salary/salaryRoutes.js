// backend/src/features/admin/salaryRoutes.js
const express = require('express');
const router = express.Router();

// Import controllers
const salaryController = require('./salaryController');
const holidayController = require('./holidayController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

const setTenantId = (req, res, next) => {
    req.tenantId = req.user?.tenant_id || req.headers['x-tenant-id'] || 1;
    next();
};

router.use(authMiddleware.verifyToken);
router.use(requireAdmin);
router.use(setTenantId);

// ==================== HOLIDAY ROUTES ====================
router.post('/holidays', holidayController.createHoliday);
router.get('/holidays', holidayController.getHolidays);
// Specific routes MUST come before /:id wildcard to avoid route shadowing
router.get('/holidays/year/:year/month/:month', holidayController.getHolidaysByYearMonth);
router.get('/holidays/month/:month/:year', holidayController.getHolidaysByMonth);
router.post('/holidays/bulk-delete', holidayController.bulkDeleteHolidays);
router.get('/holidays/:id', holidayController.getHolidayById);
router.put('/holidays/:id', holidayController.updateHoliday);
router.delete('/holidays/:id', holidayController.deleteHoliday);
// ==================== SALARY ROUTES ====================
router.get('/records', salaryController.getSalaryRecords);
router.get('/months', salaryController.getAvailableMonths);
router.get('/stats', salaryController.getSalaryStats);
router.post('/generate/:employeeId', salaryController.generateEmployeeSalary);
router.post('/generate-all', salaryController.generateAllSalaries);
router.put('/update/:salaryRecordId', salaryController.updateSalaryRecord);
router.post('/payment/:salaryRecordId', salaryController.recordSalaryPayment);
router.post('/mark-paid/:salaryRecordId', salaryController.markSalaryPaid);
router.post('/mark-pending/:salaryRecordId', salaryController.markSalaryPending);
router.get('/history/:employeeId', salaryController.getEmployeeSalaryHistory);
router.get('/slip/:salaryRecordId', salaryController.getSalarySlip);
router.get('/calculation/:employeeId', salaryController.getSalaryCalculation);
// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Salary routes working!', tenantId: req.tenantId });
});

module.exports = router;
