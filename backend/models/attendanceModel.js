// backend/models/attendanceModel.js
const pool = require('../config/database');

// Helper function to calculate status based on check-in time and shift
const calculateStatus = (checkInTime, shiftCheckInTimeStr, date, gracePeriodMinutes = 15) => {
    const [hours, minutes, seconds] = shiftCheckInTimeStr.split(':');
    const shiftCheckInTime = new Date(date);
    shiftCheckInTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
    
    const gracePeriod = new Date(shiftCheckInTime.getTime() + gracePeriodMinutes * 60000);
    
    if (checkInTime > gracePeriod) {
        return 'Delayed';
    }
    
    return 'Present';
};

// Helper function to get late streak
async function getLateStreak(connection, tenantId, employeeId, currentDate) {
    try {
        const [rows] = await connection.execute(
            `SELECT status FROM tb_attendance 
             WHERE tenant_id = ? AND employee_id = ? 
             AND date < ? 
             ORDER BY date DESC 
             LIMIT 2`,
            [tenantId, employeeId, currentDate]
        );
        
        let streak = 0;
        for (const record of rows) {
            if (record.status === 'Delayed') {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    } catch (error) {
        console.error('Error calculating late streak:', error);
        return 0;
    }
}

// Helper function to check if employee should be marked half day
async function checkHalfDayStatus(connection, tenantId, employeeId, currentDate, currentStatus, checkInTime, checkOutTime) {
    try {
        // Check 1: If current status is Delayed and has 3 consecutive late days
        const lateStreak = await getLateStreak(connection, tenantId, employeeId, currentDate);
        
        if (currentStatus === 'Delayed' && lateStreak >= 2) {
            return { isHalfDay: true, reason: '3 consecutive late days' };
        }
        
        // Check 2: If worked hours are less than 4 hours
        if (checkInTime && checkOutTime) {
            const checkIn = new Date(checkInTime);
            const checkOut = new Date(checkOutTime);
            const workedHours = (checkOut - checkIn) / (1000 * 60 * 60);
            
            if (workedHours < 4 && workedHours > 0) {
                return { isHalfDay: true, reason: `Worked only ${workedHours.toFixed(1)} hours` };
            }
        }
        
        return { isHalfDay: false, reason: null };
    } catch (error) {
        console.error('Error checking half day status:', error);
        return { isHalfDay: false, reason: null };
    }
}

const Attendance = {
    // Get all attendance records for management
    getAll: async (tenantId, filters = {}) => {
        try {
            let query = `
                SELECT 
                    a.attendance_id,
                    a.employee_id,
                    ed.id as employee_code,
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    s.shift_name,
                    a.date,
                    DATE_FORMAT(a.check_in, '%h:%i %p') as check_in_time,
                    DATE_FORMAT(a.check_out, '%h:%i %p') as check_out_time,
                    a.status,
                    a.is_half_day,
                    a.late_streak,
                    a.worked_hours,
                    a.remarks,
                    a.approved_by,
                    DATE_FORMAT(a.approved_at, '%Y-%m-%d %h:%i %p') as approved_at,
                    a.created_at
                FROM tb_attendance a
                JOIN employee_details ed ON a.employee_id = ed.id
                JOIN users u ON ed.user_id = u.id
                LEFT JOIN tb_shifts s ON a.shift_id = s.shift_id
                WHERE ed.tenant_id = ?
            `;
            
            const params = [tenantId];

            if (filters.date) {
                query += ' AND a.date = ?';
                params.push(filters.date);
            } else {
                const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
                query += ' AND a.date = ?';
                params.push(today);
            }

            if (filters.status && filters.status !== 'all') {
                query += ' AND a.status = ?';
                params.push(filters.status);
            }

            query += ' ORDER BY a.date DESC, u.first_name, u.last_name';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error in Attendance.getAll:', error);
            throw error;
        }
    },

    // Get attendance statistics
getStatistics: async (tenantId, date = null) => {
    try {
        const targetDate = date || new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
        
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN a.status = 'Delayed' THEN 1 ELSE 0 END) as \`delayed\`,
                SUM(CASE WHEN a.status = 'Half Day' THEN 1 ELSE 0 END) as half_day,
                SUM(CASE WHEN a.status = 'On Leave' THEN 1 ELSE 0 END) as on_leave,
                SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN a.status = 'Pending' THEN 1 ELSE 0 END) as pending
            FROM tb_attendance a
            JOIN employee_details ed ON a.employee_id = ed.id
            WHERE a.date = ? AND ed.tenant_id = ?
        `;
        
        const [rows] = await pool.execute(query, [targetDate, tenantId]);
        return rows[0] || { total: 0, present: 0, delayed: 0, half_day: 0, on_leave: 0, absent: 0, pending: 0 };
    } catch (error) {
        console.error('Error in Attendance.getStatistics:', error);
        throw error;
    }
},

    // Get employee history
    getEmployeeHistory: async (tenantId, employeeId) => {
        try {
            const query = `
                SELECT 
                    a.attendance_id as history_id,
                    a.employee_id,
                    a.date,
                    CONCAT(
                        CASE 
                            WHEN a.remarks LIKE '%Face%' THEN 'Face verification - '
                            WHEN a.remarks LIKE '%Manual%' THEN 'Manual entry - '
                            ELSE ''
                        END,
                        a.status
                    ) as description,
                    a.status,
                    DATE_FORMAT(a.created_at, '%Y-%m-%d') as created_date,
                    TIME_FORMAT(a.check_in, '%H:%i') as check_in_time,
                    TIME_FORMAT(a.check_out, '%H:%i') as check_out_time,
                    a.is_half_day,
                    a.worked_hours,
                    a.remarks,
                    s.shift_name
                FROM tb_attendance a
                LEFT JOIN tb_shifts s ON a.shift_id = s.shift_id
                JOIN employee_details ed ON a.employee_id = ed.id
                WHERE a.employee_id = ? AND ed.tenant_id = ?
                
                UNION ALL
                
                SELECT 
                    ah.history_id,
                    ah.employee_id,
                    ah.date,
                    ah.description,
                    ah.status,
                    DATE_FORMAT(ah.created_at, '%Y-%m-%d') as created_date,
                    NULL as check_in_time,
                    NULL as check_out_time,
                    NULL as is_half_day,
                    NULL as worked_hours,
                    NULL as remarks,
                    NULL as shift_name
                FROM attendance_history ah
                JOIN employee_details ed2 ON ah.employee_id = ed2.id
                WHERE ah.employee_id = ? AND ed2.tenant_id = ?
                
                ORDER BY date DESC, created_date DESC
                LIMIT 50
            `;
            
            const [rows] = await pool.execute(query, [employeeId, tenantId, employeeId, tenantId]);
            return rows;
        } catch (error) {
            console.error('Error in Attendance.getEmployeeHistory:', error);
            throw error;
        }
    },
// Get employee history statistics
getEmployeeHistoryStats: async (tenantId, employeeId) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN ah.status = 'Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN ah.status = 'Delayed' THEN 1 ELSE 0 END) as \`delayed\`,
                SUM(CASE WHEN ah.status = 'On Leave' THEN 1 ELSE 0 END) as on_leave,
                SUM(CASE WHEN ah.status = 'Half Day' THEN 1 ELSE 0 END) as half_day
            FROM attendance_history ah
            JOIN employee_details ed ON ah.employee_id = ed.id
            WHERE ah.employee_id = ? AND ed.tenant_id = ?
        `;
        
        const [rows] = await pool.execute(query, [employeeId, tenantId]);
        return rows[0] || { total: 0, present: 0, delayed: 0, on_leave: 0, half_day: 0 };
    } catch (error) {
        console.error('Error in Attendance.getEmployeeHistoryStats:', error);
        throw error;
    }
},
    // Approve attendance
    approve: async (tenantId, attendanceId, approvedByEmployeeId) => {
        try {
            const [result] = await pool.execute(
                `UPDATE tb_attendance a 
                 JOIN employee_details ed ON a.employee_id = ed.id
                 SET a.status = "Present", a.approved_by = ?, a.approved_at = NOW() 
                 WHERE a.attendance_id = ? AND ed.tenant_id = ?`,
                [approvedByEmployeeId, attendanceId, tenantId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Attendance record not found or unauthorized');
            }

            return result;
        } catch (error) {
            console.error('Attendance model approve error:', error);
            throw error;
        }
    },

    // Reject attendance
    reject: async (tenantId, attendanceId, approvedByEmployeeId, remarks) => {
        try {
            const [result] = await pool.execute(
                `UPDATE tb_attendance a
                 JOIN employee_details ed ON a.employee_id = ed.id 
                 SET a.status = "Absent", a.remarks = ?, a.approved_by = ?, a.approved_at = NOW() 
                 WHERE a.attendance_id = ? AND ed.tenant_id = ?`,
                [remarks, approvedByEmployeeId, attendanceId, tenantId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Attendance record not found or unauthorized');
            }

            return result;
        } catch (error) {
            console.error('Attendance model reject error:', error);
            throw error;
        }
    },

    // Get all shifts
    getShifts: async (tenantId) => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM tb_shifts WHERE tenant_id = ? ORDER BY check_in_time',
                [tenantId]
            );
            return rows;
        } catch (error) {
            console.error('Error in Attendance.getShifts:', error);
            throw error;
        }
    },

    // Check if attendance record exists for employee on date
    checkExists: async (tenantId, employeeId, date) => {
        try {
            const [rows] = await pool.execute(
                `SELECT a.attendance_id FROM tb_attendance a
                 JOIN employee_details ed ON a.employee_id = ed.id
                 WHERE a.employee_id = ? AND a.date = ? AND ed.tenant_id = ?`,
                [employeeId, date, tenantId]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error in Attendance.checkExists:', error);
            throw error;
        }
    },

    // Create attendance with shift validation and half-day logic
    create: async (tenantId, attendanceData) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const eCheckQuery = 'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?';
            const [eCheck] = await connection.execute(eCheckQuery, [attendanceData.employee_id, tenantId]);
            if (eCheck.length === 0) throw new Error("Employee not found in tenant");

            // Get shift for the employee on this date
            const todayShiftQuery = `
                SELECT es.shift_id, s.check_in_time, s.check_out_time, s.shift_name, s.is_default, s.grace_period_minutes
                FROM tb_employee_shifts es 
                JOIN tb_shifts s ON es.shift_id = s.shift_id 
                WHERE es.employee_id = ? AND es.assigned_date = ? AND s.tenant_id = ?
                LIMIT 1
            `;
            
            let [shiftRows] = await connection.execute(todayShiftQuery, [
                attendanceData.employee_id, attendanceData.date, tenantId
            ]);
            
            let shiftId = null;
            let shiftCheckInTime = null;
            let shiftCheckOutTime = null;
            let gracePeriodMinutes = 15;
            
            if (shiftRows.length > 0) {
                shiftId = shiftRows[0].shift_id;
                shiftCheckInTime = shiftRows[0].check_in_time;
                shiftCheckOutTime = shiftRows[0].check_out_time;
                gracePeriodMinutes = shiftRows[0].grace_period_minutes || 15;
            } else {
                // Check employee default shift
                const [employeeDefault] = await connection.execute(
                    `SELECT ed.default_shift_id, s.check_in_time, s.check_out_time, s.grace_period_minutes
                     FROM employee_details ed
                     LEFT JOIN tb_shifts s ON ed.default_shift_id = s.shift_id
                     WHERE ed.id = ? AND ed.tenant_id = ?`,
                    [attendanceData.employee_id, tenantId]
                );
                
                if (employeeDefault.length > 0 && employeeDefault[0].default_shift_id) {
                    shiftId = employeeDefault[0].default_shift_id;
                    shiftCheckInTime = employeeDefault[0].check_in_time;
                    shiftCheckOutTime = employeeDefault[0].check_out_time;
                    gracePeriodMinutes = employeeDefault[0].grace_period_minutes || 15;
                } else {
                    // Get system default shift
                    const [systemDefault] = await connection.execute(
                        'SELECT shift_id, check_in_time, check_out_time, grace_period_minutes FROM tb_shifts WHERE is_default = TRUE AND tenant_id = ? LIMIT 1',
                        [tenantId]
                    );
                    
                    if (systemDefault.length > 0) {
                        shiftId = systemDefault[0].shift_id;
                        shiftCheckInTime = systemDefault[0].check_in_time;
                        shiftCheckOutTime = systemDefault[0].check_out_time;
                        gracePeriodMinutes = systemDefault[0].grace_period_minutes || 15;
                    } else {
                        const [firstShift] = await connection.execute(
                            'SELECT shift_id, check_in_time, check_out_time, grace_period_minutes FROM tb_shifts WHERE tenant_id = ? ORDER BY shift_id LIMIT 1',
                            [tenantId]
                        );
                        if (firstShift.length > 0) {
                            shiftId = firstShift[0].shift_id;
                            shiftCheckInTime = firstShift[0].check_in_time;
                            shiftCheckOutTime = firstShift[0].check_out_time;
                            gracePeriodMinutes = firstShift[0].grace_period_minutes || 15;
                        }
                    }
                }
            }

            if (!shiftId) {
                throw new Error('No shift available for assignment.');
            }

            // Calculate initial status based on check-in time
            let status = attendanceData.status || 'Present';
            let isLate = false;
            let lateMinutes = 0;
            let isHalfDay = false;
            let halfDayReason = null;
            
            if (attendanceData.check_in && shiftCheckInTime) {
                const checkInDateTime = new Date(attendanceData.check_in);
                const shiftTime = new Date(attendanceData.date);
                const [hours, minutes, seconds] = shiftCheckInTime.split(':');
                shiftTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
                
                const gracePeriod = new Date(shiftTime.getTime() + gracePeriodMinutes * 60000);
                
                if (checkInDateTime > gracePeriod) {
                    status = 'Delayed';
                    isLate = true;
                    lateMinutes = (checkInDateTime - shiftTime) / (1000 * 60);
                } else {
                    status = 'Present';
                }
            }
            
            // Calculate worked hours if check-out exists
            let workedHours = 0;
            if (attendanceData.check_in && attendanceData.check_out) {
                const checkIn = new Date(attendanceData.check_in);
                const checkOut = new Date(attendanceData.check_out);
                workedHours = (checkOut - checkIn) / (1000 * 60 * 60);
                
                // Check if worked hours are less than 4 (half day)
                if (workedHours < 4 && workedHours > 0) {
                    isHalfDay = true;
                    halfDayReason = `Worked only ${workedHours.toFixed(1)} hours`;
                    status = 'Half Day';
                }
            }
            
            // Check for 3 consecutive late days
            if (status === 'Delayed') {
                const lateStreak = await getLateStreak(connection, tenantId, attendanceData.employee_id, attendanceData.date);
                if (lateStreak >= 2) {
                    isHalfDay = true;
                    halfDayReason = '3 consecutive late days';
                    status = 'Half Day';
                }
            }

            // Insert attendance record
            const query = `
                INSERT INTO tb_attendance 
                (employee_id, shift_id, date, check_in, check_out, status, is_half_day, 
                 is_late, late_minutes, worked_hours, remarks, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const [result] = await connection.execute(query, [
                attendanceData.employee_id,
                shiftId,
                attendanceData.date,
                attendanceData.check_in || null,
                attendanceData.check_out || null,
                status,
                isHalfDay,
                isLate,
                lateMinutes,
                workedHours,
                attendanceData.remarks || (attendanceData.remarks?.includes('Face') ? 
                    `Face verified at ${new Date().toLocaleTimeString()}` : 
                    `Manual entry at ${new Date().toLocaleTimeString()}`)
            ]);

            // Add to history
            await connection.execute(
                `INSERT INTO attendance_history 
                 (employee_id, date, description, status, created_at) 
                 VALUES (?, ?, ?, ?, NOW())`,
                [
                    attendanceData.employee_id,
                    attendanceData.date,
                    halfDayReason ? `${status} - ${halfDayReason}` : `${status} - ${attendanceData.remarks || 'Regular attendance'}`,
                    status
                ]
            );

            await connection.commit();
            return { 
                attendance_id: result.insertId,
                shift_id: shiftId,
                status: status,
                is_half_day: isHalfDay,
                half_day_reason: halfDayReason,
                worked_hours: workedHours,
                ...attendanceData 
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error in Attendance.create:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get employee shift for specific date
    getEmployeeShiftForDate: async (tenantId, employeeId, date) => {
        try {
            const query = `
                SELECT 
                    s.shift_id,
                    s.shift_name,
                    TIME_FORMAT(s.check_in_time, '%H:%i') as check_in_time,
                    TIME_FORMAT(s.check_out_time, '%H:%i') as check_out_time,
                    s.grace_period_minutes,
                    es.assigned_date,
                    'assigned' as shift_type
                FROM tb_employee_shifts es
                JOIN tb_shifts s ON es.shift_id = s.shift_id
                JOIN employee_details ed ON es.employee_id = ed.id
                WHERE es.employee_id = ? AND es.assigned_date = ? AND ed.tenant_id = ?
                LIMIT 1
            `;
            
            const [rows] = await pool.execute(query, [employeeId, date, tenantId]);
            if (rows.length > 0) return rows[0];
            return null;
        } catch (error) {
            console.error('Error in Attendance.getEmployeeShiftForDate:', error);
            throw error;
        }
    },

    // Update check-out with half-day calculation
    updateCheckOut: async (tenantId, employeeId, date, checkOutTime) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Get existing attendance record
            const [attendance] = await connection.execute(
                `SELECT a.*, s.check_in_time, s.grace_period_minutes 
                 FROM tb_attendance a
                 JOIN tb_shifts s ON a.shift_id = s.shift_id
                 WHERE a.employee_id = ? AND a.date = ? AND a.tenant_id = ?`,
                [employeeId, date, tenantId]
            );
            
            if (attendance.length === 0) {
                throw new Error('Attendance record not found');
            }
            
            const record = attendance[0];
            const checkInTime = record.check_in;
            
            // Calculate worked hours
            const checkIn = new Date(checkInTime);
            const checkOut = new Date(checkOutTime);
            const workedHours = (checkOut - checkIn) / (1000 * 60 * 60);
            
            let status = record.status;
            let isHalfDay = record.is_half_day || false;
            
            // Check if worked hours are less than 4 (half day)
            if (workedHours < 4 && workedHours > 0) {
                isHalfDay = true;
                status = 'Half Day';
            }
            
            // Update attendance
            await connection.execute(
                `UPDATE tb_attendance 
                 SET check_out = ?, status = ?, is_half_day = ?, worked_hours = ?, updated_at = NOW()
                 WHERE employee_id = ? AND date = ? AND tenant_id = ?`,
                [checkOutTime, status, isHalfDay, workedHours, employeeId, date, tenantId]
            );
            
            await connection.commit();
            return { 
                employee_id: employeeId, 
                date: date, 
                check_out: checkOutTime,
                worked_hours: workedHours,
                status: status,
                is_half_day: isHalfDay
            };
        } catch (error) {
            await connection.rollback();
            console.error('Error in Attendance.updateCheckOut:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get attendance by employee and date
    getByEmployeeAndDate: async (tenantId, employeeId, date) => {
        try {
            const query = `
                SELECT a.* FROM tb_attendance a
                JOIN employee_details ed ON a.employee_id = ed.id
                WHERE a.employee_id = ? AND a.date = ? AND ed.tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId, date, tenantId]);
            return rows[0];
        } catch (error) {
            console.error('Error in Attendance.getByEmployeeAndDate:', error);
            throw error;
        }
    },

    // Create history record
    createHistory: async (tenantId, historyData) => {
        try {
            const eCheckQuery = 'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?';
            const [eCheck] = await pool.execute(eCheckQuery, [historyData.employee_id, tenantId]);
            if (eCheck.length === 0) throw new Error("Employee not found in tenant");

            const query = `
                INSERT INTO attendance_history 
                (employee_id, date, description, status, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            `;
            
            const [result] = await pool.execute(query, [
                historyData.employee_id, historyData.date, historyData.description, historyData.status
            ]);
            return result;
        } catch (error) {
            console.error('Error in Attendance.createHistory:', error);
            throw error;
        }
    },

    // Mark check-in
    markCheckIn: async (tenantId, employeeId, checkInTime, status = 'Present') => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const eCheckQuery = 'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?';
            const [eCheck] = await connection.execute(eCheckQuery, [employeeId, tenantId]);
            if (eCheck.length === 0) throw new Error("Employee not found in tenant");

            const shiftQuery = `
                SELECT es.shift_id, s.check_in_time, s.grace_period_minutes
                FROM tb_employee_shifts es 
                JOIN tb_shifts s ON es.shift_id = s.shift_id
                WHERE es.employee_id = ? AND es.assigned_date = CURDATE() AND s.tenant_id = ?
                LIMIT 1
            `;
            
            const [shiftRows] = await connection.execute(shiftQuery, [employeeId, tenantId]);
            
            let shiftId = null;
            let shiftCheckInTime = '09:00:00';
            let gracePeriodMinutes = 15;
            
            if (shiftRows.length > 0) {
                shiftId = shiftRows[0].shift_id;
                shiftCheckInTime = shiftRows[0].check_in_time;
                gracePeriodMinutes = shiftRows[0].grace_period_minutes || 15;
            } else {
                const [defaultShift] = await connection.execute(
                    'SELECT shift_id, check_in_time, grace_period_minutes FROM tb_shifts WHERE tenant_id = ? ORDER BY shift_id LIMIT 1',
                    [tenantId]
                );
                if (defaultShift.length > 0) {
                    shiftId = defaultShift[0].shift_id;
                    shiftCheckInTime = defaultShift[0].check_in_time;
                    gracePeriodMinutes = defaultShift[0].grace_period_minutes || 15;
                    
                    await connection.execute(
                        'INSERT INTO tb_employee_shifts (employee_id, shift_id, assigned_date) VALUES (?, ?, CURDATE())',
                        [employeeId, shiftId]
                    );
                }
            }

            if (!shiftId) throw new Error('No shift available for assignment');

            let finalStatus = status;
            if (status === 'Present') {
                const checkInDateTime = new Date(checkInTime);
                const shiftTime = new Date();
                const [hours, minutes, seconds] = shiftCheckInTime.split(':');
                shiftTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
                
                const gracePeriod = new Date(shiftTime.getTime() + gracePeriodMinutes * 60000);
                if (checkInDateTime > gracePeriod) {
                    finalStatus = 'Delayed';
                }
            }

            const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            
            const [existing] = await connection.execute(
                'SELECT * FROM tb_attendance WHERE employee_id = ? AND date = ?',
                [employeeId, today]
            );

            if (existing.length > 0) {
                await connection.execute(
                    `UPDATE tb_attendance SET check_in = ?, status = ?, shift_id = ?, updated_at = NOW()
                     WHERE employee_id = ? AND date = ?`,
                    [checkInTime, finalStatus, shiftId, employeeId, today]
                );
            } else {
                await connection.execute(
                    `INSERT INTO tb_attendance (employee_id, shift_id, date, check_in, status, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [employeeId, shiftId, today, checkInTime, finalStatus]
                );
            }

            await connection.commit();
            return { status: finalStatus, shift_id: shiftId };
        } catch (error) {
            await connection.rollback();
            console.error('Error in Attendance.markCheckIn:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // Get monthly percentage
    getMonthlyPercentage: async (tenantId, employeeId, month = null, year = null) => {
        try {
            const currentDate = new Date();
            const targetMonth = month || currentDate.getMonth() + 1;
            const targetYear = year || currentDate.getFullYear();
            
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    SUM(CASE WHEN a.status IN ('Present', 'Delayed') THEN 1 ELSE 0 END) as present_days
                FROM tb_attendance a
                JOIN employee_details ed ON a.employee_id = ed.id
                WHERE a.employee_id = ? 
                AND MONTH(a.date) = ? 
                AND YEAR(a.date) = ?
                AND ed.tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId, targetMonth, targetYear, tenantId]);
            const data = rows[0] || { total_records: 0, present_days: 0 };
            
            const percentage = Math.min(100, Math.round((data.present_days / 18) * 100));
            return percentage;
        } catch (error) {
            console.error('Error in Attendance.getMonthlyPercentage:', error);
            throw error;
        }
    },

    // Get attendance for salary calculation
    getAttendanceForSalary: async (tenantId, employeeId, month, year) => {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    date,
                    DATE_FORMAT(check_in, '%h:%i %p') as check_in_time,
                    DATE_FORMAT(check_out, '%h:%i %p') as check_out_time,
                    status,
                    is_half_day,
                    is_late,
                    late_minutes,
                    worked_hours,
                    remarks
                 FROM tb_attendance
                 WHERE tenant_id = ? 
                    AND employee_id = ? 
                    AND MONTH(date) = ? 
                    AND YEAR(date) = ?
                 ORDER BY date`,
                [tenantId, employeeId, month, year]
            );
            
            return rows;
        } catch (error) {
            console.error('Error in Attendance.getAttendanceForSalary:', error);
            throw error;
        }
    },

    // Calculate monthly attendance summary
    getMonthlyAttendanceSummary: async (tenantId, employeeId, month, year) => {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    COUNT(*) as total_days,
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
                    SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as delayed_days,
                    SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_days,
                    SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
                    SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as leave_days,
                    SUM(worked_hours) as total_worked_hours,
                    AVG(worked_hours) as avg_worked_hours,
                    SUM(is_half_day) as half_day_count
                 FROM tb_attendance
                 WHERE tenant_id = ? 
                    AND employee_id = ? 
                    AND MONTH(date) = ? 
                    AND YEAR(date) = ?`,
                [tenantId, employeeId, month, year]
            );
            
            return rows[0];
        } catch (error) {
            console.error('Error in Attendance.getMonthlyAttendanceSummary:', error);
            throw error;
        }
    }
};

module.exports = Attendance;