// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


const router = express.Router();

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/register
// @desc    Register new user (Admin only - we'll add middleware later)
// @access  Public (temporarily)
router.post('/register', authController.register);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware.verifyToken, authController.getProfile);

module.exports = router;