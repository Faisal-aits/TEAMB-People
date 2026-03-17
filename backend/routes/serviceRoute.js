// backend/routes/serviceRoute.js
const express = require('express');
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// GET /api/services - Get all services
router.get('/', serviceController.getAllServices);

// GET /api/services/types - Get service types
router.get('/types', serviceController.getServiceTypes);

// GET /api/services/status - Get status types
router.get('/status', serviceController.getStatusTypes);

// GET /api/services/employees - Get employees for dropdown
router.get('/employees', serviceController.getEmployees);

// GET /api/services/:id - Get service by ID
router.get('/:id', serviceController.getServiceById);

// POST /api/services - Create new service
router.post('/', serviceController.createService);

// PUT /api/services/:id - Update service
router.put('/:id', serviceController.updateService);

// DELETE /api/services/:id - Delete service
router.delete('/:id', serviceController.deleteService);

// POST /api/services/:id/assign - Assign team to service
router.post('/:id/assign', serviceController.assignTeam);

module.exports = router;