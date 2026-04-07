// backend/controllers/attendanceController.js
const Attendance = require('../models/attendanceModel');
const Employee = require('../models/employeeModel');
const FaceRecognition = require('../utils/faceRecognition');
const Shift = require('../models/shiftModel');
const pool = require('../config/database');

const attendanceController = {
    // ==================== EXISTING METHODS ====================

    // Get all attendance records
    getAllAttendance: async (req, res) => {
        try {
            const filters = {
                date: req.query.date || new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0],
                status: req.query.status || 'all'
            };

            const attendanceData = await Attendance.getAll(req.tenantId, filters);
            const stats = await Attendance.getStatistics(req.tenantId, filters.date);

            res.json({
                attendance: attendanceData,
                statistics: stats
            });
        } catch (error) {
            console.error('Get attendance error:', error);
            res.status(500).json({ message: 'Server error while fetching attendance data' });
        }
    },

    // Get employee attendance history
    getEmployeeHistory: async (req, res) => {
        try {
            const { employeeId } = req.params;

            const history = await Attendance.getEmployeeHistory(req.tenantId, employeeId);
            const stats = await Attendance.getEmployeeHistoryStats(req.tenantId, employeeId);

            res.json({
                history: history,
                statistics: stats
            });
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

            console.log('👤 Approving attendance - User ID:', userId);

            const [employees] = await pool.execute(
                'SELECT id, user_id FROM employee_details WHERE user_id = ?',
                [userId]
            );

            if (employees.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Your user account is not linked to an employee record.'
                });
            }

            const employee = employees[0];
            await Attendance.approve(req.tenantId, attendanceId, employee.id);

            res.json({
                success: true,
                message: 'Attendance approved successfully!'
            });

        } catch (error) {
            console.error('Approve attendance error:', error);
            if (error.message === 'Attendance record not found') {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance record not found'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Server error while approving attendance'
            });
        }
    },

    // Reject attendance
    rejectAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;
            const { remarks } = req.body;
            const userId = req.user.id;

            const [employees] = await pool.execute(
                'SELECT id, user_id FROM employee_details WHERE user_id = ?',
                [userId]
            );

            if (employees.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Your user account is not linked to an employee record.'
                });
            }

            const employee = employees[0];
            await Attendance.reject(req.tenantId, attendanceId, employee.id, remarks);

            res.json({
                success: true,
                message: 'Attendance marked as leave!'
            });

        } catch (error) {
            console.error('Reject attendance error:', error);
            if (error.message === 'Attendance record not found') {
                return res.status(404).json({
                    success: false,
                    message: 'Attendance record not found'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Server error while rejecting attendance'
            });
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

    // Mark attendance (for admin) - UPDATED with new logic
    markAttendance: async (req, res) => {
        try {
            const { employee_id, type, date, check_in_time, check_out_time } = req.body;

            console.log('🎯 Marking attendance:', { employee_id, type, date });

            if (!employee_id || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID and type are required'
                });
            }

            const today = date || new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const currentDateTime = new Date();

            const attendanceExists = await Attendance.checkExists(req.tenantId, employee_id, today);

            let result;

            if (attendanceExists) {
                if (type === 'check_out') {
                    const checkOutTime = check_out_time || currentDateTime;
                    result = await Attendance.updateCheckOut(req.tenantId, employee_id, today, checkOutTime);
                    console.log('✅ Updated check-out:', result);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Attendance already marked for today'
                    });
                }
            } else {
                if (type === 'check_in') {
                    const checkInTime = check_in_time || currentDateTime;
                    result = await Attendance.create(req.tenantId, {
                        employee_id,
                        date: today,
                        check_in: checkInTime,
                        status: 'Present'
                    });
                    console.log('✅ Created check-in:', result);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot check out without checking in first'
                    });
                }
            }

            res.json({
                success: true,
                message: `Attendance ${type} marked successfully`,
                attendance: result
            });

        } catch (error) {
            console.error('❌ Mark attendance error:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking attendance: ' + error.message
            });
        }
    },

    getMyTodayAttendance: async (req, res) => {
        try {
            const { date } = req.query;
            const userId = req.user.id;

            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            const today = date || new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const allAttendance = await Attendance.getAll(req.tenantId, { date: today });
            const myAttendance = allAttendance.find(record => record.employee_id === employee.employee_id);

            res.json({
                success: true,
                attendance: myAttendance || {
                    employee_id: employee.employee_id,
                    check_in_time: null,
                    check_out_time: null,
                    status: 'Not Checked In',
                    date: today
                }
            });
        } catch (error) {
            console.error('Get my today attendance error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching attendance'
            });
        }
    },

    getMyHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const employee = await Employee.getByUserId(req.tenantId, userId);
            
            if (!employee || !employee.employee_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            const history = await Attendance.getEmployeeHistory(req.tenantId, employee.employee_id);

            res.json({
                success: true,
                history: history
            });
        } catch (error) {
            console.error('Get my history error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching history'
            });
        }
    },

    // Mark my attendance - UPDATED with new logic
    markMyAttendance: async (req, res) => {
        try {
            const { type, date, check_in_time, check_out_time } = req.body;
            const userId = req.user.id;

            console.log('🎯 Marking attendance for user:', userId, 'type:', type);

            if (!type) {
                return res.status(400).json({
                    success: false,
                    message: 'Type (check_in/check_out) is required'
                });
            }

            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            const employeeId = employee.employee_id;
            const today = date || new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const currentDateTime = new Date();

            const attendanceExists = await Attendance.checkExists(req.tenantId, employeeId, today);

            let result;

            if (attendanceExists) {
                if (type === 'check_out') {
                    const checkOutTime = check_out_time || currentDateTime;
                    result = await Attendance.updateCheckOut(req.tenantId, employeeId, today, checkOutTime);
                    console.log('✅ Updated check-out:', result);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Attendance already marked for today'
                    });
                }
            } else {
                if (type === 'check_in') {
                    const checkInTime = check_in_time || currentDateTime;
                    result = await Attendance.create(req.tenantId, {
                        employee_id: employeeId,
                        date: today,
                        check_in: checkInTime,
                        status: 'Present'
                    });
                    console.log('✅ Created check-in:', result);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot check out without checking in first'
                    });
                }
            }

            res.json({
                success: true,
                message: `Attendance ${type} marked successfully`,
                attendance: result
            });

        } catch (error) {
            console.error('❌ Mark my attendance error:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking attendance: ' + error.message
            });
        }
    },

    // Identify employee by face and mark attendance - UPDATED with half-day logic
    identifyAndMarkAttendance: async (req, res) => {
        try {
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Face image is required'
                });
            }

            console.log('🔍 Starting face identification for attendance...');

            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);

            if (!faceEncoding) {
                return res.json({
                    success: false,
                    message: 'No face detected in the image. Please ensure face is clearly visible.'
                });
            }

            const employees = await Employee.getAllWithFaceEncodings(req.tenantId);
            let identifiedEmployee = null;
            let highestSimilarity = 0;

            for (const employee of employees) {
                if (employee.face_encoding) {
                    try {
                        const storedData = JSON.parse(employee.face_encoding);
                        const storedEncoding = storedData.encoding;
                        const similarity = FaceRecognition.compareFaceSimilarity(storedEncoding, faceEncoding);

                        if (similarity > highestSimilarity && similarity > 0.53) {
                            highestSimilarity = similarity;
                            identifiedEmployee = employee;
                        }
                    } catch (error) {
                        console.error('Error parsing face encoding for employee:', employee.employee_id);
                    }
                }
            }

            if (!identifiedEmployee) {
                return res.json({
                    success: false,
                    message: 'No matching employee found. Please ensure you are enrolled in the system.'
                });
            }

            console.log(`✅ Employee identified: ${identifiedEmployee.employee_id}`);

            const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const currentTime = new Date();

            const employeeShift = await Shift.getEmployeeShiftForDate(req.tenantId, identifiedEmployee.employee_id, today);

            if (!employeeShift) {
                return res.json({
                    success: false,
                    message: 'No shift assigned for today. Please contact administrator.'
                });
            }

            const existingAttendance = await Attendance.getByEmployeeAndDate(req.tenantId, identifiedEmployee.employee_id, today);

            if (existingAttendance && existingAttendance.check_in) {
                return res.json({
                    success: false,
                    message: 'Attendance already marked for today.'
                });
            }

            // Create attendance record with automatic status calculation
            const attendanceData = {
                employee_id: identifiedEmployee.employee_id,
                date: today,
                check_in: currentTime,
                remarks: `Face recognition check-in (${(highestSimilarity * 100).toFixed(1)}% match)`
            };

            const attendanceResult = await Attendance.create(req.tenantId, attendanceData);

            res.json({
                success: true,
                message: `Attendance marked successfully! Status: ${attendanceResult.status}`,
                employee: {
                    id: identifiedEmployee.employee_id,
                    name: `${identifiedEmployee.first_name} ${identifiedEmployee.last_name}`,
                    department: identifiedEmployee.department_name
                },
                attendance: {
                    status: attendanceResult.status,
                    is_half_day: attendanceResult.is_half_day,
                    half_day_reason: attendanceResult.half_day_reason,
                    check_in_time: currentTime.toLocaleTimeString(),
                    shift_name: employeeShift.shift_name,
                    shift_check_in: employeeShift.check_in_time
                },
                confidence: `${(highestSimilarity * 100).toFixed(1)}%`
            });

        } catch (error) {
            console.error('❌ Identify and mark attendance error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during face recognition attendance: ' + error.message
            });
        }
    },

    // Verify face and mark attendance for logged-in user - UPDATED
    verifyMyFaceAndMarkAttendance: async (req, res) => {
        try {
            const file = req.file;
            const userId = req.user.id;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Face image is required'
                });
            }

            console.log(`🔍 Verifying face for logged-in user: ${userId}`);

            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            if (!employee.face_encoding) {
                return res.json({
                    success: false,
                    message: 'Face not enrolled. Please enroll first.',
                    redirectTo: '/profile/face-enrollment'
                });
            }

            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);

            if (!faceEncoding) {
                return res.json({
                    success: false,
                    message: 'No face detected. Please ensure face is clearly visible.'
                });
            }

            const storedData = JSON.parse(employee.face_encoding);
            const storedEncoding = storedData.encoding;
            const similarity = FaceRecognition.compareFaceSimilarity(storedEncoding, faceEncoding);
            const similarityPercent = (similarity * 100).toFixed(1);

            const REQUIRED_SIMILARITY = 0.53;

            if (similarity < REQUIRED_SIMILARITY) {
                return res.json({
                    success: false,
                    message: `Face verification failed (${similarityPercent}% match). Please try again.`,
                    confidence: similarity,
                    needsRetry: true
                });
            }

            console.log(`✅ Face verified! ${similarityPercent}% match`);

            const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const currentTime = new Date();

            let employeeShift = await Shift.getEmployeeShiftForDate(req.tenantId, employee.employee_id, today);

            if (!employeeShift) {
                return res.json({
                    success: false,
                    message: 'No shift assigned for today. Please contact administrator.'
                });
            }

            const existingAttendance = await Attendance.getByEmployeeAndDate(req.tenantId, employee.employee_id, today);

            if (existingAttendance && existingAttendance.check_in) {
                return res.json({
                    success: false,
                    message: 'Attendance already marked for today.'
                });
            }

            // Create attendance with automatic status calculation
            const attendanceData = {
                employee_id: employee.employee_id,
                date: today,
                check_in: currentTime,
                remarks: `Face verified check-in (${similarityPercent}% confidence)`
            };

            const attendanceResult = await Attendance.create(req.tenantId, attendanceData);

            res.json({
                success: true,
                message: `Attendance marked successfully!`,
                employee: {
                    name: `${employee.first_name} ${employee.last_name}`,
                    department: employee.department_name
                },
                attendance: {
                    status: attendanceResult.status,
                    is_half_day: attendanceResult.is_half_day,
                    half_day_reason: attendanceResult.half_day_reason,
                    check_in_time: currentTime.toLocaleTimeString(),
                    shift: employeeShift.shift_name,
                    shift_check_in: employeeShift.check_in_time
                },
                confidence: `${similarityPercent}%`
            });

        } catch (error) {
            console.error('❌ Face verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during face verification: ' + error.message
            });
        }
    },

    // Mark check-out - UPDATED with half-day calculation
    markCheckOut: async (req, res) => {
        try {
            const { employee_id, check_out_time } = req.body;
            const userId = req.user.id;

            let targetEmployeeId = employee_id;

            if (!targetEmployeeId) {
                const employee = await Employee.getByUserId(req.tenantId, userId);
                if (!employee || !employee.employee_id) {
                    return res.status(404).json({
                        success: false,
                        message: 'Employee record not found'
                    });
                }
                targetEmployeeId = employee.employee_id;
            }

            const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const checkOutTime = check_out_time || new Date();

            const result = await Attendance.updateCheckOut(req.tenantId, targetEmployeeId, today, checkOutTime);

            res.json({
                success: true,
                message: result.is_half_day ? 
                    `Check-out successful. Status updated to Half Day: ${result.half_day_reason}` : 
                    `Check-out successful. Worked hours: ${result.worked_hours.toFixed(2)}`,
                attendance: result
            });

        } catch (error) {
            console.error('❌ Check-out error:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking check-out: ' + error.message
            });
        }
    },

    // Get employee attendance percentage
    getEmployeeAttendancePercentage: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.query;

            if (!employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID is required'
                });
            }

            const percentage = await Attendance.getMonthlyPercentage(req.tenantId, employeeId, month, year);

            res.json({
                success: true,
                attendance_percentage: percentage,
                employee_id: employeeId,
                month: month || new Date().getMonth() + 1,
                year: year || new Date().getFullYear()
            });

        } catch (error) {
            console.error('❌ Error in getEmployeeAttendancePercentage:', error);
            res.status(500).json({
                success: false,
                message: 'Error calculating attendance percentage'
            });
        }
    },

   // Get monthly attendance summary for an employee
