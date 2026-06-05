const express = require('express');
const router = express.Router();
const clientController = require('./clientController');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

// All routes require authentication
router.use(verifyToken);
router.use(requireAdmin);

// GET /api/clients
router.get('/', clientController.getAllClients);

// GET /api/clients/managers
router.get('/managers', clientController.getManagers);

// GET /api/clients/industries
router.get('/industries', clientController.getIndustries);

// POST /api/clients/industries
router.post('/industries', clientController.addIndustry);

// GET /api/clients/:id
router.get('/:id', clientController.getClientById);

// POST /api/clients
router.post('/', clientController.createClient);

// PUT /api/clients/:id
router.put('/:id', clientController.updateClient);

// DELETE /api/clients/:id
router.delete('/:id', clientController.deleteClient);

// POST /api/clients/:id/interactions
router.post('/:id/interactions', clientController.addInteraction);

module.exports = router;
