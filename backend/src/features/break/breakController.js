const sendResponse = require('../../utils/response');
const { getIndiaDate, getIndiaDateTime } = require('../../utils/indiaTime');
const breakModel = require('./breakModel');
const employeeModel = require('../employee/employeeModel');
const { pool } = require('../../config/db');

const getEmployeeId = async (userId, tenantId) => {
    const [employees] = await pool.execute(
        'SELECT id FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
        [userId, tenantId]
    );
    if (employees.length === 0) throw new Error('Employee record not found');
    return employees[0].id;
};

const breakIn = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const employeeId = await getEmployeeId(req.user.id, tenantId);
        const currentDate = getIndiaDate();
        const currentDateTime = getIndiaDateTime();

        const breakId = await breakModel.breakIn(tenantId, employeeId, currentDate, currentDateTime);

        return sendResponse(res, 200, true, 'Break started successfully', { breakId });
    } catch (error) {
        if (error.message.includes('already on an active break')) {
            return sendResponse(res, 400, false, error.message);
        }
        console.error('Error in breakIn:', error);
        return sendResponse(res, 500, false, error.message || 'Failed to start break');
    }
};

const breakOut = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const employeeId = await getEmployeeId(req.user.id, tenantId);
        const currentDate = getIndiaDate();
        const currentDateTime = getIndiaDateTime();

        await breakModel.breakOut(tenantId, employeeId, currentDate, currentDateTime);

        return sendResponse(res, 200, true, 'Break ended successfully');
    } catch (error) {
        if (error.message.includes('No active break found')) {
            return sendResponse(res, 400, false, error.message);
        }
        console.error('Error in breakOut:', error);
        return sendResponse(res, 500, false, error.message || 'Failed to end break');
    }
};

const getMyTodayBreaks = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const employeeId = await getEmployeeId(req.user.id, tenantId);
        const currentDate = getIndiaDate();

        const [breaks] = await pool.execute(
            'SELECT * FROM tb_breaks WHERE tenant_id = ? AND employee_id = ? AND break_date = ? ORDER BY break_in_time ASC',
            [tenantId, employeeId, currentDate]
        );
        let totalDuration = 0;
        let activeBreak = null;

        breaks.forEach(b => {
            if (b.status === 'Completed') {
                totalDuration += b.duration_minutes;
            } else if (b.status === 'Active') {
                activeBreak = b;
                // Calculate current duration for active break
                const inTime = new Date(b.break_in_time);
                const now = new Date(getIndiaDateTime());
                totalDuration += Math.round((now - inTime) / (1000 * 60));
            }
        });

        return sendResponse(res, 200, true, 'Today breaks fetched', {
            breaks,
            totalDuration,
            isOnBreak: activeBreak !== null,
            activeBreak
        });
    } catch (error) {
        console.error('Error in getMyTodayBreaks:', error);
        return sendResponse(res, 500, false, 'Failed to fetch today breaks');
    }
};

const getMyHistory = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const employeeId = await getEmployeeId(req.user.id, tenantId);

        const [breaks] = await pool.execute(
            'SELECT * FROM tb_breaks WHERE tenant_id = ? AND employee_id = ? ORDER BY break_date DESC, break_in_time DESC',
            [tenantId, employeeId]
        );

        return sendResponse(res, 200, true, 'Break history fetched successfully', breaks);
    } catch (error) {
        console.error('Error in getMyHistory:', error);
        return sendResponse(res, 500, false, 'Failed to fetch break history');
    }
};

const getAllBreaks = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { startDate, endDate } = req.query;
        
        const breaks = await breakModel.getAllBreaks(tenantId, startDate, endDate);
        return sendResponse(res, 200, true, 'All breaks fetched successfully', breaks);
    } catch (error) {
        console.error('Error in getAllBreaks:', error);
        return sendResponse(res, 500, false, 'Failed to fetch all breaks');
    }
};

const getEmployeeBreakHistory = async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { employeeId } = req.params;
        
        const [breaks] = await pool.execute(
            `SELECT b.* 
             FROM tb_breaks b
             LEFT JOIN employee_details e ON (CAST(b.employee_id AS CHAR) = CAST(e.id AS CHAR) OR CAST(b.employee_id AS CHAR) = CAST(e.employee_id AS CHAR)) AND b.tenant_id = e.tenant_id
             LEFT JOIN users u ON (CAST(e.employee_id AS CHAR) = CAST(u.id AS CHAR) OR CAST(b.employee_id AS CHAR) = CAST(u.id AS CHAR)) AND b.tenant_id = u.tenant_id
             WHERE b.tenant_id = ? 
               AND (
                 CAST(b.employee_id AS CHAR) = ? 
                 OR CAST(e.id AS CHAR) = ? 
                 OR CAST(e.employee_id AS CHAR) = ? 
                 OR CAST(u.id AS CHAR) = ?
               )
             ORDER BY b.break_date DESC, b.break_in_time DESC`,
            [tenantId, employeeId, employeeId, employeeId, employeeId]
        );
        return sendResponse(res, 200, true, 'Employee break history fetched successfully', breaks);
    } catch (error) {
        console.error('Error in getEmployeeBreakHistory:', error);
        return sendResponse(res, 500, false, 'Failed to fetch employee break history');
    }
};

module.exports = {
    breakIn,
    breakOut,
    getMyTodayBreaks,
    getMyHistory,
    getAllBreaks,
    getEmployeeBreakHistory
};
