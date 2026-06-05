// routes/declarationFormRoutes.js
const express = require('express');
const router = express.Router();
const declarationFormController = require('./declarationFormController');
const authMiddleware = require('../../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== EMPLOYEE SELF-SERVICE ROUTES ====================

// POST /api/declaration-form - Save or update Declaration Form (EMPLOYEE)
router.post('/', declarationFormController.saveDeclarationForm);

// GET /api/declaration-form/all/:company_id - Get all Declaration Forms (ADMIN ONLY)
router.get('/all/:company_id', authMiddleware.verifyToken, declarationFormController.getAllDeclarationForms);

// GET /api/declaration-form/:id - Get single Declaration Form (ADMIN OR OWNER)
router.get('/:id', declarationFormController.getDeclarationFormById);

// DELETE /api/declaration-form/:id - Delete Declaration Form (ADMIN ONLY)
router.delete('/:id', authMiddleware.verifyToken, declarationFormController.deleteDeclarationForm);

module.exports = router;