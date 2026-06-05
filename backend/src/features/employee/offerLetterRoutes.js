const express = require('express');
const router = express.Router();
const offerLetterController = require('./offerLetterController');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

// HR: save or update letter
router.post('/', verifyToken, requireAdmin, offerLetterController.saveOfferLetter);

// Employee: get my letter
router.get('/my', verifyToken, offerLetterController.getMyOfferLetters);

// HR: get all letters for tracking
router.get('/all', verifyToken, requireAdmin, offerLetterController.getAllOfferLetters);

// HR: update letter status, and create employee when accepted
router.put('/:id/status', verifyToken, requireAdmin, offerLetterController.updateOfferStatus);

module.exports = router;
