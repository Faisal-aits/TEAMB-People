// backend/routes/expenseRoutes.js
const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

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

// POST /api/expenses - Submit new expense
router.post('/', expenseController.submitExpense);

// PUT /api/expenses/:id/status - Approve/Reject expense
router.put('/:id/status', expenseController.updateExpenseStatus);

module.exports = router;