// backend/routes/salaryRoutes.js - CLEAN VERSION
const express = require('express');
const salaryController = require('../controllers/salaryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/salary/records - Get all salary records
router.get('/records', salaryController.getAllSalaryRecords);

// GET /api/salary/my-records - Get salary records for logged-in employee
router.get('/my-records', salaryController.getMySalaryRecords);

// GET /api/salary/employees - Get employees list
router.get('/employees', salaryController.getEmployees);

// GET /api/salary/departments - Get departments list
router.get('/departments', salaryController.getDepartments);

// GET /api/salary/stats - Get salary statistics
router.get('/stats', salaryController.getSalaryStats);

// GET /api/salary/records/:id - Get specific salary record
router.get('/records/:id', salaryController.getSalaryRecord);

// POST /api/salary/records - Create new salary record
router.post('/records', salaryController.createSalaryRecord);

// PUT /api/salary/records/:id - Update salary record
router.put('/records/:id', salaryController.updateSalaryRecord);

// DELETE /api/salary/records/:id - Delete salary record
router.delete('/records/:id', salaryController.deleteSalaryRecord);

// GET /api/salary/payslip/:id - Generate and download payslip PDF
router.get('/payslip/:id', salaryController.generatePayslip);

// GET /api/salary/payslip-preview/:id - Generate payslip preview (base64)
router.get('/payslip-preview/:id', salaryController.generatePayslipPreview);

// POST /api/salary/payslip/:id/email - Send payslip email
router.post('/payslip/:id/email', salaryController.sendPayslipEmail);

// Calculate salary from attendance (preview before creating)
router.post('/calculate-from-attendance', salaryController.calculateSalaryFromAttendance);

// Bulk create salary records for all employees
router.post('/bulk-create', salaryController.bulkCreateSalaryRecords);

// Get salary breakdown by department
router.get('/department-breakdown', salaryController.getSalaryByDepartment);

module.exports = router;