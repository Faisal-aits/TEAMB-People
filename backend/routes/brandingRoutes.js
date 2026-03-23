// routes/brandingRoutes.js
const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/brandingController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// GET — any authenticated user can read branding (needed for document rendering)
router.get('/', brandingController.getBranding);

// PUT — admin/hr only — update text fields
router.put('/', requireRole(['admin', 'hr_manager']), brandingController.updateBranding);

// POST — admin/hr only — upload image
router.post('/upload', requireRole(['admin', 'hr_manager']), brandingController.uploadMiddleware, brandingController.uploadImage);

// DELETE — admin/hr only — remove image
router.delete('/upload', requireRole(['admin', 'hr_manager']), brandingController.deleteImage);

module.exports = router;
