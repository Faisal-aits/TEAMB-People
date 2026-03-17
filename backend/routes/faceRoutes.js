// backend/routes/faceRoutes.js
const express = require('express');
const multer = require('multer');
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Face validation endpoint
router.post('/validate', upload.single('faceImage'), employeeController.validateFace);

module.exports = router;