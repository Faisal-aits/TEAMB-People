const { pool } = require('../../config/db');

async function breakIn(tenantId, employeeId, breakDate, breakInTime) {
    try {
        // Check if employee has checked in today and has not checked out yet
        const [attendance] = await pool.execute(
            'SELECT * FROM tb_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ? AND check_in IS NOT NULL',
            [tenantId, employeeId, breakDate]
        );

        if (attendance.length === 0) {
            throw new Error('You must check in first before taking a break');
        }

        if (attendance[0].check_out) {
            throw new Error('Cannot take a break after checking out for the day');
        }

        // Check if there is already an active break
        const [activeBreak] = await pool.execute(
            'SELECT * FROM tb_breaks WHERE tenant_id = ? AND employee_id = ? AND break_date = ? AND status = "Active"',
            [tenantId, employeeId, breakDate]
        );

        if (activeBreak.length > 0) {
            throw new Error('You are already on an active break');
        }

        const [result] = await pool.execute(
            'INSERT INTO tb_breaks (tenant_id, employee_id, break_date, break_in_time, status) VALUES (?, ?, ?, ?, "Active")',
            [tenantId, employeeId, breakDate, breakInTime]
        );

        return result.insertId;
    } catch (error) {
        console.error('Error in breakIn model:', error);
        throw error;
    }
}

async function breakOut(tenantId, employeeId, breakDate, breakOutTime) {
    try {
        // Find the active break
        const [activeBreak] = await pool.execute(
            'SELECT * FROM tb_breaks WHERE tenant_id = ? AND employee_id = ? AND break_date = ? AND status = "Active" ORDER BY break_in_time DESC LIMIT 1',
            [tenantId, employeeId, breakDate]
        );

        if (activeBreak.length === 0) {
            throw new Error('No active break found to check out from');
        }

        const breakRecord = activeBreak[0];
        const inTime = new Date(breakRecord.break_in_time);
        const outTime = new Date(breakOutTime);
        const durationMinutes = Math.round((outTime - inTime) / (1000 * 60)); // Duration in minutes

        await pool.execute(
            'UPDATE tb_breaks SET break_out_time = ?, duration_minutes = ?, status = "Completed" WHERE id = ?',
            [breakOutTime, durationMinutes, breakRecord.id]
        );

        return { id: breakRecord.id, durationMinutes };
    } catch (error) {
        console.error('Error in breakOut model:', error);
        throw error;
    }
}

async function getBreaksByEmployeeAndDate(tenantId, employeeId, breakDate) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM tb_breaks WHERE tenant_id = ? AND employee_id = ? AND break_date = ? ORDER BY break_in_time ASC',
            [tenantId, employeeId, breakDate]
        );
        return rows;
    } catch (error) {
        console.error('Error in getBreaksByEmployeeAndDate:', error);
        throw error;
    }
}

async function getAllBreaks(tenantId, startDate, endDate) {
    try {
        let query = `
            SELECT 
                b.*, 
                u.id AS user_id,
                e.id AS employee_detail_id,
                e.employee_id AS employee_code,
                TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS full_name,
                u.first_name, 
                u.last_name, 
                d.name AS department, 
                e.position AS designation
            FROM tb_breaks b
            LEFT JOIN employee_details e ON (CAST(b.employee_id AS CHAR) = CAST(e.id AS CHAR) OR CAST(b.employee_id AS CHAR) = CAST(e.employee_id AS CHAR)) AND b.tenant_id = e.tenant_id
            LEFT JOIN users u ON (CAST(e.employee_id AS CHAR) = CAST(u.id AS CHAR) OR CAST(b.employee_id AS CHAR) = CAST(u.id AS CHAR)) AND b.tenant_id = u.tenant_id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE b.tenant_id = ?
        `;
        const params = [tenantId];

        if (startDate && endDate) {
            query += ' AND DATE(b.break_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY b.break_date DESC, b.break_in_time DESC';

        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error in getAllBreaks:', error);
        throw error;
    }
}

module.exports = {
    breakIn,
    breakOut,
    getBreaksByEmployeeAndDate,
    getAllBreaks
};
