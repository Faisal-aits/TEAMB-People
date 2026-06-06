// backend/src/features/admin/salaryController.js
const Salary = require('./salaryModel');
const { pool } = require('../../config/db');

// Helper function to round to 2 decimal places
const roundToTwo = (num) => {
    return Math.round((num || 0) * 100) / 100;
};

const salaryController = {
    // Get all salary records for a month
    getSalaryRecords: async (req, res) => {
        try {
            const { month, year } = req.query;
            const tenantId = req.tenantId;
            
            if (!month || !year) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Month and year are required' 
                });
            }
            
            const records = await Salary.getAllSalaryRecords(tenantId, parseInt(month), parseInt(year));
            
            // Calculate totals with proper rounding
            const totals = {
                total_gross: roundToTwo(records.reduce((sum, r) => sum + (parseFloat(r.gross_salary) || 0), 0)),
                total_deduction: roundToTwo(records.reduce((sum, r) => sum + (parseFloat(r.deduction_amount) || 0), 0)),
                total_net: roundToTwo(records.reduce((sum, r) => sum + (parseFloat(r.net_salary) || 0), 0)),
                total_paid: roundToTwo(records.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0)),
                total_balance: roundToTwo(records.reduce((sum, r) => sum + (parseFloat(r.balance_amount) || 0), 0))
            };
            
            res.json({ 
                success: true, 
                salaries: records,
                totals,
                count: records.length
            });
        } catch (error) {
            console.error('Get salary records error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get salary calculation for an employee (for the modal popup) - KEPT ONE VERSION
    getSalaryCalculation: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.query;
            const tenantId = req.tenantId || 1;
            
            if (!month || !year) {
                return res.status(400).json({ success: false, message: 'Month and year are required' });
            }
            
            const [employees] = await pool.execute(
                `SELECT ed.id, ROUND(ed.salary, 0) as annual_salary, ed.position, ed.department_id,
                        u.first_name, u.last_name, u.email,
                        d.name as department
                 FROM employee_details ed
                 JOIN users u ON ed.employee_id = u.id
                 LEFT JOIN departments d ON ed.department_id = d.id
                 WHERE ed.id = ? AND ed.tenant_id = ? AND ed.status = 'active'`,
                [employeeId, tenantId]
            );
            
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            
            const employee = employees[0];
            const annualSalary = Math.round(parseFloat(employee.annual_salary) || 0);
            const monthlySalary = Math.round(annualSalary / 12);

            const salaryCalculation = await Salary.calculateSalary(
                tenantId,
                employeeId,
                parseInt(month),
                parseInt(year),
                annualSalary
            );
            const details = salaryCalculation.details || {};
            
            res.json({
                success: true,
                employee: {
                    id: employee.id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    department: employee.department,
                    position: employee.position,
                    annual_salary: annualSalary,
                    monthly_salary: monthlySalary
                },
                calculation: {
                    total_days: details.total_days || 0,
                    total_working_days: details.total_working_days || 0,
                    present_days: salaryCalculation.present_days || 0,
                    half_days: salaryCalculation.half_days || 0,
                    late_days: salaryCalculation.late_days || 0,
                    absent_days: salaryCalculation.absent_days || 0,
                    paid_leave_days: salaryCalculation.paid_leave_days || 0,
                    unpaid_leave_days: salaryCalculation.unpaid_leave_days || 0,
                    holiday_days: salaryCalculation.holiday_days || 0,
                    weekly_off_days: salaryCalculation.weekly_off_days || 0,
                    effective_days: salaryCalculation.effective_days || 0,
                    paid_days: salaryCalculation.paid_days || 0,
                    deduction_days: salaryCalculation.deduction_days || 0,
                    daily_rate: salaryCalculation.daily_rate || 0,
                    monthly_salary: monthlySalary,
                    gross_salary: salaryCalculation.gross_salary || monthlySalary,
                    deduction_amount: salaryCalculation.deduction_amount || 0,
                    net_salary: salaryCalculation.net_salary || 0,
                    calculated_net_salary: salaryCalculation.net_salary || 0,
                    leave_policy_applied: Boolean(details.leave_policy_applied),
                    paid_leave_rule: details.paid_leave_rule,
                    has_attendance: Boolean(details.has_attendance_data)
                },
                daily_breakdown: salaryCalculation.daily_breakdown || []
            });
            
        } catch (error) {
            console.error('Get salary calculation error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Generate salary for a single employee
    generateEmployeeSalary: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { month, year } = req.body;
            const tenantId = req.tenantId;
            
            const [employees] = await pool.execute(
                `SELECT ed.id, ROUND(ed.salary, 2) as salary, u.first_name, u.last_name
                 FROM employee_details ed
                 JOIN users u ON ed.employee_id = u.id
                 WHERE ed.id = ? AND ed.tenant_id = ? AND ed.status = 'active'`,
                [employeeId, tenantId]
            );
            
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            
            const employee = employees[0];
            const salaryRecord = await Salary.getOrCreateSalaryRecord(
                tenantId, employeeId, parseInt(month), parseInt(year), parseFloat(employee.salary)
            );
            
            res.json({ 
                success: true, 
                message: 'Salary generated successfully',
                salary: salaryRecord
            });
        } catch (error) {
            console.error('Generate salary error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Generate salaries for all employees
    generateAllSalaries: async (req, res) => {
        try {
            const { month, year } = req.body;
            const tenantId = req.tenantId || 1;
            
            if (!month || !year) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Month and year are required' 
                });
            }
            
            const [employees] = await pool.execute(
                `SELECT ed.id, ROUND(ed.salary, 2) as salary, u.first_name, u.last_name
                 FROM employee_details ed
                 JOIN users u ON ed.employee_id = u.id
                 WHERE ed.tenant_id = ? AND ed.status = 'active'`,
                [tenantId]
            );
            
            let generated = 0;
            
            for (const employee of employees) {
                await Salary.getOrCreateSalaryRecord(
                    tenantId, employee.id, parseInt(month), parseInt(year), parseFloat(employee.salary)
                );
                generated++;
            }
            
            const records = await Salary.getAllSalaryRecords(tenantId, parseInt(month), parseInt(year));
            
            res.json({ 
                success: true, 
                message: `Generated salaries for ${generated} employees`,
                generated,
                total: employees.length,
                salaries: records
            });
        } catch (error) {
            console.error('Generate all salaries error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Update salary record (when net salary is changed manually)
    updateSalaryRecord: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const { amount, reason } = req.body;
            const tenantId = req.tenantId;
            
            const connection = await pool.getConnection();
            
            try {
                await connection.beginTransaction();
                
                const [records] = await connection.execute(
                    `SELECT * FROM tb_salary_records WHERE id = ? AND tenant_id = ? FOR UPDATE`,
                    [salaryRecordId, tenantId]
                );
                
                if (records.length === 0) {
                    return res.status(404).json({ success: false, message: 'Salary record not found' });
                }
                
                const salaryRecord = records[0];
                const newNetSalary = Math.round(parseFloat(amount));
                const currentPaidAmount = Math.round(parseFloat(salaryRecord.paid_amount) || 0);
                
                // Calculate new balance
                const newBalance = Math.round(newNetSalary - currentPaidAmount);
                
                // Determine new status
                let newStatus;
                if (newBalance <= 0) {
                    newStatus = 'paid';
                } else if (currentPaidAmount > 0) {
                    newStatus = 'partial';
                } else {
                    newStatus = 'pending';
                }
                
                // Update salary record
                await connection.execute(
                    `UPDATE tb_salary_records 
                     SET net_salary = ?, balance_amount = ?, payment_status = ?
                     WHERE id = ?`,
                    [newNetSalary, newBalance, newStatus, salaryRecordId]
                );
                
                // Add adjustment note
                let details = salaryRecord.details || {};
                if (typeof details === 'string') {
                    details = JSON.parse(details);
                }
                
                if (!details.adjustments) {
                    details.adjustments = [];
                }
                
                details.adjustments.push({
                    date: new Date().toISOString(),
                    old_amount: Math.round(salaryRecord.net_salary),
                    new_amount: newNetSalary,
                    reason: reason || 'Manual adjustment by admin'
                });
                
                await connection.execute(
                    `UPDATE tb_salary_records SET details = ? WHERE id = ?`,
                    [JSON.stringify(details), salaryRecordId]
                );
                
                await connection.commit();
                
                res.json({ 
                    success: true, 
                    message: 'Salary amount updated successfully',
                    new_amount: newNetSalary,
                    new_balance: newBalance,
                    new_status: newStatus
                });
                
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
            
        } catch (error) {
            console.error('Update salary error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Record salary payment
    recordSalaryPayment: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const { amount, payment_method, transaction_id, notes } = req.body;
            const tenantId = req.tenantId;
            const userId = req.user?.id || req.user?.employee_id;
            
            if (!amount || amount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Valid amount is required' 
                });
            }
            
            // Round the amount to 2 decimal places
            const roundedAmount = roundToTwo(parseFloat(amount));
            
            const result = await Salary.recordPayment(
                tenantId, salaryRecordId, roundedAmount, payment_method || 'bank_transfer', 
                transaction_id, notes, userId
            );
            
            res.json({ 
                success: true, 
                message: 'Payment recorded successfully',
                ...result
            });
        } catch (error) {
            console.error('Record payment error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Mark salary as fully paid
    markSalaryPaid: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const tenantId = req.tenantId;
            
            const success = await Salary.markAsPaid(tenantId, salaryRecordId);
            
            if (!success) {
                return res.status(404).json({ success: false, message: 'Salary record not found' });
            }
            
            res.json({ success: true, message: 'Salary marked as paid' });
        } catch (error) {
            console.error('Mark paid error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Mark salary as pending
    markSalaryPending: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const tenantId = req.tenantId;
            
            const success = await Salary.markAsPending(tenantId, salaryRecordId);
            
            if (!success) {
                return res.status(404).json({ success: false, message: 'Salary record not found' });
            }
            
            res.json({ success: true, message: 'Salary marked as pending' });
        } catch (error) {
            console.error('Mark pending error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Get employee salary history
    getEmployeeSalaryHistory: async (req, res) => {
        try {
            const { employeeId } = req.params;
            const tenantId = req.tenantId;
            
            const [employees] = await pool.execute(
                `SELECT ed.id, ROUND(ed.salary, 2) as annual_salary, ed.position, ed.joining_date,
                        u.first_name, u.last_name, u.email
                 FROM employee_details ed
                 JOIN users u ON ed.employee_id = u.id
                 WHERE ed.id = ? AND ed.tenant_id = ?`,
                [employeeId, tenantId]
            );
            
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee not found' });
            }
            
            const employee = employees[0];
            const history = await Salary.getEmployeeSalaryHistory(tenantId, employeeId);
            
            // Round salary values in history
            const roundedHistory = history.map(record => ({
                ...record,
                net_salary: roundToTwo(record.net_salary),
                paid_amount: roundToTwo(record.paid_amount),
                balance_amount: roundToTwo(record.balance_amount),
                basic_salary: roundToTwo(record.basic_salary)
            }));
            
            const summary = {
                total_records: roundedHistory.length,
                paid_records: roundedHistory.filter(r => r.payment_status === 'paid').length,
                pending_records: roundedHistory.filter(r => r.payment_status === 'pending').length,
                partial_records: roundedHistory.filter(r => r.payment_status === 'partial').length,
                total_amount: roundToTwo(roundedHistory.reduce((sum, r) => sum + (r.net_salary || 0), 0)),
                total_paid: roundToTwo(roundedHistory.reduce((sum, r) => sum + (r.paid_amount || 0), 0)),
                total_balance: roundToTwo(roundedHistory.reduce((sum, r) => sum + (r.balance_amount || 0), 0))
            };
            
            res.json({ 
                success: true, 
                employee: {
                    id: employee.id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    email: employee.email,
                    position: employee.position,
                    salary: roundToTwo(employee.annual_salary),
                    joining_date: employee.joining_date
                },
                history: roundedHistory, 
                summary 
            });
        } catch (error) {
            console.error('Get salary history error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Get available months for dropdown
    getAvailableMonths: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const months = await Salary.getUniqueMonths(tenantId);
            
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const currentMonthName = `${monthNames[currentMonth - 1]} ${currentYear}`;
            
            res.json({ 
                success: true, 
                months,
                current_month: currentMonth,
                current_year: currentYear,
                current_month_name: currentMonthName
            });
        } catch (error) {
            console.error('Get months error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Get salary slip for printing
    getSalarySlip: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const tenantId = req.tenantId;
            
            const [records] = await pool.execute(
                `SELECT sr.*, u.first_name, u.last_name, u.email, u.phone, 
                        ed.bank_account_number, ed.ifsc_code, ed.pan_number, ed.aadhar_number,
                        ed.position, ed.joining_date, ed.department_id,
                        d.name as department_name
                 FROM tb_salary_records sr
                 JOIN employee_details ed ON sr.employee_id = ed.id
                 JOIN users u ON ed.employee_id = u.id
                 LEFT JOIN departments d ON ed.department_id = d.id
                 WHERE sr.id = ? AND sr.tenant_id = ?`,
                [salaryRecordId, tenantId]
            );
            
            if (records.length === 0) {
                return res.status(404).json({ success: false, message: 'Salary record not found' });
            }
            
            const salarySlip = records[0];
            if (salarySlip.details && typeof salarySlip.details === 'string') {
                salarySlip.details = JSON.parse(salarySlip.details);
            }
            
            // Round salary values
            salarySlip.net_salary = roundToTwo(salarySlip.net_salary);
            salarySlip.paid_amount = roundToTwo(salarySlip.paid_amount);
            salarySlip.balance_amount = roundToTwo(salarySlip.balance_amount);
            salarySlip.basic_salary = roundToTwo(salarySlip.basic_salary);
            
            const [payments] = await pool.execute(
                `SELECT * FROM tb_salary_payments 
                 WHERE salary_record_id = ? AND tenant_id = ?
                 ORDER BY payment_date DESC`,
                [salaryRecordId, tenantId]
            );
            
            res.json({ 
                success: true, 
                salary_slip: salarySlip,
                payment_history: payments
            });
        } catch (error) {
            console.error('Get salary slip error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get salary statistics dashboard
    getSalaryStats: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            
            const currentMonthSalaries = await Salary.getAllSalaryRecords(tenantId, currentMonth, currentYear);
            
            let prevMonth = currentMonth - 1;
            let prevYear = currentYear;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = currentYear - 1;
            }
            const prevMonthSalaries = await Salary.getAllSalaryRecords(tenantId, prevMonth, prevYear);
            
            const currentStats = {
                total_employees: currentMonthSalaries.length,
                total_gross: roundToTwo(currentMonthSalaries.reduce((sum, r) => sum + (parseFloat(r.gross_salary) || 0), 0)),
                total_net: roundToTwo(currentMonthSalaries.reduce((sum, r) => sum + (parseFloat(r.net_salary) || 0), 0)),
                total_paid: roundToTwo(currentMonthSalaries.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0)),
                total_balance: roundToTwo(currentMonthSalaries.reduce((sum, r) => sum + (parseFloat(r.balance_amount) || 0), 0)),
                paid_count: currentMonthSalaries.filter(r => r.payment_status === 'paid').length,
                pending_count: currentMonthSalaries.filter(r => r.payment_status === 'pending').length,
                partial_count: currentMonthSalaries.filter(r => r.payment_status === 'partial').length
            };
            
            const prevStats = {
                total_net: roundToTwo(prevMonthSalaries.reduce((sum, r) => sum + (parseFloat(r.net_salary) || 0), 0)),
                total_paid: roundToTwo(prevMonthSalaries.reduce((sum, r) => sum + (parseFloat(r.paid_amount) || 0), 0))
            };
            
            const monthOverMonth = {
                net_change: roundToTwo(currentStats.total_net - prevStats.total_net),
                net_percentage: prevStats.total_net > 0 
                    ? roundToTwo(((currentStats.total_net - prevStats.total_net) / prevStats.total_net * 100))
                    : 0,
                paid_change: roundToTwo(currentStats.total_paid - prevStats.total_paid),
                paid_percentage: prevStats.total_paid > 0
                    ? roundToTwo(((currentStats.total_paid - prevStats.total_paid) / prevStats.total_paid * 100))
                    : 0
            };
            
            res.json({
                success: true,
                current_month: currentStats,
                previous_month: prevStats,
                month_over_month: monthOverMonth,
                month_name: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' }),
                year: currentYear
            });
        } catch (error) {
            console.error('Get salary stats error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = salaryController;
