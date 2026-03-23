import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import fallbackLogo from '../assets/img/company.png';
import fallbackStamp from '../assets/img/stamp.png';
import { brandingAPI } from './brandingAPI';

export const resignationPDFService = {
  generatePDFBlob: async (pdfData) => {
    try {
      console.log('Generating PDF Blob for Resignation Letter');
      
      let branding = {};
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
      } catch (err) { console.error("Failed to load branding", err); }
      
      const fullData = {
        ...pdfData,
        company: {
          name: branding.company_name || "Company Name",
          address: branding.company_address || "Company Address",
          email: branding.company_email || "Company Email",
          website: branding.company_website || "Company Website"
        },
        hr: {
          name: branding.hr_name || "HR Name",
          designation: branding.hr_designation || "HR Designation",
          signature: branding.signature_url ? brandingAPI.getImageUrl(branding.signature_url) : null
        },
        logo: branding.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : fallbackLogo,
        stamp: branding.stamp_url ? brandingAPI.getImageUrl(branding.stamp_url) : fallbackStamp
      };

      const htmlContent = generateLetterHTML(fullData);
      return await generatePDF(htmlContent);

    } catch (error) {
      console.error('Error generating resignation letter:', error);
      throw error;
    }
  }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const commonHeader = (logo, website, email) => `
  <div style="width: 100%; border-bottom: 5px solid #000; padding: 10mm 20mm 5mm 20mm; box-sizing: border-box; display: table;">
    <div style="display: table-cell; vertical-align: middle; text-align: left; padding-right: 15mm;">
      <img src="${logo}" alt="Logo" style="height: 100px; width: auto; max-width: 350px; display: block; object-fit: contain; padding: 0 2px;">
    </div>
    <div style="display: table-cell; vertical-align: middle; text-align: left; line-height: 1.2;">
      <div style="display: inline-block; text-align: left; font-size: 11pt; white-space: nowrap;">
        <div style="font-weight: bold; margin-bottom: 4px;">${website}</div>
        <div style="font-weight: bold;">${email}</div>
      </div>
    </div>
  </div>
`;

const generateLetterHTML = ({ employeeName, joiningDate, requestedLastDay, hrNote, company, hr, logo, stamp, generatedAt, refNumber }) => {
  const joinDate = new Date(joiningDate);
  const leaveDate = new Date(requestedLastDay);
  let tenure = "";
  if (!isNaN(joinDate) && !isNaN(leaveDate)) {
    let diffObj = diffDates(joinDate, leaveDate);
    tenure = `${diffObj.years} Years, ${diffObj.months} Months`;
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #000; line-height: 1.6; min-height: 297mm; display: flex; flex-direction: column;">
      ${commonHeader(logo, company.website, company.email)}
      <div style="padding: 15mm 20mm 40mm 20mm; flex-grow: 1;">
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="width: 50%;">
            <div style="font-weight: bold; font-size: 12pt;">Date: ${formatShortDate(generatedAt)}</div>
          </div>
          <div style="text-align: right; width: 45%;">
            <div style="font-weight: bold; font-size: 12pt;">Ref No: ${refNumber || '-'}</div>
          </div>
        </div>

        <div style="font-weight: bold; font-size: 12pt; margin-bottom: 25px;">
          Dear ${employeeName || 'Employee'},
        </div>

        <div style="text-align: justify; font-size: 11pt; font-family: 'Times New Roman', Times, serif;">
          <p>This letter is to acknowledge the receipt of your resignation letter. We hereby accept your resignation effective <strong>${formatShortDate(requestedLastDay)}</strong>.</p>
          
          ${hrNote ? `<p>${hrNote}</p>` : ''}
          
          <p>We thank you for your contributions to <strong>${company.name}</strong> during your tenure of <strong>${tenure}</strong>.</p>
          
          <p>Wishing you the best in your future endeavors.</p>
        </div>

        <div style="margin-top: 60px; display: flex; flex-direction: column; align-items: flex-start;">
          <div style="text-align: left; font-family: Arial, sans-serif;">
            ${hr.signature ? `<img src="${hr.signature}" alt="Signature" style="height: 50px; margin-bottom: 5px; object-fit: contain;">` : '<div style="height:50px"></div>'}
            ${stamp ? `<img src="${stamp}" alt="Stamp" style="height: 80px; width: auto; max-width: 130px; object-fit: contain; margin-bottom: 5px; position: absolute; margin-top:-30px; opacity: 0.8; z-index:-1;">` : ''}
            <div>
              <div style="font-weight: bold; font-size: 11pt; margin-bottom: 4px;">Regards,</div>
              <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2px;">${hr.name}</div>
              <div style="font-size: 10pt; margin-bottom: 2px;">${hr.designation}</div>
              <div style="font-weight: bold; font-size: 10pt;">${company.name}</div>
            </div>
          </div>
        </div>

      </div>
      <div style="margin-top: 'auto'; border-top: 3px solid #000; padding: 15px 20px; text-align: center; font-size: 10pt; font-weight: bold; background: #fff; width: 100%; box-sizing: border-box; white-space: pre-line;">
        ${company.address}
      </div>
    </div>
  `;
};

// Helper inside file for date diffs
function diffDates(date1, date2) {
  let d1 = new Date(Math.min(date1, date2));
  let d2 = new Date(Math.max(date1, date2));
  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  if (months < 0) { years--; months += 12; }
  return { years, months };
}

const generatePDF = async (htmlContent) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.minHeight = '297mm';
      tempDiv.style.padding = '0';
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.background = 'white';
      tempDiv.style.color = '#333';
      
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      document.body.removeChild(tempDiv);

      // Convert to blob instead of forcing save
      resolve(pdf.output('blob'));
    } catch (error) {
      reject(error);
    }
  });
};
