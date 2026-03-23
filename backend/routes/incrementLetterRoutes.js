// routes/incrementLetterRoutes.js
const express = require('express');
const router = express.Router();
const incrementLetterController = require('../controllers/incrementLetterController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.use(authMiddleware.verifyToken);
router.use(tenantMiddleware.extractTenantId);

router.get('/my', incrementLetterController.getMyLetters);

router.post('/', authMiddleware.requireRole(['admin', 'hr_manager']), incrementLetterController.uploadPDFMiddleware, incrementLetterController.generateLetter);
router.get('/', authMiddleware.requireRole(['admin', 'hr_manager']), incrementLetterController.getAllLetters);
router.get('/:id', incrementLetterController.getLetterById);
router.delete('/:id', authMiddleware.requireRole(['admin', 'hr_manager']), incrementLetterController.deleteLetter);

module.exports = router;
