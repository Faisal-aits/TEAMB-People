// backend/src/features/admin/salaryModel.js
const { pool } = require('../../config/db');

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const formatDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date.slice(0, 10);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isSunday = (date) => date.getDay() === 0;

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const roundToInt = (num) => {
    if (isNaN(num)) return 0;
    return Math.round(num);
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const getPaymentStatus = (netSalary, paidAmount) => {
    if (netSalary <= 0) return 'pending';
    if (paidAmount >= netSalary) return 'paid';
    if (paidAmount > 0) return 'partial';
    return 'pending';
};

const Salary = {
    getHolidays: async (tenantId, month, year) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const daysInMonth = getDaysInMonth(year, month);
        const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

        const [holidays] = await pool.execute(
            `SELECT id, name, date, description FROM tb_holidays
             WHERE tenant_id = ? AND date BETWEEN ? AND ? AND is_active = 1`,
            [tenantId, startDate, endDate]
        );
        return holidays;
    },

    getAttendanceForSalary: async (tenantId, employeeDetailId, month, year) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const daysInMonth = getDaysInMonth(year, month);
        const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

        const [attendance] = await pool.execute(
            `SELECT a.date, a.status, a.check_in, a.check_out, a.should_deduct_salary, a.deduction_amount
             FROM tb_attendance a
             JOIN employee_details ed ON a.employee_id = ed.id
             WHERE ed.tenant_id = ? AND ed.id = ?
             AND a.date BETWEEN ? AND ?
             ORDER BY a.date`,
            [tenantId, employeeDetailId, startDate, endDate]
        );

        return attendance;
    },

    getApprovedLeaveDates: async (tenantId, employeeDetailId, month, year) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const daysInMonth = getDaysInMonth(year, month);
        const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

        const [leaves] = await pool.execute(
            `SELECT lr.leave_id, lr.leave_type, lr.start_date, lr.end_date,
                    COALESCE(
                        lr.is_paid,
                        lt.is_paid,
                        CASE WHEN LOWER(TRIM(lr.leave_type)) = 'unpaid' THEN 0 ELSE 1 END
                    ) as is_paid
             FROM leave_requests lr
             LEFT JOIN leave_types lt
               ON lt.tenant_id = lr.tenant_id
              AND lt.name = lr.leave_type
             WHERE lr.tenant_id = ?
             AND lr.employee_id = ?
             AND lr.status = 'Approved'
             AND lr.start_date <= ?
             AND lr.end_date >= ?
             ORDER BY lr.start_date ASC`,
            [tenantId, employeeDetailId, endDate, startDate]
        );

        const leaveDates = [];
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month - 1, daysInMonth);

        leaves.forEach((leave) => {
            const leaveStart = new Date(leave.start_date);
            const leaveEnd = new Date(leave.end_date);
            let currentDate = leaveStart > monthStart ? leaveStart : monthStart;
            const finalDate = leaveEnd < monthEnd ? leaveEnd : monthEnd;

            while (currentDate <= finalDate) {
                leaveDates.push({
                    date: formatDate(currentDate),
                    leave_id: leave.leave_id,
                    leave_type: leave.leave_type,
                    is_paid: Number(leave.is_paid) === 1
                });
                currentDate = addDays(currentDate, 1);
            }
        });

        const uniqueByDate = new Map();
        leaveDates.forEach((leaveDate) => {
            if (!uniqueByDate.has(leaveDate.date)) {
                uniqueByDate.set(leaveDate.date, leaveDate);
            }
        });

        return [...uniqueByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    },

    calculateSalary: async (tenantId, employeeDetailId, month, year, annualSalary) => {
        const startDate = new Date(year, month - 1, 1);
        const daysInMonth = getDaysInMonth(year, month);
        const endDate = new Date(year, month - 1, daysInMonth);
        const monthlySalary = Math.round((parseFloat(annualSalary) || 0) / 12);

        const holidays = await Salary.getHolidays(tenantId, month, year);
        const holidayDates = new Set(holidays.map((holiday) => formatDate(holiday.date)));
        const attendanceRecords = await Salary.getAttendanceForSalary(tenantId, employeeDetailId, month, year);
        const approvedLeaveDates = await Salary.getApprovedLeaveDates(tenantId, employeeDetailId, month, year);
        const leaveByDate = new Map(approvedLeaveDates.map((leaveDate) => [leaveDate.date, leaveDate]));

        let presentDays = 0;
        let halfDays = 0;
        let lateDays = 0;
        let absentDays = 0;
        let paidLeaveDays = 0;
        let unpaidLeaveDays = 0;
        let holidayDays = 0;
        let weeklyOffDays = 0;
        let paidDays = 0;
        let deductionDays = 0;
        let attendanceDeductions = 0;
        const dailyBreakdown = [];

        const attendanceMap = new Map();
        attendanceRecords.forEach((record) => {
            attendanceMap.set(formatDate(record.date), record);
        });

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = formatDate(currentDate);
            const attendance = attendanceMap.get(dateKey);
            const weeklyOff = isSunday(currentDate);
            const holiday = holidayDates.has(dateKey);
            const approvedLeave = leaveByDate.get(dateKey);
            let status = 'Absent';
            let shortStatus = 'A';
            let paidValue = 0;
            let deductionValue = 1;
            let leaveType = null;

            if (weeklyOff) {
                weeklyOffDays++;
                paidDays += 1;
                status = 'Weekly Off';
                shortStatus = 'WO';
                paidValue = 1;
                deductionValue = 0;
            } else if (holiday) {
                holidayDays++;
                paidDays += 1;
                status = 'Holiday';
                shortStatus = 'HD';
                paidValue = 1;
                deductionValue = 0;
            } else if (approvedLeave || normalizeStatus(attendance?.status) === 'on leave') {
                const isPaidLeave = approvedLeave ? approvedLeave.is_paid : true;
                leaveType = approvedLeave?.leave_type || null;

                if (isPaidLeave) {
                    paidLeaveDays++;
                    paidDays += 1;
                    status = leaveType ? `Paid Leave (${leaveType})` : 'Paid Leave';
                    shortStatus = 'PL';
                    paidValue = 1;
                    deductionValue = 0;
                } else {
                    unpaidLeaveDays++;
                    deductionDays += 1;
                    status = leaveType ? `Unpaid Leave (${leaveType})` : 'Unpaid Leave';
                    shortStatus = 'UL';
                }
            } else if (attendance) {
                const attStatus = normalizeStatus(attendance.status);
                if (attStatus === 'present') {
                    presentDays++;
                    paidDays += 1;
                    status = 'Present';
                    shortStatus = 'P';
                    paidValue = 1;
                    deductionValue = 0;
                } else if (attStatus === 'delayed' || attStatus === 'late') {
                    lateDays++;
                    paidDays += 1;
                    status = 'Delayed';
                    shortStatus = 'D';
                    paidValue = 1;
                    deductionValue = 0;
                } else if (attStatus === 'half day') {
                    halfDays++;
                    paidDays += 0.5;
                    deductionDays += 0.5;
                    status = 'Half Day';
                    shortStatus = 'H';
                    paidValue = 0.5;
                    deductionValue = 0.5;
                } else {
                    absentDays++;
                    deductionDays += 1;
                }

                if (attendance.should_deduct_salary) {
                    attendanceDeductions += parseFloat(attendance.deduction_amount) || 0;
                }
            } else {
                absentDays++;
                deductionDays += 1;
            }

            dailyBreakdown.push({
                date: dateKey,
                day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
                status,
                shortStatus,
                paid_value: paidValue,
                deduction_value: deductionValue,
                leave_type: leaveType,
                leave_is_paid: approvedLeave ? approvedLeave.is_paid : null,
                check_in: attendance?.check_in || '-',
                check_out: attendance?.check_out || '-'
            });

            currentDate = addDays(currentDate, 1);
        }

        if (attendanceRecords.length === 0 && leaveByDate.size === 0) {
            paidDays = 0;
            deductionDays = daysInMonth;
        }

        // Cap paid leaves at 2 per month and deduct excess as unpaid days
