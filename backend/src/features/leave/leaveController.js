// backend/controllers/leaveController.js
const Leave = require('./leaveModel');
const { pool } = require('../../config/db'); 
const Notification = require('../notifications/notificationModel');

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
                WHERE ed.employee_id = ? AND ed.tenant_id = ?`,
                [user_id, req.tenantId]
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
                WHERE ed.employee_id = ? AND ed.tenant_id = ?`,
                [user_id, req.tenantId]
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

            const normType = String(leave_type || '').toUpperCase();
            const isPL = normType.startsWith('PL') || normType.includes('PRIVILEGE') || normType.includes('PLANNED');

            if (isPL) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const minAllowed = new Date(today);
                minAllowed.setDate(minAllowed.getDate() + 7);

                const reqStartDate = new Date(start_date);
                reqStartDate.setHours(0, 0, 0, 0);

                if (reqStartDate < minAllowed) {
                    return res.status(400).json({
                        message: 'PL (Paid Leave) must be requested at least 7 days (1 week) in advance.'
                    });
                }
            }

            const leaveId = await Leave.create(req.tenantId, {
                employee_id,
                leave_type: leave_type || 'Casual',
                description,
                start_date,
                end_date
            });

            // Notify admins about new leave request
            await Notification.notifyAdmins(req.tenantId, 'leave', 'New Leave Request', `A new ${leave_type || 'Casual'} leave request has been submitted for ${start_date} to ${end_date}.`, leaveId);

            res.status(201).json({
                message: 'Leave request submitted successfully!',
                leave_id: leaveId
            });
        } catch (error) {
            console.error('Create leave error:', error);
            res.status(400).json({ message: error.message || 'Server error while creating leave request' });
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
        const { category } = req.body;

        const [adminEmployeeRows] = await pool.execute(
          `SELECT ed.id as employee_id 
               FROM employee_details ed 
               WHERE ed.employee_id = ? AND ed.tenant_id = ?`,
          [user_id, req.tenantId]
        );

        const approved_by = adminEmployeeRows.length > 0
          ? adminEmployeeRows[0].employee_id
          : null;

        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // Fetch current leave data
          const [leaveRows] = await connection.execute(
            `SELECT leave_type FROM leave_requests WHERE leave_id = ? AND tenant_id = ?`,
            [leaveId, req.tenantId]
          );
          if (leaveRows.length === 0) {
            throw new Error('Leave request not found');
          }
          // Update leave_type if category provided and differs
          if (category && category !== leaveRows[0].leave_type) {
            await connection.execute(
              `UPDATE leave_requests SET leave_type = ? WHERE leave_id = ? AND tenant_id = ?`,
              [category, leaveId, req.tenantId]
            );
          }

          await Leave.approve(req.tenantId, leaveId, approved_by);

          // Notify the requesting employee
          const [leaveOwnerRows] = await connection.execute(
            `SELECT u.id as user_id FROM leave_requests lr JOIN employee_details ed ON ed.id = lr.employee_id JOIN users u ON u.id = ed.employee_id WHERE lr.leave_id = ? AND lr.tenant_id = ?`,
            [leaveId, req.tenantId]
          );
          if (leaveOwnerRows.length > 0) {
            await Notification.create(req.tenantId, leaveOwnerRows[0].user_id, 'leave', 'Leave Approved', `Your leave request has been approved.`, parseInt(leaveId));
          }

          await connection.commit();
          res.json({ message: 'Leave approved successfully!' });
        } catch (err) {
          await connection.rollback();
          throw err;
        } finally {
          connection.release();
        }
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
                 WHERE ed.employee_id = ? AND ed.tenant_id = ?`,
                [user_id, req.tenantId]
            );

            const approved_by = adminEmployeeRows.length > 0
                ? adminEmployeeRows[0].employee_id
                : null;

            await Leave.reject(req.tenantId, leaveId, approved_by);

            // Notify the requesting employee
            const [leaveOwnerRows] = await pool.execute(
              `SELECT u.id as user_id FROM leave_requests lr JOIN employee_details ed ON ed.id = lr.employee_id JOIN users u ON u.id = ed.employee_id WHERE lr.leave_id = ? AND lr.tenant_id = ?`,
              [leaveId, req.tenantId]
            );
            if (leaveOwnerRows.length > 0) {
              await Notification.create(req.tenantId, leaveOwnerRows[0].user_id, 'leave', 'Leave Rejected', `Your leave request has been rejected.`, parseInt(leaveId));
            }

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
            const user_id = req.user.id;
            const tenantId = req.tenantId;
            const Leave = require('./leaveModel');
            const { pool } = require('../../config/db');

            const leaveData = await Leave.getById(tenantId, leaveId);
            if (!leaveData) {
                return res.status(404).json({ message: 'Leave request not found' });
            }

            const [employeeRows] = await pool.execute(
                "SELECT ed.id as employee_id FROM employee_details ed WHERE ed.employee_id = ? AND ed.tenant_id = ?",
                [user_id, tenantId]
            );
            const userEmployeeId = employeeRows.length > 0 ? employeeRows[0].employee_id : null;

            const isOwner = userEmployeeId === leaveData.employee_code || userEmployeeId === leaveData.employee_id;

            if (!isOwner) {
                const [accessRows] = await pool.execute(
                    "SELECT can_write FROM user_module_access WHERE user_id = ? AND tenant_id = ? AND module_name = 'leave_management'",
                    [user_id, tenantId]
                );
                const hasAdminAccess = req.user.role === 'admin' || (accessRows.length > 0 && accessRows[0].can_write);
                
                if (!hasAdminAccess) {
                    return res.status(403).json({ message: 'Forbidden. You do not have permission to delete this leave.' });
                }
            } else {
                if (leaveData.status !== 'Pending') {
                    return res.status(400).json({ message: 'You can only delete pending leave requests.' });
                }
            }

            await Leave.delete(tenantId, leaveId);

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
                WHERE ed.employee_id = ? AND ed.tenant_id = ?`,
                [user_id, req.tenantId]
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
