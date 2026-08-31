import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { brandingAPI } from './brandingAPI';
import api from './api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Given formData, returns a human-readable "Month YYYY" string.
 * Accepts month as a number (1–12), a month name string, or extracts from monthYear.
 */
const resolveMonthTitle = (data) => {
  // If month number is provided
  if (data.month && !isNaN(Number(data.month))) {
    const idx = Number(data.month) - 1;
    const name = MONTH_NAMES[idx] || data.month;
    return `${name} ${data.year || ''}`.trim();
  }
  // If monthYear is already like "January 2026"
  if (data.monthYear) {
    const parts = data.monthYear.split(/[\s/,]+/);
    // If first part is a number, convert
    if (!isNaN(Number(parts[0]))) {
      const idx = Number(parts[0]) - 1;
      const name = MONTH_NAMES[idx] || parts[0];
      return `${name} ${parts[1] || ''}`.trim();
    }
    return data.monthYear;
  }
  return '';
};

export const salarySlipPDFService = {
  downloadSalarySlip: async (formData) => {
    try {
      let branding = {};
      let salaryFormat = 'Monthly';
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
        
        const settingsRes = await api.get('/settings/salary_format');
        if (settingsRes.data?.value) salaryFormat = settingsRes.data.value;
      } catch (err) { console.error("Failed to fetch branding/settings data", err); }

      const html = generateSalarySlipHTML(formData, branding, salaryFormat);
      const pdf = await generatePDFFromHTML(html);
      const monthTitle = resolveMonthTitle(formData).replace(/\s+/g, '_');
      pdf.save(`SalarySlip_${(formData.fullName || '').replace(/\s+/g, '_')}_${monthTitle}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },

  generatePDFBlob: async (formData) => {
    try {
      let branding = {};
      let salaryFormat = 'Monthly';
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
        const settingsRes = await api.get('/settings/salary_format');
        if (settingsRes.data?.value) salaryFormat = settingsRes.data.value;
      } catch (err) { console.error("Failed to fetch branding/settings data", err); }

      const html = generateSalarySlipHTML(formData, branding, salaryFormat);
      const pdf = await generatePDFFromHTML(html);
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      throw error;
    }
  },

  viewSalarySlip: async (formData) => {
    try {
      let branding = {};
      let salaryFormat = 'Monthly';
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
        const settingsRes = await api.get('/settings/salary_format');
        if (settingsRes.data?.value) salaryFormat = settingsRes.data.value;
      } catch (err) { console.error("Failed to fetch branding/settings data", err); }

      const html = generateSalarySlipHTML(formData, branding, salaryFormat);
      const pdf = await generatePDFFromHTML(html);
      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF blob URL:', error);
      throw error;
    }
  }
};

const generatePDFFromHTML = async (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '210mm';
  tempDiv.style.minHeight = '297mm';
  tempDiv.style.background = 'white';
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    return pdf;
  } finally {
    document.body.removeChild(tempDiv);
  }
};

const formatCurrency = (amt) => {
  return new Intl.NumberFormat('en-IN').format(Math.round(amt || 0));
};

const numberToWords = (num) => {
  // Ensure integer
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numStr = num.toString();
  if (numStr.length > 9) return 'overflow';

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return 'Zero';

  let str = '';
  str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
  str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
  str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
  str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
  str += n[5] != 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim();
};

const generateSalarySlipHTML = (data, branding, salaryFormat = 'Monthly') => {
  // ── Salary figures: use pre-calculated values from salary management ──
  const basicSalary = Math.round(data.earnings?.basic || data.basicSalary || 0);
  // netSalary = the already-computed value from the DB (after deductions / pro-rata)
  const netPay = Math.round(data.netSalary ?? data.earnings?.net ?? basicSalary);
  const grossSalary = Math.round(data.grossSalary ?? basicSalary);
  const deductionAmount = Math.round(data.deductionAmount ?? (grossSalary - netPay));

  // ── Branding ──
  const company_name = branding?.company_name || '';
  const company_address = branding?.company_address ? branding.company_address.replace(/\n/g, ', ') : '';
  const logo_url = branding?.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : null;

  // ── Month title ──
  const monthTitle = resolveMonthTitle(data);

  // ── Attendance breakdown ──
  const presentDays    = data.presentDays    ?? data.present_days    ?? '-';
  const absentDays     = data.absentDays     ?? data.absent_days     ?? '-';
  const halfDays       = data.halfDays       ?? data.half_days       ?? '-';
  const paidLeaveDays  = data.paidLeaveDays  ?? data.paid_leave_days ?? '-';
  const unpaidLeaveDays= data.unpaidLeaveDays?? data.unpaid_leave_days?? '-';
  const payableDays    = data.payableDays    ?? data.paid_days       ?? '-';
  const nonPayableDays = data.nonPayableDays ?? data.deduction_days  ?? '-';

  return `
    <div style="font-family: Arial, sans-serif; color: #000; width: 210mm; padding: 20mm 15mm; background: #fff; box-sizing: border-box; font-size: 9pt;">
      
      <!-- Top Block: Company Info & Payslip Title -->
      <div style="border: 1px solid #000; margin-bottom: 5px; padding: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="width: 40%;">
            ${logo_url ? `<img src="${logo_url}" alt="Logo" style="max-height: 80px; width: auto; object-fit: contain;">` : `<h2 style="margin:0; font-size:14pt;">${company_name}</h2>`}
          </div>
          <div style="width: 60%; text-align: right;">
             <h3 style="margin: 0 0 5px 0; font-size: 11pt; text-transform: uppercase;">${company_name}</h3>
             <p style="margin: 0; line-height: 1.4; font-size: 9pt;">${company_address}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px;">
           <p style="margin: 0; font-weight: bold; font-size: 10pt;">Payslip for ${monthTitle}</p>
        </div>
      </div>

      <!-- Employee Details Block -->
      <div style="border: 1px solid #000; display: flex; margin-bottom: 5px;">
        <!-- Left: Employee Info -->
        <div style="width: 50%; border-right: 1px solid #000; padding: 10px;">
          <table style="width: 100%; font-size: 9pt; border-collapse: collapse;">
            <tr><td style="width: 45%; padding: 2px 0; color: #555;">Employee Name</td><td><strong>${data.fullName || '-'}</strong></td></tr>
            <tr><td style="padding: 2px 0; color: #555;">Employee ID</td><td>${data.employeeId || '-'}</td></tr>
            <tr><td style="padding: 2px 0; color: #555;">Designation</td><td>${data.designation || '-'}</td></tr>
            <tr><td style="padding: 2px 0; color: #555;">Department</td><td>${data.department || '-'}</td></tr>
            <tr><td style="padding: 2px 0; color: #555;">Date of Joining</td><td>${data.dateOfJoining || '-'}</td></tr>
            <tr><td style="padding: 2px 0; color: #555;">Bank A/C No</td><td>${data.bankAccountNo || '-'}</td></tr>
            <tr><td style="padding: 2px 0; color: #555;">PAN</td><td>${data.pan || '-'}</td></tr>
          </table>
        </div>
        <!-- Right: Attendance Summary -->
        <div style="width: 50%; padding: 10px;">
          <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 9pt; border-bottom: 1px solid #ccc; padding-bottom: 4px;">Attendance Summary</p>
          <table style="width: 100%; font-size: 9pt; border-collapse: collapse;">
            <tr>
              <td style="width: 55%; padding: 2px 0; color: #555;">Present Days</td>
              <td style="font-weight: 600; color: #1a6b1a;">${presentDays}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #555;">Absent Days</td>
              <td style="font-weight: 600; color: #c0392b;">${absentDays}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #555;">Half Days</td>
              <td style="font-weight: 600;">${halfDays}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #555;">Paid Leave (PL)</td>
              <td style="font-weight: 600; color: #1a6b1a;">${paidLeaveDays}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #555;">Half Days</td>
              <td style="font-weight: 600;">${halfDays}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #555;">Absent Days</td>
              <td style="font-weight: 600; color: #c0392b;">${absentDays}</td>
            </tr>
            <tr style="border-top: 1px solid #ccc; margin-top: 4px;">
              <td style="padding: 4px 0 2px 0; color: #c0392b; font-weight: bold;">Total Deductive Days</td>
              <td style="font-weight: bold; color: #c0392b;">${nonPayableDays}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #555; font-weight: bold;">Payable Days</td>
              <td style="font-weight: bold; color: #1a4fa0;">${payableDays}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Earnings and Deductions Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9pt;">
        <thead>
          <tr style="border-bottom: 1px solid #000; background: #f0f0f0;">
            <th colspan="2" style="border-right: 1px solid #000; padding: 6px; text-align: center;">Earnings</th>
            <th colspan="2" style="padding: 6px; text-align: center;">Deductions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px;">Basic Salary</td>
            <td style="padding: 5px; text-align: right; border-right: 1px solid #000;">${formatCurrency(basicSalary)}</td>
            <td style="padding: 5px;">Absence / Leave Deductions ${nonPayableDays !== '-' ? `(${nonPayableDays} days)` : ''}</td>
            <td style="padding: 5px; text-align: right;">${deductionAmount > 0 ? formatCurrency(deductionAmount) : '0.00'}</td>
          </tr>
          <tr>
            <td style="padding: 5px;"></td>
            <td style="padding: 5px; text-align: right; border-right: 1px solid #000;"></td>
            <td style="padding: 5px;">Professional Tax</td>
            <td style="padding: 5px; text-align: right;">0.00</td>
          </tr>
          <tr>
            <td style="padding: 5px;"></td>
            <td style="padding: 5px; text-align: right; border-right: 1px solid #000;"></td>
            <td style="padding: 5px;">Health Insurance/ESI</td>
            <td style="padding: 5px; text-align: right;">0.00</td>
          </tr>
          <tr>
            <td style="padding: 5px; height: 30px;"></td>
            <td style="padding: 5px; text-align: right; border-right: 1px solid #000;"></td>
            <td style="padding: 5px;">Income Tax</td>
            <td style="padding: 5px; text-align: right;">0.00</td>
          </tr>
          
          <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000; background: #fafafa;">
            <td style="padding: 6px; font-weight: bold;">Gross Salary</td>
            <td style="padding: 6px; text-align: right; font-weight: bold; border-right: 1px solid #000;">${formatCurrency(grossSalary)}</td>
            <td style="padding: 6px; font-weight: bold;">Total Deduction</td>
            <td style="padding: 6px; text-align: right; font-weight: bold;">${deductionAmount > 0 ? formatCurrency(deductionAmount) : '0.00'}</td>
          </tr>
        </tbody>
      </table>

      <!-- NET SALARY PAYABLE BLOCK (ONE ROW & BELOW LAYOUT) -->
      <div style="border: 1px solid #000; margin-top: 10px; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #ddd; background: #e8f4e8;">
          <span style="font-weight: bold; font-size: 10.5pt; color: #000;">NET SALARY PAYABLE:</span>
          <span style="font-weight: bold; font-size: 12pt; color: #1a4fa0;">Rs. ${formatCurrency(netPay)}.00</span>
        </div>
        <div style="padding: 8px 12px; font-size: 9.5pt; background: #fafafa;">
          <strong>Amount in words:</strong> ${numberToWords(netPay)} Rupees Only
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 8pt; font-style: italic; color: #555;">
         This is a system generated pay slip and does not require any stamp or signature
      </div>

    </div>
  `;
};
