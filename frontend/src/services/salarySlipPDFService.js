import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import fallbackLogo from '../assets/img/company.png';
import fallbackStamp from '../assets/img/stamp.png';
import { brandingAPI } from './brandingAPI';

export const salarySlipPDFService = {
  downloadSalarySlip: async (formData) => {
    try {
      let branding = {};
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
      } catch (err) { console.error("Failed to fetch branding data", err); }

      const html = generateSalarySlipHTML(formData, branding);
      const pdf = await generatePDFFromHTML(html);
      pdf.save(`SalarySlip_${formData.fullName.replace(/\s+/g, '_')}_${formData.monthYear.replace(/[\s,]+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },

  viewSalarySlip: async (formData) => {
    try {
      let branding = {};
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
      } catch (err) { console.error("Failed to fetch branding data", err); }

      const html = generateSalarySlipHTML(formData, branding);
      const pdf = await generatePDFFromHTML(html);
      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error viewing PDF:', error);
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
  return new Intl.NumberFormat('en-IN').format(amt || 0);
};

const generateSalarySlipHTML = (data, branding) => {
  const totalEarnings = Object.values(data.earnings).reduce((a, b) => a + Number(b), 0);
  const totalDeductions = Object.values(data.deductions).reduce((a, b) => a + Number(b), 0);
  const netPay = totalEarnings - totalDeductions;

  const company_name = branding?.company_name || "Arham IT Solution";
  const company_address = branding?.company_address ? branding.company_address.replace(/\n/g, '<br />') : "Above Being Healthy Gym, Near Surbhi Hospital, Nagar–Sambhaji Nagar Road,<br />Ahilyanagar, Maharashtra 414003";
  const company_email = branding?.company_email || "info@arhamitsolution.in";
  const company_website = branding?.company_website || "www.arhamitsolution.in";
  const hr_name = branding?.hr_name || "Sharjeel Iqbal";
  const hr_designation = branding?.hr_designation || "HR & BDE Executive";
  
  const logo_url = branding?.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : fallbackLogo;
  const stamp_url = branding?.stamp_url ? brandingAPI.getImageUrl(branding.stamp_url) : fallbackStamp;
  const signature_url = branding?.signature_url ? brandingAPI.getImageUrl(branding.signature_url) : null;

  return `
    <div style="font-family: Arial, sans-serif; color: #000; width: 210mm; min-height: 297mm; background: #fff; display: flex; flex-direction: column; box-sizing: border-box;">
      <!-- Header -->
      <div style="width: 100%; border-bottom: 5px solid #000; padding: 10mm 20mm 5mm 20mm; box-sizing: border-box; display: table;">
        <div style="display: table-cell; vertical-align: middle; text-align: left; padding-right: 15mm;">
          ${logo_url ? `<img src="${logo_url}" alt="Logo" style="height: 100px; width: auto; max-width: 350px; display: block; object-fit: contain; padding: 0 2px;">` : ''}
        </div>
        <div style="display: table-cell; vertical-align: middle; text-align: left; line-height: 1.2;">
          <div style="display: inline-block; text-align: left; font-size: 11pt; white-space: nowrap;">
            <div style="display: table; margin-bottom: 8px;">
               <div style="display: table-cell; vertical-align: middle;">
                 <div style="background: #000; border-radius: 50%; width: 20pt; height: 20pt; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 8pt;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 12pt; height: 12pt;">
                      <circle cx="12" cy="12" r="9" />
                      <line x1="3.6" y1="9" x2="20.4" y2="9" />
                      <line x1="3.6" y1="15" x2="20.4" y2="15" />
                      <path d="M11.5 3a17 17 0 0 0 0 18" />
                      <path d="M12.5 3a17 17 0 0 1 0 18" />
                    </svg>
                 </div>
               </div>
               <div style="display: table-cell; vertical-align: middle; font-weight: bold;">
                 ${company_website}
               </div>
            </div>
            <div style="display: table;">
               <div style="display: table-cell; vertical-align: middle;">
                 <div style="background: #000; border-radius: 50%; width: 20pt; height: 20pt; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 8pt;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 11pt; height: 11pt;">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <polyline points="3 7 12 13 21 7" />
                    </svg>
                 </div>
               </div>
               <div style="display: table-cell; vertical-align: middle; font-weight: bold;">
                 ${company_email}
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div style="padding: 10mm 15mm 20mm 15mm; flex-grow: 1;">
        <div style="text-align: center; font-size: 15pt; font-weight: bold; margin-bottom: 25px;">Employee Salary Slip</div>

        <div style="font-size: 12pt; line-height: 1.8; margin-bottom: 30px;">
          <p style="margin: 5px 0;"><strong>Employee Name:</strong> ${data.fullName}</p>
          <p style="margin: 5px 0;"><strong>Month & Year:</strong> ${data.monthYear}</p>
          <p style="margin: 5px 0;"><strong>Designation:</strong> ${data.designation}</p>
          <p style="margin: 20px 0 10px 0;"><strong>Salary paid by ${data.paymentMode || 'Bank Transfer'}:</strong></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 11pt;">
          <thead>
            <tr>
              <th style="border: 1.5px solid #000; padding: 18px 10px; text-align: left; background: #f8fafc;">Earnings (₹)</th>
              <th style="border: 1.5px solid #000; padding: 18px 10px; text-align: right; background: #f8fafc;">Amount (₹)</th>
              <th style="border: 1.5px solid #000; padding: 18px 10px; text-align: left; background: #f8fafc;">Deductions (₹)</th>
              <th style="border: 1.5px solid #000; padding: 18px 10px; text-align: right; background: #f8fafc;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Basic Salary</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.earnings.basic)}</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Provident Fund (PF)</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.deductions.pf)}</td>
            </tr>
            <tr>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">House Rent Allowance</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.earnings.hra)}</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Professional Tax (PT)</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.deductions.pt)}</td>
            </tr>
            <tr>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Conveyance Allowance</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.earnings.conveyance)}</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Income Tax (TDS)</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.deductions.tds)}</td>
            </tr>
            <tr>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Medical Allowance</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.earnings.medical)}</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; font-weight: bold;">Total Deductions</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right; font-weight: bold;">₹ ${formatCurrency(totalDeductions)}</td>
            </tr>
            <tr>
              <td style="border: 1.5px solid #000; padding: 15px 10px;">Special Allowance</td>
              <td style="border: 1.5px solid #000; padding: 15px 10px; text-align: right;">₹ ${formatCurrency(data.earnings.special)}</td>
              <td colspan="2" style="border: 1.5px solid #000; padding: 15px 10px;"></td>
            </tr>
            <tr style="background: #f1f5f9;">
              <td style="border: 1.5px solid #000; padding: 18px 10px; font-weight: bold;">Total Earnings</td>
              <td style="border: 1.5px solid #000; padding: 18px 10px; text-align: right; font-weight: bold;">₹ ${formatCurrency(totalEarnings)}</td>
              <td style="border: 1.5px solid #000; padding: 18px 10px; font-weight: bold;">Net Pay (Take-home)</td>
              <td style="border: 1.5px solid #000; padding: 18px 10px; text-align: right; font-weight: bold;">₹ ${formatCurrency(netPay)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="text-align: center;">
            <div style="height: 60px;"></div>
            <div style="border-top: 1.5px solid #000; width: 180px; padding-top: 5px;">
              <p style="font-size: 10pt; font-weight: bold; margin: 0;">Employee Signature</p>
            </div>
          </div>
          <div style="text-align: right; position: relative;">
            ${stamp_url ? `<img src="${stamp_url}" alt="Stamp" style="height: 90px; width: auto; max-width: 140px; position: absolute; right: 30px; top: -75px; opacity: 0.9; object-fit: contain;">` : ''}
            <div style="position: relative; z-index: 2; display: flex; flex-direction: column; align-items: flex-end;">
              ${signature_url ? `<img src="${signature_url}" alt="Signature" style="height: 45px; margin-bottom: 5px; object-fit: contain;">` : '<div style="height: 50px;"></div>'}
              <p style="font-weight: bold; margin: 0;">Best Regards,</p>
              <p style="font-weight: bold; margin: 0; font-size: 13pt;">${hr_name}</p>
              <p style="font-size: 10pt; margin: 2px 0;">${hr_designation}</p>
              <p style="font-weight: bold; margin: 0;">${company_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: auto; border-top: 3px solid #000; padding: 15px 20px; textAlign: center; font-size: 10pt; font-weight: bold; background: #fff; width: 100%; box-sizing: border-box; text-align: center;">
        ${company_address}
      </div>
    </div>
  `;
};
