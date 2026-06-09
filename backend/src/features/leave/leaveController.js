// backend/src/features/leave/leaveController.js
const fs = require('fs');
const path = require('path');
const Leave = require('./leaveModel');
const { pool } = require('../../config/db'); 

const leaveController = {
    // Get all leave requests (admin)
    getAllLeaves: async (req, res) => {
        try {
            const filters = {
                status: req.query.status || 'all',
                leave_type: req.query.leave_type || 'all'
            };

            const leaveData = await Leave.getAll(req.tenantId, filters);
            const stats = await Leave.getStatistics(req.tenantId);

            res.json({
                leaves: leaveData,
                statistics: stats
            });
        } catch (error) {
            console.error('Get leaves error:', error);
            res.status(500).json({ message: 'Server error while fetching leave data' });
        }
    },

    // Get current user's leaves
    getMyLeaves: async (req, res) => {
        try {
            const user_id = req.user.id;

            // Find employee_id first
            const [employeeRows] = await pool.execute(
                `SELECT ed.id as employee_id 
                FROM employee_details ed 
                WHERE ed.employee_id = ?`,
                [user_id]
            );

            if (employeeRows.length === 0) {
                return res.status(400).json({ message: 'Employee record not found' });
            }

            const employee_id = employeeRows[0].employee_id;
            const leaves = await Leave.getByEmployeeId(req.tenantId, employee_id);
          
            res.json({
                leaves: leaves || [],
                employee_id: employee_id
            });
        } catch (error) {
            console.error('Get my leaves error:', error);
            res.status(500).json({ message: 'Server error while fetching your leaves' });
        }
    },

    // Create new leave request
    createLeave: async (req, res) => {
        try {
            const { description, start_date, end_date, leave_type } = req.body;
            const user_id = req.user.id;

            const [employeeRows] = await pool.execute(
                `SELECT ed.id as employee_id 
                FROM employee_details ed 
                WHERE ed.employee_id = ?`,
                [user_id]
            );

            if (employeeRows.length === 0) {
                return res.status(400).json({
                    message: 'Employee record not found. Please contact administrator.'
                });
            }

            const employee_id = employeeRows[0].employee_id;
            
            if (!description || !start_date || !end_date) {
                return res.status(400).json({ message: 'Description, start date, and end date are required' });
            }

            if (new Date(start_date) > new Date(end_date)) {
                return res.status(400).json({ message: 'End date cannot be before start date' });
            }

            // Handle optional medical document upload
            let documentPath = null;
            if (req.file) {
                const ext = path.extname(req.file.originalname).toLowerCase();
                const fileName = `leave_${Date.now()}_${employee_id}${ext}`;
                const uploadDir = path.join(__dirname, '../../../uploads/leave-documents');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const filePath = path.join(uploadDir, fileName);
                fs.writeFileSync(filePath, req.file.buffer);
                documentPath = `uploads/leave-documents/${fileName}`;
            }

            const leaveId = await Leave.create(req.tenantId, {
                employee_id,
                leave_type: leave_type || 'Casual',
                description,
                start_date,
                end_date,
                medical_document: documentPath
            });

            res.status(201).json({
                message: 'Leave request submitted successfully!',
                leave_id: leaveId
            });
        } catch (error) {
            console.error('Create leave error:', error);
            res.status(400).json({ message: error.message || 'Server error while creating leave request' });
        }
    },

    // Stream / view medical document (admin only)
    getDocument: async (req, res) => {
        try {
            const { leaveId } = req.params;
            const [rows] = await pool.execute(
                'SELECT medical_document FROM leave_requests WHERE leave_id = ? AND tenant_id = ?',
                [leaveId, req.tenantId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Leave request not found' });
            }

            const docPath = rows[0].medical_document;
            if (!docPath) {
                return res.status(404).json({ message: 'No document attached to this leave request' });
            }

            const absolutePath = path.join(__dirname, '../../../', docPath);
            if (!fs.existsSync(absolutePath)) {
                return res.status(404).json({ message: 'Document file not found on server' });
            }

            const ext = path.extname(absolutePath).toLowerCase();
            const mimeMap = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
            res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename="medical_doc_leave${leaveId}${ext}"`);
            fs.createReadStream(absolutePath).pipe(res);
        } catch (error) {
            console.error('Get document error:', error);
            res.status(500).json({ message: 'Server error while fetching document' });
        }
    },


    // Get employee attendance history
    getEmployeeAttendanceHistory: async (req, res) => {
        try {
            const { employeeId } = req.params;

            const history = await Leave.getEmployeeAttendanceHistory(req.tenantId, employeeId);
            const stats = await Leave.getEmployeeAttendanceStats(req.tenantId, employeeId);

            res.json({
                history: history,
                statistics: stats
            });
        } catch (error) {
            console.error('Get employee attendance history error:', error);
            res.status(500).json({ message: 'Server error while fetching employee attendance history' });
        }
    },

    // Approve leave request
    approveLeave: async (req, res) => {
        try {
            const { leaveId } = req.params;
            const user_id = req.user.id;

            const [adminEmployeeRows] = await pool.execute(
                `SELECT ed.id as employee_id 
                 FROM employee_details ed 
                 WHERE ed.employee_id = ?`,
                [user_id]
            );

            const approved_by = adminEmployeeRows.length > 0
                ? adminEmployeeRows[0].employee_id
                : null;

            await Leave.approve(req.tenantId, leaveId, approved_by);

            res.json({ message: 'Leave approved successfully!' });
        } catch (error) {
            console.error('Approve leave error:', error);
            res.status(500).json({ message: error.message || 'Server error while approving leave' });
        }
    },

    // Reject leave request
    rejectLeave: async (req, res) => {
        try {
            const { leaveId } = req.params;
            const user_id = req.user.id;

            const [adminEmployeeRows] = await pool.execute(
                `SELECT ed.id as employee_id 
                 FROM employee_details ed 
                 WHERE ed.employee_id = ?`,
                [user_id]
            );

            const approved_by = adminEmployeeRows.length > 0
                ? adminEmployeeRows[0].employee_id
                : null;

            await Leave.reject(req.tenantId, leaveId, approved_by);

            res.json({ message: 'Leave rejected successfully!' });
        } catch (error) {
            console.error('Reject leave error:', error);
            res.status(500).json({ message: error.message || 'Server error while rejecting leave' });
        }
    },

    // Delete leave request
    deleteLeave: async (req, res) => {
        try {
            const { leaveId } = req.params;

            await Leave.delete(req.tenantId, leaveId);

            res.json({ message: 'Leave request deleted successfully!' });
        } catch (error) {
            console.error('Delete leave error:', error);
            res.status(500).json({ message: error.message || 'Server error while deleting leave' });
        }
    },

    // Get stats
    getLeaveStats: async (req, res) => {
        try {
            const stats = await Leave.getStatistics(req.tenantId);
            res.json({ 
                statistics: {
                    total: stats?.total || 0,
                    pending: stats?.pending || 0,
                    approved: stats?.approved || 0,
                    rejected: stats?.rejected || 0
                }
            });
        } catch (error) {
            console.error('Get leave stats error:', error);
            res.json({ statistics: { total: 0, pending: 0, approved: 0, rejected: 0 } });
        }
    },

    // Get all leave types for settings/drop-downs
    getLeaveTypes: async (req, res) => {
        try {
            const types = await Leave.getLeaveTypes(req.tenantId);
            res.json({ success: true, leave_types: types });
        } catch (error) {
            console.error('Get leave types error:', error);
            res.status(500).json({ message: 'Server error while fetching leave types' });
        }
    },

    // Get all leave types for HR policy settings
    getLeaveTypeSettings: async (req, res) => {
        try {
            const types = await Leave.getLeaveTypesForSettings(req.tenantId);
            res.json({ success: true, leave_types: types });
        } catch (error) {
            console.error('Get leave type settings error:', error);
            res.status(500).json({ message: 'Server error while fetching leave type settings' });
        }
    },

    // Create a leave type from HR policy settings
    createLeaveType: async (req, res) => {
        try {
            const leaveTypeId = await Leave.createLeaveType(req.tenantId, req.body);
            res.status(201).json({
                success: true,
                message: 'Leave type created successfully',
                leave_type_id: leaveTypeId
            });
        } catch (error) {
            console.error('Create leave type error:', error);
            res.status(400).json({ message: error.message || 'Server error while creating leave type' });
        }
    },

    // Update HR-configurable leave type values
    updateLeaveType: async (req, res) => {
        try {
            await Leave.updateLeaveType(req.tenantId, req.params.typeId, req.body);
            res.json({ success: true, message: 'Leave type updated successfully' });
        } catch (error) {
            console.error('Update leave type error:', error);
            res.status(400).json({ message: error.message || 'Server error while updating leave type' });
        }
    },

    // Get leave balances for a specific employee (admin use)
    getLeaveBalances: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const year = req.query.year || new Date().getFullYear();
            const balances = await Leave.getBalances(req.tenantId, employeeId, year);
            res.json({ success: true, balances });
        } catch (error) {
            console.error('Get leave balances error:', error);
            res.status(500).json({ message: 'Server error while fetching leave balances' });
        }
    },

    // Get leave balances for the logged-in employee (self use)
    getMyBalances: async (req, res) => {
        try {
            const user_id = req.user.id;
            const [employeeRows] = await pool.execute(
                `SELECT ed.id as employee_id 
                FROM employee_details ed 
                WHERE ed.employee_id = ?`,
                [user_id]
            );

            if (employeeRows.length === 0) {
                return res.status(400).json({ message: 'Employee record not found' });
            }

            const employee_id = employeeRows[0].employee_id;
            const year = req.query.year || new Date().getFullYear();
            const balances = await Leave.getBalances(req.tenantId, employee_id, year);

            res.json({ success: true, balances });
        } catch (error) {
            console.error('Get my balances error:', error);
            res.status(500).json({ message: 'Server error while fetching your balances' });
        }
    }
};

module.exports = leaveController;