const paidLeaveCap = 2;
const excessPaidLeaves = Math.max(0, paidLeaveDays - paidLeaveCap);
if (excessPaidLeaves > 0) {
    // Convert excess paid leaves to deduction days
    deductionDays += excessPaidLeaves;
    // Reduce paid days accordingly
    paidDays -= excessPaidLeaves;
}

const dailyRate = monthlySalary / daysInMonth;
const leaveAndAbsenceDeduction = Math.round(dailyRate * deductionDays);
const totalDeduction = Math.round(leaveAndAbsenceDeduction + attendanceDeductions);
const netSalary = Math.max(0, Math.round(monthlySalary - totalDeduction));
const roundedPaidDays = Math.round(paidDays * 10) / 10;
const roundedDeductionDays = Math.round(deductionDays * 10) / 10;

        const details = {
            present_days: presentDays,
            half_days: halfDays,
            late_days: lateDays,
            absent_days: absentDays,
            paid_leave_days: paidLeaveDays,
            unpaid_leave_days: unpaidLeaveDays,
            holiday_days: holidayDays,
            weekly_off_days: weeklyOffDays,
            effective_days: roundedPaidDays,
            paid_days: roundedPaidDays,
            deduction_days: roundedDeductionDays,
            total_days: daysInMonth,
            total_working_days: daysInMonth - weeklyOffDays - holidayDays,
            daily_rate: Math.round(dailyRate),
            monthly_salary: monthlySalary,
            gross_salary: monthlySalary,
            leave_and_absence_deduction: leaveAndAbsenceDeduction,
            attendance_deductions: Math.round(attendanceDeductions),
            total_deduction: totalDeduction,
            leave_policy_applied: true,
            paid_leave_rule: 'Paid/unpaid is determined by Leave Policy Settings for each approved leave request.',
            has_attendance_data: attendanceRecords.length > 0,
            calculation_summary: {
                monthly_salary: monthlySalary,
                daily_rate: Math.round(dailyRate),
                effective_days: roundedPaidDays,
                deduction_days: roundedDeductionDays,
                total_deduction: totalDeduction,
                net_salary: netSalary,
                note: attendanceRecords.length === 0 ? 'No attendance records found for this month' : null
            }
        };

        return {
            basic_salary: monthlySalary,
            gross_salary: monthlySalary,
            deduction_amount: totalDeduction,
            present_days: presentDays,
            half_days: halfDays,
            late_days: lateDays,
            absent_days: absentDays,
            paid_leave_days: paidLeaveDays,
            unpaid_leave_days: unpaidLeaveDays,
            holiday_days: holidayDays,
            weekly_off_days: weeklyOffDays,
            effective_days: roundedPaidDays,
            paid_days: roundedPaidDays,
            deduction_days: roundedDeductionDays,
            daily_rate: Math.round(dailyRate),
            net_salary: netSalary,
            daily_breakdown: dailyBreakdown,
            details
        };
    },

    getOrCreateSalaryRecord: async (tenantId, employeeDetailId, month, year, annualSalary) => {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const calculation = await Salary.calculateSalary(tenantId, employeeDetailId, month, year, annualSalary);
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [existing] = await connection.execute(
                `SELECT * FROM tb_salary_records
                 WHERE tenant_id = ? AND employee_id = ? AND month_number = ? AND year = ?
                 FOR UPDATE`,
                [tenantId, employeeDetailId, month, year]
            );

            const paidAmount = existing.length > 0 ? roundToInt(parseFloat(existing[0].paid_amount) || 0) : 0;
            const balanceAmount = Math.max(0, roundToInt(calculation.net_salary - paidAmount));
            const paymentStatus = getPaymentStatus(calculation.net_salary, paidAmount);
            const details = JSON.stringify(calculation.details);

            if (existing.length > 0) {
                await connection.execute(
                    `UPDATE tb_salary_records
                     SET month = ?, basic_salary = ?, gross_salary = ?, deduction_amount = ?,
                         net_salary = ?, balance_amount = ?, payment_status = ?, details = ?
                     WHERE id = ? AND tenant_id = ?`,
                    [
                        monthNames[month - 1],
                        calculation.basic_salary,
                        calculation.gross_salary,
                        calculation.deduction_amount,
                        calculation.net_salary,
                        balanceAmount,
                        paymentStatus,
                        details,
                        existing[0].id,
                        tenantId
                    ]
                );
            } else {
                await connection.execute(
                    `INSERT INTO tb_salary_records
                     (tenant_id, employee_id, month, month_number, year, basic_salary,
                      gross_salary, deduction_amount, net_salary, paid_amount, balance_amount,
                      payment_status, details)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tenantId,
                        employeeDetailId,
                        monthNames[month - 1],
                        month,
                        year,
                        calculation.basic_salary,
                        calculation.gross_salary,
                        calculation.deduction_amount,
                        calculation.net_salary,
                        0,
                        calculation.net_salary,
                        'pending',
                        details
                    ]
                );
            }

            await connection.commit();
            const records = await Salary.getAllSalaryRecords(tenantId, month, year);
            return records.find((record) => record.employee_id === employeeDetailId || record.employee_detail_id === employeeDetailId);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    getAllSalaryRecords: async (tenantId, month, year) => {
        const [records] = await pool.execute(
            `SELECT sr.*,
                    ROUND(ed.salary, 0) as annual_salary,
                    ed.position,
                    ed.department_id,
                    ed.id as employee_detail_id,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    d.name as department
             FROM tb_salary_records sr
             JOIN employee_details ed ON sr.employee_id = ed.id
             JOIN users u ON ed.employee_id = u.id
             LEFT JOIN departments d ON ed.department_id = d.id
             WHERE sr.tenant_id = ? AND sr.month_number = ? AND sr.year = ?
             ORDER BY u.first_name, u.last_name`,
            [tenantId, month, year]
        );

        records.forEach((record) => {
            if (record.details && typeof record.details === 'string') {
                try {
                    record.details = JSON.parse(record.details);
                } catch (e) {
                    record.details = null;
                }
            }

            record.net_salary = roundToInt(parseFloat(record.net_salary) || 0);
            record.paid_amount = roundToInt(parseFloat(record.paid_amount) || 0);
            record.balance_amount = roundToInt(parseFloat(record.balance_amount) || 0);
            record.basic_salary = roundToInt(parseFloat(record.basic_salary) || 0);
            record.gross_salary = roundToInt(parseFloat(record.gross_salary) || 0);
            record.deduction_amount = roundToInt(parseFloat(record.deduction_amount) || 0);
            record.annual_salary = roundToInt(parseFloat(record.annual_salary) || 0);
        });

        return records;
    },

    updateSalaryRecord: async (tenantId, salaryRecordId, newNetSalary) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [records] = await connection.execute(
                `SELECT * FROM tb_salary_records WHERE id = ? AND tenant_id = ? FOR UPDATE`,
                [salaryRecordId, tenantId]
            );

            if (records.length === 0) {
                throw new Error('Salary record not found');
            }

            const salaryRecord = records[0];
            const newNetSalaryInt = roundToInt(newNetSalary);
            const paidAmount = roundToInt(salaryRecord.paid_amount || 0);
            const newBalance = Math.max(0, roundToInt(newNetSalaryInt - paidAmount));
            const newStatus = getPaymentStatus(newNetSalaryInt, paidAmount);

            await connection.execute(
                `UPDATE tb_salary_records
                 SET net_salary = ?, balance_amount = ?, payment_status = ?
                 WHERE id = ?`,
                [newNetSalaryInt, newBalance, newStatus, salaryRecordId]
            );

            await connection.commit();

            return { success: true, new_amount: newNetSalaryInt, new_balance: newBalance, new_status: newStatus };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    recordPayment: async (tenantId, salaryRecordId, amount, paymentMethod, transactionId, notes, recordedBy) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [records] = await connection.execute(
                `SELECT * FROM tb_salary_records WHERE id = ? AND tenant_id = ? FOR UPDATE`,
                [salaryRecordId, tenantId]
            );

            if (records.length === 0) {
                throw new Error('Salary record not found');
            }

            const salaryRecord = records[0];
            const paymentAmount = roundToInt(amount);
            const currentPaid = roundToInt(salaryRecord.paid_amount || 0);
            const currentNet = roundToInt(salaryRecord.net_salary || 0);
            const newPaid = roundToInt(currentPaid + paymentAmount);
            const newBalance = Math.max(0, roundToInt(currentNet - newPaid));
            const newStatus = getPaymentStatus(currentNet, newPaid);

            await connection.execute(
                `UPDATE tb_salary_records
                 SET paid_amount = ?, balance_amount = ?, payment_status = ?, payment_date = ?
                 WHERE id = ?`,
                [newPaid, newBalance, newStatus, new Date().toISOString().split('T')[0], salaryRecordId]
            );

            await connection.execute(
                `INSERT INTO tb_salary_payments
                 (salary_record_id, amount, payment_method, transaction_id, notes, recorded_by, tenant_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [salaryRecordId, paymentAmount, paymentMethod, transactionId || null, notes || null, recordedBy || null, tenantId]
            );

            await connection.commit();

            return { success: true, new_status: newStatus, paid_amount: newPaid, balance: newBalance };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    markAsPaid: async (tenantId, salaryRecordId) => {
        const [result] = await pool.execute(
            `UPDATE tb_salary_records
             SET paid_amount = net_salary, balance_amount = 0, payment_status = 'paid', payment_date = ?
             WHERE id = ? AND tenant_id = ?`,
            [new Date().toISOString().split('T')[0], salaryRecordId, tenantId]
        );
        return result.affectedRows > 0;
    },

    markAsPending: async (tenantId, salaryRecordId) => {
        const [result] = await pool.execute(
            `UPDATE tb_salary_records
             SET payment_status = 'pending', payment_date = NULL
             WHERE id = ? AND tenant_id = ?`,
            [salaryRecordId, tenantId]
        );
        return result.affectedRows > 0;
    },

    getEmployeeSalaryHistory: async (tenantId, employeeDetailId) => {
        const [records] = await pool.execute(
            `SELECT sr.*, CONCAT(sr.month, ' ', sr.year) as month
             FROM tb_salary_records sr
             WHERE sr.tenant_id = ? AND sr.employee_id = ?
             ORDER BY sr.year DESC, sr.month_number DESC`,
            [tenantId, employeeDetailId]
        );

        records.forEach((record) => {
            record.net_salary = roundToInt(parseFloat(record.net_salary) || 0);
            record.paid_amount = roundToInt(parseFloat(record.paid_amount) || 0);
            record.balance_amount = roundToInt(parseFloat(record.balance_amount) || 0);
        });

        return records;
    },

    getUniqueMonths: async (tenantId) => {
        const [months] = await pool.execute(
            `SELECT DISTINCT month, year, month_number
             FROM tb_salary_records
             WHERE tenant_id = ?
             ORDER BY year DESC, month_number DESC`,
            [tenantId]
        );
        return months;
    }
};

module.exports = Salary;
