// backend/routes/employeeRoutes.js
const express = require('express');
const multer = require('multer');
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== EMPLOYEE SELF-SERVICE ROUTES ====================
// These can be accessed by any authenticated employee/admin

// GET /api/employees/my-profile - Get current employee profile
router.get('/my-profile', employeeController.getMyProfile);

// GET /api/employees/:id - Get employee by ID (self or admin only)
router.get('/:id', authMiddleware.requireSelfOrAdmin, employeeController.getEmployee);

// ==================== ADMIN-ONLY ROUTES ====================
// These require admin role

// GET /api/employees - Get all employees (ADMIN ONLY)
router.get('/', authMiddleware.requireAdmin, employeeController.getAllEmployees);

// GET /api/employees/roles - Get roles for this tenant (ADMIN ONLY)
router.get('/roles', authMiddleware.requireAdmin, employeeController.getRoles);

// GET /api/employees/departments - Get departments (ADMIN ONLY)
router.get('/departments', authMiddleware.requireAdmin, employeeController.getDepartments);

// POST /api/employees - Create new employee (ADMIN ONLY)
router.post('/', authMiddleware.requireAdmin, employeeController.createEmployee);

// PUT /api/employees/:id - Update employee (ADMIN ONLY)
router.put('/:id', authMiddleware.requireAdmin, employeeController.updateEmployee);

// POST /api/employees/:id/reset-password - Reset employee password (ADMIN/HR ONLY)
router.post('/:id/reset-password', authMiddleware.requireRole(['admin', 'hr']), employeeController.resetPassword);

// DELETE /api/employees/:id - Delete employee (ADMIN ONLY)
router.delete('/:id', authMiddleware.requireAdmin, employeeController.deleteEmployee);

// GET /api/employees/positions/suggested - Get suggested positions (ADMIN ONLY)
router.get('/positions/suggested', authMiddleware.requireAdmin, employeeController.getSuggestedPositions);

// POST /api/employees/positions/suggested - Add new suggested position (ADMIN ONLY)
router.post('/positions/suggested', authMiddleware.requireAdmin, employeeController.addSuggestedPosition);

// GET /api/employees/:id/face-status - Get face enrollment status
router.get('/:id/face-status', employeeController.getFaceStatus);

// ==================== FACE UPLOAD ROUTES (WITH MULTER) ====================
// POST /api/employees/:id/enroll-face - Enroll face for employee
router.post('/:id/enroll-face', upload.single('faceImage'), employeeController.enrollFace);


module.exports = router;