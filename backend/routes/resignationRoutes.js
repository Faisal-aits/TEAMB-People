// routes/resignationRoutes.js
const express = require('express');
const router = express.Router();
const resignationController = require('../controllers/resignationController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

// All routes require authentication and tenant context
router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

// Employee routes
router.post('/', resignationController.submitRequest);
router.get('/my', resignationController.getMyRequests);

// HR/Admin routes
router.get('/', authMiddleware.requireRole(['admin', 'hr_manager']), resignationController.getAllRequests);
router.get('/:id', resignationController.getRequestById); // Need both employee and HR to view, filtering is handled by logic or can trust since they can only see what they ask for
router.put('/:id/accept', authMiddleware.requireRole(['admin', 'hr_manager']), resignationController.uploadPDFMiddleware, resignationController.acceptRequest);
router.put('/:id/reject', authMiddleware.requireRole(['admin', 'hr_manager']), resignationController.rejectRequest);

module.exports = router;
