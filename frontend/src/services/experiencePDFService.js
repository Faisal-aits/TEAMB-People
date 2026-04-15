import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import fallbackLogo from '../assets/img/company.png';
import fallbackStamp from '../assets/img/stamp.png';
import { brandingAPI } from './brandingAPI';

export const experiencePDFService = {
  generatePDFBlob: async (pdfData) => {
    try {
      console.log('Generating PDF Blob for Experience Letter', pdfData);
      
      // Validate required data
      if (!pdfData) {
        throw new Error('PDF data is required');
      }
      
      let branding = {};
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) {
          branding = res.data.branding;
          console.log('Branding loaded successfully');
        }
      } catch (err) { 
        console.warn("Failed to load branding, using defaults", err); 
      }
      
      const fullData = {
        ...pdfData,
        company: {
          name: branding.company_name || "KosQu Technolab",
          address: branding.company_address || "KosQu Technolab, Innovation Hub, Electronic City, Bengaluru - 560100",
          email: branding.company_email || "info@kosqu.com",
          website: branding.company_website || "www.kosqu.com"
        },
        hr: {
          name: branding.hr_name || "Ashish Thakur",
          designation: branding.hr_designation || "Manager- HR",
          signature: branding.signature_url ? brandingAPI.getImageUrl(branding.signature_url) : null
        },
        logo: branding.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : fallbackLogo,
        stamp: branding.stamp_url ? brandingAPI.getImageUrl(branding.stamp_url) : fallbackStamp
      };

      console.log('Generating HTML content...');
      const htmlContent = generateLetterHTML(fullData);
      
      console.log('Generating PDF...');
      const pdfBlob = await generatePDF(htmlContent);
      
      console.log('PDF generated successfully');
      return pdfBlob;

    } catch (error) {
      console.error('Error generating experience letter:', error);
      throw new Error(`Failed to generate letter: ${error.message}`);
    }
  }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

// Format date with ordinal suffix (1st, 2nd, 3rd, 4th)
const formatDateWithOrdinal = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    return `${day}${suffix} ${month} ${year}`;
  } catch (error) {
    console.error('Date ordinal formatting error:', error);
    return dateStr;
  }
};

const commonHeader = (logo, website, email) => {
  if (!logo) logo = fallbackLogo;
  return `
    <div style="width: 100%; border-bottom: 5px solid #000; padding: 10mm 20mm 5mm 20mm; box-sizing: border-box; display: flex; justify-content: space-between; align-items: center;">
      <div style="flex: 1;">
        <img src="${logo}" alt="Logo" style="height: 80px; width: auto; max-width: 280px; display: block; object-fit: contain;">
      </div>
      <div style="text-align: right; line-height: 1.3;">
        <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">${website || 'www.kosqu.com'}</div>
        <div style="font-weight: bold; font-size: 10pt;">${email || 'info@kosqu.com'}</div>
      </div>
    </div>
  `;
};

