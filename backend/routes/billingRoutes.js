// backend/routes/billingRoutes.js
const express = require('express');
const billingController = require('../controllers/billingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/billing/invoices - Get all invoices
router.get('/invoices', billingController.getAllInvoices);

// GET /api/billing/invoices/:id - Get specific invoice
router.get('/invoices/:id', billingController.getInvoice);

// POST /api/billing/invoices - Create new invoice
router.post('/invoices', billingController.createInvoice);

// PUT /api/billing/invoices/:id - Update invoice
router.put('/invoices/:id', billingController.updateInvoice);

// DELETE /api/billing/invoices/:id - Delete invoice
router.delete('/invoices/:id', billingController.deleteInvoice);

// PUT /api/billing/invoices/:id/status - Update invoice status
router.put('/invoices/:id/status', billingController.updateInvoiceStatus);

// POST /api/billing/invoices/:id/follow-up - Add follow-up note
router.post('/invoices/:id/follow-up', billingController.addFollowUp);

module.exports = router;