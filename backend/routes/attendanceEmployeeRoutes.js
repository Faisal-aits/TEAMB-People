// backend/routes/attendanceEmployeeRoutes.js
const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const multer = require('multer');
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Add this route
router.post(
    '/verify-face', 
    upload.single('faceImage'), // Handle file upload
    attendanceController.verifyMyFaceAndMarkAttendance
);

// Employee-specific routes
router.get('/today', attendanceController.getMyTodayAttendance);
router.get('/history', attendanceController.getMyHistory);
router.post('/mark', attendanceController.markMyAttendance);


module.exports = router;