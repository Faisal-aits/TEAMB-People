// routes/experienceLetterRoutes.js
const express = require('express');
const router = express.Router();
const experienceLetterController = require('./experienceLetterController');
const authMiddleware = require('../../middleware/auth.middleware');
const tenantMiddleware = require('../../middleware/tenantMiddleware');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

// ==================== MIXED ACCESS ROUTES ====================

// GET /api/experience-letters/my - Employee views own letters (EMPLOYEE)
router.get('/my', experienceLetterController.getMyLetters);

// POST /api/experience-letters - HR generates letter (ADMIN/HR ONLY)
router.post('/', requireAdmin, experienceLetterController.uploadPDFMiddleware, experienceLetterController.generateLetter);

// GET /api/experience-letters - HR views all letters (ADMIN/HR ONLY)
router.get('/', requireAdmin, experienceLetterController.getAllLetters);

// GET /api/experience-letters/:id - View specific letter (ADMIN/HR)
router.get('/:id', requireAdmin, experienceLetterController.getLetterById);

// DELETE /api/experience-letters/:id - Delete letter (ADMIN/HR ONLY)
router.delete('/:id', requireAdmin, experienceLetterController.deleteLetter);

module.exports = router;
