// backend/controllers/attendanceController.js
const Attendance = require('./attendanceModel');
const Employee = require('../employee/employeeModel');
// const FaceRecognition = require('../utils/faceRecognition');
const Shift = require('../shift/shiftModel');
const {pool} = require('../../config/db');
const Salary = require('../salary/salaryModel');
const { getIndiaDate, getIndiaDateTime } = require('../../utils/indiaTime');
const { runAutoCheckout } = require('./autoCheckoutService');


const attendanceController = {
    // backend/controllers/attendanceController.js - Fix getAllAttendance

    getAllAttendance: async (req, res) => {
        try {
            const { date, status, start_date, end_date, department } = req.query;


            // Get today's date in the correct format
            const today = getIndiaDate();
            let targetDate = date || today;


            const filters = {
                date: targetDate,
                status: status || 'all',
                start_date: start_date,
                end_date: end_date,
                department: department
            };

            // Wrap in try-catch to prevent crashes
            let attendanceData = [];
            let stats = { total: 0, present: 0, delayed: 0, half_day: 0, on_leave: 0, absent: 0, pending: 0 };

            try {
                attendanceData = await Attendance.getAll(req.tenantId, filters);
                stats = await Attendance.getStatistics(req.tenantId, targetDate);
            } catch (dbError) {
                console.error('Database error in getAllAttendance:', dbError);
                // Return empty array instead of crashing
            }



            let holidays = [];
            try {
                const targetDateObj = new Date(targetDate);
                holidays = await Salary.getHolidays(req.tenantId, targetDateObj.getMonth() + 1, targetDateObj.getFullYear());
            } catch (err) {
                console.error('Error fetching holidays:', err);
            }
            const holidayDates = new Set(holidays.map(h => h.date));
            
            attendanceData = attendanceData.map(record => {
                if (holidayDates.has(record.date) && record.status === 'Absent') {
                    record.status = 'Holiday';
                }
                return record;
            });

            res.json({
                success: true,
                attendance: attendanceData || [],
                statistics: stats,
                holidays: holidays
            });
        } catch (error) {
            console.error('Get attendance error:', error);
            // Always return a valid response, never crash
            res.status(200).json({
                success: false,
                message: 'Error fetching attendance data',
                attendance: [],
                statistics: { total: 0, present: 0, delayed: 0, half_day: 0, on_leave: 0, absent: 0, pending: 0 },
                holidays: []
            });
        }
    },

    // Get employee attendance history
    getEmployeeHistory: async (req, res) => {
        try {
            const { employeeId } = req.params;
            let history = await Attendance.getEmployeeHistory(req.tenantId, employeeId);
            const stats = await Attendance.getEmployeeHistoryStats(req.tenantId, employeeId);
            
            let holidays = [];
            try {
                const today = new Date();
                holidays = await Salary.getHolidays(req.tenantId, today.getMonth() + 1, today.getFullYear());
                const holidayDates = new Set(holidays.map(h => h.date));
                history = history.map(record => {
                    if (holidayDates.has(record.date) && record.status === 'Absent') {
                        record.status = 'Holiday';
                    }
                    return record;
                });
            } catch (err) {
                console.error('Error fetching holidays for history:', err);
            }
            
            res.json({ history: history, statistics: stats, holidays: holidays });
        } catch (error) {
            console.error('Get employee history error:', error);
            res.status(500).json({ message: 'Server error while fetching employee history' });
        }
    },

    // Approve attendance
    approveAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;
            const userId = req.user.id;

            const [employees] = await pool.execute(
                'SELECT id, employee_id FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [userId, req.tenantId]
            );

            if (employees.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Your user account is not linked to an employee record.'
                });
            }

            const employee = employees[0];
            await Attendance.approve(req.tenantId, attendanceId, employee.id);

            res.json({ success: true, message: 'Attendance approved successfully!' });
        } catch (error) {
            console.error('Approve attendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Reject attendance
    rejectAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;
            const { remarks } = req.body;
            const userId = req.user.id;

            const [employees] = await pool.execute(
                'SELECT id, employee_id FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [userId, req.tenantId]
            );

            if (employees.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Your user account is not linked to an employee record.'
                });
            }

            const employee = employees[0];
            await Attendance.reject(req.tenantId, attendanceId, employee.id, remarks);

            res.json({ success: true, message: 'Attendance marked as leave!' });
        } catch (error) {
            console.error('Reject attendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get shifts
    getShifts: async (req, res) => {
        try {
            const shifts = await Attendance.getShifts(req.tenantId);
            res.json({ shifts });
        } catch (error) {
            console.error('Get shifts error:', error);
            res.status(500).json({ message: 'Server error while fetching shifts' });
        }
    },

    // Get attendance statistics
    getAttendanceStats: async (req, res) => {
        try {
            const { date } = req.query;
            const stats = await Attendance.getStatistics(req.tenantId, date);
            res.json({ statistics: stats });
        } catch (error) {
            console.error('Get attendance stats error:', error);
            res.status(500).json({ message: 'Server error while fetching statistics' });
        }
    },

    // Mark attendance (for admin)
    markAttendance: async (req, res) => {
        try {
            const { employee_id, type, date, check_in_time, check_out_time, latitude, longitude } = req.body;

            if (!employee_id || !type) {
                return res.status(400).json({ success: false, message: 'Employee ID and type are required' });
            }

            const today = date || getIndiaDate();
            const currentDateTime = getIndiaDateTime();
            const attendanceExists = await Attendance.checkExists(req.tenantId, employee_id, today);

            let result;

            if (attendanceExists) {
                if (type === 'check_out') {
                    const checkOutTime = check_out_time || currentDateTime;
                    result = await Attendance.updateCheckOut(req.tenantId, employee_id, today, checkOutTime, latitude, longitude);
                } else {
                    return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
                }
            } else {
                if (type === 'check_in') {
                    const checkInTime = check_in_time || currentDateTime;
                    result = await Attendance.create(req.tenantId, {
                        employee_id,
                        date: today,
                        check_in: checkInTime,
                        status: 'Present',
                        latitude,
                        longitude
                    });
                } else {
                    return res.status(400).json({ success: false, message: 'Cannot check out without checking in first' });
                }
            }

            res.json({ success: true, message: `Attendance ${type} marked successfully`, attendance: result });
        } catch (error) {
            console.error('❌ Mark attendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get current user's today attendance
    getMyTodayAttendance: async (req, res) => {
        try {
            const userId = req.user.id;
            const [employees] = await pool.execute(
                'SELECT id, auto_checkout_enabled FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [userId, req.tenantId]
            );

            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            const employeeId = employees[0].id;
            const today = getIndiaDate();
            const currentShift = await Shift.getEmployeeShiftForDate(req.tenantId, employeeId, today);

            const [attendance] = await pool.execute(
                `SELECT a.*, DATE_FORMAT(a.check_in, '%h:%i %p') as check_in_time,
                        DATE_FORMAT(a.check_out, '%h:%i %p') as check_out_time
                 FROM tb_attendance a
                 WHERE a.employee_id = ? AND a.date = ? AND a.tenant_id = ?`,
                [employeeId, today, req.tenantId]
            );

            res.json({
                success: true,
                auto_checkout_enabled: Boolean(employees[0].auto_checkout_enabled),
                shift: currentShift,
                attendance: attendance[0] || {
                    employee_id: employeeId,
                    check_in_time: null,
                    check_out_time: null,
                    status: 'Not Checked In',
                    date: today
                }
            });
        } catch (error) {
            console.error('Get my today attendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getMyAutoCheckoutSetting: async (req, res) => {
        try {
            const userId = req.user.id;
            const [employees] = await pool.execute(
                'SELECT id, auto_checkout_enabled FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [userId, req.tenantId]
            );

            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            const today = getIndiaDate();
            const shift = await Shift.getEmployeeShiftForDate(req.tenantId, employees[0].id, today);

            res.json({
                success: true,
                auto_checkout_enabled: Boolean(employees[0].auto_checkout_enabled),
                shift
            });
        } catch (error) {
            console.error('Get auto checkout setting error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateMyAutoCheckoutSetting: async (req, res) => {
        try {
            const userId = req.user.id;
            const enabled = req.body.enabled ?? req.body.auto_checkout_enabled;
            const normalizedEnabled = enabled === true || enabled === 1 || enabled === '1' || enabled === 'true';

            const [result] = await pool.execute(
                `UPDATE employee_details
                 SET auto_checkout_enabled = ?, updated_at = NOW()
                 WHERE employee_id = ? AND tenant_id = ?`,
                [normalizedEnabled ? 1 : 0, userId, req.tenantId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            res.json({
                success: true,
                auto_checkout_enabled: normalizedEnabled,
                message: normalizedEnabled ? 'Auto check-out enabled' : 'Auto check-out disabled'
            });
        } catch (error) {
            console.error('Update auto checkout setting error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get current user's history
    getMyHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const [employees] = await pool.execute(
                'SELECT id FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [userId, req.tenantId]
            );

            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            const employeeId = employees[0].id;
            let history = await Attendance.getEmployeeHistory(req.tenantId, employeeId);

            let holidays = [];
            try {
                const today = new Date();
                holidays = await Salary.getHolidays(req.tenantId, today.getMonth() + 1, today.getFullYear());
                const holidayDates = new Set(holidays.map(h => h.date));
                history = history.map(record => {
                    if (holidayDates.has(record.date) && record.status === 'Absent') {
                        record.status = 'Holiday';
                    }
                    return record;
                });
            } catch (err) {
                console.error('Error fetching holidays for my history:', err);
            }

            res.json({ success: true, history: history, holidays: holidays });
        } catch (error) {
            console.error('Get my history error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Mark my attendance
    markMyAttendance: async (req, res) => {
        try {
            const { type, date, check_in_time, check_out_time, latitude, longitude } = req.body;
            const userId = req.user.id;

            if (!type) {
                return res.status(400).json({ success: false, message: 'Type is required' });
            }

            const [employees] = await pool.execute(
                'SELECT id, salary FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [userId, req.tenantId]
            );

            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            const employeeId = employees[0].id;
            const today = date || getIndiaDate();
            const currentDateTime = getIndiaDateTime();
            const attendanceExists = await Attendance.checkExists(req.tenantId, employeeId, today);

            let result;

            if (attendanceExists) {
                if (type === 'check_out') {
                    const checkOutTime = check_out_time || currentDateTime;
                    result = await Attendance.updateCheckOut(req.tenantId, employeeId, today, checkOutTime, latitude, longitude);
                } else {
                    return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
                }
            } else {
                if (type === 'check_in') {
                    const checkInTime = check_in_time || currentDateTime;
                    result = await Attendance.create(req.tenantId, {
                        employee_id: employeeId,
                        date: today,
                        check_in: checkInTime,
                        status: 'Present',
                        latitude,
                        longitude
                    });
                } else {
                    return res.status(400).json({ success: false, message: 'Cannot check out without checking in first' });
                }
            }

            res.json({ success: true, message: `Attendance ${type} marked successfully`, attendance: result });
        } catch (error) {
            console.error('❌ Mark my attendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Verify face and mark attendance
    verifyMyFaceAndMarkAttendance: async (req, res) => {
        try {
            const file = req.file;
            const userId = req.user.id;

            if (!file) {
                return res.status(400).json({ success: false, message: 'Face image is required' });
            }

            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            if (!employee.face_encoding) {
                return res.json({ success: false, message: 'Face not enrolled. Please enroll first.' });
            }

            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            if (!faceEncoding) {
                return res.json({ success: false, message: 'No face detected. Please ensure face is clearly visible.' });
            }

            const storedData = JSON.parse(employee.face_encoding);
            const similarity = FaceRecognition.compareFaceSimilarity(storedData.encoding, faceEncoding);
            const similarityPercent = (similarity * 100).toFixed(1);

            if (similarity < 0.53) {
                return res.json({ success: false, message: `Face verification failed (${similarityPercent}% match)` });
            }

            const today = getIndiaDate();
            const currentTime = getIndiaDateTime();

            const attendanceResult = await Attendance.create(req.tenantId, {
                employee_id: employee.employee_id,
                date: today,
                check_in: currentTime,
                remarks: `Face verified check-in (${similarityPercent}% confidence)`
            });

            res.json({
                success: true,
                message: 'Attendance marked successfully!',
                attendance: { status: attendanceResult.status, check_in_time: currentTime.split(' ')[1] },
                confidence: `${similarityPercent}%`
            });
        } catch (error) {
            console.error('❌ Face verification error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Identify and mark attendance (admin)
    identifyAndMarkAttendance: async (req, res) => {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, message: 'Face image is required' });
            }

            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);
            if (!faceEncoding) {
                return res.json({ success: false, message: 'No face detected' });
            }

            const employees = await Employee.getAllWithFaceEncodings(req.tenantId);
            let identifiedEmployee = null;
            let highestSimilarity = 0;

            for (const employee of employees) {
                if (employee.face_encoding) {
                    const storedData = JSON.parse(employee.face_encoding);
                    const similarity = FaceRecognition.compareFaceSimilarity(storedData.encoding, faceEncoding);
                    if (similarity > highestSimilarity && similarity > 0.53) {
                        highestSimilarity = similarity;
                        identifiedEmployee = employee;
                    }
                }
            }

            if (!identifiedEmployee) {
                return res.json({ success: false, message: 'No matching employee found' });
            }

            const today = getIndiaDate();
            const currentTime = getIndiaDateTime();

            const attendanceResult = await Attendance.create(req.tenantId, {
                employee_id: identifiedEmployee.employee_id,
                date: today,
                check_in: currentTime,
                remarks: `Face recognition check-in (${(highestSimilarity * 100).toFixed(1)}% match)`
            });

            res.json({ success: true, message: 'Attendance marked successfully!', attendance: attendanceResult });
        } catch (error) {
            console.error('❌ Identify and mark attendance error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get employee attendance percentage
    getEmployeeAttendancePercentage: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.query;

            const [indiaYear, indiaMonth] = getIndiaDate().split('-');
            const targetMonth = month || Number(indiaMonth);
            const targetYear = year || Number(indiaYear);
            const percentage = await Attendance.getMonthlyPercentage(req.tenantId, employeeId, targetMonth, targetYear);

            res.json({ success: true, attendance_percentage: percentage });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get monthly attendance summary
    getMonthlyAttendanceSummary: async (req, res) => {
        try {
            const { employeeId } = req.params;
            let { month, year } = req.query;

            const [indiaYear, indiaMonth] = getIndiaDate().split('-');
            const targetMonth = month || Number(indiaMonth);
            const targetYear = year || Number(indiaYear);
            const summary = await Attendance.getMonthlyAttendanceSummary(req.tenantId, employeeId, parseInt(targetMonth), parseInt(targetYear));

            res.json({ success: true, summary });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Mark absent
    markAbsent: async (req, res) => {
        try {
            const userId = req.user.id;
            const today = getIndiaDate();

            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            const exists = await Attendance.checkExists(req.tenantId, employee.employee_id, today);
            if (!exists) {
                await Attendance.create(req.tenantId, {
                    employee_id: employee.employee_id,
                    date: today,
                    status: 'Absent',
                    remarks: 'Marked as absent by system'
                });
            }

            res.json({ success: true, message: 'Absent marked successfully' });
        } catch (error) {
            console.error('Error marking absent:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get attendance for salary calculation
    getAttendanceForSalary: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.query;

            const attendanceRecords = await Attendance.getAttendanceForSalary(req.tenantId, employeeId, parseInt(month), parseInt(year));
            res.json({ success: true, attendance: attendanceRecords });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Mark check-out
    markCheckOut: async (req, res) => {
        try {
            const { employee_id, check_out_time, latitude, longitude } = req.body;
            const userId = req.user.id;

            let targetEmployeeId = employee_id;
            if (!targetEmployeeId) {
                const employee = await Employee.getByUserId(req.tenantId, userId);
                targetEmployeeId = employee.employee_id;
            }

            const today = getIndiaDate();
            const checkOutTime = check_out_time || getIndiaDateTime();
            const result = await Attendance.updateCheckOut(req.tenantId, targetEmployeeId, today, checkOutTime, latitude, longitude);

            res.json({ success: true, message: 'Check-out successful', attendance: result });
        } catch (error) {
            console.error('❌ Check-out error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    runAutoCheckout: async (req, res) => {
        try {
            const result = await runAutoCheckout();
            res.json({
                success: true,
                message: `Auto check-out completed for ${result.checkedOutCount} employee(s).`,
                ...result
            });
        } catch (error) {
            console.error('Run auto checkout error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    markHalfDay: async (req, res) => {
        try {
            const { date, employee_id, mark_all, reason } = req.body;
            const targetDate = date || getIndiaDate();
            const adminUserId = req.user?.id || null;

            const result = await Attendance.markHalfDay(req.tenantId, {
                date: targetDate,
                employeeId: employee_id,
                markAll: Boolean(mark_all || employee_id === 'all'),
                reason,
                adminUserId
            });

            res.json({
                success: true,
                message: result.message,
                count: result.count
            });
        } catch (error) {
            console.error('Error marking half day:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to mark half day' });
        }
    }
};

module.exports = attendanceController;
