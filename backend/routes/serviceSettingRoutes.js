// backend/routes/serviceSettingRoutes.js
const express = require('express');
const serviceSettingController = require('../controllers/serviceSettingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// ==================== BANK DETAILS ROUTES ====================
// GET /api/service-settings/bank - Get bank details
router.get('/bank', serviceSettingController.getBankDetails);

// PUT /api/service-settings/bank - Update bank details
router.put('/bank', serviceSettingController.updateBankDetails);

// ==================== GST DETAILS ROUTES ====================
// GET /api/service-settings/gst - Get GST details
router.get('/gst', serviceSettingController.getGstDetails);

// PUT /api/service-settings/gst - Update GST details
router.put('/gst', serviceSettingController.updateGstDetails);

// ==================== Newly added 6/2/26 ====================
// GET /api/service-settings/quotation - Get settings for quotation
router.get('/quotation', serviceSettingController.getQuotationSettings);

// ==================== SMTP SETTINGS ROUTES ====================
// GET /api/service-settings/smtp - Get SMTP details
router.get('/smtp', serviceSettingController.getSmtpDetails);

// PUT /api/service-settings/smtp - Update SMTP details
router.put('/smtp', serviceSettingController.updateSmtpDetails);

module.exports = router;