getMonthlyAttendanceSummary: async (req, res) => {
    try {
        const { employeeId } = req.params;
        let { month, year } = req.query;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        // Get the actual employee ID from the database if employeeId is a code
        let actualEmployeeId = employeeId;
        
        // Check if employeeId is numeric or a code
        if (isNaN(employeeId)) {
            const [employee] = await pool.execute(
                'SELECT id FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
                [employeeId, req.tenantId]
            );
            if (employee.length > 0) {
                actualEmployeeId = employee[0].id;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }
        }

        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        const summary = await Attendance.getMonthlyAttendanceSummary(
            req.tenantId, 
            actualEmployeeId, 
            parseInt(targetMonth), 
            parseInt(targetYear)
        );

        res.json({
            success: true,
            summary: summary,
            employee_id: employeeId,
            month: targetMonth,
            year: targetYear
        });

    } catch (error) {
        console.error('❌ Error in getMonthlyAttendanceSummary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance summary'
        });
    }
},

    // Get attendance records for salary calculation
    getAttendanceForSalary: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.query;

            if (!employeeId || !month || !year) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID, month, and year are required'
                });
            }

            const attendanceRecords = await Attendance.getAttendanceForSalary(
                req.tenantId,
                employeeId,
                parseInt(month),
                parseInt(year)
            );

            res.json({
                success: true,
                attendance: attendanceRecords,
                employee_id: employeeId,
                month: month,
                year: year
            });

        } catch (error) {
            console.error('❌ Error in getAttendanceForSalary:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching attendance for salary calculation'
            });
        }
    }
};

module.exports = attendanceController;