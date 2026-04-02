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

    // Approve attendance - UPDATED WITH FLEXIBLE APPROACH
    approveAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;
            const userId = req.user.id;

            console.log('👤 Approving attendance - User ID:', userId);

            // ✅ FIXED: Find employee by user_id, not id
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
            console.log('✅ Found employee record:', {
                employeeId: employee.id,
                userId: employee.user_id
            });

            // Approve the attendance using employee.id (the employee_details id)
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

    // Reject attendance - FIXED with correct logic
    rejectAttendance: async (req, res) => {
        try {
            const { attendanceId } = req.params;
            const { remarks } = req.body;
            const userId = req.user.id;

            console.log('👤 Rejecting attendance - User ID:', userId);

            // ✅ FIXED: Find employee by user_id, not id
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
            console.log('✅ Found employee record:', {
                employeeId: employee.id,
                userId: employee.user_id
            });

            // Reject the attendance using employee.id (the employee_details id)
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

    // Mark attendance (for admin)
    markAttendance: async (req, res) => {
        try {
            const { employee_id, type, date } = req.body;

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
                    result = await Attendance.updateCheckOut(req.tenantId, employee_id, today, currentDateTime);
                    console.log('✅ Updated check-out:', result);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Attendance already marked for today'
                    });
                }
            } else {
                if (type === 'check_in') {
                    result = await Attendance.create(req.tenantId, {
                        employee_id,
                        date: today,
                        check_in: currentDateTime,
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

            console.log('👤 Getting today attendance for user:', userId);

            // ✅ Pass req.tenantId as first argument
            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            const today = date || new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            console.log('📅 Looking for attendance on:', today, 'for employee:', employee.employee_id);

            const allAttendance = await Attendance.getAll(req.tenantId, { date: today });

            // ✅ Fix .find() — remove the stray req.tenantId argument
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

            console.log('📖 Getting history for user:', userId);

            // ✅ Pass req.tenantId as first argument
            const employee = await Employee.getByUserId(req.tenantId, userId);
            if (!employee || !employee.employee_id) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee record not found'
                });
            }

            console.log('🔍 Getting history for employee:', employee.employee_id);
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

    markMyAttendance: async (req, res) => {
        try {
            const { type, date } = req.body;
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

            console.log('💾 Creating attendance for:', { employeeId, type, today });

            const attendanceExists = await Attendance.checkExists(req.tenantId, employeeId, today);

            let result;

            if (attendanceExists) {
                if (type === 'check_out') {
                    result = await Attendance.updateCheckOut(req.tenantId, employeeId, today, currentDateTime);
                    console.log('✅ Updated check-out:', result);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Attendance already marked for today'
                    });
                }
            } else {
                if (type === 'check_in') {
                    result = await Attendance.create(req.tenantId, {
                        employee_id: employeeId,
                        date: today,
                        check_in: currentDateTime,
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



    // Identify employee by face and mark attendance
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

            // Step 1: Extract face encoding from captured image
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

            console.log(`👥 Checking against ${employees.length} enrolled employees...`);

            for (const employee of employees) {
                if (employee.face_encoding) {
                    try {
                        const storedData = JSON.parse(employee.face_encoding);
                        const storedEncoding = storedData.encoding;

                        // ✅ UPDATED: 40% similarity threshold (more lenient)
                        const similarity = FaceRecognition.compareFaceSimilarity(storedEncoding, faceEncoding);

                        console.log(`📊 ${employee.employee_id}: ${(similarity * 100).toFixed(1)}% similarity`);

                        // ✅ UPDATED: Find best match above 53% threshold
                        if (similarity > highestSimilarity && similarity > 0.53) {
                            highestSimilarity = similarity;
                            identifiedEmployee = employee;
                            console.log(`🎯 New best match: ${employee.employee_id} (${(similarity * 100).toFixed(1)}%)`);
                        }
                    } catch (error) {
                        console.error('Error parsing face encoding for employee:', employee.employee_id);
                    }
                }
            }

            if (!identifiedEmployee) {
                console.log('❌ No employee found with similarity > 53%');
                return res.json({
                    success: false,
                    message: 'No matching employee found. Please ensure you are enrolled in the system.'
                });
            }

            console.log(`✅ Employee identified: ${identifiedEmployee.employee_id} (Similarity: ${(highestSimilarity * 100).toFixed(1)}%)`);

            // Step 3: Get today's date
            const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const currentTime = new Date();

            // Step 4: Get employee's shift for today
            const employeeShift = await Shift.getEmployeeShiftForDate(req.tenantId, identifiedEmployee.employee_id, today);

            if (!employeeShift) {
                return res.json({
                    success: false,
                    message: 'No shift assigned for today. Please contact administrator.'
                });
            }

            // Step 5: Check if attendance already exists for today
            const existingAttendance = await Attendance.getByEmployeeAndDate(req.tenantId, identifiedEmployee.employee_id, today);

            if (existingAttendance && existingAttendance.check_in) {
                return res.json({
                    success: false,
                    message: 'Attendance already marked for today.'
                });
            }

            // Step 6: Determine status based on shift timing with 15-minute concession
            let status = 'Present';
            const shiftCheckInTime = new Date(`${today}T${employeeShift.check_in_time}`);
            const checkInTime = new Date();

            // Calculate grace period (shift start time + 15 minutes)
            const gracePeriod = new Date(shiftCheckInTime.getTime() + 15 * 60000);

            // If check-in is within 15 minutes of shift start → Present
            // If check-in is after grace period → Delayed
            if (checkInTime > gracePeriod) {
                status = 'Delayed';
                console.log(`⏰ Marked as Delayed: Check-in at ${checkInTime.toLocaleTimeString()} is after grace period (${gracePeriod.toLocaleTimeString()})`);
            } else {
                console.log(`✅ Marked as Present: Check-in at ${checkInTime.toLocaleTimeString()} is within grace period`);
            }

            // Step 7: Create attendance record
            const attendanceData = {
                employee_id: identifiedEmployee.employee_id,
                shift_id: employeeShift.shift_id,
                date: today,
                check_in: checkInTime,
                status: status,
                remarks: `Auto-marked via face recognition (Similarity: ${(highestSimilarity * 100).toFixed(1)}%)`
            };

            const attendanceResult = await Attendance.create(req.tenantId, attendanceData);

            // Step 8: Create attendance history record
            const historyData = {
                employee_id: identifiedEmployee.employee_id,
                date: today,
                description: `Checked in via face recognition - ${status}`,
                status: status
            };

            await Attendance.createHistory(req.tenantId, historyData);

            console.log(`✅ Attendance marked for ${identifiedEmployee.employee_id}: ${status}`);

            // Step 9: Return success response
            res.json({
                success: true,
                message: `Attendance marked successfully! Status: ${status}`,
                employee: {
                    id: identifiedEmployee.employee_id,
                    name: `${identifiedEmployee.first_name} ${identifiedEmployee.last_name}`,
                    department: identifiedEmployee.department_name
                },
                attendance: {
                    status: status,
                    check_in_time: checkInTime.toLocaleTimeString(),
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
    // ==================== NEW FACE RECOGNITION METHOD ====================
    // attendanceController.js - ADD THIS METHOD
    verifyMyFaceAndMarkAttendance: async (req, res) => {
        try {
            const file = req.file;
            const userId = req.user.id; // From auth middleware

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

            console.log(`👤 Found employee: ${employee.employee_id}`);

            // Step 2: Check if employee has face enrolled
            if (!employee.face_encoding) {
                return res.json({
                    success: false,
                    message: 'Face not enrolled. Please enroll first.',
                    redirectTo: '/profile/face-enrollment'
                });
            }

            // Step 3: Extract face encoding from captured image
            const faceEncoding = await FaceRecognition.extractFaceEncoding(file.buffer);

            if (!faceEncoding) {
                return res.json({
                    success: false,
                    message: 'No face detected. Please ensure face is clearly visible.'
                });
            }

            // Step 4: Parse ONLY logged-in user's encoding (not thousands!)
            const storedData = JSON.parse(employee.face_encoding);
            const storedEncoding = storedData.encoding;

            // Step 5: Compare ONLY with logged-in user
            const similarity = FaceRecognition.compareFaceSimilarity(
                storedEncoding,
                faceEncoding
            );

            const similarityPercent = (similarity * 100).toFixed(1);
            console.log(`📊 Similarity for ${employee.employee_id}: ${similarityPercent}%`);

            // Step 6: Check threshold (53% - as you requested)
            const REQUIRED_SIMILARITY = 0.53;

            if (similarity < REQUIRED_SIMILARITY) {
                console.log(`❌ Face verification failed: ${similarityPercent}% < 53%`);

                return res.json({
                    success: false,
                    message: `Face verification failed (${similarityPercent}% match). Please try again.`,
                    confidence: similarity,
                    needsRetry: true
                });
            }

            console.log(`✅ Face verified! Proceeding with attendance...`);

            // Step 7: Mark attendance (same as before but faster)
            const today = new Date().toLocaleString("sv-SE", {timeZone: "Asia/Kolkata"}).split(' ')[0];
            const currentTime = new Date();

            console.log(`🔍 Getting shift for employee ${employee.employee_id} on date ${today}`);

            let employeeShift = await Shift.getEmployeeShiftForDate(req.tenantId, employee.employee_id, today);

            if (!employeeShift) {
                console.log('⚠️ No shift found, checking default...');
                return res.json({
                    success: false,
                    message: 'No shift assigned for today. Please contact administrator.'
                });
            }

            console.log(`✅ Found shift: ${employeeShift.shift_name} (${employeeShift.check_in_time} - ${employeeShift.check_out_time})`);

            if (!employeeShift) {
                return res.json({
                    success: false,
                    message: 'No shift assigned for today.'
                });
            }

            // Check existing attendance
            const existingAttendance = await Attendance.getByEmployeeAndDate(req.tenantId, employee.employee_id, today);

            if (existingAttendance && existingAttendance.check_in) {
                return res.json({
                    success: false,
                    message: 'Attendance already marked for today.'
                });
            }

            // Determine status with 15-minute concession
            let status = 'Present';
            const shiftCheckInTime = new Date(`${today}T${employeeShift.check_in_time}`);
            const checkInTime = new Date();

            const gracePeriod = new Date(shiftCheckInTime.getTime() + 15 * 60000);
            if (checkInTime > gracePeriod) {
                status = 'Delayed';
                console.log(`⏰ Employee delayed: ${checkInTime.toLocaleTimeString()} > ${gracePeriod.toLocaleTimeString()}`);
            } else {
                console.log(`✅ Employee on time: ${checkInTime.toLocaleTimeString()} within grace period`);
            }

            // Create attendance
            const attendanceData = {
                employee_id: employee.employee_id,
                shift_id: employeeShift.shift_id,
                date: today,
                check_in: checkInTime,
                status: status,
                remarks: `Face verified (${similarityPercent} confidence)`
            };

            await Attendance.create(req.tenantId, attendanceData);

            // Create history
            await Attendance.createHistory(req.tenantId, {
                employee_id: employee.employee_id,
                date: today,
                description: `Face verified attendance - ${status}`,
                status: status
            });

            // Success response
            res.json({
                success: true,
                message: `Attendance marked successfully!`,
                employee: {
                    name: `${employee.first_name} ${employee.last_name}`,
                    department: employee.department_name
                },
                attendance: {
                    status: status,
                    check_in_time: checkInTime.toLocaleTimeString(),
                    shift: employeeShift.shift_name
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

    // Add this in attendanceController.js (at the end, before module.exports)
    getEmployeeAttendancePercentage: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.query;

            console.log('📊 Getting attendance percentage for:', employeeId);

            if (!employeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID is required'
                });
            }

            // Use the new model method
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
    }

};

module.exports = attendanceController;