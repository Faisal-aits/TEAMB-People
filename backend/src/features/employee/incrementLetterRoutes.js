// routes/incrementLetterRoutes.js
const express = require('express');
const router = express.Router();
const incrementLetterController = require('./incrementLetterController');
const authMiddleware = require('../../middleware/auth.middleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

// ==================== MIXED ACCESS ROUTES ====================

// GET /api/increment-letters/my - Employee views own letters (EMPLOYEE)
router.get('/my', incrementLetterController.getMyLetters);

// POST /api/increment-letters - HR generates letter (ADMIN/HR ONLY)
router.post('/', requireAdmin, incrementLetterController.uploadPDFMiddleware, incrementLetterController.generateLetter);

// GET /api/increment-letters - HR views all letters (ADMIN/HR ONLY)
router.get('/', requireAdmin, incrementLetterController.getAllLetters);

// GET /api/increment-letters/:id - View specific letter (ADMIN/HR)
router.get('/:id', requireAdmin, incrementLetterController.getLetterById);

// DELETE /api/increment-letters/:id - Delete letter (ADMIN/HR ONLY)
router.delete('/:id', requireAdmin, incrementLetterController.deleteLetter);

module.exports = router;
