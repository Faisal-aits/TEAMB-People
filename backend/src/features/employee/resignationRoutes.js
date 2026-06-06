// routes/resignationRoutes.js
const express = require('express');
const router = express.Router();
const resignationController = require('./resignationController');
const authMiddleware = require('../../middleware/auth.middleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

// All routes require authentication and tenant context
router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

// ==================== MIXED ACCESS ROUTES ====================

// POST /api/resignation-requests - Employee submits resignation request (EMPLOYEE)
router.post('/', resignationController.submitRequest);

// GET /api/resignation-requests/my - Employee views own requests (EMPLOYEE)
router.get('/my', resignationController.getMyRequests);

// GET /api/resignation-requests - HR/Admin views all requests (ADMIN/HR ONLY)
router.get('/', requireModuleAccess('resignations', 'read'), resignationController.getAllRequests);

// GET /api/resignation-requests/:id - View specific request (ADMIN/HR)
router.get('/:id', requireModuleAccess('resignations', 'read'), resignationController.getRequestById);

// PUT /api/resignation-requests/:id/accept - HR/Admin accepts resignation (ADMIN/HR ONLY)
router.put('/:id/accept', requireModuleAccess('resignations', 'write'), resignationController.uploadPDFMiddleware, resignationController.acceptRequest);

// PUT /api/resignation-requests/:id/reject - HR/Admin rejects resignation (ADMIN/HR ONLY)
router.put('/:id/reject', requireModuleAccess('resignations', 'write'), resignationController.rejectRequest);

module.exports = router;
