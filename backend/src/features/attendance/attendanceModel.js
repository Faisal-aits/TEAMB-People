    // backend/models/attendanceModel.js
    const {pool }= require('../../config/db');
    const { getIndiaDate, getIndiaDateTime } = require('../../utils/indiaTime');
 // Helper function to calculate status based on check-in time and shift
    const calculateStatus = (checkInTime, shiftCheckInTimeStr, date, gracePeriodMinutes = 15) => {
        const [hours, minutes] = shiftCheckInTimeStr.split(':');
        const shiftCheckInTime = new Date(date);
        shiftCheckInTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const gracePeriod = new Date(shiftCheckInTime.getTime() + gracePeriodMinutes * 60000);
        
        if (checkInTime > gracePeriod) {
            return 'Delayed';
        }
        return 'Present';
    };

    // Helper function to get late streak - Get consecutive late days before current date
    async function getLateStreak(connection, tenantId, employeeId, currentDate) {
        try {
            const [rows] = await connection.execute(
                `SELECT status, date FROM tb_attendance 
                WHERE tenant_id = ? AND employee_id = ? 
                AND date < ? 
                ORDER BY date DESC 
                LIMIT 3`,
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
            // Check 1: If current status is Delayed and has 2 or more consecutive late days (making it 3 total including today)
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

   // backend/models/attendanceModel.js - Fix helper function

async function getEmployeeShiftForDateHelper(connection, tenantId, employeeId, date) {
    try {
        // employeeId here is the VARCHAR id from employee_details (e.g., "EMP001")
        
        // First check for specific shift assignment on that date
        const [specificShift] = await connection.execute(
            `SELECT s.shift_id, s.shift_name, s.check_in_time, s.check_out_time, s.grace_period_minutes
            FROM tb_employee_shifts es
            JOIN tb_shifts s ON es.shift_id = s.shift_id
            WHERE es.employee_id = ? AND es.assigned_date = ? AND s.tenant_id = ?
            LIMIT 1`,
            [employeeId, date, tenantId]
        );
        
        if (specificShift.length > 0) {
            return specificShift[0];
        }
        
        // If no specific assignment, get employee's default shift
        const [defaultShift] = await connection.execute(
            `SELECT s.shift_id, s.shift_name, s.check_in_time, s.check_out_time, s.grace_period_minutes
            FROM employee_details ed
            JOIN tb_shifts s ON ed.default_shift_id = s.shift_id
            WHERE ed.id = ? AND ed.tenant_id = ? AND s.tenant_id = ?`,
            [employeeId, tenantId, tenantId]  // FIXED: Use ed.id = employeeId
        );
        
        if (defaultShift.length > 0) {
            return defaultShift[0];
        }
        
        // Finally, get system default shift
        const [systemDefault] = await connection.execute(
            `SELECT shift_id, shift_name, check_in_time, check_out_time, grace_period_minutes
            FROM tb_shifts 
            WHERE tenant_id = ? AND is_default = TRUE 
            LIMIT 1`,
            [tenantId]
        );
        
        return systemDefault[0] || null;
    } catch (error) {
        console.error('Error getting employee shift:', error);
        return null;
    }
}

    const Attendance = {

getAll: async (tenantId, filters = {}) => {
    try {
       
        
        if (!tenantId) {
            
            return [];
        }
        
        let query = `
            SELECT 
                a.attendance_id,
                a.employee_id,
                ed.id as hr_employee_code,
                ed.employee_id as user_id,
                COALESCE(CONCAT(u.first_name, " ", u.last_name), "Unknown") as employee_name,
                s.shift_name,
                a.date,
                TIME_FORMAT(a.check_in, "%h:%i %p") as check_in_time,
                TIME_FORMAT(a.check_out, "%h:%i %p") as check_out_time,
                a.status,
                a.is_half_day,
                a.worked_hours,
                a.remarks,
                a.approved_by,
                a.check_in_latitude,
                a.check_in_longitude,
                a.check_out_latitude,
                a.check_out_longitude,
                DATE_FORMAT(a.approved_at, "%Y-%m-%d %h:%i %p") as approved_at,
                a.created_at
            FROM tb_attendance a
            LEFT JOIN employee_details ed ON a.employee_id = ed.id
            LEFT JOIN users u ON ed.employee_id = u.id
            LEFT JOIN tb_shifts s ON a.shift_id = s.shift_id
            WHERE 1=1
        `;
        
        const params = [];

        query += ` AND (ed.tenant_id = ? OR ed.tenant_id IS NULL)`;
        params.push(tenantId);

        if (filters.start_date && filters.end_date) {
            query += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        } else if (filters.date) {
            query += ' AND a.date = ?';
            params.push(filters.date);
        } else {
            const today = getIndiaDate();
            query += ' AND a.date = ?';
            params.push(today);
        }

        if (filters.status && filters.status !== 'all') {
            query += ' AND a.status = ?';
            params.push(filters.status);
        }

        if (filters.department) {
            query += ' AND ed.department_id = ?';
            params.push(filters.department);
        }

        query += ' ORDER BY a.date DESC, u.first_name, u.last_name';

        const [rows] = await pool.execute(query, params);
       
        
        return rows;
    } catch (error) {
        console.error('Error in Attendance.getAll:', error);
        return [];
    }
},      // Get attendance statistics
       // Get attendance statistics - FIXED VERSION
getStatistics: async (tenantId, date = null) => {
    try {
        const targetDate = date || getIndiaDate();
        
        const query = `
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) = 'present' THEN 1 ELSE 0 END), 0) as present,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) IN ('delayed', 'late') THEN 1 ELSE 0 END), 0) as \`delayed\`,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) IN ('half day', 'half-day') OR a.is_half_day = 1 THEN 1 ELSE 0 END), 0) as half_day,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) IN ('present', 'delayed', 'late', 'half day', 'half-day') OR a.is_half_day = 1 THEN 1 ELSE 0 END), 0) as present_like,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) IN ('on leave', 'leave') THEN 1 ELSE 0 END), 0) as on_leave,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) = 'absent' THEN 1 ELSE 0 END), 0) as absent,
                COALESCE(SUM(CASE WHEN LOWER(TRIM(a.status)) = 'pending' THEN 1 ELSE 0 END), 0) as pending
            FROM tb_attendance a
            LEFT JOIN employee_details ed ON a.employee_id = ed.id
            WHERE a.date = ? AND (a.tenant_id = ? OR ed.tenant_id = ?)
        `;
        
        const [rows] = await pool.execute(query, [targetDate, tenantId, tenantId]);
        return rows[0] || { total: 0, present: 0, delayed: 0, half_day: 0, present_like: 0, on_leave: 0, absent: 0, pending: 0 };
    } catch (error) {
        console.error('Error in Attendance.getStatistics:', error);
        // Return default values instead of throwing
        return { total: 0, present: 0, delayed: 0, half_day: 0, present_like: 0, on_leave: 0, absent: 0, pending: 0 };
    }
},

        // Get employee history - FIXED VERSION
getEmployeeHistory: async (tenantId, employeeId) => {
    try {
        const query = `
            SELECT 
                a.attendance_id as history_id,
                a.employee_id,
                a.date,
                CONCAT(a.status, IFNULL(CONCAT(" - ", a.remarks), "")) as description,
                a.status,
                DATE_FORMAT(a.created_at, "%Y-%m-%d") as created_date,
                TIME_FORMAT(a.check_in, "%h:%i %p") as check_in_time,
                TIME_FORMAT(a.check_out, "%h:%i %p") as check_out_time,
                a.is_half_day,
                a.worked_hours,
                a.remarks,
                s.shift_name
            FROM tb_attendance a
            LEFT JOIN tb_shifts s ON a.shift_id = s.shift_id
            JOIN employee_details ed ON a.employee_id = ed.id
            WHERE a.employee_id = ? AND ed.tenant_id = ?
            ORDER BY a.date DESC
            LIMIT 50
        `;
        
        const [rows] = await pool.execute(query, [employeeId, tenantId]);
        return rows;
    } catch (error) {
        console.error('Error in Attendance.getEmployeeHistory:', error);
        return [];
    }
},

        // Get employee history statistics
        getEmployeeHistoryStats: async (tenantId, employeeId) => {
            try {
                const query = `
                    SELECT 
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END), 0) as present,
                        COALESCE(SUM(CASE WHEN a.status = 'Delayed' THEN 1 ELSE 0 END), 0) as delayed,
                        COALESCE(SUM(CASE WHEN a.status = 'On Leave' THEN 1 ELSE 0 END), 0) as on_leave,
                        COALESCE(SUM(CASE WHEN a.status = 'Half Day' THEN 1 ELSE 0 END), 0) as half_day
                    FROM tb_attendance a
                    JOIN employee_details ed ON a.employee_id = ed.id
                    WHERE a.employee_id = ? AND ed.tenant_id = ?
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
                    SET a.status = 'Present', a.approved_by = ?, a.approved_at = ? 
                    WHERE a.attendance_id = ? AND ed.tenant_id = ?`,
                    [approvedByEmployeeId, getIndiaDateTime(), attendanceId, tenantId]
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
                    SET a.status = 'Absent', a.remarks = ?, a.approved_by = ?, a.approved_at = ? 
                    WHERE a.attendance_id = ? AND ed.tenant_id = ?`,
                    [remarks, approvedByEmployeeId, getIndiaDateTime(), attendanceId, tenantId]
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

       // backend/models/attendanceModel.js

checkExists: async (tenantId, employeeId, date) => {
    try {
        const [rows] = await pool.execute(
            `SELECT a.attendance_id FROM tb_attendance a
            WHERE a.employee_id = ? AND a.date = ? AND a.tenant_id = ?`,
            [employeeId, date, tenantId]  // employeeId is the VARCHAR id
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error in Attendance.checkExists:', error);
        throw error;
    }
},
// backend/models/attendanceModel.js - Update the create method

create: async (tenantId, attendanceData) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Get employee details
        const [eCheck] = await connection.execute(
            'SELECT id, salary FROM employee_details WHERE id = ? AND tenant_id = ?',
            [attendanceData.employee_id, tenantId]
        );
        
        if (eCheck.length === 0) {
            throw new Error("Employee not found in tenant");
        }
        
        const employeeIdString = eCheck[0].id;
        const employeeSalary = eCheck[0].salary || 0;

        // Get shift for the employee
        const shiftInfo = await getEmployeeShiftForDateHelper(connection, tenantId, employeeIdString, attendanceData.date);
        
        if (!shiftInfo) {
            throw new Error('No shift available for assignment.');
        }

        const shiftId = shiftInfo.shift_id;
        const shiftCheckInTime = shiftInfo.check_in_time;
        const gracePeriodMinutes = shiftInfo.grace_period_minutes || 15;

        // Calculate status based on check-in time
        let status = attendanceData.status || 'Pending';
        let isLate = false;
        let lateMinutes = 0;
        let lateStreak = 0;
        let shouldDeductSalary = false;
        let deductionAmount = 0;
        let deductionReason = null;
        
        if (attendanceData.check_in && shiftCheckInTime) {
            const checkInDateTime = new Date(attendanceData.check_in);
            const shiftTime = new Date(attendanceData.date);
            const [hours, minutes] = shiftCheckInTime.split(':');
            shiftTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const gracePeriod = new Date(shiftTime.getTime() + gracePeriodMinutes * 60000);
            
            if (checkInDateTime > gracePeriod) {
                status = 'Delayed';  // Always show Delayed, never Half Day
                isLate = true;
                lateMinutes = Math.round((checkInDateTime - shiftTime) / (1000 * 60));
                
                // Get previous attendance records for streak calculation
                const [recentAttendance] = await connection.execute(
                    `SELECT status, date, late_streak 
                     FROM tb_attendance 
                     WHERE employee_id = ? AND tenant_id = ? 
                     AND date < ?
                     ORDER BY date DESC 
                     LIMIT 5`,
                    [employeeIdString, tenantId, attendanceData.date]
                );
                
                // Calculate consecutive late days
                let consecutiveCount = 1;
                for (const record of recentAttendance) {
                    if (record.status === 'Delayed') {
                        const recordDate = new Date(record.date);
                        const currentDate = new Date(attendanceData.date);
                        const dayDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
                        
                        if (dayDiff === consecutiveCount) {
                            consecutiveCount++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                
                lateStreak = consecutiveCount;
                
                // IMPORTANT: Salary deduction for 3+ consecutive late days (but status remains "Delayed")
                if (lateStreak >= 3) {
                    shouldDeductSalary = true;
                    const dailySalary = employeeSalary / 30;
                    deductionAmount = dailySalary * 0.5;
                    deductionReason = `${lateStreak} consecutive late days - Half day salary deducted`;
                 
                }
            } else {
                status = 'Present';
                lateStreak = 0;
            }
        }
        
        // Calculate worked hours
        let workedHours = 0;
        if (attendanceData.check_in && attendanceData.check_out) {
            const checkIn = new Date(attendanceData.check_in);
            const checkOut = new Date(attendanceData.check_out);
            workedHours = parseFloat(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2));
            
            // Salary deduction for short hours, but status remains Delayed or Present
            if (workedHours < 4 && workedHours > 0 && status !== 'Half Day') {
                shouldDeductSalary = true;
                const dailySalary = employeeSalary / 30;
                deductionAmount = dailySalary * 0.5;
                deductionReason = `Worked only ${workedHours} hours - Half day deduction`;
            }
        }

        // Prepare remarks
        let remarks = attendanceData.remarks || '';
        if (isLate && !remarks) {
            remarks = `Late check-in by ${lateMinutes} minutes`;
        }
        if (shouldDeductSalary) {
            remarks = remarks ? `${remarks} | ${deductionReason}` : deductionReason;
        }

        // Insert attendance record - is_half_day is always 0
        const query = `
            INSERT INTO tb_attendance 
            (tenant_id, employee_id, shift_id, date, check_in, check_out, status, 
             is_half_day, is_late, late_minutes, late_streak, worked_hours, 
             scheduled_check_in, grace_period_minutes, remarks, 
             should_deduct_salary, deduction_amount, deduction_reason,
             check_in_latitude, check_in_longitude, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.execute(query, [
            tenantId,
            employeeIdString,
            shiftId,
            attendanceData.date,
            attendanceData.check_in || null,
            attendanceData.check_out || null,
            status,  // Always 'Delayed' for late arrivals, never 'Half Day'
            0,  // is_half_day always 0 (removed from UI)
            isLate ? 1 : 0,
            lateMinutes,
            lateStreak,
            workedHours,
            shiftCheckInTime || null,
            gracePeriodMinutes,
            remarks,
            shouldDeductSalary ? 1 : 0,
            deductionAmount,
            deductionReason,
            attendanceData.latitude || null,
            attendanceData.longitude || null,
            getIndiaDateTime()
        ]);

        await connection.commit();
        
        return { 
            attendance_id: result.insertId,
            shift_id: shiftId,
            status: status,
            is_late: isLate,
            late_minutes: lateMinutes,
            late_streak: lateStreak,
            should_deduct_salary: shouldDeductSalary,
            deduction_amount: deductionAmount,
            deduction_reason: deductionReason,
            is_half_day: false,
            worked_hours: workedHours,
            shift_name: shiftInfo.shift_name,
            shift_check_in: shiftCheckInTime
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
            const connection = await pool.getConnection();
            try {
                const shift = await getEmployeeShiftForDateHelper(connection, tenantId, employeeId, date);
                return shift;
            } catch (error) {
                console.error('Error in Attendance.getEmployeeShiftForDate:', error);
                return null;
            } finally {
                connection.release();
            }
        },

      // backend/models/attendanceModel.js

updateCheckOut: async (tenantId, employeeId, date, checkOutTime, latitude = null, longitude = null, remarks = null) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get existing attendance record
        const [attendance] = await connection.execute(
            `SELECT a.* FROM tb_attendance a
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
        const workedHours = parseFloat(((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2));
        
        let status = record.status;
        let isHalfDay = record.is_half_day || false;
        
        // Check if worked hours are less than 4 (half day)
        if (workedHours < 4 && workedHours > 0 && status !== 'Half Day') {
            isHalfDay = true;
            status = 'Half Day';
            
            // Get employee salary for deduction
            const [empCheck] = await connection.execute(
                'SELECT salary FROM employee_details WHERE id = ? AND tenant_id = ?',
                [employeeId, tenantId]
            );
            
            if (empCheck.length > 0) {
                const dailySalary = empCheck[0].salary / 30;
                const deductionAmount = dailySalary * 0.5;
                
                await connection.execute(
                    `UPDATE tb_attendance 
                    SET should_deduct_salary = 1, deduction_amount = ?, deduction_reason = ?
                    WHERE employee_id = ? AND date = ? AND tenant_id = ?`,
                    [deductionAmount, `Worked only ${workedHours} hours - Half day deduction`, employeeId, date, tenantId]
                );
            }
        }
        
        const nextRemarks = remarks
            ? [record.remarks, remarks].filter(Boolean).join(' | ')
            : record.remarks;

        // Update attendance
        await connection.execute(
            `UPDATE tb_attendance 
            SET check_out = ?, status = ?, is_half_day = ?, worked_hours = ?, updated_at = ?,
                check_out_latitude = ?, check_out_longitude = ?, remarks = ?
            WHERE employee_id = ? AND date = ? AND tenant_id = ?`,
            [checkOutTime, status, isHalfDay ? 1 : 0, workedHours, getIndiaDateTime(), latitude, longitude, nextRemarks, employeeId, date, tenantId]
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

       // backend/models/attendanceModel.js

getByEmployeeAndDate: async (tenantId, employeeId, date) => {
    try {
        const [rows] = await pool.execute(
            `SELECT a.* FROM tb_attendance a
            WHERE a.employee_id = ? AND a.date = ? AND a.tenant_id = ?`,
            [employeeId, date, tenantId]  // employeeId is already the VARCHAR id
        );
        return rows[0];
    } catch (error) {
        console.error('Error in Attendance.getByEmployeeAndDate:', error);
        throw error;
    }
},

        // Mark check-in
        markCheckIn: async (tenantId, employeeId, checkInTime, status = 'Present') => {
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();

                // Verify employee exists
                const [eCheck] = await connection.execute(
                    'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?',
                    [employeeId, tenantId]
                );
                if (eCheck.length === 0) throw new Error("Employee not found in tenant");

                const today = getIndiaDate();
                
                // Get shift info
                const shiftInfo = await getEmployeeShiftForDateHelper(connection, tenantId, employeeId, today);
                
                if (!shiftInfo) {
                    throw new Error('No shift available for assignment');
                }

                const shiftId = shiftInfo.shift_id;
                const shiftCheckInTime = shiftInfo.check_in_time;
                const gracePeriodMinutes = shiftInfo.grace_period_minutes || 15;

                let finalStatus = status;
                if (status === 'Present') {
                    const checkInDateTime = new Date(checkInTime);
                    const shiftTime = new Date(today);
                    const [hours, minutes] = shiftCheckInTime.split(':');
                    shiftTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    const gracePeriod = new Date(shiftTime.getTime() + gracePeriodMinutes * 60000);
                    if (checkInDateTime > gracePeriod) {
                        finalStatus = 'Delayed';
                    }
                }
                
                const [existing] = await connection.execute(
                    'SELECT * FROM tb_attendance WHERE employee_id = ? AND date = ?',
                    [employeeId, today]
                );

                if (existing.length > 0) {
                    await connection.execute(
                        `UPDATE tb_attendance SET check_in = ?, status = ?, shift_id = ?, updated_at = ?
                        WHERE employee_id = ? AND date = ?`,
                        [checkInTime, finalStatus, shiftId, getIndiaDateTime(), employeeId, today]
                    );
                } else {
                    await connection.execute(
                        `INSERT INTO tb_attendance (tenant_id, employee_id, shift_id, date, check_in, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [tenantId, employeeId, shiftId, today, checkInTime, finalStatus, getIndiaDateTime()]
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
                const [indiaYear, indiaMonth] = getIndiaDate().split('-');
                const targetMonth = month || Number(indiaMonth);
                const targetYear = year || Number(indiaYear);
                
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
                
                const percentage = Math.min(100, Math.round((data.present_days / 22) * 100));
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
                    ORDER BY date ASC`,
                    [tenantId, employeeId, month, year]
                );
                
                return rows;
            } catch (error) {
                console.error('Error in Attendance.getAttendanceForSalary:', error);
                throw error;
            }
        },

        // Get monthly attendance summary
        getMonthlyAttendanceSummary: async (tenantId, employeeId, month, year) => {
            try {
                const [rows] = await pool.execute(
                    `SELECT 
                        COUNT(*) as total_days,
                        COALESCE(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END), 0) as present_days,
                        COALESCE(SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END), 0) as delayed_days,
                        COALESCE(SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END), 0) as half_days,
                        COALESCE(SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END), 0) as absent_days,
                        COALESCE(SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END), 0) as leave_days,
                        COALESCE(SUM(worked_hours), 0) as total_worked_hours,
                        COALESCE(AVG(worked_hours), 0) as avg_worked_hours,
                        COALESCE(SUM(is_half_day), 0) as half_day_count
                    FROM tb_attendance
                    WHERE tenant_id = ? 
                        AND employee_id = ? 
                        AND MONTH(date) = ? 
                        AND YEAR(date) = ?`,
                    [tenantId, employeeId, month, year]
                );
                
               
                
                return rows[0] || { 
                    total_days: 0, 
                    present_days: 0, 
                    delayed_days: 0,
                    half_days: 0, 
                    absent_days: 0,
                    leave_days: 0 
                };
            } catch (error) {
                console.error('Error in Attendance.getMonthlyAttendanceSummary:', error);
                throw error;
            }
        },

        
    changeAttendanceStatus: async (tenantId, { date, employeeId, markAll, status = 'Present', checkInTime, checkOutTime, reason, adminUserId }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            let targetEmployeeIds = [];
            const isBulkAll = Boolean(markAll || employeeId === 'all' || !employeeId);

            if (isBulkAll) {
                const [empRows] = await connection.execute(
                    `SELECT id FROM employee_details 
                     WHERE tenant_id = ? AND status = 'active'`,
                    [tenantId]
                );
                targetEmployeeIds = empRows.map(r => r.id);
            } else {
                const [empRows] = await connection.execute(
                    `SELECT id FROM employee_details 
                     WHERE tenant_id = ? AND (id = ? OR employee_id = ?)`,
                    [tenantId, employeeId, employeeId]
                );
                if (empRows.length > 0) {
                    targetEmployeeIds = [empRows[0].id];
                } else {
                    targetEmployeeIds = [employeeId];
                }
            }

            if (targetEmployeeIds.length === 0) {
                await connection.rollback();
                return { count: 0, message: isBulkAll ? 'No active employees found' : 'Employee not found' };
            }

            let approverEmpId = null;
            if (adminUserId) {
                const [appRows] = await connection.execute(
                    `SELECT id FROM employee_details WHERE tenant_id = ? AND employee_id = ?`,
                    [tenantId, adminUserId]
                );
                if (appRows.length > 0) {
                    approverEmpId = appRows[0].id;
                }
            }

            let updatedCount = 0;
            let insertedCount = 0;
            
            const rawStatus = String(status || 'Present').trim().toLowerCase();
            let finalStatus = 'Present';
            let finalLeaveType = null;
            let isHalfDay = 0;
            let isLate = 0;
            let workedHours = 9.0;
            
                        const formatTime = (t, def) => {
                let timeStr = t || def;
                if (!timeStr) return null;
                
                let hour = 0, minute = 0, second = 0;
                const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                if (ampmMatch) {
                    hour = parseInt(ampmMatch[1], 10);
                    minute = parseInt(ampmMatch[2], 10);
                    if (ampmMatch[3]) {
                        const ampm = ampmMatch[3].toUpperCase();
                        if (ampm === 'PM' && hour < 12) hour += 12;
                        if (ampm === 'AM' && hour === 12) hour = 0;
                    }
                }
                const hh = String(hour).padStart(2, '0');
                const mm = String(minute).padStart(2, '0');
                return `${date} ${hh}:${mm}:00`;
            };

            // Default checkIn / checkOut will be calculated per-employee in the loop based on their shift


            if (rawStatus === 'half day' || rawStatus === 'half-day') {
                finalStatus = 'Half Day';
                isHalfDay = 1;
                workedHours = 4.0;
            } else if (rawStatus === 'delayed' || rawStatus === 'late') {
                finalStatus = 'Delayed';
                isLate = 1;
                workedHours = 8.0;
            } else if (rawStatus === 'absent') {
                finalStatus = 'Absent';
                workedHours = 0.0;
            } else if (rawStatus === 'leave_pl') {
                finalStatus = 'On Leave';
                finalLeaveType = 'PL';
                workedHours = 0.0;
            } else if (rawStatus === 'leave_psl') {
                finalStatus = 'On Leave';
                finalLeaveType = 'PSL';
                workedHours = 0.0;
            } else if (rawStatus === 'on leave' || rawStatus === 'leave') {
                finalStatus = 'On Leave';
                workedHours = 0.0;
            }
            
            const remarks = reason || `Marked ${finalStatus} by Admin`;

            for (const empId of targetEmployeeIds) {
                // Get employee's shift
                const shift = await getEmployeeShiftForDateHelper(connection, tenantId, empId, date);
                const shiftCheckIn = shift ? shift.check_in_time : '09:30:00';
                const shiftCheckOut = shift ? shift.check_out_time : '18:30:00';
                
                let checkIn = null;
                let checkOut = null;
                
                if (finalStatus !== 'Absent' && finalStatus !== 'On Leave') {
                    checkIn = checkInTime ? formatTime(checkInTime) : formatTime(shiftCheckIn);
                    checkOut = checkOutTime ? formatTime(checkOutTime) : formatTime(shiftCheckOut);
                    
                    if (finalStatus === 'Half Day' && !checkOutTime) {
                         // Default check-out for half day is check-in + 4 hours
                         if (checkIn) {
                             const ci = new Date(checkIn);
                             ci.setHours(ci.getHours() + 4);
                             const hh = String(ci.getHours()).padStart(2, '0');
                             const mm = String(ci.getMinutes()).padStart(2, '0');
                             checkOut = formatTime(`${hh}:${mm}:00`);
                         }
                    }
                    if (finalStatus === 'Delayed' && !checkInTime) {
                        // Default check-in for delayed is shift check-in + 1 hour
                        if (checkIn) {
                            const ci = new Date(checkIn);
                            ci.setHours(ci.getHours() + 1);
                            const hh = String(ci.getHours()).padStart(2, '0');
                            const mm = String(ci.getMinutes()).padStart(2, '0');
                            checkIn = formatTime(`${hh}:${mm}:00`);
                        }
                    }
                }

                // --- NEW LEAVE BALANCE CHECK ---
                if (finalLeaveType) {
                    const year = date.split('-')[0];
                    const [balanceRows] = await connection.execute(
                        `SELECT allocated, used, pending FROM leave_balances 
                         WHERE tenant_id = ? AND employee_id = ? AND year = ? AND leave_type = ?`,
                        [tenantId, empId, year, finalLeaveType]
                    );
                    if (balanceRows.length === 0) {
                        throw new Error(`Employee ID ${empId} does not have any ${finalLeaveType} balance initialized.`);
                    }
                    const b = balanceRows[0];
                    const remaining = b.allocated - b.used;
                    if (remaining < 1) {
                        throw new Error(`Employee ID ${empId} does not have enough ${finalLeaveType} balance (Remaining: ${remaining}).`);
                    }

                    // -- NEW: APPROVE OVERLAPPING PENDING LEAVE REQUEST --
                    const [pendingReqs] = await connection.execute(
                        `SELECT leave_id FROM leave_requests WHERE tenant_id = ? AND employee_id = ? AND status = 'Pending' AND leave_type = ? AND start_date = ? AND end_date = ?`,
                        [tenantId, empId, finalLeaveType, date, date]
                    );
                    if (pendingReqs.length > 0) {
                        await connection.execute(
                            `UPDATE leave_requests SET status = 'Approved', approved_by = ?, approved_at = NOW() WHERE leave_id = ?`,
                            [approverEmpId, pendingReqs[0].leave_id]
                        );
                        // Decrease pending by 1 since it's approved. 
                        // (The +1 to used will happen normally in the loop below)
                        await connection.execute(
                            `UPDATE leave_balances SET pending = GREATEST(0, pending - 1) WHERE tenant_id = ? AND employee_id = ? AND year = ? AND leave_type = ?`,
                            [tenantId, empId, year, finalLeaveType]
                        );
                    }
                }
                
                const [existing] = await connection.execute(
                    `SELECT attendance_id, status, leave_type FROM tb_attendance WHERE (tenant_id = ? OR tenant_id IS NULL) AND employee_id = ? AND date = ?`,
                    [tenantId, empId, date]
                );

                let prevLeaveType = null;
                if (existing.length > 0) {
                    prevLeaveType = existing[0].leave_type;
                }

                // --- LEAVE BALANCE ADJUSTMENT ---
                if (finalLeaveType !== prevLeaveType) {
                    const year = date.split('-')[0];
                    if (finalLeaveType) {
                        await connection.execute(
                            `UPDATE leave_balances SET used = used + 1 WHERE tenant_id = ? AND employee_id = ? AND year = ? AND leave_type = ?`,
                            [tenantId, empId, year, finalLeaveType]
                        );
                        const [existingReqs] = await connection.execute(
                            `SELECT leave_id FROM leave_requests WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND start_date <= ? AND end_date >= ? AND status = 'Approved'`,
                            [tenantId, empId, finalLeaveType, date, date]
                        );
                        if (existingReqs.length === 0) {
                            await connection.execute(
                                `INSERT INTO leave_requests (tenant_id, employee_id, leave_type, is_paid, description, start_date, end_date, status, approved_by, approved_at, created_at, updated_at)
                                 VALUES (?, ?, ?, 1, 'Marked On Leave by Admin from Attendance', ?, ?, 'Approved', ?, NOW(), NOW(), NOW())`,
                                [tenantId, empId, finalLeaveType, date, date, approverEmpId]
                            );
                        }
                    }
                    if (prevLeaveType) {
                        await connection.execute(
                            `UPDATE leave_balances SET used = GREATEST(0, used - 1) WHERE tenant_id = ? AND employee_id = ? AND year = ? AND leave_type = ?`,
                            [tenantId, empId, year, prevLeaveType]
                        );
                        await connection.execute(
                            `DELETE FROM leave_requests WHERE tenant_id = ? AND employee_id = ? AND leave_type = ? AND start_date = ? AND end_date = ? AND status = 'Approved'`,
                            [tenantId, empId, prevLeaveType, date, date]
                        );
                    }
                }

                if (existing.length > 0) {
                    await connection.execute(
                        `UPDATE tb_attendance 
                         SET status = ?, is_half_day = ?, is_late = ?, worked_hours = ?, 
                             check_in = ?, check_out = ?, remarks = ?, approved_by = ?, leave_type = ?, updated_at = NOW()
                         WHERE attendance_id = ?`,
                        [finalStatus, isHalfDay, isLate, workedHours, checkIn, checkOut, remarks, approverEmpId, finalLeaveType, existing[0].attendance_id]
                    );
                    updatedCount++;
                                    } else {
                    const shift = await getEmployeeShiftForDateHelper(connection, tenantId, empId, date);
                    const shiftId = shift ? shift.shift_id : 1;

                    await connection.execute(
                        `INSERT INTO tb_attendance 
                         (tenant_id, employee_id, shift_id, date, status, is_half_day, is_late, worked_hours, 
                          check_in, check_out, remarks, approved_by, leave_type, created_at, updated_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                        [tenantId, empId, shiftId, date, finalStatus, isHalfDay, isLate, workedHours, checkIn, checkOut, remarks, approverEmpId, finalLeaveType]
                    );
                    insertedCount++;
                }
            }

            await connection.commit();
            return { count: updatedCount + insertedCount, message: `Successfully updated attendance for ${updatedCount + insertedCount} employee(s)` };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },


    markHalfDay: async (tenantId, { date, employeeId, markAll, reason, adminUserId }) => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                let targetEmployeeIds = [];
                const isBulkAll = markAll || employeeId === 'all' || !employeeId;

                if (isBulkAll) {
                    const [attRows] = await connection.execute(
                        `SELECT DISTINCT a.employee_id 
                         FROM tb_attendance a
                         WHERE (a.tenant_id = ? OR a.tenant_id IS NULL) 
                           AND a.date = ? 
                           AND LOWER(TRIM(a.status)) NOT IN ('on leave', 'leave', 'absent', 'holiday')`,
                        [tenantId, date]
                    );

                    const [leaveRows] = await connection.execute(
                        `SELECT ed.id AS hr_employee_code, ed.employee_id AS user_id
                         FROM leave_requests lr
                         JOIN employee_details ed ON ed.id = lr.employee_id AND ed.tenant_id = lr.tenant_id
                         WHERE lr.tenant_id = ?
                           AND LOWER(lr.status) = 'approved'
                           AND ? BETWEEN lr.start_date AND lr.end_date`,
                        [tenantId, date]
                    );

                    const onLeaveKeys = new Set();
                    leaveRows.forEach((r) => {
                        if (r.hr_employee_code) onLeaveKeys.add(String(r.hr_employee_code).trim());
                        if (r.user_id) onLeaveKeys.add(String(r.user_id).trim());
                    });

                    targetEmployeeIds = attRows
                        .map((row) => String(row.employee_id).trim())
                        .filter((empId) => !onLeaveKeys.has(empId));
                } else {
                    const [empRows] = await connection.execute(
                        `SELECT ed.id FROM employee_details ed
                         WHERE ed.tenant_id = ? AND (ed.id = ? OR ed.employee_id = ?)`,
                        [tenantId, employeeId, employeeId]
                    );
                    if (empRows.length > 0) {
                        targetEmployeeIds = [empRows[0].id];
                    } else {
                        targetEmployeeIds = [employeeId];
                    }
                }

                if (targetEmployeeIds.length === 0) {
                    await connection.rollback();
                    return { count: 0, message: isBulkAll ? 'No present/checked-in employees found for selected date' : 'Employee not found' };
                }

                let approverEmpId = null;
                if (adminUserId) {
                    const [appRows] = await connection.execute(
                        `SELECT id FROM employee_details WHERE tenant_id = ? AND (id = ? OR employee_id = ? OR employee_id = (SELECT CAST(id AS CHAR) FROM users WHERE id = ?))`,
                        [tenantId, adminUserId, adminUserId, adminUserId]
                    );
                    if (appRows.length > 0) {
                        approverEmpId = appRows[0].id;
                    }
                }

                let updatedCount = 0;
                const remarks = reason || 'Marked Half Day by Admin';

                for (const empId of targetEmployeeIds) {
                    const [existing] = await connection.execute(
                        `SELECT attendance_id FROM tb_attendance WHERE (tenant_id = ? OR tenant_id IS NULL) AND employee_id = ? AND date = ?`,
                        [tenantId, empId, date]
                    );

                    if (existing.length > 0) {
                        await connection.execute(
                            `UPDATE tb_attendance 
                             SET status = 'Half Day', is_half_day = 1, remarks = COALESCE(?, remarks), approved_by = ?, updated_at = NOW()
                             WHERE attendance_id = ?`,
                            [remarks, approverEmpId, existing[0].attendance_id]
                        );
                        updatedCount++;
                    } else if (!isBulkAll) {
                        const shift = await getEmployeeShiftForDateHelper(connection, tenantId, empId, date);
                        const shiftId = shift ? shift.shift_id : 1;

                        await connection.execute(
                            `INSERT INTO tb_attendance (tenant_id, employee_id, shift_id, date, status, is_half_day, remarks, approved_by, created_at, updated_at)
                             VALUES (?, ?, ?, ?, 'Half Day', 1, ?, ?, NOW(), NOW())`,
                            [tenantId, empId, shiftId, date, remarks, approverEmpId]
                        );
                        updatedCount++;
                    }
                }

                await connection.commit();
                return { count: updatedCount, message: `Successfully marked Half Day for ${updatedCount} employee(s)` };
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        }
    };

    module.exports = Attendance;
