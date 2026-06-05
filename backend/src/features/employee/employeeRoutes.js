// backend/src/features/employee/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('./employeeController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const multer = require('multer');
const path = require('path');
const {
  MAX_BULK_UPLOAD_FILE_SIZE,
  ALLOWED_BULK_UPLOAD_EXTENSIONS,
  ALLOWED_BULK_UPLOAD_MIME_TYPES
} = require('./employeeBulkUploadConfig');


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BULK_UPLOAD_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const hasAllowedExtension = ALLOWED_BULK_UPLOAD_EXTENSIONS.includes(extension);
    const hasAllowedMimeType = ALLOWED_BULK_UPLOAD_MIME_TYPES.includes(file.mimetype);

    if (!hasAllowedExtension || !hasAllowedMimeType) {
      return cb(new Error('Only CSV and XLSX files are allowed'));
    }

    return cb(null, true);
  }
});

const handleBulkUploadFile = (req, res, next) => {
  bulkUpload.single('file')(req, res, (error) => {
    if (!error) return next();

    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `File size must be ${Math.floor(MAX_BULK_UPLOAD_FILE_SIZE / 1024 / 1024)}MB or less`
      : error.message;

    return res.status(400).json({
      success: false,
      totalRows: 0,
      insertedRows: 0,
      failedRows: 0,
      errors: [{ row: null, message }]
    });
  });
};

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== EMPLOYEE ROUTES ====================

// GET /api/employees - Get all employees
router.get('/', employeeController.getAllEmployees);

// GET /api/employees/departments - Get departments
router.get('/departments', employeeController.getDepartments);

// POST /api/employees/departments - Create department
router.post('/departments', requireAdmin, employeeController.createDepartment);

// PUT /api/employees/departments/:departmentId - Update department
router.put('/departments/:departmentId', requireAdmin, employeeController.updateDepartment);

// DELETE /api/employees/departments/:departmentId - Delete department
router.delete('/departments/:departmentId', requireAdmin, employeeController.deleteDepartment);

// GET /api/employees/my-profile - Get current employee profile
router.get('/my-profile', employeeController.getMyProfile);

// GET /api/employees/positions/suggested - Get suggested positions
router.get('/positions/suggested', employeeController.getSuggestedPositions);

// POST /api/employees/positions/suggested - Add new suggested position
router.post('/positions/suggested', employeeController.addSuggestedPosition);

// POST /api/employees - Create new employee
router.post('/', employeeController.createEmployee);

// POST /api/employees/bulk-upload - Upload CSV/XLSX file and create employees
router.post('/bulk-upload', handleBulkUploadFile, employeeController.bulkUploadEmployees);

// POST /api/employees/bulk - Bulk create employees
router.post('/bulk', employeeController.bulkCreateEmployee);

// GET /api/employees/:id - Get employee by ID
router.get('/:id', employeeController.getEmployee);

// GET /api/employees/:id/face-status - Get face enrollment status
router.get('/:id/face-status', employeeController.getFaceStatus);

// PUT /api/employees/:id - Update employee
router.put('/:id', employeeController.updateEmployee);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', employeeController.deleteEmployee);

// POST /api/employees/:id/reset-password - Reset employee password
router.post('/:id/reset-password', employeeController.resetPassword);

// POST /api/employees/:id/enroll-face - Enroll face for employee
router.post('/:id/enroll-face', upload.single('faceImage'), employeeController.enrollFace);

module.exports = router;
