// backend/models/leaveModel.js
const { pool } = require('../../config/db');

const Leave = {
    // Default leave types setup
    DEFAULT_LEAVE_TYPES: [
        { name: 'Casual', max_days: 10, is_paid: 1 },
        { name: 'Sick', max_days: 10, is_paid: 1 },
        { name: 'Earned', max_days: 15, is_paid: 1 },
        { name: 'Maternity', max_days: 90, is_paid: 1 },
        { name: 'Unpaid', max_days: 365, is_paid: 0 }
    ],

    // Initialize default leave types for a tenant if not present
    initLeaveTypes: async (connection, tenantId) => {
        try {
            const [rows] = await connection.execute(
                'SELECT COUNT(*) as count FROM leave_types WHERE tenant_id = ?',
                [tenantId]
            );
            if (rows[0].count === 0) {
                for (const type of Leave.DEFAULT_LEAVE_TYPES) {
                    await connection.execute(
                        'INSERT INTO leave_types (tenant_id, name, max_days, is_paid) VALUES (?, ?, ?, ?)',
                        [tenantId, type.name, type.max_days, type.is_paid]
                    );
                }
            }
        } catch (error) {
            console.error('Error initializing leave types:', error);
            throw error;
        }
    },

    // Initialize leave balances for an employee for a specific year
    initBalances: async (connection, tenantId, employeeId, year) => {
        try {
            // First, make sure leave types exist for this tenant
            await Leave.initLeaveTypes(connection, tenantId);

            // Fetch the leave types
            const [leaveTypes] = await connection.execute(
                'SELECT name, max_days FROM leave_types WHERE tenant_id = ? AND is_active = 1',
                [tenantId]
            );

            // Check if balances already exist for this year
            const [existingBalances] = await connection.execute(
                'SELECT leave_type FROM leave_balances WHERE tenant_id = ? AND employee_id = ? AND year = ?',
                [tenantId, employeeId, year]
            );
            const existingTypes = new Set(existingBalances.map(b => b.leave_type));

            // Determine if there are previous year's balances to calculate carry-forward
            const prevYear = year - 1;
            const [prevBalances] = await connection.execute(
                'SELECT leave_type, allocated, used FROM leave_balances WHERE tenant_id = ? AND employee_id = ? AND year = ?',
                [tenantId, employeeId, prevYear]
            );
            const prevBalancesMap = new Map(prevBalances.map(b => [b.leave_type, b]));

            for (const type of leaveTypes) {
                if (!existingTypes.has(type.name)) {
                    let allocated = type.max_days;
                    
                    // Q3 Carry Forward: carry over unused Earned leaves to next year with a cap of 10 days
                    if (type.name === 'Earned' && prevBalancesMap.has('Earned')) {
                        const prevEarned = prevBalancesMap.get('Earned');
                        const unused = Math.max(0, prevEarned.allocated - prevEarned.used);
                        const carryForward = Math.min(10, unused); // Cap at 10 days
                        allocated += carryForward;
                    }

                    await connection.execute(
                        `INSERT INTO leave_balances (tenant_id, employee_id, leave_type, year, allocated, used, pending) 
                         VALUES (?, ?, ?, ?, ?, 0, 0)`,
                        [tenantId, employeeId, type.name, year, allocated]
                    );
                }
            }
        } catch (error) {
            console.error('Error initializing leave balances:', error);
            throw error;
        }
    },

    // Get active leave types
    getLeaveTypes: async (tenantId) => {
        try {
            const connection = await pool.getConnection();
            try {
                await Leave.initLeaveTypes(connection, tenantId);
                const [rows] = await connection.execute(
                    'SELECT id, name, max_days, is_paid, is_active FROM leave_types WHERE tenant_id = ? AND is_active = 1',
                    [tenantId]
                );
                return rows;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error in Leave.getLeaveTypes:', error);
            throw error;
        }
    },

    // Get balances for an employee
    getBalances: async (tenantId, employeeId, year) => {
        try {
            const connection = await pool.getConnection();
            try {
                await Leave.initBalances(connection, tenantId, employeeId, year);
                const [rows] = await connection.execute(
                    `SELECT leave_type, allocated, used, pending, (allocated - used - pending) as remaining 
                     FROM leave_balances 
                     WHERE tenant_id = ? AND employee_id = ? AND year = ?`,
                    [tenantId, employeeId, year]
                );
                return rows;
            } finally {
                connection.release();
            }
        } catch (error) {
            console.error('Error in Leave.getBalances:', error);
            throw error;
        }
    },

    // Check if dates overlap with existing approved/pending leave requests
    checkOverlap: async (tenantId, employeeId, startDate, endDate, excludeLeaveId = null) => {
        try {
            let sql = `
                SELECT leave_id, start_date, end_date, status 
                FROM leave_requests 
                WHERE tenant_id = ? AND employee_id = ? AND status IN ('Pending', 'Approved')
                  AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
            `;
            const params = [tenantId, employeeId, endDate, startDate, startDate, endDate];
            
            if (excludeLeaveId) {
                sql += ' AND leave_id != ?';
                params.push(excludeLeaveId);
            }

            const [rows] = await pool.execute(sql, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in Leave.checkOverlap:', error);
            throw error;
        }
    },

    // Create new leave request with balance verification and overlap check
    create: async (tenantId, leaveData) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { employee_id, leave_type, description, start_date, end_date } = leaveData;
            const year = new Date(start_date).getFullYear();

            // 1. Check for overlapping dates
            const isOverlapping = await Leave.checkOverlap(tenantId, employee_id, start_date, end_date);
            if (isOverlapping) {
                throw new Error('Overlapping leave request already exists for these dates');
            }

            // Calculate total days
            const start = new Date(start_date);
            const end = new Date(end_date);
            const total_days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

            // 2. Initialize and verify leave balances
            await Leave.initBalances(connection, tenantId, employee_id, year);

            // Fetch current balance for the selected type
            const [balanceRows] = await connection.execute(
                `SELECT allocated, used, pending 
                 FROM leave_balances 
                 WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = ?`,
                [tenantId, employee_id, leave_type, year]
            );

            if (balanceRows.length > 0 && leave_type !== 'Unpaid') {
                const balance = balanceRows[0];
                const remaining = balance.allocated - balance.used - balance.pending;
                if (remaining < total_days) {
                    throw new Error(`Insufficient leave balance. Remaining: ${remaining} days, Requested: ${total_days} days.`);
                }
            }

            // 3. Insert leave request
            const [result] = await connection.execute(
                `INSERT INTO leave_requests (tenant_id, employee_id, leave_type, description, start_date, end_date, medical_document, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                [tenantId, employee_id, leave_type, description, start_date, end_date, leaveData.medical_document || null]
            );

            // 4. Update pending balance
            if (leave_type !== 'Unpaid') {
                await connection.execute(
                    `UPDATE leave_balances 
                     SET pending = pending + ? 
                     WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = ?`,
                    [total_days, tenantId, employee_id, leave_type, year]
                );
            }

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            console.error('Error in Leave.create:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get leaves by employee ID
    getByEmployeeId: async (tenantId, employeeId) => {
        try {
            const query = `
                SELECT 
                    lr.leave_id,
                    lr.employee_id,
                    lr.leave_type,
                    lr.description,
                    lr.start_date,
                    lr.end_date,
                    DATEDIFF(lr.end_date, lr.start_date) + 1 as total_days,
                    lr.status,
                    lr.approved_by,
                    lr.approved_at,
                    lr.created_at,
                    lr.updated_at,
                    CASE WHEN lr.medical_document IS NOT NULL THEN 1 ELSE 0 END as has_document
                FROM leave_requests lr
                WHERE lr.employee_id = ? AND lr.tenant_id = ?
                ORDER BY lr.created_at DESC
            `;
            
            const [rows] = await pool.execute(query, [employeeId, tenantId]);
            return rows;
        } catch (error) {
            console.error('Error in Leave.getByEmployeeId:', error);
            throw error;
        }
    },

    // Get all leave requests (for admin)
    getAll: async (tenantId, filters = {}) => {
        try {
            let query = `
                SELECT 
                    lr.leave_id,
                    lr.employee_id,
                    ed.id as employee_code,
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    lr.leave_type,
                    lr.description,
                    lr.start_date,
                    lr.end_date,
                    DATEDIFF(lr.end_date, lr.start_date) + 1 as total_days,
                    lr.status,
                    lr.approved_by,
                    DATE_FORMAT(lr.approved_at, '%Y-%m-%d %h:%i %p') as approved_at,
                    lr.created_at,
                    CASE WHEN lr.medical_document IS NOT NULL THEN 1 ELSE 0 END as has_document
                FROM leave_requests lr
                JOIN employee_details ed ON lr.employee_id = ed.id
                JOIN users u ON ed.employee_id = u.id
                WHERE lr.tenant_id = ?
            `;
            
            const params = [tenantId];

            if (filters.status && filters.status !== 'all') {
                query += ' AND lr.status = ?';
                params.push(filters.status);
            }

            if (filters.leave_type && filters.leave_type !== 'all') {
                query += ' AND lr.leave_type = ?';
                params.push(filters.leave_type);
            }

            query += ' ORDER BY lr.created_at DESC, FIELD(lr.status, "Pending", "Approved", "Rejected")';

            const [rows] = await pool.execute(query, params);
            return rows || [];
        } catch (error) {
            console.error('Error in Leave.getAll:', error);
            return [];
        }
    },

    // Get leave statistics
    getStatistics: async (tenantId) => {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
                FROM leave_requests
                WHERE tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [tenantId]);
            return rows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        } catch (error) {
            console.error('Error in Leave.getStatistics:', error);
            return { total: 0, pending: 0, approved: 0, rejected: 0 };
        }
    },

    // Get employee attendance history for leave context
    getEmployeeAttendanceHistory: async (tenantId, employeeId) => {
        try {
            const query = `
                SELECT 
                    ah.history_id,
                    ah.employee_id,
                    ah.date,
                    ah.description,
                    ah.status,
                    DATE_FORMAT(ah.created_at, '%Y-%m-%d') as created_date
                FROM attendance_history ah
                WHERE ah.employee_id = ? AND ah.tenant_id = ?
                ORDER BY ah.date DESC
                LIMIT 30
            `;
            
            const [rows] = await pool.execute(query, [employeeId, tenantId]);
            return rows;
        } catch (error) {
            console.error('Error in Leave.getEmployeeAttendanceHistory:', error);
            throw error;
        }
    },

    // Get employee attendance statistics
    getEmployeeAttendanceStats: async (tenantId, employeeId) => {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as \`delayed\`,
                    SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave
                FROM attendance_history 
                WHERE employee_id = ? AND tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId, tenantId]);
            return rows[0] || { total: 0, present: 0, delayed: 0, on_leave: 0 };
        } catch (error) {
            console.error('Error in Leave.getEmployeeAttendanceStats:', error);
            throw error;
        }
    },

    // Approve leave request (single-level approval by any HR admin)
    approve: async (tenantId, leaveId, approvedBy) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Fetch the leave request details first
            const [leave] = await connection.execute(
                `SELECT employee_id, leave_type, start_date, end_date, description, status 
                 FROM leave_requests 
                 WHERE leave_id = ? AND tenant_id = ?`,
                [leaveId, tenantId]
            );

            if (leave.length === 0) {
                throw new Error('Leave request not found');
            }

            const { employee_id, leave_type, start_date, end_date, description, status } = leave[0];

            if (status !== 'Pending') {
                throw new Error('Leave request is already processed');
            }

            // Update leave status
            await connection.execute(
                `UPDATE leave_requests 
                 SET status = 'Approved', approved_by = ?, approved_at = NOW() 
                 WHERE leave_id = ? AND tenant_id = ?`,
                [approvedBy, leaveId, tenantId]
            );

            // Calculate duration
            const start = new Date(start_date);
            const end = new Date(end_date);
            const total_days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
            const year = start.getFullYear();

            // Update balances: subtract from pending and add to used
            if (leave_type !== 'Unpaid') {
                await connection.execute(
                    `UPDATE leave_balances 
                     SET pending = pending - ?, used = used + ? 
                     WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = ?`,
                    [total_days, total_days, tenantId, employee_id, leave_type, year]
                );
            }

            // Helper to format local date
            const formatDateLocal = (date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };
            
            // Add to attendance history for each day of leave
            let currentDate = new Date(start_date);
            const lastDate = new Date(end_date);
            
            while (currentDate <= lastDate) {
                const dateStr = formatDateLocal(currentDate);
                
                await connection.execute(
                    `INSERT INTO attendance_history (tenant_id, employee_id, date, description, status)
                     VALUES (?, ?, ?, ?, 'On Leave')
                     ON DUPLICATE KEY UPDATE description = VALUES(description), status = VALUES(status)`,
                    [tenantId, employee_id, dateStr, description || `${leave_type} Leave`]
                );
                
                currentDate.setDate(currentDate.getDate() + 1);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error in Leave.approve:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Reject leave request
    reject: async (tenantId, leaveId, approvedBy) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const [leave] = await connection.execute(
                `SELECT employee_id, leave_type, start_date, end_date, status 
                 FROM leave_requests 
                 WHERE leave_id = ? AND tenant_id = ?`,
                [leaveId, tenantId]
            );

            if (leave.length === 0) {
                throw new Error('Leave request not found');
            }

            const { employee_id, leave_type, start_date, end_date, status } = leave[0];

            if (status !== 'Pending') {
                throw new Error('Leave request is already processed');
            }

            // Update leave status
            await connection.execute(
                `UPDATE leave_requests 
                 SET status = 'Rejected', approved_by = ?, approved_at = NOW() 
                 WHERE leave_id = ? AND tenant_id = ?`,
                [approvedBy, leaveId, tenantId]
            );

            // Calculate duration
            const start = new Date(start_date);
            const end = new Date(end_date);
            const total_days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
            const year = start.getFullYear();

            // Release pending balance
            if (leave_type !== 'Unpaid') {
                await connection.execute(
                    `UPDATE leave_balances 
                     SET pending = pending - ? 
                     WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = ?`,
                    [total_days, tenantId, employee_id, leave_type, year]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error in Leave.reject:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Delete leave request (if approved, restore used balance and clean attendance history)
    delete: async (tenantId, leaveId) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [leave] = await connection.execute(
                `SELECT employee_id, leave_type, start_date, end_date, status 
                 FROM leave_requests 
                 WHERE leave_id = ? AND tenant_id = ?`,
                [leaveId, tenantId]
            );

            if (leave.length === 0) {
                throw new Error('Leave request not found');
            }

            const { employee_id, leave_type, start_date, end_date, status } = leave[0];

            const start = new Date(start_date);
            const end = new Date(end_date);
            const total_days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
            const year = start.getFullYear();

            // Restore balance depending on current status
            if (leave_type !== 'Unpaid') {
                if (status === 'Pending') {
                    await connection.execute(
                        `UPDATE leave_balances 
                         SET pending = pending - ? 
                         WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = ?`,
                        [total_days, tenantId, employee_id, leave_type, year]
                    );
                } else if (status === 'Approved') {
                    await connection.execute(
                        `UPDATE leave_balances 
                         SET used = used - ? 
                         WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND year = ?`,
                        [total_days, tenantId, employee_id, leave_type, year]
                    );
                }
            }

            // If approved, delete matching entries in attendance history
            if (status === 'Approved') {
                // Helper to format local date
                const formatDateLocal = (date) => {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                };

                let currentDate = new Date(start_date);
                const lastDate = new Date(end_date);

                while (currentDate <= lastDate) {
                    const dateStr = formatDateLocal(currentDate);
                    await connection.execute(
                        `DELETE FROM attendance_history 
                         WHERE tenant_id = ? AND employee_id = ? AND date = ? AND status = 'On Leave'`,
                        [tenantId, employee_id, dateStr]
                    );
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }

            // Delete leave request row
            await connection.execute(
                'DELETE FROM leave_requests WHERE leave_id = ? AND tenant_id = ?',
                [leaveId, tenantId]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error in Leave.delete:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get leave request by ID
    getById: async (tenantId, leaveId) => {
        try {
            const query = `
                SELECT 
                    lr.leave_id,
                    lr.employee_id,
                    ed.id as employee_code,
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    lr.leave_type,
                    lr.description,
                    lr.start_date,
                    lr.end_date,
                    DATEDIFF(lr.end_date, lr.start_date) + 1 as total_days,
                    lr.status,
                    lr.approved_by,
                    lr.approved_at,
                    lr.created_at
                FROM leave_requests lr
                JOIN employee_details ed ON lr.employee_id = ed.id
                JOIN users u ON ed.employee_id = u.id
                WHERE lr.leave_id = ? AND lr.tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [leaveId, tenantId]);
            return rows[0];
        } catch (error) {
            console.error('Error in Leave.getById:', error);
            throw error;
        }
    }
};

module.exports = Leave;
