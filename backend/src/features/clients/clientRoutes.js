const express = require('express');
const router = express.Router();
const clientController = require('./clientController');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

// All routes require authentication
router.use(verifyToken);
router.use(requireModuleAccess('service_management', 'read'));

// GET /api/clients
router.get('/', clientController.getAllClients);

// GET /api/clients/managers
router.get('/managers', clientController.getManagers);

// GET /api/clients/industries
router.get('/industries', clientController.getIndustries);

// POST /api/clients/industries
router.post('/industries', requireModuleAccess('service_management', 'write'), clientController.addIndustry);

// GET /api/clients/:id
router.get('/:id', clientController.getClientById);

// POST /api/clients
router.post('/', requireModuleAccess('service_management', 'write'), clientController.createClient);

// PUT /api/clients/:id
router.put('/:id', requireModuleAccess('service_management', 'write'), clientController.updateClient);

// DELETE /api/clients/:id
router.delete('/:id', requireModuleAccess('service_management', 'write'), clientController.deleteClient);

// POST /api/clients/:id/interactions
router.post('/:id/interactions', requireModuleAccess('service_management', 'write'), clientController.addInteraction);

module.exports = router;
