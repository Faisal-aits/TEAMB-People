// routes/resignationRoutes.js
const express = require('express');
const router = express.Router();
const resignationController = require('./resignationController');
const authMiddleware = require('../../middleware/auth.middleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');
const requireAdmin = require('../../middleware/requireAdmin');

// All routes require authentication and tenant context
router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

// ==================== MIXED ACCESS ROUTES ====================

// POST /api/resignation-requests - Employee submits resignation request (EMPLOYEE)
router.post('/', resignationController.submitRequest);

// GET /api/resignation-requests/my - Employee views own requests (EMPLOYEE)
router.get('/my', resignationController.getMyRequests);

// GET /api/resignation-requests - HR/Admin views all requests (ADMIN/HR ONLY)
router.get('/', requireAdmin, resignationController.getAllRequests);

// GET /api/resignation-requests/:id - View specific request (ADMIN/HR)
router.get('/:id', requireAdmin, resignationController.getRequestById);

// PUT /api/resignation-requests/:id/accept - HR/Admin accepts resignation (ADMIN/HR ONLY)
router.put('/:id/accept', requireAdmin, resignationController.uploadPDFMiddleware, resignationController.acceptRequest);

// PUT /api/resignation-requests/:id/reject - HR/Admin rejects resignation (ADMIN/HR ONLY)
router.put('/:id/reject', requireAdmin, resignationController.rejectRequest);

module.exports = router;
