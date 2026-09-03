// backend/src/features/admin/salaryRoutes.js
const express = require('express');
const router = express.Router();

// Import controllers
const salaryController = require('./salaryController');
const holidayController = require('./holidayController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

const setTenantId = (req, res, next) => {
    if (!req.user || !req.user.tenant_id) {
        return res.status(401).json({ success: false, message: 'Tenant context is missing from token' });
    }
    req.tenantId = req.user.tenant_id;
    next();
};

router.use(authMiddleware.verifyToken);
router.use(setTenantId);

const canReadSalary = requireModuleAccess('salary_management', 'read');
const canWriteSalary = requireModuleAccess('salary_management', 'write');
const canReadHoliday = requireModuleAccess('holiday_management', 'read');
const canWriteHoliday = requireModuleAccess('holiday_management', 'write');

// ==================== HOLIDAY ROUTES ====================
router.post('/holidays', canWriteHoliday, holidayController.createHoliday);
router.get('/holidays', holidayController.getHolidays);
// Specific routes MUST come before /:id wildcard to avoid route shadowing
router.get('/holidays/year/:year/month/:month', holidayController.getHolidaysByYearMonth);
router.get('/holidays/month/:month/:year', holidayController.getHolidaysByMonth);
router.post('/holidays/bulk-delete', canWriteHoliday, holidayController.bulkDeleteHolidays);
router.get('/holidays/:id', canReadHoliday, holidayController.getHolidayById);
router.put('/holidays/:id', canWriteHoliday, holidayController.updateHoliday);
router.delete('/holidays/:id', canWriteHoliday, holidayController.deleteHoliday);
// ==================== SALARY ROUTES ====================
router.get('/records', canReadSalary, salaryController.getSalaryRecords);
router.get('/months', canReadSalary, salaryController.getAvailableMonths);
router.get('/stats', canReadSalary, salaryController.getSalaryStats);
router.post('/generate/:employeeId', canWriteSalary, salaryController.generateEmployeeSalary);
router.post('/generate-all', canWriteSalary, salaryController.generateAllSalaries);
router.put('/update/:salaryRecordId', canWriteSalary, salaryController.updateSalaryRecord);
router.post('/payment/:salaryRecordId', canWriteSalary, salaryController.recordSalaryPayment);
router.post('/pay-bulk', canWriteSalary, salaryController.payBulkSalaries);
router.post('/pay/:salaryRecordId', canWriteSalary, salaryController.paySalary);
router.post('/mark-paid/:salaryRecordId', canWriteSalary, salaryController.markSalaryPaid);
router.post('/mark-pending/:salaryRecordId', canWriteSalary, salaryController.markSalaryPending);
router.get('/history/:employeeId', canReadSalary, salaryController.getEmployeeSalaryHistory);
router.get('/my-slips', salaryController.getMySalarySlips);
router.get('/slip/:salaryRecordId', salaryController.getSalarySlip);
router.post('/send-payslip/:salaryRecordId', canWriteSalary, salaryController.sendPayslipEmail);
router.get('/calculation/:employeeId', canReadSalary, salaryController.getSalaryCalculation);
// Test route
router.get('/test', canReadSalary, (req, res) => {
    res.json({ success: true, message: 'Salary routes working!', tenantId: req.tenantId });
});

module.exports = router;