const generateLetterHTML = ({ employeeName, firstName, dateOfIssue, dateOfJoining, lastWorkingDay, designation, department, employmentType, customNote, refNumber, company, hr, logo, stamp }) => {
  // Set defaults for missing values
  const safeEmployeeName = employeeName || 'Employee Name';
  const safeFirstName = firstName || 'the employee';
  const safeDesignation = designation || 'Position';
  const safeDepartment = department || 'Department';
  const safeEmploymentType = employmentType || 'Full-time';
  const safeRefNumber = refNumber || `EXP/${new Date().getFullYear()}/001`;
  
  // Format dates with ordinal suffix
  const formattedJoiningDate = formatDateWithOrdinal(dateOfJoining);
  const formattedLastDate = formatDateWithOrdinal(lastWorkingDay);
  const formattedIssueDate = formatDateWithOrdinal(dateOfIssue);
  
  // Use custom note or default performance statement
  const performanceNote = customNote && customNote.trim() !== '' 
    ? customNote 
    : `${safeFirstName} demonstrated exceptional technical skills, a strong work ethic, and a keen ability to adapt to new challenges. Their contributions have significantly impacted the success of our projects and the overall growth of the company.`;
  
  const companyName = company?.name || "KosQu Technolab";
  const companyAddress = company?.address || "KosQu Technolab, Innovation Hub, Electronic City, Bengaluru - 560100";
  const companyWebsite = company?.website || "www.kosqu.com";
  const companyEmail = company?.email || "info@kosqu.com";
  const hrName = hr?.name || "Ashish Thakur";
  const hrDesignation = hr?.designation || "Manager- HR";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; width: 100%; min-height: 297mm;">
        ${commonHeader(logo, companyWebsite, companyEmail)}
        
        <div style="padding: 12mm 20mm 35mm 20mm;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 35px;">
            <div>
              <div style="font-weight: bold; font-size: 11pt;">Date: ${formattedIssueDate || formatShortDate(dateOfIssue)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 11pt;">Ref No: ${safeRefNumber}</div>
            </div>
          </div>

          <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 28px; letter-spacing: 1px;">
            TO WHOMSOEVER IT MAY CONCERN
          </div>

          <div style="text-align: justify; font-size: 11pt; line-height: 1.5;">
            <p style="margin: 0 0 12px 0;">This is to certify that <strong>${safeEmployeeName}</strong> has been employed with <strong>${companyName}</strong> as a <strong>${safeDesignation}</strong> from <strong>${formattedJoiningDate || formatShortDate(dateOfJoining)}</strong> to <strong>${formattedLastDate || formatShortDate(lastWorkingDay)}</strong>.</p>
            
            <p style="margin: 0 0 10px 0;">During this period, ${safeFirstName} has been a valuable asset to our team. Their responsibilities included but were not limited to:</p>
            
            <ul style="margin: 0 0 12px 0; padding-left: 25px;">
              <li style="margin-bottom: 6px;">Developing, testing, and maintaining software applications to ensure their functionality and efficiency.</li>
              <li style="margin-bottom: 6px;">Collaborating with cross-functional teams to design and implement new features.</li>
              <li style="margin-bottom: 6px;">Leading software development projects, ensuring timely delivery and adherence to quality standards.</li>
              <li style="margin-bottom: 6px;">Mentoring junior developers and providing technical guidance to the team.</li>
              <li style="margin-bottom: 6px;">Troubleshooting and debugging applications to resolve issues promptly.</li>
            </ul>
            
            <p style="margin: 0 0 12px 0;">${performanceNote}</p>
            
            <p style="margin: 0 0 12px 0;">We wish ${safeFirstName} all the best in their future endeavours and highly recommend ${safeFirstName} for any suitable position.</p>
            
            <p style="margin: 20px 0 0 0;">If you have any questions or require further information, please do not hesitate to contact us.</p>
          </div>

          <div style="margin-top: 55px; position: relative;">
            <div style="margin-bottom: 5px;">
              ${hr?.signature ? `<img src="${hr.signature}" alt="Signature" style="height: 55px; object-fit: contain;">` : '<div style="height: 55px;"></div>'}
            </div>
            ${stamp ? `<img src="${stamp}" alt="Company Stamp" style="position: absolute; left: 140px; top: -10px; height: 80px; width: auto; object-fit: contain; opacity: 0.8;">` : ''}
            <div style="margin-top: 8px;">
              <div style="font-weight: bold; font-size: 11pt; margin-bottom: 3px;">${hrName}</div>
              <div style="font-size: 10pt; margin-bottom: 3px;">${hrDesignation}</div>
              <div style="font-weight: bold; font-size: 10pt;">${companyName}</div>
            </div>
          </div>
        </div>
        
        <div style="border-top: 3px solid #000; padding: 12px 20px; text-align: center; font-size: 9pt; font-weight: bold; background: #fff; width: 100%;">
          ${companyAddress}
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePDF = async (htmlContent) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if jsPDF is available globally or through import
      let PDFLib;
      
      if (typeof window !== 'undefined' && window.jspdf) {
        // If using CDN or global
        PDFLib = window.jspdf.jsPDF;
      } else {
        // If using module import
        const jspdfModule = await import('jspdf');
        PDFLib = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;
      }
      
      if (!PDFLib || typeof PDFLib !== 'function') {
        throw new Error('jsPDF library not properly loaded');
      }
      
      console.log('jsPDF loaded successfully');
      const pdf = new PDFLib({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Create temporary container
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '0';
      tempDiv.style.margin = '0';
      tempDiv.innerHTML = htmlContent;
      document.body.appendChild(tempDiv);
      
      // Wait for images to load
      const images = tempDiv.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = (err) => {
            console.warn('Image failed to load:', img.src);
            resolve(); // Continue even if image fails
          };
        });
      }));
      
      // Render to canvas
      const canvas = await html2canvas(tempDiv, { 
        scale: 2.5, 
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      document.body.removeChild(tempDiv);
      
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(new Error(`PDF generation failed: ${error.message}`));
    }
  });
};