const PDFDocument = require('pdfkit');
const numberToWords = require('../utils/numberToWords');
const fs = require('fs');
const path = require('path');

const generateSalarySlipPDF = (salarySlip, branding) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- BRANDING & HEADER ---
      // Logo (Full Left Heading)
      if (branding?.logo_url) {
        try {
          const logoPath = path.join(__dirname, '../../', branding.logo_url);
          if (fs.existsSync(logoPath)) {
            // Place logo on left, fixed height/width
            doc.image(logoPath, 40, 40, { fit: [150, 70], align: 'left', valign: 'top' });
          }
        } catch (err) {
          console.error('Error loading logo for PDF:', err);
        }
      }

      // Company Details (Right side)
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#000000')
         .text(branding?.company_name || 'Company Name', 200, 36, { align: 'right', width: 355 });
      
      doc.font('Helvetica').fontSize(9).fillColor('#333333');
      
      let curY = doc.y + 4;
      if (branding?.company_address) {
        doc.text(branding.company_address, 200, curY, { align: 'right', width: 355, lineGap: 2 });
        curY = doc.y + 3;
      }
      if (branding?.company_phone) {
        doc.text(`Phone: ${branding.company_phone}`, 200, curY, { align: 'right', width: 355, lineGap: 2 });
        curY = doc.y + 3;
      }
      if (branding?.company_email) {
        doc.text(`Email: ${branding.company_email}`, 200, curY, { align: 'right', width: 355, lineGap: 2 });
        curY = doc.y + 3;
      }
      if (branding?.company_website) {
        doc.text(`Website: ${branding.company_website}`, 200, curY, { align: 'right', width: 355, lineGap: 2 });
        curY = doc.y + 3;
      }

      // Divider Line (Dynamically positioned below all header text)
      const dividerY = Math.max(curY + 10, 125);
      doc.moveTo(40, dividerY).lineTo(555, dividerY).lineWidth(1).strokeColor('#dddddd').stroke();

      // --- TITLE ---
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[salarySlip.month_number - 1];
      
      const titleY = dividerY + 15;
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#333333')
         .text(`Salary Slip for ${monthName} ${salarySlip.year}`, 40, titleY, { align: 'center' });

      // --- EMPLOYEE DETAILS & ATTENDANCE BREAKDOWN ---
      let detailsObj = salarySlip.details || {};
      if (typeof detailsObj === 'string') {
        try { detailsObj = JSON.parse(detailsObj); } catch(e) {}
      }

      const presentDays = detailsObj.present_days ?? detailsObj.attendance?.present_days ?? '-';
      const absentDays = detailsObj.absent_days ?? detailsObj.attendance?.absent_days ?? '-';
      const halfDays = detailsObj.half_days ?? detailsObj.attendance?.half_days ?? '-';
      const paidLeaveDays = detailsObj.paid_leave_days ?? detailsObj.attendance?.paid_leave_days ?? '-';
      const deductionDays = detailsObj.deduction_days ?? detailsObj.attendance?.deduction_days ?? salarySlip.deduction_days ?? '-';
      const payableDays = detailsObj.paid_days ?? detailsObj.attendance?.paid_days ?? salarySlip.paid_days ?? '-';
      const totalDays = detailsObj.total_days ?? detailsObj.attendance?.total_days ?? 31;

      const detailsY = titleY + 24;
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
      
      const formatVal = (val) => (val !== undefined && val !== null && val !== '') ? String(val) : '-';
      
      // Column 1 (Left) - Employee Profile
      doc.font('Helvetica-Bold').text('Employee Name:', 40, detailsY);
      doc.font('Helvetica').text(formatVal(`${salarySlip.first_name || ''} ${salarySlip.last_name || ''}`.trim()), 125, detailsY);
      
      doc.font('Helvetica-Bold').text('Designation:', 40, detailsY + 16);
      doc.font('Helvetica').text(formatVal(salarySlip.position), 125, detailsY + 16);
      
      doc.font('Helvetica-Bold').text('Department:', 40, detailsY + 32);
      doc.font('Helvetica').text(formatVal(salarySlip.department_name), 125, detailsY + 32);

      doc.font('Helvetica-Bold').text('Joining Date:', 40, detailsY + 48);
      const joiningDate = salarySlip.joining_date ? new Date(salarySlip.joining_date).toLocaleDateString('en-GB') : '-';
      doc.font('Helvetica').text(joiningDate, 125, detailsY + 48);

      // Column 2 (Middle) - Bank & Account Info
      const midColX = 220;
      doc.font('Helvetica-Bold').text('Bank Account:', midColX, detailsY);
      doc.font('Helvetica').text(formatVal(salarySlip.bank_account_number), midColX + 80, detailsY);
      
      doc.font('Helvetica-Bold').text('IFSC Code:', midColX, detailsY + 16);
      doc.font('Helvetica').text(formatVal(salarySlip.ifsc_code), midColX + 80, detailsY + 16);
      
      doc.font('Helvetica-Bold').text('PAN Number:', midColX, detailsY + 32);
      doc.font('Helvetica').text(formatVal(salarySlip.pan_number), midColX + 80, detailsY + 32);

      // Column 3 (Right Box) - Attendance & Deductions Summary
      doc.rect(385, detailsY - 5, 170, 75).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a4fa0').text('Attendance Summary', 392, detailsY);
      doc.fillColor('#000000').font('Helvetica').fontSize(8.5);

      doc.font('Helvetica-Bold').text('Present Days:', 392, detailsY + 14);
      doc.font('Helvetica').text(formatVal(presentDays), 495, detailsY + 14, { align: 'right', width: 52 });

      doc.font('Helvetica-Bold').text('Paid Leave (PL):', 392, detailsY + 25);
      doc.font('Helvetica').text(formatVal(paidLeaveDays), 495, detailsY + 25, { align: 'right', width: 52 });

      doc.font('Helvetica-Bold').text('Half Days:', 392, detailsY + 36);
      doc.font('Helvetica').text(formatVal(halfDays), 495, detailsY + 36, { align: 'right', width: 52 });

      doc.font('Helvetica-Bold').text('Absent Days:', 392, detailsY + 47);
      doc.font('Helvetica').text(formatVal(absentDays), 495, detailsY + 47, { align: 'right', width: 52 });

      doc.font('Helvetica-Bold').fillColor('#c0392b').text('Deductive Days:', 392, detailsY + 58);
      doc.font('Helvetica-Bold').fillColor('#c0392b').text(formatVal(deductionDays), 495, detailsY + 58, { align: 'right', width: 52 });

      // --- EARNINGS & DEDUCTIONS TABLE ---
      const tableY = detailsY + 86;
      doc.rect(40, tableY, 515, 22).fill('#f5f5f5');
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5);
      
      doc.text('Earnings', 50, tableY + 6);
      doc.text('Amount (Rs)', 200, tableY + 6, { width: 80, align: 'right' });
      doc.text('Deductions', 310, tableY + 6);
      doc.text('Amount (Rs)', 460, tableY + 6, { width: 80, align: 'right' });
      
      // Box for table body
      const tableHeight = 150;
      doc.rect(40, tableY, 515, tableHeight).strokeColor('#000000').lineWidth(1).stroke();
      doc.moveTo(297, tableY).lineTo(297, tableY + tableHeight).stroke(); // Center vertical line
      
      doc.font('Helvetica').fontSize(9);
      let rowY = tableY + 28;
      
      const earnings = [
        { label: 'Basic Salary', amount: detailsObj.earnings?.basic || salarySlip.basic_salary },
        { label: 'HRA', amount: detailsObj.earnings?.hra || 0 },
        { label: 'Conveyance', amount: detailsObj.earnings?.conveyance || 0 },
        { label: 'Medical Allowance', amount: detailsObj.earnings?.medical || 0 },
        { label: 'Special Allowance', amount: detailsObj.earnings?.special || 0 }
      ].filter(e => parseFloat(e.amount) > 0);

      const leaveDeductionsLabel = deductionDays !== '-' ? `Absence / Leave Deductions (${deductionDays} days)` : 'Absence / Leave Deductions';

      const deductions = [
        { label: 'Professional Tax', amount: detailsObj.deductions?.pt || 0 },
        { label: 'TDS', amount: detailsObj.deductions?.tds || 0 },
        { label: 'EPF', amount: detailsObj.deductions?.epf || 0 },
        { label: 'ESI', amount: detailsObj.deductions?.esi || 0 },
        { label: leaveDeductionsLabel, amount: detailsObj.deductions?.leave_deduction || detailsObj.leave_and_absence_deduction || salarySlip.deduction_amount || 0 }
      ].filter(d => parseFloat(d.amount) > 0);

      const maxRows = Math.max(earnings.length, deductions.length);
      
      let totalEarnings = 0;
      let totalDeductions = 0;

      for (let i = 0; i < maxRows; i++) {
        if (earnings[i]) {
          doc.text(earnings[i].label, 50, rowY);
          doc.text(parseFloat(earnings[i].amount).toFixed(2), 200, rowY, { width: 80, align: 'right' });
          totalEarnings += parseFloat(earnings[i].amount);
        }
        if (deductions[i]) {
          doc.text(deductions[i].label, 310, rowY);
          doc.text(parseFloat(deductions[i].amount).toFixed(2), 460, rowY, { width: 80, align: 'right' });
          totalDeductions += parseFloat(deductions[i].amount);
        }
        rowY += 18;
      }

      // Total Row
      const totalY = tableY + tableHeight;
      doc.rect(40, totalY, 515, 22).fill('#f5f5f5').stroke();
      doc.moveTo(297, totalY).lineTo(297, totalY + 22).stroke(); // Center vertical line
      
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(9.5);
      doc.text('Total Earnings', 50, totalY + 6);
      doc.text(totalEarnings.toFixed(2), 200, totalY + 6, { width: 80, align: 'right' });
      doc.text('Total Deductions', 310, totalY + 6);
      doc.text(totalDeductions.toFixed(2), 460, totalY + 6, { width: 80, align: 'right' });

      // --- NET SALARY PAYABLE & AMOUNT IN WORDS (ONE ROW & BELOW LAYOUT) ---
      const netY = totalY + 22;
      const netSalary = parseFloat(salarySlip.net_salary || 0);
      const rawWords = numberToWords(Math.round(netSalary));
      const amountInWords = String(rawWords || '').toLowerCase().includes('rupees only')
        ? rawWords
        : `${rawWords} Rupees Only`;
      
      // Outer border box for Net Salary + Words
      doc.rect(40, netY, 515, 52).strokeColor('#000000').lineWidth(1).stroke();
      
      // Row 1: NET SALARY PAYABLE: Rs. XXXXX.XX
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
         .text('NET SALARY PAYABLE:', 50, netY + 9);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a4fa0')
         .text(`Rs. ${netSalary.toFixed(2)}`, 300, netY + 8, { width: 245, align: 'right' });
         
      // Inner Divider Line
      doc.moveTo(40, netY + 26).lineTo(555, netY + 26).lineWidth(0.5).strokeColor('#dddddd').stroke();

      // Row 2 (Below): Amount in words: XXXXX Rupees Only
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#333333')
         .text('Amount in words:', 50, netY + 32);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000')
         .text(amountInWords, 150, netY + 32, { width: 395, align: 'left' });

      // --- FOOTER ---
      doc.font('Helvetica').fontSize(9).fillColor('#666666')
         .text('This is a computer-generated document and does not require a signature.', 40, netY + 68, { align: 'center' });
      
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateSalarySlipPDF
};
