const express = require('express');
const router = express.Router();
const serviceController = require('./serviceController');
const { verifyToken } = require('../../middleware/auth.middleware');

// GET /api/services
router.get('/', verifyToken, serviceController.getAllServices);

// GET /api/services/types
router.get('/types', verifyToken, serviceController.getServiceTypes);

// GET /api/services/status
router.get('/status', verifyToken, serviceController.getStatusTypes);

// GET /api/services/:id
router.get('/:id', verifyToken, serviceController.getServiceById);

// POST /api/services
router.post('/', verifyToken, serviceController.createService);

// PUT /api/services/:id
router.put('/:id', verifyToken, serviceController.updateService);

// DELETE /api/services/:id
router.delete('/:id', verifyToken, serviceController.deleteService);

// POST /api/services/:id/assign
router.post('/:id/assign', verifyToken, serviceController.assignTeam);

module.exports = router;
