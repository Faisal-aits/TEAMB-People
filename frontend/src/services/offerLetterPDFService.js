// src/services/offerLetterPDFService.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import companyLogo from '../assets/img/company.png';
import stampPng from '../assets/img/stamp.png';

export const offerLetterPDFService = {
  downloadOfferLetter: async (formData) => {
    try {
      console.log('📄 Generating PDF for Offer Letter:', formData.fullName);
      
      const pdfData = {
        formData,
        company: {
          name: "Arham IT Solution",
          address: "Above Being Healthy Gym, Near Surbhi Hospital, Nagar Sambhajjnagar Road, Ahliyanagar 414003",
          email: "info@arhamitsolution.in",
          website: "www.arhamitsolution.in",
          phone: "9322195628"
        },
        logo: companyLogo,
        stamp: stampPng
      };

      const pdf = await generatePDF(pdfData);
      pdf.save(`Offer_Letter_${formData.fullName.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Error generating offer letter:', error);
      throw error;
    }
  }
};

const generatePDF = async (pdfData) => {
  return new Promise((resolve, reject) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm';
      tempDiv.style.minHeight = '297mm';
      tempDiv.style.padding = '0'; // Remove global padding
      tempDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      tempDiv.style.fontSize = '12pt';
      tempDiv.style.background = 'white';
      tempDiv.style.color = '#333';
      tempDiv.style.lineHeight = '1.6';

      tempDiv.innerHTML = generateOfferLetterHTML(pdfData);
      document.body.appendChild(tempDiv);

      html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        document.body.removeChild(tempDiv);
        resolve(pdf);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

const generateOfferLetterHTML = ({ formData, company, logo, stamp }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  return `
    <div style="font-family: Arial, sans-serif; color: #000; line-height: 1.6; min-height: 297mm; display: flex; flex-direction: column;">
      <!-- Full width Header - Left aligned layout -->
      <div style="width: 100%; border-bottom: 5px solid #000; padding: 10mm 20mm 5mm 20mm; box-sizing: border-box; display: table;">
        <div style="display: table-cell; vertical-align: middle; text-align: left; padding-right: 15mm;">
          <img src="${logo}" alt="Logo" style="height: 100px; width: auto; max-width: 350px; display: block; object-fit: contain; padding: 0 2px;">
        </div>
        <div style="display: table-cell; vertical-align: middle; text-align: left; line-height: 1.2;">
          <div style="display: inline-block; text-align: left; font-size: 11pt; white-space: nowrap;">
            <!-- Website Row -->
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
                 ${company.website}
               </div>
            </div>
            <!-- Email Row -->
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
                 ${company.email}
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Body Content with consistent margins -->
      <div style="padding: 15mm 20mm 0mm 20mm; flex-grow: 1;">
        <!-- Address & Date -->
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

        <!-- Subject -->
        <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 15px;">
          Subject : Offer Letter
        </div>

        <!-- Body with Times New Roman -->
        <div style="text-align: justify; font-size: 11pt; font-family: 'Times New Roman', Times, serif; margin-top: 30px;">
          <p>Congratulations!</p>
          
          <p>We are pleased to offer you the position of <strong>${formData.designation || '[Designation]'}</strong> with the Company. The effective date of your appointment is agreed as <strong>${formatDate(formData.joiningDate) || '[Joining Date]'}</strong>.</p>
          
          <p>Your annual compensation (CTC) will be <strong>Rs. ${formData.ctc || '[CTC]'} (${formData.ctcInWords || '[CTC in Words]'} only)</strong> per annum, subject to statutory deductions. Performance assessment will be conducted periodically.</p>
          
          <p>Your continued employment is contingent upon your satisfactorily meeting the Company's expectations.</p>
          
          <p>On your first day of work, you will be required to sign the <strong>Employment Agreement</strong>, which will contain detailed terms and conditions of your employment with the Company. You are expected to follow the policies, rules, and regulations laid out by the Company, details of which will be elaborated in the Employment Agreement. On your first day of employment, you will be given additional information about the Company, its procedures, policies, benefit programs, and more.</p>
          
          <p>Any female employee who has conceived prior to joining the Company is expected to inform the Company of her pregnancy before signing the Offer Letter and the Employee Agreement.</p>
          
          <p>This Letter of Offer is contingent upon the successful completion of all background and reference checks and required documentation. On your first day, please bring the documents as provided in <strong>Annexure 1</strong>.</p>
        </div>

        <!-- Stamp & Signature -->
        <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: flex-end;">
          <div style="text-align: center; margin-right: 4mm; font-family: Arial, sans-serif;">
            <img src="${stamp}" alt="Stamp" style="width: 130px; margin-bottom: 5px;">
            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 2px;">Best Regards,</div>
            <div style="font-weight: bold; font-size: 11pt; margin-bottom: 1pt;">Sharjeel iqbal,</div>
            <div style="font-size: 10pt; margin-bottom: 1pt;">HR and BDE Executive,</div>
            <div style="font-weight: bold; font-size: 10pt;">Arham It Solution</div>
          </div>
        </div>
      </div>
      
      <!-- Footer margin / Stamp area (Legacy space removed partially to accommodate signature) -->
      <div style="height: 20mm; width: 100%;"></div>
    </div>
  `;
};
