// backend/models/attendanceModel.js
const pool = require('../config/database');

const calculateStatus = (checkInTime, shiftCheckInTimeStr, date) => {
    const [hours, minutes, seconds] = shiftCheckInTimeStr.split(':');
    const shiftCheckInTime = new Date(date);
    shiftCheckInTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
    
    const gracePeriod = new Date(shiftCheckInTime.getTime() + 15 * 60000);
    
    if (checkInTime > gracePeriod) {
        return 'Delayed';
    }
    
    return 'Present';
};
    
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
                const today = new Date().toISOString().split('T')[0];
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
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            const query = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN a.status = 'Delayed' THEN 1 ELSE 0 END) as \`delayed\`,
                    SUM(CASE WHEN a.status = 'On Leave' THEN 1 ELSE 0 END) as on_leave,
                    SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent,
                    SUM(CASE WHEN a.status = 'Pending' THEN 1 ELSE 0 END) as pending
                FROM tb_attendance a
                JOIN employee_details ed ON a.employee_id = ed.id
                WHERE a.date = ? AND ed.tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [targetDate, tenantId]);
            return rows[0] || { total: 0, present: 0, delayed: 0, on_leave: 0, absent: 0, pending: 0 };
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
                    SUM(CASE WHEN ah.status = 'On Leave' THEN 1 ELSE 0 END) as on_leave
                FROM attendance_history ah
                JOIN employee_details ed ON ah.employee_id = ed.id
                WHERE ah.employee_id = ? AND ed.tenant_id = ?
            `;
            
            const [rows] = await pool.execute(query, [employeeId, tenantId]);
            return rows[0] || { total: 0, present: 0, delayed: 0, on_leave: 0 };
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

    // Create attendance with shift_id
    create: async (tenantId, attendanceData) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const eCheckQuery = 'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?';
            const [eCheck] = await connection.execute(eCheckQuery, [attendanceData.employee_id, tenantId]);
            if (eCheck.length === 0) throw new Error("Employee not found in tenant");

            const todayShiftQuery = `
                SELECT es.shift_id, s.check_in_time, s.shift_name, s.is_default
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
            
            if (shiftRows.length > 0) {
                shiftId = shiftRows[0].shift_id;
                shiftCheckInTime = shiftRows[0].check_in_time;
            } else {
                const [anyAssignment] = await connection.execute(
                    `SELECT es.shift_id FROM tb_employee_shifts es
                     JOIN tb_shifts s ON es.shift_id = s.shift_id
                     WHERE es.employee_id = ? AND s.tenant_id = ? ORDER BY es.assigned_date DESC LIMIT 1`,
                    [attendanceData.employee_id, tenantId]
                );
                
                if (anyAssignment.length > 0) {
                    shiftId = anyAssignment[0].shift_id;
                    const [shiftTime] = await connection.execute(
                        'SELECT check_in_time FROM tb_shifts WHERE shift_id = ? AND tenant_id = ?',
                        [shiftId, tenantId]
                    );
                    shiftCheckInTime = shiftTime[0]?.check_in_time;
                } else {
                    const [employeeDefault] = await connection.execute(
                        `SELECT ed.default_shift_id, s.check_in_time, s.shift_name 
                         FROM employee_details ed
                         LEFT JOIN tb_shifts s ON ed.default_shift_id = s.shift_id
                         WHERE ed.id = ? AND ed.tenant_id = ?`,
                        [attendanceData.employee_id, tenantId]
                    );
                    
                    if (employeeDefault.length > 0 && employeeDefault[0].default_shift_id) {
                        shiftId = employeeDefault[0].default_shift_id;
                        shiftCheckInTime = employeeDefault[0].check_in_time;
                    } else {
                        const [systemDefault] = await connection.execute(
                            'SELECT shift_id, check_in_time FROM tb_shifts WHERE is_default = TRUE AND tenant_id = ? LIMIT 1',
                            [tenantId]
                        );
                        
                        if (systemDefault.length > 0) {
                            shiftId = systemDefault[0].shift_id;
                            shiftCheckInTime = systemDefault[0].check_in_time;
                        } else {
                            const [firstShift] = await connection.execute(
                                'SELECT shift_id, check_in_time FROM tb_shifts WHERE tenant_id = ? ORDER BY shift_id LIMIT 1',
                                [tenantId]
                            );
                            if (firstShift.length > 0) {
                                shiftId = firstShift[0].shift_id;
                                shiftCheckInTime = firstShift[0].check_in_time;
                            }
                        }
                    }
                }
            }

            if (!shiftId) {
                throw new Error('No shift available for assignment.');
            }

            if (shiftRows.length === 0) {
                await connection.execute(
                    `INSERT INTO tb_employee_shifts (employee_id, shift_id, assigned_date) 
                     VALUES (?, ?, ?)`,
                    [attendanceData.employee_id, shiftId, attendanceData.date]
                );
            }

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

    getEmployeeShiftForDate: async (tenantId, employeeId, date) => {
        try {
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

    updateCheckOut: async (tenantId, employeeId, date, checkOutTime) => {
        try {
            const query = `
                UPDATE tb_attendance a
                JOIN employee_details ed ON a.employee_id = ed.id
                SET a.check_out = ?, a.updated_at = NOW()
                WHERE a.employee_id = ? AND a.date = ? AND ed.tenant_id = ?
            `;
            
            const [result] = await pool.execute(query, [checkOutTime, employeeId, date, tenantId]);
            
            if (result.affectedRows === 0) {
                throw new Error('Attendance record not found for update');
            }
            
            return { employee_id: employeeId, date: date, check_out: checkOutTime };
        } catch (error) {
            console.error('Error in Attendance.updateCheckOut:', error);
            throw error;
        }
    },

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

    markCheckIn: async (tenantId, employeeId, checkInTime, status = 'Present') => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const eCheckQuery = 'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?';
            const [eCheck] = await connection.execute(eCheckQuery, [employeeId, tenantId]);
            if (eCheck.length === 0) throw new Error("Employee not found in tenant");

            const shiftQuery = `
                SELECT es.shift_id, s.check_in_time
                FROM tb_employee_shifts es 
                JOIN tb_shifts s ON es.shift_id = s.shift_id
                WHERE es.employee_id = ? AND es.assigned_date = CURDATE() AND s.tenant_id = ?
                LIMIT 1
            `;
            
            const [shiftRows] = await connection.execute(shiftQuery, [employeeId, tenantId]);
            
            let shiftId = null;
            let shiftCheckInTime = '09:00:00';
            
            if (shiftRows.length > 0) {
                shiftId = shiftRows[0].shift_id;
                shiftCheckInTime = shiftRows[0].check_in_time;
            } else {
                const [defaultShift] = await connection.execute(
                    'SELECT shift_id, check_in_time FROM tb_shifts WHERE tenant_id = ? ORDER BY shift_id LIMIT 1',
                    [tenantId]
                );
                if (defaultShift.length > 0) {
                    shiftId = defaultShift[0].shift_id;
                    shiftCheckInTime = defaultShift[0].check_in_time;
                    
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
                
                const gracePeriod = new Date(shiftTime.getTime() + 15 * 60000);
                if (checkInDateTime > gracePeriod) {
                    finalStatus = 'Delayed';
                }
            }

            const today = new Date().toISOString().split('T')[0];
            
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
    }
};

module.exports = Attendance;