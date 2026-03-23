// routes/experienceLetterRoutes.js
const express = require('express');
const router = express.Router();
const experienceLetterController = require('../controllers/experienceLetterController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

router.get('/my', experienceLetterController.getMyLetters);

router.post('/', authMiddleware.requireRole(['admin', 'hr_manager']), experienceLetterController.uploadPDFMiddleware, experienceLetterController.generateLetter);
router.get('/', authMiddleware.requireRole(['admin', 'hr_manager']), experienceLetterController.getAllLetters);
router.get('/:id', experienceLetterController.getLetterById);
router.delete('/:id', authMiddleware.requireRole(['admin', 'hr_manager']), experienceLetterController.deleteLetter);

module.exports = router;
