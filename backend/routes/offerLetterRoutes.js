const express = require('express');
const router = express.Router();
const offerLetterController = require('../controllers/offerLetterController');
const { verifyToken } = require('../middleware/authMiddleware');

// HR: save or update letter
router.post('/', verifyToken, offerLetterController.saveOfferLetter);

// Employee: get my letter
router.get('/my', verifyToken, offerLetterController.getMyOfferLetters);

// HR: get all letters for tracking
router.get('/all', verifyToken, offerLetterController.getAllOfferLetters);

module.exports = router;
