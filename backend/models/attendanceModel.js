// backend/models/attendanceModel.js
const pool = require('../config/database');


// Helper function to calculate status with 15-minute concession
const calculateStatus = (checkInTime, shiftCheckInTimeStr, date) => {
    // Parse shift check-in time
    const [hours, minutes, seconds] = shiftCheckInTimeStr.split(':');
    const shiftCheckInTime = new Date(date);
    shiftCheckInTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
    
    // Calculate grace period (15 minutes after shift start)
    const gracePeriod = new Date(shiftCheckInTime.getTime() + 15 * 60000);
    
    // If check-in is after grace period, mark as delayed
    if (checkInTime > gracePeriod) {
        return 'Delayed';
    }
    
    return 'Present'; // Within grace period
};
    
const Attendance = {
    // Get all attendance records for management
    getAll: async (filters = {}) => {
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
                    a.remarks,
                    a.approved_by,
                    DATE_FORMAT(a.approved_at, '%Y-%m-%d %h:%i %p') as approved_at,
                    a.created_at
                FROM tb_attendance a
                JOIN employee_details ed ON a.employee_id = ed.id
                JOIN users u ON ed.user_id = u.id
                LEFT JOIN tb_shifts s ON a.shift_id = s.shift_id
                WHERE 1=1
            `;
            
            const params = [];

            // Add date filter if provided
            if (filters.date) {
                query += ' AND a.date = ?';
                params.push(filters.date);
            } else {
                // Default to today's date
                const today = new Date().toISOString().split('T')[0];
                query += ' AND a.date = ?';
                params.push(today);
            }

            // Add status filter if provided
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
    getStatistics: async (date = null) => {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as \`delayed\`,
                    SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave,
                    SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
                FROM tb_attendance 
                WHERE date = ?
            `;
            
            const [rows] = await pool.execute(query, [targetDate]);
            return rows[0] || { total: 0, present: 0, delayed: 0, on_leave: 0, absent: 0, pending: 0 };
        } catch (error) {
            console.error('Error in Attendance.getStatistics:', error);
            throw error;
        }
    },

    // Get employee attendance history
   // backend/models/attendanceModel.js

// Fix the getEmployeeHistory method:

