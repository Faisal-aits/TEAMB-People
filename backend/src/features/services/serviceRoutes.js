const express = require('express');
const router = express.Router();
const serviceController = require('./serviceController');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(verifyToken);
router.use(requireAdmin);

// GET /api/services
router.get('/', serviceController.getAllServices);

// GET /api/services/types
router.get('/types', serviceController.getServiceTypes);

// GET /api/services/status
router.get('/status', serviceController.getStatusTypes);

// GET /api/services/:id
router.get('/:id', serviceController.getServiceById);

// POST /api/services
router.post('/', serviceController.createService);

// PUT /api/services/:id
router.put('/:id', serviceController.updateService);

// DELETE /api/services/:id
router.delete('/:id', serviceController.deleteService);

// POST /api/services/:id/assign
router.post('/:id/assign', serviceController.assignTeam);

module.exports = router;
