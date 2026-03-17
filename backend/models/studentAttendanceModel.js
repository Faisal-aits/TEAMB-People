// backend/models/studentAttendanceModel.js
const pool = require('../config/database');

const StudentAttendance = {
    // Get student's own attendance history - FIXED VERSION
    getStudentAttendance: async (studentId, filters = {}) => {
        try {
            let query = `
                SELECT 
                    sa.*,
                    c.course_name,
                    c.course_code
                FROM student_attendance sa
                LEFT JOIN courses c ON sa.course_id = c.id
                WHERE sa.student_id = ?
            `;
            
            const params = [studentId];

            if (filters.start_date && filters.end_date) {
                query += ' AND sa.attendance_date BETWEEN ? AND ?';
                params.push(filters.start_date, filters.end_date);
            }

            query += ' ORDER BY sa.attendance_date DESC';

            // Handle limit separately to avoid parameter binding issues
            if (filters.limit) {
                const limit = parseInt(filters.limit);
                if (!isNaN(limit) && limit > 0) {
                    query += ` LIMIT ${limit}`;
                }
            }

            console.log('getStudentAttendance SQL:', query);
            console.log('getStudentAttendance Params:', params);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error in getStudentAttendance:', error);
            throw error;
        }
    },

    // Get today's attendance for student
    getTodaysAttendance: async (studentId) => {
        try {
            const query = `
                SELECT 
                    sa.*,
                    c.course_name,
                    c.course_code
                FROM student_attendance sa
                LEFT JOIN courses c ON sa.course_id = c.id
                WHERE sa.student_id = ? 
                AND DATE(sa.attendance_date) = CURDATE()
            `;
            
            console.log('getTodaysAttendance SQL:', query);
            console.log('getTodaysAttendance Params:', [studentId]);

            const [rows] = await pool.execute(query, [studentId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getTodaysAttendance:', error);
            throw error;
        }
    },

    // Get student ID from user ID
    getStudentIdFromUserId: async (userId) => {
        try {
            const query = 'SELECT id FROM students WHERE user_id = ?';
            console.log('getStudentIdFromUserId SQL:', query);
            console.log('getStudentIdFromUserId Params:', [userId]);

            const [rows] = await pool.execute(query, [userId]);
            return rows.length > 0 ? rows[0].id : null;
        } catch (error) {
            console.error('Error in getStudentIdFromUserId:', error);
            throw error;
        }
    },

    // Create new student attendance
    create: async (attendanceData) => {
        try {
            const {
                student_id,
                course_id,
                attendance_date,
                check_in_time,
                check_out_time,
                total_hours,
                status,
                attendance_type,
                remarks,
                created_by
            } = attendanceData;

            const query = `
                INSERT INTO student_attendance (
                    student_id, course_id, attendance_date, check_in_time, 
                    check_out_time, total_hours, status, attendance_type, 
                    remarks, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                student_id, course_id, attendance_date, check_in_time,
                check_out_time, total_hours || 0, status, attendance_type || 'manual',
                remarks || '', created_by
            ];

            console.log('create Attendance SQL:', query);
            console.log('create Attendance Params:', params);

            const [result] = await pool.execute(query, params);
            return result.insertId;
        } catch (error) {
            console.error('Error in create attendance:', error);
            throw error;
        }
    },

    // Update student attendance
    update: async (id, attendanceData) => {
        try {
            const {
                student_id,
                course_id,
                attendance_date,
                check_in_time,
                check_out_time,
                total_hours,
                status,
                attendance_type,
                remarks
            } = attendanceData;

            const query = `
                UPDATE student_attendance SET 
                    student_id = ?, course_id = ?, attendance_date = ?, 
                    check_in_time = ?, check_out_time = ?, total_hours = ?, 
                    status = ?, attendance_type = ?, remarks = ?, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                student_id, course_id, attendance_date, check_in_time,
                check_out_time, total_hours || 0, status, attendance_type || 'manual',
                remarks || '', id
            ];

            console.log('update Attendance SQL:', query);
            console.log('update Attendance Params:', params);

            const [result] = await pool.execute(query, params);
            return result.affectedRows;
        } catch (error) {
            console.error('Error in update attendance:', error);
            throw error;
        }
    },

    // Check if attendance already exists for student on date
    checkAttendanceExists: async (studentId, attendanceDate, excludeId = null) => {
        try {
            let query = `
                SELECT id FROM student_attendance 
                WHERE student_id = ? AND DATE(attendance_date) = DATE(?)
            `;
            
            const params = [studentId, attendanceDate];

            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }

            console.log('checkAttendanceExists SQL:', query);
            console.log('checkAttendanceExists Params:', params);

            const [rows] = await pool.execute(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in checkAttendanceExists:', error);
            throw error;
        }
    },

    // Get student details
    getStudentDetails: async (studentId) => {
        try {
            const query = `
                SELECT 
                    s.*,
                    c.course_name,
                    c.course_code
                FROM students s
                LEFT JOIN courses c ON s.course_id = c.id
                WHERE s.id = ?
            `;

            console.log('getStudentDetails SQL:', query);
            console.log('getStudentDetails Params:', [studentId]);

            const [rows] = await pool.execute(query, [studentId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getStudentDetails:', error);
            throw error;
        }
    },

    // Get student attendance by ID
    getStudentAttendanceById: async (id) => {
        try {
            const query = `
                SELECT 
                    sa.*,
                    c.course_name,
                    c.course_code
                FROM student_attendance sa
                LEFT JOIN courses c ON sa.course_id = c.id
                WHERE sa.id = ?
            `;

            console.log('getStudentAttendanceById SQL:', query);
            console.log('getStudentAttendanceById Params:', [id]);

            const [rows] = await pool.execute(query, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in getStudentAttendanceById:', error);
            throw error;
        }
    },

    // Alternative method: Simple query without LIMIT parameter binding issues
    getStudentAttendanceSimple: async (studentId, limit = 30) => {
        try {
            const query = `
                SELECT 
                    sa.*,
                    c.course_name,
                    c.course_code
                FROM student_attendance sa
                LEFT JOIN courses c ON sa.course_id = c.id
                WHERE sa.student_id = ?
                ORDER BY sa.attendance_date DESC
                LIMIT ${parseInt(limit)}
            `;
            
            console.log('getStudentAttendanceSimple SQL:', query);
            console.log('getStudentAttendanceSimple Params:', [studentId]);

            const [rows] = await pool.execute(query, [studentId]);
            return rows;
        } catch (error) {
            console.error('Error in getStudentAttendanceSimple:', error);
            throw error;
        }
    }
};

module.exports = StudentAttendance;