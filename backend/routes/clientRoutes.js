// backend/routes/clientRoutes.js
const express = require('express');
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/clients - Get all clients
router.get('/', clientController.getAllClients);

// GET /api/clients/managers - Get managers list
router.get('/managers', clientController.getManagers);

// GET /api/clients/industries - Get industries list
router.get('/industries', clientController.getIndustries);

// POST /api/clients/industries - Add new industry
router.post('/industries', clientController.addIndustry);

// GET /api/clients/:id - Get specific client
router.get('/:id', clientController.getClient);

// POST /api/clients - Create new client
router.post('/', clientController.createClient);

// PUT /api/clients/:id - Update client
router.put('/:id', clientController.updateClient);

// DELETE /api/clients/:id - Delete client
router.delete('/:id', clientController.deleteClient);

// POST /api/clients/:id/interactions - Add interaction
router.post('/:id/interactions', clientController.addInteraction);

module.exports = router;