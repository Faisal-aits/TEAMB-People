const express = require('express');
const router = express.Router();
const declarationFormController = require('../controllers/declarationFormController');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Save or update Declaration Form
router.post('/', declarationFormController.saveDeclarationForm);

// Get all Declaration Forms for a company
router.get('/all/:company_id', declarationFormController.getAllDeclarationForms);

// Get single Declaration Form by ID
router.get('/:id', declarationFormController.getDeclarationFormById);

// Delete Declaration Form
router.delete('/:id', declarationFormController.deleteDeclarationForm);

module.exports = router;