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

// ==================== STANDARD EMPLOYEE ROUTES ====================
// GET /api/employees - Get all employees
router.get('/', employeeController.getAllEmployees);

// GET /api/employees/roles - Get roles for this tenant
router.get('/roles', employeeController.getRoles);

// GET /api/employees/departments - Get departments
router.get('/departments', employeeController.getDepartments);

// GET /api/employees/my-profile - Get current employee profile
router.get('/my-profile', employeeController.getMyProfile);

// GET /api/employees/:id - Get employee by ID
router.get('/:id', employeeController.getEmployee);

// POST /api/employees - Create new employee
router.post('/', employeeController.createEmployee);

// PUT /api/employees/:id - Update employee
router.put('/:id', employeeController.updateEmployee);

// POST /api/employees/:id/reset-password - Reset employee password (admin/hr restricted handled externally or via token check)
router.post('/:id/reset-password', authMiddleware.requireRole(['admin']), employeeController.resetPassword);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', employeeController.deleteEmployee);

// GET /api/employees/positions/suggested - Get suggested positions
router.get('/positions/suggested', employeeController.getSuggestedPositions);

// POST /api/employees/positions/suggested - Add new suggested position
router.post('/positions/suggested', employeeController.addSuggestedPosition);

// GET /api/employees/:id/face-status - Get face enrollment status
router.get('/:id/face-status', employeeController.getFaceStatus);

// ==================== FACE UPLOAD ROUTES (WITH MULTER) ====================
// POST /api/employees/:id/enroll-face - Enroll face for employee
router.post('/:id/enroll-face', upload.single('faceImage'), employeeController.enrollFace);


module.exports = router;