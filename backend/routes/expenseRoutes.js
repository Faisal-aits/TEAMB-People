// backend/routes/expenseRoutes.js
const express = require('express');
const multer = require('multer');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for expense images (using memory storage as in your server.js)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// All routes are protected
router.use(authMiddleware.verifyToken);

// GET /api/expenses - Get all expenses (role-based)
router.get('/', expenseController.getAllExpenses);

// GET /api/expenses/categories - Get expense categories
router.get('/categories', expenseController.getCategories);

// GET /api/expenses/my - Get current user's expenses
router.get('/my', expenseController.getMyExpenses);

// GET /api/expenses/:id - Get specific expense
router.get('/:id', expenseController.getExpense);

// POST /api/expenses - Submit new expense (with image upload)
router.post('/', upload.single('image'), expenseController.submitExpense);

// PUT /api/expenses/:id/status - Approve/Reject expense
router.put('/:id/status', expenseController.updateExpenseStatus);

// PUT /api/expenses/:id/payment-status - Update payment status
router.put('/:id/payment-status', expenseController.updatePaymentStatus);

module.exports = router;