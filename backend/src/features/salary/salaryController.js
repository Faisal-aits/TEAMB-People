const Salary = require('./salaryModel');
const { pool } = require('../../config/db');
const fs = require('fs');
const path = require('path');
const Document = require('../documents/documentModel');
const Notification = require('../notifications/notificationModel');
const brandingModel = require('../branding/brandingModel');
const mailService = require('../../services/mailService');
const pdfService = require('../../services/salarySlipPDFService');

// Helper function to round to 2 decimal places
const roundToTwo = (num) => {
    return Math.round((num || 0) * 100) / 100;
};

// Unified helper to generate PDF, save file to disk, create document entry with file_url, notify employee, and email salary slip
const processSalaryPaymentAndPayslip = async (tenantId, salaryRecordId, customPdfBuffer = null, sendEmail = true) => {
    try {
        const [records] = await pool.execute(
            `SELECT sr.*, ed.id as employee_detail_id, ed.position, ed.department_id,
                    ed.bank_account_number, ed.ifsc_code, ed.pan_number, ed.joining_date,
                    u.id as user_id, u.first_name, u.last_name, u.email,
                    d.name as department_name
             FROM tb_salary_records sr
             JOIN employee_details ed ON sr.employee_id = ed.id
             JOIN users u ON ed.employee_id = u.id
             LEFT JOIN departments d ON ed.department_id = d.id
             WHERE sr.id = ? AND sr.tenant_id = ?`,
            [salaryRecordId, tenantId]
        );

        if (records.length === 0) return null;
        const record = records[0];

        if (record.details && typeof record.details === 'string') {
            try { record.details = JSON.parse(record.details); } catch(e) {}
        }

        const month = record.month_number;
        const year = record.year;
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const monthName = monthNames[month - 1] || record.month || String(month);
        const title = `${monthName} ${year}`;
        const filename = `salary_slip_${record.employee_detail_id}_${month}_${year}.pdf`;

        const docsDir = path.join(__dirname, '../../../uploads/documents');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        const filePath = path.join(docsDir, filename);
        const fileUrl = `/uploads/documents/${filename}`;

        let pdfBuffer = customPdfBuffer;
        if (!pdfBuffer) {
            try {
                const branding = await brandingModel.getByTenantId(tenantId);
                pdfBuffer = await pdfService.generateSalarySlipPDF(record, branding);
            } catch (pdfErr) {
                console.error('[processSalaryPaymentAndPayslip] PDF generation error:', pdfErr);
            }
        }

        if (pdfBuffer) {
            fs.writeFileSync(filePath, pdfBuffer);
        }

        const [existingDocs] = await pool.execute(
            `SELECT id FROM employee_documents WHERE tenant_id = ? AND employee_id = ? AND document_type = 'salary_slip' AND (JSON_EXTRACT(metadata, '$.month') = ? OR title = ?)`,
            [tenantId, record.employee_detail_id, String(month), title]
        );

        let docId;
        if (existingDocs.length > 0) {
            docId = existingDocs[0].id;
            await pool.execute(
                `UPDATE employee_documents SET file_url = ?, is_sent = 1, title = ? WHERE id = ?`,
                [fileUrl, title, docId]
            );
        } else {
            docId = await Document.save(
                tenantId,
                record.employee_detail_id,
                'salary_slip',
                title,
                fileUrl,
                { month: String(month), year: String(year), salary_record_id: record.id },
                1
            );
        }

        await Notification.create(
            tenantId,
            record.user_id,
            'salary_slip',
            'Salary Slip Available',
            `Your salary slip for ${monthName} ${year} is now available in My Documents.`,
            docId
        );

        let emailSent = false;
        if (sendEmail && record.email && pdfBuffer) {
            try {
                await mailService.sendSalarySlip(tenantId, {
                    to: record.email,
                    name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                    monthName,
                    year,
                    pdfBuffer
                });
                emailSent = true;
                console.log(`[processSalaryPaymentAndPayslip] Email sent to ${record.email} for ${monthName} ${year}`);
            } catch (mailErr) {
                console.warn(`[processSalaryPaymentAndPayslip] Email send warning for ${record.email}:`, mailErr.message);
            }
        }

        return { docId, fileUrl, emailSent };
    } catch (err) {
        console.error('[processSalaryPaymentAndPayslip] Global error:', err);
        return null;
    }
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
                `SELECT ed.id, u.id as user_id, ROUND(ed.salary, 2) as salary, u.first_name, u.last_name
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
    
    // Pay salary for a single employee
    paySalary: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const tenantId = req.tenantId || 1;
            const sendEmailParam = req.body?.send_email ?? req.query?.send_email;
            const sendEmail = sendEmailParam !== false && sendEmailParam !== 'false' && sendEmailParam !== 0 && sendEmailParam !== '0';
            
            const [records] = await pool.execute(
                `SELECT id FROM tb_salary_records WHERE id = ? AND tenant_id = ?`,
                [salaryRecordId, tenantId]
            );
            
            if (records.length === 0) {
                return res.status(404).json({ success: false, message: 'Salary record not found' });
            }
            
            await Salary.markAsPaid(tenantId, salaryRecordId);
            const payslipResult = await processSalaryPaymentAndPayslip(tenantId, salaryRecordId, null, sendEmail);
            
            const msg = sendEmail ? 'Salary paid successfully and salary slip sent to email' : 'Salary paid and salary slip generated successfully';
            res.json({ success: true, message: msg, ...payslipResult });
        } catch (error) {
            console.error('Pay salary error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    
    // Pay salaries for all employees in a month
    payBulkSalaries: async (req, res) => {
        try {
            const { month, year } = req.body;
            const tenantId = req.tenantId || 1;
            const sendEmailParam = req.body?.send_email ?? req.query?.send_email;
            const sendEmail = sendEmailParam !== false && sendEmailParam !== 'false' && sendEmailParam !== 0 && sendEmailParam !== '0';
            
            if (!month || !year) {
                return res.status(400).json({ success: false, message: 'Month and year are required' });
            }
            
            const [records] = await pool.execute(
                `SELECT id FROM tb_salary_records WHERE tenant_id = ? AND month_number = ? AND year = ? AND payment_status != 'paid'`,
                [tenantId, month, year]
            );
            
            let paidCount = 0;
            
            for (const record of records) {
                await Salary.markAsPaid(tenantId, record.id);
                await processSalaryPaymentAndPayslip(tenantId, record.id, null, sendEmail);
                paidCount++;
            }
            
            const updatedRecords = await Salary.getAllSalaryRecords(tenantId, parseInt(month), parseInt(year));
            
            const msg = sendEmail 
                ? `Successfully paid salaries and emailed slips for ${paidCount} employees` 
                : `Successfully paid salaries and generated slips for ${paidCount} employees`;

            res.json({ 
                success: true, 
                message: msg,
                paid: paidCount,
                salaries: updatedRecords
            });
        } catch (error) {
            console.error('Pay bulk salaries error:', error);
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
                
                if (newNetSalary < currentPaidAmount) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Net salary (${newNetSalary}) cannot be less than the already paid amount (${currentPaidAmount}).` 
                    });
                }

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

            if (result.new_status === 'paid') {
                await processSalaryPaymentAndPayslip(tenantId, salaryRecordId);
            }
            
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

            await processSalaryPaymentAndPayslip(tenantId, salaryRecordId);
            
            res.json({ success: true, message: 'Salary marked as paid and salary slip sent to email' });
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
            const userId = req.user?.id || req.user?.user_id;

            const [records] = await pool.execute(
                `SELECT sr.*, u.first_name, u.last_name, u.email, u.phone, 
                        ed.bank_account_number, ed.ifsc_code, ed.pan_number, ed.aadhar_number,
                        ed.position, ed.joining_date, ed.department_id,
                        d.name as department_name, u.id as user_id
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

            // Custom authorization check
            const role = req.user?.role || req.user?.position || req.user?.role_name;
            let hasAccess = false;
            
            if (role === 'admin' || role === 'super_admin') {
                hasAccess = true;
            } else if (String(salarySlip.user_id) === String(userId)) {
                hasAccess = true;
            } else {
                const [accessRows] = await pool.execute(
                    `SELECT access_level FROM user_module_access WHERE user_id = ? AND tenant_id = ? AND module_key IN ('salary_management', 'hr')`,
                    [userId, tenantId]
                );
                hasAccess = accessRows.some(r => r.access_level === 'read' || r.access_level === 'write');
            }

            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Unauthorized access to salary slip' });
            }
            
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
    },

    // Send payslip email — accepts base64 PDF or auto-generates
    sendPayslipEmail: async (req, res) => {
        try {
            const { salaryRecordId } = req.params;
            const { pdf_base64 } = req.body || {};
            const tenantId = req.tenantId;

            let pdfBuffer = pdf_base64 ? Buffer.from(pdf_base64, 'base64') : null;
            const payslipResult = await processSalaryPaymentAndPayslip(tenantId, salaryRecordId, pdfBuffer);

            res.json({ success: true, message: 'Payslip processed and sent to email successfully', ...payslipResult });
        } catch (error) {
            console.error('Send payslip email error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get logged-in employee's salary history / slips
    getMySalarySlips: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const userId = req.user?.id || req.user?.user_id;

            // Resolve all employee ID aliases (detail_id e.g. TEAMB02, user_fk e.g. 6)
            const [empRows] = await pool.execute(
                `SELECT id, employee_id FROM employee_details WHERE (employee_id = ? OR id = ?) AND tenant_id = ?`,
                [userId, userId, tenantId]
            );
            
            let idList = [String(userId)];
            if (empRows.length > 0) {
                idList.push(String(empRows[0].id));
                idList.push(String(empRows[0].employee_id));
            }
            idList = Array.from(new Set(idList.filter(Boolean)));
            const placeholders = idList.map(() => '?').join(',');

            // 1. Fetch generated records from tb_salary_records
            const [records] = await pool.execute(
                `SELECT sr.*,
                        u.first_name, u.last_name, u.email,
                        ed.position, d.name as department_name, ed.bank_account_number, ed.ifsc_code, ed.pan_number
                 FROM tb_salary_records sr
                 JOIN employee_details ed ON sr.employee_id = ed.id
                 JOIN users u ON ed.employee_id = u.id
                 LEFT JOIN departments d ON ed.department_id = d.id
                 WHERE sr.employee_id IN (${placeholders}) AND sr.tenant_id = ?
                 ORDER BY sr.year DESC, sr.month DESC`,
                [...idList, tenantId]
            );

            // 2. Fetch document salary slips from employee_documents
            const [docRows] = await pool.execute(
                `SELECT * FROM employee_documents
                 WHERE employee_id IN (${placeholders}) AND tenant_id = ? AND document_type = 'salary_slip' AND is_sent = 1
                 ORDER BY generated_at DESC`,
                [...idList, tenantId]
            );

            const docMap = {};
            docRows.forEach(doc => {
              let meta = {};
              try {
                meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {});
              } catch (e) {}
              if (meta.salary_record_id) {
                docMap[String(meta.salary_record_id)] = doc.file_url;
              }
              if (meta.year && meta.month) {
                docMap[`${meta.year}-${meta.month}`] = doc.file_url;
              }
            });

            res.json({
                success: true,
                salaries: records.map(r => ({
                    ...r,
                    net_salary: roundToTwo(r.net_salary),
                    paid_amount: roundToTwo(r.paid_amount),
                    balance_amount: roundToTwo(r.balance_amount),
                    basic_salary: roundToTwo(r.basic_salary),
                    gross_salary: roundToTwo(r.gross_salary),
                    deduction_amount: roundToTwo(r.deduction_amount),
                    doc_file_url: docMap[String(r.id)] || docMap[`${r.year}-${r.month_number}`] || null
                })),
                documents: docRows
            });
        } catch (error) {
            console.error('Get my salary slips error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = salaryController;
