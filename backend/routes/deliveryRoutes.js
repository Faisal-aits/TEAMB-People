// backend/routes/deliveryRoutes.js
const express = require('express');
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/delivery/challans - Get all delivery challans
router.get('/challans', deliveryController.getAllChallans);

// GET /api/delivery/challans/:id - Get specific delivery challan
router.get('/challans/:id', deliveryController.getChallan);

// POST /api/delivery/challans - Create new delivery challan
router.post('/challans', deliveryController.createChallan);

// PUT /api/delivery/challans/:id - Update delivery challan
router.put('/challans/:id', deliveryController.updateChallan);

// DELETE /api/delivery/challans/:id - Delete delivery challan
router.delete('/challans/:id', deliveryController.deleteChallan);

// POST /api/delivery/challans/:id/follow-up - Add follow-up note
router.post('/challans/:id/follow-up', deliveryController.addFollowUp);

// GET /api/delivery/challans/:id/download - Download delivery challan as PDF
router.get('/challans/:id/download', deliveryController.downloadChallanPDF);

module.exports = router;