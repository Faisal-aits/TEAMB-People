const pool = require('../config/database');

const Course = {
    
    // Get all courses
    getAll: async (filters = {}) => {
        try {
            let query = `
                SELECT 
                    c.*,
                    d.name as department_name,
                    COUNT(ce.student_id) as enrolled_students
                FROM courses c
                LEFT JOIN departments d ON c.department_id = d.id
                LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'enrolled'
                WHERE 1=1
            `;
            const params = [];

            if (filters.department) {
                query += ' AND c.department_id = ?';
                params.push(filters.department);
            }

            if (filters.instructor) {
                query += ' AND c.instructor LIKE ?';
                params.push(`%${filters.instructor}%`);
            }

            if (filters.level) {
                query += ' AND c.level = ?';
                params.push(filters.level);
            }

            if (filters.status) {
                query += ' AND c.status = ?';
                params.push(filters.status);
            }

            query += ' GROUP BY c.id ORDER BY c.course_name';

            const [rows] = await pool.execute(query, params);
            
            // Return dates as is - let frontend handle formatting
            return rows;
        } catch (error) {
            console.error('Error in Course.getAll:', error);
            throw error;
        }
    },

    // Get course by ID
    getById: async (id) => {
        try {
            const [rows] = await pool.execute(
                `SELECT 
                    c.*,
                    d.name as department_name,
                    COUNT(ce.student_id) as enrolled_students
                FROM courses c
                LEFT JOIN departments d ON c.department_id = d.id
                LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.status = 'enrolled'
                WHERE c.id = ?
                GROUP BY c.id`,
                [id]
            );
            
            if (rows.length === 0) return null;
            
            return rows[0];
        } catch (error) {
            console.error('Error in Course.getById:', error);
            throw error;
        }
    },

    // Create new course
    create: async (courseData) => {
        try {
            const [result] = await pool.execute(
                `INSERT INTO courses 
                (course_name, course_code, department_id, instructor, level, 
                 duration, schedule, status, description, max_students, start_date, end_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    courseData.course_name,
                    courseData.course_code,
                    courseData.department_id || null,
                    courseData.instructor || null,
                    courseData.level || null,
                    courseData.duration || null,
                    courseData.schedule || null,
                    courseData.status || 'open',
                    courseData.description || null,
                    courseData.max_students || null,
                    courseData.start_date || null,
                    courseData.end_date || null
                ]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error in Course.create:', error);
            throw error;
        }
    },

    // Update course
    update: async (id, courseData) => {
        try {
            await pool.execute(
                `UPDATE courses 
                 SET course_name = ?, course_code = ?, department_id = ?, instructor = ?,
                     level = ?, duration = ?, schedule = ?, status = ?, description = ?,
                     max_students = ?, start_date = ?, end_date = ?
                 WHERE id = ?`,
                [
                    courseData.course_name,
                    courseData.course_code,
                    courseData.department_id,
                    courseData.instructor,
                    courseData.level,
                    courseData.duration,
                    courseData.schedule,
                    courseData.status,
                    courseData.description,
                    courseData.max_students,
                    courseData.start_date,
                    courseData.end_date,
                    id
                ]
            );

            return true;
        } catch (error) {
            console.error('Error in Course.update:', error);
            throw error;
        }
    },

    // Delete course
    delete: async (id) => {
        try {
            await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
            return true;
        } catch (error) {
            console.error('Error in Course.delete:', error);
            throw error;
        }
    },

    // Get enrolled students for a course
    getEnrolledStudents: async (courseId) => {
        try {
            const [rows] = await pool.execute(
                `SELECT s.*, ce.enrollment_date, ce.status as enrollment_status
                 FROM course_enrollments ce
                 JOIN students s ON ce.student_id = s.id
                 WHERE ce.course_id = ? AND ce.status = 'enrolled'`,
                [courseId]
            );
            return rows;
        } catch (error) {
            console.error('Error in Course.getEnrolledStudents:', error);
            throw error;
        }
    },

    // Get enrolled students count for a course
    getEnrolledCount: async (courseId) => {
        try {
            const [rows] = await pool.execute(
                `SELECT COUNT(*) as count 
                 FROM course_enrollments 
                 WHERE course_id = ? AND status = 'enrolled'`,
                [courseId]
            );
            return rows[0].count;
        } catch (error) {
            console.error('Error in Course.getEnrolledCount:', error);
            throw error;
        }
    }
};

module.exports = Course;