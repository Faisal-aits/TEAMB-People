import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import fallbackLogo from '../assets/img/company.png';
import fallbackStamp from '../assets/img/stamp.png';
import { brandingAPI } from './brandingAPI';

export const offerLetterPDFService = {
  downloadOfferLetter: async (formData) => {
    try {
      console.log('📄 Generating PDF for Offer Letter:', formData.fullName);
      
      let branding = {};
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
      } catch (err) { console.error("Failed to load branding", err); }
      
      const pdfData = {
        formData,
        company: {
          name: branding.company_name || "Arham IT Solution",
          address: branding.company_address || "Above Being Healthy Gym, Near Surbhi Hospital, Nagar Sambhajjnagar Road, Ahliyanagar 414003",
          email: branding.company_email || "info@arhamitsolution.in",
          website: branding.company_website || "www.arhamitsolution.in",
          phone: "9322195628"
        },
        hr: {
          name: branding.hr_name || "Sharjeel Iqbal",
          designation: branding.hr_designation || "HR and BDE Executive",
          signature: branding.signature_url ? brandingAPI.getImageUrl(branding.signature_url) : null
        },
        logo: branding.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : fallbackLogo,
        stamp: branding.stamp_url ? brandingAPI.getImageUrl(branding.stamp_url) : fallbackStamp
      };

      const pages = [
        generatePage1HTML(pdfData),
        generatePage2HTML(pdfData),
        generatePage3HTML(pdfData)
      ];

      const pdf = await generatePDF(pages);
      pdf.save(`Offer_Letter_${formData.fullName.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Error generating offer letter:', error);
      throw error;
    }
  },

  viewOfferLetter: async (formData) => {
    try {
      console.log('👁️ Previewing PDF for Offer Letter:', formData.fullName);
      
      let branding = {};
      try {
        const res = await brandingAPI.get();
        if (res.data?.success && res.data?.branding) branding = res.data.branding;
      } catch (err) { console.error("Failed to load branding", err); }

      const pdfData = {
        formData,
        company: {
          name: branding.company_name || "Arham IT Solution",
          address: branding.company_address || "Above Being Healthy Gym, Near Surbhi Hospital, Nagar Sambhajjnagar Road, Ahliyanagar 414003",
          email: branding.company_email || "info@arhamitsolution.in",
          website: branding.company_website || "www.arhamitsolution.in",
          phone: "9322195628"
        },
        hr: {
          name: branding.hr_name || "Sharjeel Iqbal",
          designation: branding.hr_designation || "HR and BDE Executive",
          signature: branding.signature_url ? brandingAPI.getImageUrl(branding.signature_url) : null
        },
        logo: branding.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : fallbackLogo,
        stamp: branding.stamp_url ? brandingAPI.getImageUrl(branding.stamp_url) : fallbackStamp
      };

      const pages = [
        generatePage1HTML(pdfData),
        generatePage2HTML(pdfData),
        generatePage3HTML(pdfData)
      ];

      const pdf = await generatePDF(pages);
      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl, '_blank');

    } catch (error) {
      console.error('Error previewing offer letter:', error);
      throw error;
    }
  }
};

const generatePDF = async (pagesHTML) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pagesHTML.length; i++) {
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
        
        tempDiv.innerHTML = pagesHTML[i];
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        document.body.removeChild(tempDiv);
      }

      resolve(pdf);
    } catch (error) {
      reject(error);
    }
  });
};

const commonHeader = (logo, website, email) => `
  <div style="width: 100%; border-bottom: 5px solid #000; padding: 10mm 20mm 5mm 20mm; box-sizing: border-box; display: table;">
    <div style="display: table-cell; vertical-align: middle; text-align: left; padding-right: 15mm;">
      <img src="${logo}" alt="Logo" style="height: 100px; width: auto; max-width: 350px; display: block; object-fit: contain; padding: 0 2px;">
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
             ${website}
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
             ${email}
           </div>
        </div>
      </div>
    </div>
  </div>
`;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');
};

const generatePage1HTML = ({ formData, company, hr, logo, stamp }) => `
  <div style="font-family: Arial, sans-serif; color: #000; line-height: 1.6; min-height: 297mm; display: flex; flex-direction: column;">
    ${commonHeader(logo, company.website, company.email)}
    <div style="padding: 15mm 20mm 40mm 20mm; flex-grow: 1;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="width: 60%;">
          <div style="font-weight: bold; margin-bottom: 5px; font-size: 12pt;">To,</div>
          <div style="font-weight: bold; font-size: 12pt;">${formData.salutation || 'Mr./Ms.'} ${formData.fullName || '[Name]'} ,</div>
          <div style="font-size: 11pt; margin-top: 5px;">${formData.address || '[Address]'} .</div>
          <div style="font-size: 11pt;">Tel : ${formData.phone || '[Phone]'}</div>
          <div style="font-size: 11pt;">E-mail: ${formData.email || '[Email]'}</div>
        </div>
        <div style="text-align: right; width: 35%;">
          <div style="font-weight: bold; font-size: 12pt;">Date :- ${formatDate(formData.issueDate) || '[Date]'}</div>
        </div>
      </div>
      <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 15px;">
        Subject : Offer Letter
      </div>
      <div style="text-align: justify; font-size: 11pt; font-family: 'Times New Roman', Times, serif; margin-top: 30px;">
        <p>Congratulations!</p>
        <p>We are pleased to offer you the position of <strong>${formData.designation || '[Designation]'}</strong> with the Company. The effective date of your appointment is agreed as <strong>${formatDate(formData.joiningDate) || '[Joining Date]'}</strong>.</p>
        <p>Your annual compensation (CTC) will be <strong>Rs. ${formData.ctc} (${formData.ctcInWords} only)</strong> per annum, subject to statutory deductions. Performance assessment will be conducted periodically.</p>
        <p>Your continued employment is contingent upon your satisfactorily meeting the Company's expectations.</p>
        <p>On your first day of work, you will be required to sign the <strong>Employment Agreement</strong>, which will contain detailed terms and conditions of your employment with the Company. You are expected to follow the policies, rules, and regulations laid out by the Company. On your first day of employment, you will be given additional information about the Company, its procedures, policies, benefit programs, and more.</p>
        <p>Any female employee who has conceived prior to joining the Company is expected to inform the Company of her pregnancy before signing the Offer Letter and the Employee Agreement.</p>
        <p>This Letter of Offer is contingent upon the successful completion of all background and reference checks and required documentation. On your first day, please bring the documents as provided in <strong>Annexure 1</strong>.</p>
      </div>
    </div>
  </div>
`;

const generatePage2HTML = ({ formData, company, hr, logo, stamp }) => `
  <div style="font-family: Arial, sans-serif; color: #000; line-height: 1.6; min-height: 297mm; display: flex; flex-direction: column;">
    ${commonHeader(logo, company.website, company.email)}
    <div style="padding: 15mm 20mm 40mm 20mm; flex-grow: 1;">
      <div style="text-align: justify; font-size: 11pt; font-family: 'Times New Roman', Times, serif; margin-top: 20px;">
        <p>Note that this Letter of Offer is valid for <strong>two (2) working days</strong> from the date of receipt. Please confirm your acceptance of this Offer Letter by signing and returning a copy within two (2) working days of receiving it, failing which, this Offer letter shall stand withdrawn. Please note that if you do not report on the reporting date, this Offer shall stand withdrawn.</p>
        
        <p style="margin-top: 30px;">We look forward to you joining <strong>${company.name}</strong> and to a mutually rewarding working relationship.</p>
      </div>

      <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: flex-start;">
        <div style="text-align: center; font-family: Arial, sans-serif;">
          ${hr.signature ? `<img src="${hr.signature}" alt="Signature" style="height: 50px; margin-bottom: 5px; object-fit: contain;">` : ''}
          ${stamp ? `<img src="${stamp}" alt="Stamp" style="height: 80px; width: auto; max-width: 130px; object-fit: contain; margin-bottom: 5px;">` : ''}
          <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2px;">Best Regards,</div>
            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 1pt;">${hr.name},</div>
            <div style="font-size: 10pt; margin-bottom: 1pt;">${hr.designation},</div>
            <div style="font-weight: bold; font-size: 10pt;">${company.name}</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 80px; font-family: 'Times New Roman', Times, serif; font-size: 11pt;">
        <p>I agree and accept this Letter of Offer which has been read, understood and accepted by me.</p>
        <div style="margin-top: 30px;">
          <span>Signature : ____________________</span>
        </div>
        <div style="margin-top: 20px;">
          <span>Name :- ${formData.salutation || ''} ${formData.fullName || '________________'}</span>
        </div>
        <div style="margin-top: 20px;">
          <span>Date : </span>
        </div>
      </div>
    </div>
  </div>
`;

const generatePage3HTML = ({ formData, company, hr, logo, stamp }) => `
  <div style="font-family: Arial, sans-serif; color: #000; line-height: 1.6; min-height: 297mm; display: flex; flex-direction: column;">
    ${commonHeader(logo, company.website, company.email)}
    <div style="padding: 10mm 20mm 40mm 20mm; flex-grow: 1;">
      <div style="font-weight: bold; font-size: 11pt; margin-bottom: 15px;">Annexure 1 - Documents required at the time of joining</div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
        <thead>
          <tr style="background: #ccc; border: 1.5pt solid #000;">
            <th style="padding: 8px; border: 1.5pt solid #000; width: 10%;">S. No.</th>
            <th style="padding: 8px; border: 1.5pt solid #000; width: 30%;">Documents Required</th>
            <th style="padding: 8px; border: 1.5pt solid #000; width: 15%;">Format</th>
            <th style="padding: 8px; border: 1.5pt solid #000; width: 45%;">Document Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">1.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Proof of Age and ID</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Photocopy</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Aadhar Card/ Driver License/10th Certificate/PAN Card</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">2.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Proof of Residence</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Photocopy</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Aadhar Card/ Telephone Bill/Ration Card/Voter ID Card/Electricity Bill/Rent Agreement</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">3.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Educational Qualifications</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Photocopy</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Graduation, Post-Graduation</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">4.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Experience Certificate/s</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Photocopy</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">On the letterhead of the previous company</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">5.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Last 3 (three) months’ payslip/Bank Statement</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Original</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Letter with Stamp of the previous company/bank</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">6.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Relieving Letter</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Photocopy</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">On the letterhead of the previous company</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">7.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Updated Resume</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;"></td>
            <td style="padding: 8px; border: 1.5pt solid #000;"></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">9.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Cancelled Cheque</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">Soft Copy</td>
            <td style="padding: 8px; border: 1.5pt solid #000;"></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;">10.</td>
            <td style="padding: 8px; border: 1.5pt solid #000;">Employee Provident Fund Details</td>
            <td style="padding: 8px; border: 1.5pt solid #000; text-align: center;"></td>
            <td style="padding: 8px; border: 1.5pt solid #000;">EPF number</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
`;
