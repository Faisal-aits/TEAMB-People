// backend/routes/quotationRoutes.js
const express = require('express');
const quotationController = require('../controllers/quotationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/quotations - Get all quotations
router.get('/', quotationController.getAllQuotations);

// GET /api/quotations/:id - Get specific quotation
router.get('/:id', quotationController.getQuotation);

// POST /api/quotations - Create new quotation
router.post('/', quotationController.createQuotation);

// PUT /api/quotations/:id - Update quotation
router.put('/:id', quotationController.updateQuotation);

// DELETE /api/quotations/:id - Delete quotation
router.delete('/:id', quotationController.deleteQuotation);

// PUT /api/quotations/:id/status - Update quotation status
router.put('/:id/status', quotationController.updateQuotationStatus);

// POST /api/quotations/:id/follow-up - Add follow-up note
router.post('/:id/follow-up', quotationController.addFollowUp);

module.exports = router;