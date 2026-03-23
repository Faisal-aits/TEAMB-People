// backend/routes/shiftRoutes.js
const express = require('express');
const shiftController = require('../controllers/shiftController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// GET /api/shifts - Get all shifts
router.get('/', shiftController.getAllShifts);

// GET /api/shifts/default - Get default shift
router.get('/default', shiftController.getDefaultShift);

// GET /api/shifts/employees - Get available employees
router.get('/employees', async (req, res) => {
    try {
        const Shift = require('../models/shiftModel');
        const employees = await Shift.getAvailableEmployees(req.tenantId);
        res.json({
            employees: employees,
            success: true
        });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            message: 'Server error while fetching employees',
            success: false
        });
    }
});

// GET /api/shifts/:shiftId - Get shift by ID
router.get('/:shiftId', shiftController.getShiftById);

// GET /api/shifts/:shiftId/employees - Get employees in shift
router.get('/:shiftId/employees', shiftController.getShiftEmployees);

// POST /api/shifts - Create new shift
router.post('/', shiftController.createShift);

// PUT /api/shifts/:shiftId - Update shift
router.put('/:shiftId', shiftController.updateShift);

// POST /api/shifts/:shiftId/set-default - Set shift as default
router.post('/:shiftId/set-default', shiftController.setShiftAsDefault);

// DELETE /api/shifts/:shiftId - Delete shift
router.delete('/:shiftId', shiftController.deleteShift);

module.exports = router;