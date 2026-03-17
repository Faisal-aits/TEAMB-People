// backend/routes/departmentRoutes.js
const express = require('express');
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/departments - Get all departments
router.get('/', departmentController.getAllDepartments);

// GET /api/departments/managers - Get managers list
router.get('/managers', departmentController.getManagers);

// GET /api/departments/:id - Get specific department
router.get('/:id', departmentController.getDepartment);

// GET /api/departments/:id/employees - Get department employees
router.get('/:id/employees', departmentController.getDepartmentEmployees);

// POST /api/departments - Create new department
router.post('/', departmentController.createDepartment);

// PUT /api/departments/:id - Update department
router.put('/:id', departmentController.updateDepartment);

// DELETE /api/departments/:id - Delete department
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;