getEmployeeHistory: async (employeeId) => {
    try {
        // Get records from BOTH tables
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
                a.remarks,
                s.shift_name
            FROM tb_attendance a
            LEFT JOIN tb_shifts s ON a.shift_id = s.shift_id
            WHERE a.employee_id = ?
            
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
                NULL as remarks,
                NULL as shift_name
            FROM attendance_history ah
            WHERE ah.employee_id = ?
            
            ORDER BY date DESC, created_date DESC
            LIMIT 50
        `;
        
        const [rows] = await pool.execute(query, [employeeId, employeeId]);
        return rows;
    } catch (error) {
        console.error('Error in Attendance.getEmployeeHistory:', error);
        throw error;
    }
},

    // Get employee history statistics
    getEmployeeHistoryStats: async (employeeId) => {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as \`delayed\`,
                    SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) as on_leave
                FROM attendance_history 
                WHERE employee_id = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId]);
            return rows[0] || { total: 0, present: 0, delayed: 0, on_leave: 0 };
        } catch (error) {
            console.error('Error in Attendance.getEmployeeHistoryStats:', error);
            throw error;
        }
    },

    // Approve attendance
approve: async (attendanceId, approvedByEmployeeId) => {
        try {
            const [result] = await pool.execute(
                'UPDATE tb_attendance SET status = "Present", approved_by = ?, approved_at = NOW() WHERE attendance_id = ?',
                [approvedByEmployeeId, attendanceId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Attendance record not found');
            }

            return result;
        } catch (error) {
            console.error('Attendance model approve error:', error);
            throw error;
        }
    },

    // Reject attendance
    reject: async (attendanceId, approvedByEmployeeId, remarks) => {
        try {
            const [result] = await pool.execute(
                'UPDATE tb_attendance SET status = "Absent", remarks = ?, approved_by = ?, approved_at = NOW() WHERE attendance_id = ?',
                [remarks, approvedByEmployeeId, attendanceId]
            );

            if (result.affectedRows === 0) {
                throw new Error('Attendance record not found');
            }

            return result;
        } catch (error) {
            console.error('Attendance model reject error:', error);
            throw error;
        }
    },

    // Get all shifts
    getShifts: async () => {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM tb_shifts ORDER BY check_in_time'
            );
            return rows;
        } catch (error) {
            console.error('Error in Attendance.getShifts:', error);
            throw error;
        }
    },

    // Check if attendance record exists for employee on date
    checkExists: async (employeeId, date) => {
        try {
            const [rows] = await pool.execute(
                'SELECT attendance_id FROM tb_attendance WHERE employee_id = ? AND date = ?',
                [employeeId, date]
            );
            return rows.length > 0;
        } catch (error) {
            console.error('Error in Attendance.checkExists:', error);
            throw error;
        }
    },

    

    // FIXED: Create attendance with shift_id
   // backend/models/attendanceModel.js

// Fix the create method to properly fetch today's assigned shift:

create: async (attendanceData) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // FIXED: First check if employee has a shift assigned for TODAY in tb_employee_shifts
        console.log(`🔍 Checking shift for employee ${attendanceData.employee_id} on date ${attendanceData.date}`);
        
        const todayShiftQuery = `
            SELECT es.shift_id, s.check_in_time, s.shift_name, s.is_default
            FROM tb_employee_shifts es 
            JOIN tb_shifts s ON es.shift_id = s.shift_id 
            WHERE es.employee_id = ? AND es.assigned_date = ?
            LIMIT 1
        `;
        
        let [shiftRows] = await connection.execute(todayShiftQuery, [
            attendanceData.employee_id, 
            attendanceData.date // Use the actual date from attendanceData
        ]);
        
        let shiftId = null;
        let shiftCheckInTime = null;
        
        if (shiftRows.length > 0) {
            // Employee has shift assigned for this specific date (what admin just assigned)
            shiftId = shiftRows[0].shift_id;
            shiftCheckInTime = shiftRows[0].check_in_time;
            console.log(`✅ Found shift assigned for ${attendanceData.date}: ${shiftRows[0].shift_name}`);
        } else {
            console.log(`⚠️ No shift assigned for ${attendanceData.date}, checking other sources...`);
            
            // If no shift for today, check if employee has any future/past assignments
            const [anyAssignment] = await connection.execute(
                `SELECT shift_id FROM tb_employee_shifts 
                 WHERE employee_id = ? ORDER BY assigned_date DESC LIMIT 1`,
                [attendanceData.employee_id]
            );
            
            if (anyAssignment.length > 0) {
                // Use the most recent assignment
                shiftId = anyAssignment[0].shift_id;
                const [shiftTime] = await connection.execute(
                    'SELECT check_in_time FROM tb_shifts WHERE shift_id = ?',
                    [shiftId]
                );
                shiftCheckInTime = shiftTime[0]?.check_in_time;
                console.log(`✅ Using most recent assignment: shift_id ${shiftId}`);
            } else {
                // No assignments at all, check employee's default shift
                console.log('⚠️ No assignments found, checking employee default shift...');
                
                const [employeeDefault] = await connection.execute(
                    `SELECT ed.default_shift_id, s.check_in_time, s.shift_name 
                     FROM employee_details ed
                     LEFT JOIN tb_shifts s ON ed.default_shift_id = s.shift_id
                     WHERE ed.id = ?`,
                    [attendanceData.employee_id]
                );
                
                if (employeeDefault.length > 0 && employeeDefault[0].default_shift_id) {
                    shiftId = employeeDefault[0].default_shift_id;
                    shiftCheckInTime = employeeDefault[0].check_in_time;
                    console.log(`✅ Using employee's default shift: ${employeeDefault[0].shift_name}`);
                } else {
                    // No default shift, get system default shift
                    console.log('⚠️ No default shift, checking system default...');
                    const [systemDefault] = await connection.execute(
                        'SELECT shift_id, check_in_time FROM tb_shifts WHERE is_default = TRUE LIMIT 1'
                    );
                    
                    if (systemDefault.length > 0) {
                        shiftId = systemDefault[0].shift_id;
                        shiftCheckInTime = systemDefault[0].check_in_time;
                        console.log('✅ Using system default shift');
                    } else {
                        // Last resort: get first shift
                        const [firstShift] = await connection.execute(
                            'SELECT shift_id, check_in_time FROM tb_shifts ORDER BY shift_id LIMIT 1'
                        );
                        if (firstShift.length > 0) {
                            shiftId = firstShift[0].shift_id;
                            shiftCheckInTime = firstShift[0].check_in_time;
                            console.log('⚠️ Using first available shift');
                        }
                    }
                }
            }
        }

        if (!shiftId) {
            throw new Error('No shift available for assignment. Please contact administrator.');
        }

        // If we found a shift but it's not assigned for today, assign it now
        if (shiftRows.length === 0) {
            await connection.execute(
                `INSERT INTO tb_employee_shifts (employee_id, shift_id, assigned_date) 
                 VALUES (?, ?, ?)`,
                [attendanceData.employee_id, shiftId, attendanceData.date]
            );
            console.log(`✅ Assigned shift ${shiftId} for date ${attendanceData.date}`);
        }

        // CALCULATE STATUS WITH 15-MINUTE CONCESSION
        let status = attendanceData.status || 'Present';
        
        if (attendanceData.check_in && shiftCheckInTime) {
            status = calculateStatus(
                new Date(attendanceData.check_in),
                shiftCheckInTime,
                attendanceData.date
            );
        }

        const query = `
            INSERT INTO tb_attendance 
            (employee_id, shift_id, date, check_in, status, remarks, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await connection.execute(query, [
            attendanceData.employee_id,
            shiftId,
            attendanceData.date,
            attendanceData.check_in,
            status,
            attendanceData.remarks || (attendanceData.remarks?.includes('Face') ? 
                `Face verified at ${new Date().toLocaleTimeString()}` : 
                `Manual entry at ${new Date().toLocaleTimeString()}`)
        ]);

        // Also add to attendance_history for backward compatibility
        await connection.execute(
            `INSERT INTO attendance_history 
             (employee_id, date, description, status, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [
                attendanceData.employee_id,
                attendanceData.date,
                attendanceData.remarks?.includes('Face') ? 
                    `Face verification - ${status}` : 
                    `Manual entry - ${status}`,
                status
            ]
        );

        await connection.commit();
        
        // Return the shift info along with attendance
        return { 
            attendance_id: result.insertId,
            shift_id: shiftId,
            shift_check_in_time: shiftCheckInTime,
            status: status,
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
// adding this part to verify shift assignment
getEmployeeShiftForDate: async (employeeId, date) => {
    try {
        console.log(`🔍 Getting shift for employee ${employeeId} on date ${date}`);
        
        // Direct query to check tb_employee_shifts
        const query = `
            SELECT 
                s.shift_id,
                s.shift_name,
                TIME_FORMAT(s.check_in_time, '%H:%i') as check_in_time,
                TIME_FORMAT(s.check_out_time, '%H:%i') as check_out_time,
                es.assigned_date,
                'assigned' as shift_type
            FROM tb_employee_shifts es
            JOIN tb_shifts s ON es.shift_id = s.shift_id
            WHERE es.employee_id = ? AND es.assigned_date = ?
            LIMIT 1
        `;
        
        const [rows] = await pool.execute(query, [employeeId, date]);
        
        if (rows.length > 0) {
            console.log(`✅ Found assigned shift for ${date}:`, rows[0]);
            return rows[0];
        }
        
        console.log(`⚠️ No shift found in tb_employee_shifts for ${date}`);
        return null;
    } catch (error) {
        console.error('Error in Attendance.getEmployeeShiftForDate:', error);
        throw error;
    }
},

    // Update checkout time
    updateCheckOut: async (employeeId, date, checkOutTime) => {
        try {
            const query = `
                UPDATE tb_attendance 
                SET check_out = ?, updated_at = NOW()
                WHERE employee_id = ? AND date = ?
            `;
            
            const [result] = await pool.execute(query, [
                checkOutTime, 
                employeeId, 
                date
            ]);
            
            if (result.affectedRows === 0) {
                throw new Error('Attendance record not found for update');
            }
            
            return { 
                employee_id: employeeId,
                date: date,
                check_out: checkOutTime 
            };
        } catch (error) {
            console.error('Error in Attendance.updateCheckOut:', error);
            throw error;
        }
    },

    getByEmployeeAndDate: async (employeeId, date) => {
        try {
            const query = `
                SELECT * FROM tb_attendance 
                WHERE employee_id = ? AND date = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId, date]);
            return rows[0];
        } catch (error) {
            console.error('Error in Attendance.getByEmployeeAndDate:', error);
            throw error;
        }
    },

    // Create attendance history
    createHistory: async (historyData) => {
        try {
            const query = `
                INSERT INTO attendance_history 
                (employee_id, date, description, status, created_at) 
                VALUES (?, ?, ?, ?, NOW())
            `;
            
            const values = [
                historyData.employee_id,
                historyData.date,
                historyData.description,
                historyData.status
            ];

            const [result] = await pool.execute(query, values);
            return result;
        } catch (error) {
            console.error('Error in Attendance.createHistory:', error);
            throw error;
        }
    },

    // NEW: Mark check-in with automatic shift assignment
    markCheckIn: async (employeeId, checkInTime, status = 'Present') => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get employee's shift for today
            const shiftQuery = `
                SELECT es.shift_id, s.check_in_time
                FROM tb_employee_shifts es 
                JOIN tb_shifts s ON es.shift_id = s.shift_id
                WHERE es.employee_id = ? AND es.assigned_date = CURDATE()
                LIMIT 1
            `;
            
            const [shiftRows] = await connection.execute(shiftQuery, [employeeId]);
            
            let shiftId = null;
            let shiftCheckInTime = '09:00:00'; // Default shift time
            
            if (shiftRows.length > 0) {
                shiftId = shiftRows[0].shift_id;
                shiftCheckInTime = shiftRows[0].check_in_time;
            } else {
                // If no shift assigned, get the first available shift
                const [defaultShift] = await connection.execute(
                    'SELECT shift_id, check_in_time FROM tb_shifts ORDER BY shift_id LIMIT 1'
                );
                if (defaultShift.length > 0) {
                    shiftId = defaultShift[0].shift_id;
                    shiftCheckInTime = defaultShift[0].check_in_time;
                    
                    // Assign this shift to employee for today
                    await connection.execute(
                        'INSERT INTO tb_employee_shifts (employee_id, shift_id, assigned_date) VALUES (?, ?, CURDATE())',
                        [employeeId, shiftId]
                    );
                }
            }

            if (!shiftId) {
                throw new Error('No shift available for assignment');
            }

            // Determine status based on check-in time with 15-minute concession
            let finalStatus = status;
            if (status === 'Present') {
                const checkInDateTime = new Date(checkInTime);
                const shiftTime = new Date();
                const [hours, minutes, seconds] = shiftCheckInTime.split(':');
                shiftTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
                
                // Calculate grace period (15 minutes after shift start)
                const gracePeriod = new Date(shiftTime.getTime() + 15 * 60000);
                
                // If check-in is after grace period (more than 15 minutes late), mark as delayed
                if (checkInDateTime > gracePeriod) {
                    finalStatus = 'Delayed';
                    console.log(`⏰ Marked Delayed: ${checkInDateTime.toLocaleTimeString()} is after ${gracePeriod.toLocaleTimeString()}`);
                } else {
                    console.log(`✅ Marked Present: ${checkInDateTime.toLocaleTimeString()} is within grace period`);
                }
            }

            const today = new Date().toISOString().split('T')[0];
            
            // Check if attendance already exists
            const [existing] = await connection.execute(
                'SELECT * FROM tb_attendance WHERE employee_id = ? AND date = ?',
                [employeeId, today]
            );

            if (existing.length > 0) {
                // Update existing record
                await connection.execute(
                    `UPDATE tb_attendance 
                     SET check_in = ?, status = ?, shift_id = ?, updated_at = NOW()
                     WHERE employee_id = ? AND date = ?`,
                    [checkInTime, finalStatus, shiftId, employeeId, today]
                );
            } else {
                // Create new record
                await connection.execute(
                    `INSERT INTO tb_attendance 
                     (employee_id, shift_id, date, check_in, status, created_at)
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

// Add this in attendanceModel.js (after getEmployeeHistoryStats method)
    getMonthlyPercentage: async (employeeId, month = null, year = null) => {
        try {
            const currentDate = new Date();
            const targetMonth = month || currentDate.getMonth() + 1;
            const targetYear = year || currentDate.getFullYear();
            
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    SUM(CASE WHEN status IN ('Present', 'Delayed') THEN 1 ELSE 0 END) as present_days
                FROM tb_attendance 
                WHERE employee_id = ? 
                AND MONTH(date) = ? 
                AND YEAR(date) = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId, targetMonth, targetYear]);
            const data = rows[0] || { total_records: 0, present_days: 0 };
            
            // Calculate: (present days / 18 working days) * 100
            // 18 = 22 working days - 4 holidays
            const percentage = Math.min(100, Math.round((data.present_days / 18) * 100));
            
            return percentage;
        } catch (error) {
            console.error('Error in Attendance.getMonthlyPercentage:', error);
            throw error;
        }
    }

};

module.exports = Attendance;