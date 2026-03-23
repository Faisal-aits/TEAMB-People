// backend/controllers/salaryController.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Salary = require('../models/salaryModel');

const salaryController = {
    // Get all salary records
    getAllSalaryRecords: async (req, res) => {
        try {
            const { employee, department, month, year, status } = req.query;
            const filters = { employee, department, month, year, status };
            
            const salaryRecords = await Salary.getAll(req.tenantId, filters);
            res.json({ salaryRecords });
        } catch (error) {
            console.error('Get salary records error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get salary records for the logged-in employee
    getMySalaryRecords: async (req, res) => {
        try {
            const { month, year } = req.query;
            const salaryRecords = await Salary.getByUserId(req.user.id, { month, year });
            res.json({ salaryRecords });
        } catch (error) {
            console.error('Get my salary records error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get salary record by ID
    getSalaryRecord: async (req, res) => {
        try {
            const salaryRecord = await Salary.getById(req.tenantId, req.params.id);
            
            if (!salaryRecord) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            res.json({ salaryRecord });
        } catch (error) {
            console.error('Get salary record error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Create new salary record
    createSalaryRecord: async (req, res) => {
        try {
            const {
                employee_id,
                department_id,
                basic_salary,
                allowances,
                deductions,
                net_salary,
                payment_date,
                month,
                year,
                payment_frequency,
                status
            } = req.body;

            // Validation
            if (!employee_id || !basic_salary || !month || !year) {
                return res.status(400).json({ message: 'Employee, basic salary, month, and year are required' });
            }

            // Check if salary record already exists for this employee and period
            const recordExists = await Salary.checkRecordExists(req.tenantId, employee_id, month, year);
            if (recordExists) {
                return res.status(400).json({ message: 'Salary record already exists for this employee and period' });
            }

            const salaryId = await Salary.create(req.tenantId, {
                employee_id,
                department_id,
                basic_salary,
                allowances,
                deductions,
                net_salary,
                payment_date,
                month,
                year,
                payment_frequency: payment_frequency || 'Monthly',
                status: status || 'pending'
            });

            res.status(201).json({ 
                message: 'Salary record created successfully', 
                salary_id: salaryId 
            });
        } catch (error) {
            console.error('Create salary record error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Update salary record
    updateSalaryRecord: async (req, res) => {
        try {
            const {
                employee_id,
                department_id,
                basic_salary,
                allowances,
                deductions,
                net_salary,
                payment_date,
                month,
                year,
                payment_frequency,
                status
            } = req.body;
            const salaryId = req.params.id;

            // Validation
            if (!employee_id || !basic_salary || !month || !year) {
                return res.status(400).json({ message: 'Employee, basic salary, month, and year are required' });
            }

            // Check if salary record exists
            const existingRecord = await Salary.getById(req.tenantId, salaryId);
            if (!existingRecord) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            // Check if salary record already exists for this employee and period (excluding current record)
            const recordExists = await Salary.checkRecordExists(req.tenantId, employee_id, month, year, salaryId);
            if (recordExists) {
                return res.status(400).json({ message: 'Salary record already exists for this employee and period' });
            }

            const affectedRows = await Salary.update(req.tenantId, salaryId, {
                employee_id,
                department_id,
                basic_salary,
                allowances,
                deductions,
                net_salary,
                payment_date,
                month,
                year,
                payment_frequency,
                status
            });

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            res.json({ message: 'Salary record updated successfully' });
        } catch (error) {
            console.error('Update salary record error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Delete salary record
    deleteSalaryRecord: async (req, res) => {
        try {
            const salaryId = req.params.id;

            // Check if salary record exists
            const existingRecord = await Salary.getById(req.tenantId, salaryId);
            if (!existingRecord) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            const affectedRows = await Salary.delete(req.tenantId, salaryId);

            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            res.json({ message: 'Salary record deleted successfully' });
        } catch (error) {
            console.error('Delete salary record error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get employees for dropdown
    getEmployees: async (req, res) => {
        try {
            const employees = await Salary.getEmployees(req.tenantId);
            res.json({ employees });
        } catch (error) {
            console.error('Get employees error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get departments for dropdown
    getDepartments: async (req, res) => {
        try {
            const departments = await Salary.getDepartments(req.tenantId);
            res.json({ departments });
        } catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Generate payslip
    // generatePayslip: async (req, res) => {
    //     try {
    //         const salaryId = req.params.id;
            
    //         // Check if salary record exists
    //         const salaryRecord = await Salary.getById(req.tenantId, salaryId);
    //         if (!salaryRecord) {
    //             return res.status(404).json({ message: 'Salary record not found' });
    //         }

    //         // In a real application, you would generate a PDF here
    //         // For now, we'll just return success
    //         res.json({ 
    //             message: 'Payslip generated successfully',
    //             payslip_data: salaryRecord
    //         });
    //     } catch (error) {
    //         console.error('Generate payslip error:', error);
    //         res.status(500).json({ message: 'Server error' });
    //     }
    // },

    // Get salary statistics
    getSalaryStats: async (req, res) => {
        try {
            const stats = await Salary.getStatistics(req.tenantId);
            res.json({ stats });
        } catch (error) {
            console.error('Get salary stats error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    },
   
    // Generate payslip PDF
    generatePayslip: async (req, res) => {
        try {
            const salaryId = req.params.id;
            
            // Get salary record with complete details
            const salaryRecord = await Salary.getById(req.tenantId, salaryId);
            if (!salaryRecord) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            // Create PDF document
            const doc = new PDFDocument({ margin: 50 });
            
            // Set response headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 
                `attachment; filename=payslip-${salaryRecord.employee_name}-${salaryRecord.month}-${salaryRecord.year}.pdf`);

            // Pipe PDF to response
            doc.pipe(res);

            // Generate payslip content
            generatePayslipContent(doc, salaryRecord);

            // Finalize PDF
            doc.end();

        } catch (error) {
            console.error('Generate payslip error:', error);
            res.status(500).json({ message: 'Error generating payslip' });
        }
    },

    // Generate payslip and return as base64 (for preview)
    generatePayslipPreview: async (req, res) => {
        try {
            const salaryId = req.params.id;
            
            const salaryRecord = await Salary.getById(req.tenantId, salaryId);
            if (!salaryRecord) {
                return res.status(404).json({ message: 'Salary record not found' });
            }

            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                const base64Pdf = pdfBuffer.toString('base64');
                
                res.json({
                    success: true,
                    data: {
                        base64: base64Pdf,
                        filename: `payslip-${salaryRecord.employee_name}-${salaryRecord.month}-${salaryRecord.year}.pdf`
                    }
                });
            });

            generatePayslipContent(doc, salaryRecord);
            doc.end();

        } catch (error) {
            console.error('Generate payslip preview error:', error);
            res.status(500).json({ message: 'Error generating payslip preview' });
        }
    }

};
// Helper function to generate payslip content
function generatePayslipContent(doc, salaryRecord) {
    const { employee_name, employee_id, designation, department_name, month, year, 
            basic_salary, allowances, deductions, net_salary, payment_date, 
            bank_account_number, ifsc_code, pan_number, aadhar_number } = salaryRecord;

    // Company Header
    doc.fillColor('#2c3e50')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('COMPANY NAME LTD.', 50, 50, { align: 'center' });
    
    doc.fillColor('#7f8c8d')
       .fontSize(12)
       .font('Helvetica')
       .text('Salary Payslip', 50, 75, { align: 'center' });
    
    // Separator line
    doc.moveTo(50, 95).lineTo(550, 95).strokeColor('#bdc3c7').lineWidth(1).stroke();

    // Employee Details Section
    doc.y = 110;
    
    // Left Column - Employee Info
    doc.fillColor('#2c3e50')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Employee Details:', 50, doc.y);
    
    doc.fillColor('#34495e')
       .fontSize(10)
       .font('Helvetica')
       .text(`Name: ${employee_name}`, 50, doc.y + 20)
       .text(`Employee ID: ${employee_id}`, 50, doc.y + 35)
       .text(`Designation: ${designation}`, 50, doc.y + 50)
       .text(`Department: ${department_name}`, 50, doc.y + 65);

    // Right Column - Payment Info
    doc.fillColor('#2c3e50')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Payment Details:', 300, doc.y);
    
    doc.fillColor('#34495e')
       .fontSize(10)
       .font('Helvetica')
       .text(`Payment Month: ${month} ${year}`, 300, doc.y + 20)
       .text(`Payment Date: ${new Date(payment_date).toLocaleDateString('en-IN')}`, 300, doc.y + 35)
       .text(`Payment Status: Paid`, 300, doc.y + 50);

    doc.y += 90;

    // Salary Breakdown Section
    doc.fillColor('#2c3e50')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Salary Breakdown', 50, doc.y, { align: 'center' });
    
    doc.y += 25;

    // Earnings Table
    const earningsStartY = doc.y;
    
    // Table Header - Earnings
    doc.fillColor('#ecf0f1')
       .rect(50, doc.y, 250, 20)
       .fill();
    
    doc.fillColor('#2c3e50')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('EARNINGS', 60, doc.y + 6)
       .text('AMOUNT (₹)', 200, doc.y + 6, { width: 90, align: 'right' });
    
    doc.y += 25;

    // Earnings Rows
    const earnings = [
        { description: 'Basic Salary', amount: basic_salary },
        { description: 'House Rent Allowance (HRA)', amount: allowances.hra },
        { description: 'Transport Allowance', amount: allowances.transport },
        { description: 'Medical Allowance', amount: allowances.medical },
        { description: 'Special Allowance', amount: allowances.special }
    ];

    earnings.forEach((earning, index) => {
        const yPos = doc.y + (index * 18);
        
        doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f8f9fa')
           .rect(50, yPos, 250, 18)
           .fill();
        
        doc.fillColor('#2c3e50')
           .fontSize(9)
           .font('Helvetica')
           .text(earning.description, 60, yPos + 5)
           .text(formatCurrency(earning.amount), 200, yPos + 5, { width: 90, align: 'right' });
    });

    // Total Earnings
    const totalEarningsY = doc.y + (earnings.length * 18);
    const totalEarnings = basic_salary + allowances.hra + allowances.transport + allowances.medical + allowances.special;
    
    doc.fillColor('#d5dbdb')
       .rect(50, totalEarningsY, 250, 20)
       .fill();
    
    doc.fillColor('#2c3e50')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Total Earnings', 60, totalEarningsY + 6)
       .text(formatCurrency(totalEarnings), 200, totalEarningsY + 6, { width: 90, align: 'right' });

    // Deductions Table (Right Side)
    const deductionsStartY = earningsStartY;
    
    // Table Header - Deductions
    doc.fillColor('#ecf0f1')
       .rect(320, deductionsStartY, 230, 20)
       .fill();
    
    doc.fillColor('#2c3e50')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('DEDUCTIONS', 330, deductionsStartY + 6)
       .text('AMOUNT (₹)', 440, deductionsStartY + 6, { width: 100, align: 'right' });
    
    doc.y = deductionsStartY + 25;

    // Deductions Rows
    const deductionItems = [
        { description: 'Income Tax', amount: deductions.tax },
        { description: 'Provident Fund (PF)', amount: deductions.provident_fund },
        { description: 'Insurance', amount: deductions.insurance },
        { description: 'Loan Recovery', amount: deductions.loan }
    ];

    deductionItems.forEach((deduction, index) => {
        const yPos = doc.y + (index * 18);
        
        doc.fillColor(index % 2 === 0 ? '#ffffff' : '#f8f9fa')
           .rect(320, yPos, 230, 18)
           .fill();
        
        doc.fillColor('#2c3e50')
           .fontSize(9)
           .font('Helvetica')
           .text(deduction.description, 330, yPos + 5)
           .text(formatCurrency(deduction.amount), 440, yPos + 5, { width: 100, align: 'right' });
    });

    // Total Deductions
    const totalDeductionsY = doc.y + (deductionItems.length * 18);
    const totalDeductions = deductions.tax + deductions.provident_fund + deductions.insurance + deductions.loan;
    
    doc.fillColor('#d5dbdb')
       .rect(320, totalDeductionsY, 230, 20)
       .fill();
    
    doc.fillColor('#2c3e50')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Total Deductions', 330, totalDeductionsY + 6)
       .text(formatCurrency(totalDeductions), 440, totalDeductionsY + 6, { width: 100, align: 'right' });

    // Net Salary Section
    const netSalaryY = Math.max(totalEarningsY, totalDeductionsY) + 30;
    
    doc.fillColor('#2c3e50')
       .rect(50, netSalaryY, 500, 30)
       .fill();
    
    doc.fillColor('#ffffff')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('NET SALARY', 60, netSalaryY + 8)
       .text(formatCurrency(net_salary), 400, netSalaryY + 8, { width: 140, align: 'right' });

    // Bank Details Section
    doc.y = netSalaryY + 50;
    
    doc.fillColor('#2c3e50')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Bank Details:', 50, doc.y);
    
    if (bank_account_number && ifsc_code) {
        doc.fillColor('#34495e')
           .fontSize(10)
           .font('Helvetica')
           .text(`Account Number: ${bank_account_number}`, 50, doc.y + 20)
           .text(`IFSC Code: ${ifsc_code}`, 50, doc.y + 35);
    }

    // Footer
    const footerY = 750;
    
    doc.fillColor('#7f8c8d')
       .fontSize(8)
       .font('Helvetica')
       .text('This is a computer-generated payslip and does not require signature.', 50, footerY, { align: 'center' })
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 50, footerY + 12, { align: 'center' });

    // Confidential Watermark
    doc.fillColor('#f8f9fa')
       .fontSize(60)
       .font('Helvetica-Bold')
       .text('CONFIDENTIAL', 50, 300, { 
           align: 'center',
           opacity: 0.1,
           rotate: 45 
       });
}

// Helper function to format currency
function formatCurrency(amount) {
    return '₹' + new Intl.NumberFormat('en-IN').format(amount);
}



module.exports = salaryController;