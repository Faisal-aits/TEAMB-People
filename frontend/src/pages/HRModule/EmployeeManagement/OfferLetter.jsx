import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { offerLetterAPI } from '../../../services/offerLetterAPI';
import { employeeAPI } from '../../../services/employeeAPI';
import offerLetterPDFService from '../../../services/offerLetterPDFService';
import './Employee.css';
import './OfferLetterBuilder.css';
import brandingAPI from '../../../services/brandingAPI';
import { serviceSettingAPI } from '../../../services/serviceSettingAPI';
import BrandingValidationModal from '../../../components/BrandingValidationModal';


const numberToWords = (num) => {
  if (!num) return '';
  const clean = String(num).replace(/,/g, '').trim();
  const val = parseInt(clean, 10);
  if (isNaN(val) || val <= 0) return '';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const nStr = ('000000000' + val).slice(-9);
  const n = nStr.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';

  const trimmed = str.replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed + ' Rupees Only' : '';
};

const defaultTerms = [
  "The employee shall abide by all company policies, rules, and regulations.",
  "This offer is contingent upon satisfactory background verification and reference checks.",
  "The first three months shall be a probationary period, during which either party may terminate employment with one week's notice.",
  "The company reserves the right to modify terms with prior notice.",
  "Confidentiality of company information must be maintained during and after employment.",
  "All intellectual property created during employment shall belong to the company.",
  "The employee agrees not to engage in any competing business during employment and for six months after termination.",
  "Employment may be terminated by either party with one month's notice or payment in lieu thereof."
];

const OfferLetter = ({ companySettings = { salary_format: 'Monthly', probation_months: '4', enable_probation: true }, onEmployeeConverted }) => {
  const [offerLetters, setOfferLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedOfferLetter, setSelectedOfferLetter] = useState(null);
  const [acceptFormData, setAcceptFormData] = useState({ employee_id: '', department_id: '', employment_type: 'Full-time' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    salutation: 'Mr.',
    fullName: '',
    address: '',
    phone: '',
    email: '',
    designation: '',
    joiningDate: '',
    ctc: '',
    ctcInWords: '',
    basicSalary: '',
    hra: '',
    conveyanceAllowance: '',
    specialAllowance: '',
    medicalAllowance: '',
    totalEarning: '',
    professionalTax: '',
    tds: '',
    employerPf: '',
    employerEsi: '',
    netPay: '',
    monthlySalary: '',
    monthlySalaryInWords: '',
    salaryDuringProbation: '',
    salaryDuringProbationInWords: '',
    salaryAfterProbation: '',
    salaryAfterProbationInWords: '',
    terms: [...defaultTerms]
  });

  const [branding, setBranding] = useState({
    company_name: "",
    company_address: "",
    company_email: "",
    company_website: "",
    hr_name: "",
    hr_designation: "",
    logo_url: "",
    stamp_url: "",
    signature_url: null
  });

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  // Derive probation months from prop (set by AdminLayout from settings)
  const probationMonths = companySettings.probation_months || '4';
  const enableProbation = companySettings.enable_probation !== false;
  const salaryFormat = companySettings.salary_format || 'Monthly';

  const loadOfferLetters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await offerLetterAPI.getAll();
      setOfferLetters(response.data.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to load offer letters:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await employeeAPI.getDepartments();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadBranding = async () => {
    try {
      const res = await brandingAPI.get();
      if (res.data?.success && res.data?.branding) {
        const b = res.data.branding;
        if (!b.company_name) {
          setIsBrandingModalOpen(true);
        }
        setBranding({
          company_name: b.company_name || "",
          company_address: b.company_address || "",
          company_email: b.company_email || "",
          company_website: b.company_website || "",
          hr_name: b.hr_name || "",
          hr_designation: b.hr_designation || "",
          logo_url: b.logo_url ? brandingAPI.getImageUrl(b.logo_url) : "",
          stamp_url: b.stamp_url ? brandingAPI.getImageUrl(b.stamp_url) : "",
          signature_url: b.signature_url ? brandingAPI.getImageUrl(b.signature_url) : null
        });
      } else {
        setIsBrandingModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching branding:", err);
      setIsBrandingModalOpen(true);
    }
  };

  const [isSmtpConfigModalOpen, setIsSmtpConfigModalOpen] = useState(false);
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(null);

  const checkSmtpStatus = useCallback(async () => {
    try {
      const res = await serviceSettingAPI.getSmtpDetails();
      const smtp = res.data?.smtp;
      const isOutlookConfigured = Boolean(
        smtp &&
        smtp.provider === 'outlook_graph' &&
        smtp.azure_tenant_id &&
        smtp.azure_client_id &&
        smtp.has_azure_client_secret &&
        smtp.from_email
      );
      const isStandardSmtpConfigured = Boolean(
        smtp &&
        smtp.provider !== 'outlook_graph' &&
        smtp.host &&
        smtp.username &&
        smtp.has_password &&
        smtp.from_email
      );
      const configured = Boolean(isOutlookConfigured || isStandardSmtpConfigured);
      setIsSmtpConfigured(configured);
      return configured;
    } catch (err) {
      console.warn("Error fetching SMTP status:", err);
      return false;
    }
  }, []);

  const handleOpenNewOfferModal = async () => {
    const configured = isSmtpConfigured !== null ? isSmtpConfigured : await checkSmtpStatus();
    if (!configured) {
      setIsSmtpConfigModalOpen(true);
      return;
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    loadOfferLetters();
    loadDepartments();
    loadBranding();
    checkSmtpStatus();
  }, [loadOfferLetters, checkSmtpStatus]);

  const totalPages = Math.ceil(offerLetters.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOfferLetters = offerLetters.slice(indexOfFirstItem, indexOfLastItem);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const goToPrevPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      const toWords = (v) => v ? numberToWords(parseInt(String(v).replace(/,/g, ''), 10)) || '' : '';
      if (name === 'ctc') newData.ctcInWords = toWords(value);
      if (name === 'monthlySalary') newData.monthlySalaryInWords = toWords(value);
      if (name === 'salaryDuringProbation') newData.salaryDuringProbationInWords = toWords(value);
      if (name === 'salaryAfterProbation') newData.salaryAfterProbationInWords = toWords(value);
      return newData;
    });
  };

  const handleTermChange = (index, value) => {
    const newTerms = [...formData.terms];
    newTerms[index] = value;
    setFormData({ ...formData, terms: newTerms });
  };

  const handleAddTerm = () => {
    setFormData({ ...formData, terms: [...formData.terms, ''] });
  };

  const handleRemoveLastTerm = () => {
    const newTerms = [...formData.terms];
    newTerms.pop();
    setFormData({ ...formData, terms: newTerms });
  };

  const handleResetTerms = () => {
    setFormData({ ...formData, terms: [...defaultTerms] });
  };

  const [resendingId, setResendingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const completeFormData = {
        ...formData,
        salary_format: companySettings?.salary_format || salaryFormat || 'Monthly',
        probationMonths,
        ctcInWords: formData.ctc ? numberToWords(formData.ctc) : (formData.ctcInWords || ''),
        monthlySalaryInWords: formData.monthlySalary ? numberToWords(formData.monthlySalary) : (formData.monthlySalaryInWords || ''),
        salaryDuringProbationInWords: formData.salaryDuringProbation ? numberToWords(formData.salaryDuringProbation) : (formData.salaryDuringProbationInWords || ''),
        salaryAfterProbationInWords: formData.salaryAfterProbation ? numberToWords(formData.salaryAfterProbation) : (formData.salaryAfterProbationInWords || '')
      };

      let pdfBase64 = null;
      try {
        pdfBase64 = await offerLetterPDFService.getBase64OfferLetter(completeFormData);
      } catch (pdfErr) {
        console.warn('Could not generate PDF base64 client-side, sending without it:', pdfErr);
      }

      const payload = {
        candidate_name: formData.fullName,
        candidate_email: formData.email,
        issue_date: formData.issueDate,
        form_data: completeFormData,
        pdf_base64: pdfBase64
      };

      const response = await offerLetterAPI.save(payload);
      alert(response.data?.message || 'Offer letter saved and emailed successfully!');
      setIsModalOpen(false);

      setFormData({
        issueDate: new Date().toISOString().slice(0, 10),
        salutation: 'Mr.', fullName: '', address: '', phone: '', email: '',
        designation: '', joiningDate: '', ctc: '', ctcInWords: '',
        basicSalary: '', hra: '', conveyanceAllowance: '', specialAllowance: '', medicalAllowance: '',
        totalEarning: '', professionalTax: '', tds: '', employerPf: '', employerEsi: '', netPay: '',
        monthlySalary: '', monthlySalaryInWords: '',
        salaryDuringProbation: '', salaryDuringProbationInWords: '',
        salaryAfterProbation: '', salaryAfterProbationInWords: '',
        terms: [...defaultTerms]
      });

      loadOfferLetters();
    } catch (error) {
      console.error('Failed to process offer letter:', error);
      const isSmtpMissing = error.response?.status === 428 ||
        error.response?.data?.code === 'SMTP_NOT_CONFIGURED' ||
        error.response?.data?.smtp_not_configured ||
        error.response?.data?.message?.includes('SMTP_NOT_CONFIGURED') ||
        error.message?.includes('SMTP_NOT_CONFIGURED');

      if (isSmtpMissing) {
        setIsModalOpen(false);
        setIsSmtpConfigModalOpen(true);
        return;
      }

      const msg = error.response?.data?.message || error.message || 'Failed to process offer letter';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (offer) => {
    const candidateEmail = offer.candidate_email || offer.form_data?.email;
    if (!candidateEmail) {
      alert('Candidate email address is missing');
      return;
    }

    if (!window.confirm(`Resend offer letter email to ${candidateEmail}?`)) return;

    try {
      setResendingId(offer.id);
      let pdfBase64 = null;
      try {
        pdfBase64 = await offerLetterPDFService.getBase64OfferLetter(offer.form_data);
      } catch (pdfErr) {
        console.warn('PDF generation for resend failed:', pdfErr);
      }

      const res = await offerLetterAPI.resendEmail(offer.id, { pdf_base64: pdfBase64 });
      alert(res.data?.message || `Offer letter emailed successfully to ${candidateEmail}`);
      loadOfferLetters();
    } catch (error) {
      console.error('Failed to resend offer letter:', error);
      const isSmtpMissing = error.response?.status === 428 ||
        error.response?.data?.code === 'SMTP_NOT_CONFIGURED' ||
        error.response?.data?.smtp_not_configured ||
        error.response?.data?.message?.includes('SMTP_NOT_CONFIGURED') ||
        error.message?.includes('SMTP_NOT_CONFIGURED');

      if (isSmtpMissing) {
        setIsSmtpConfigModalOpen(true);
        return;
      }

      const msg = error.response?.data?.message || error.message || 'Failed to resend offer letter email';
      alert(msg);
    } finally {
      setResendingId(null);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (status === 'Accepted') {
      const offer = offerLetters.find(o => o.id === id);
      setSelectedOfferLetter(offer);
      setAcceptFormData({ employee_id: '', department_id: '', employment_type: 'Full-time' });
      setIsAcceptModalOpen(true);
      return;
    }

    if (!window.confirm(`Are you sure you want to mark this offer as ${status}?`)) return;

    try {
      await offerLetterAPI.updateStatus(id, { status });
      alert(`Offer letter marked as ${status}`);
      loadOfferLetters();
    } catch (error) {
      console.error('Status update failed:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    if (!acceptFormData.employee_id || !acceptFormData.department_id || !acceptFormData.employment_type) {
      alert('Please provide Employee ID, Department, and Employee Type');
      return;
    }

    try {
      setIsSubmitting(true);
      await offerLetterAPI.updateStatus(selectedOfferLetter.id, {
        status: 'Accepted',
        new_employee_id: acceptFormData.employee_id,
        department_id: acceptFormData.department_id,
        employment_type: acceptFormData.employment_type
      });
      alert('Offer accepted and Employee created successfully!');
      setIsAcceptModalOpen(false);
      loadOfferLetters();
      if (onEmployeeConverted) {
        onEmployeeConverted();
      }
    } catch (error) {
      console.error('Accept offer failed:', error);
      alert(error.response?.data?.message || 'Failed to accept offer and create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = async (offer) => {
    try {
      const blobUrl = await offerLetterPDFService.getBlobUrlOfferLetter(offer.form_data);
      setPreviewPdfUrl(blobUrl);
    } catch (err) {
      console.error("Failed to generate PDF preview", err);
      alert("Failed to generate PDF preview");
    }
  };

  const getStatusBadge = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'accepted': return <span className="status-badge status-active">ACCEPTED</span>;
      case 'rejected': return <span className="status-badge status-inactive">REJECTED</span>;
      case 'sent': return <span className="status-badge" style={{ background: '#3b82f6', color: 'white' }}>SENT</span>;
      default: return <span className="status-badge" style={{ background: '#f59e0b', color: 'white' }}>PENDING</span>;
    }
  };

  const canActOnOffer = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    return !['accepted', 'rejected'].includes(normalizedStatus);
  };

  const renderPreviewHeader = () => (
    <div className="preview-header">
      {branding.logo_url && <img src={branding.logo_url} alt="Logo" className="preview-logo" onError={(e) => { e.target.style.display = 'none' }} />}
      <div className="preview-contact">
        <div className="preview-contact-item"><i className="fas fa-globe"></i> {branding.company_website}</div>
        <div className="preview-contact-item"><i className="fas fa-envelope"></i> {branding.company_email}</div>
      </div>
    </div>
  );

  if (loading) return <div className="employee-section"><div className="loading-container">Loading...</div></div>;

  return (
    <div className="employee-section">
      <BrandingValidationModal isOpen={isBrandingModalOpen} onClose={() => setIsBrandingModalOpen(false)} />
      <div className="employee-table-container glass-form">
        <div className="table-header employee-management-header">
          <h3 style={{ margin: 0 }}>Offer Letters Tracking</h3>
          <button className="add-employee-btn" onClick={handleOpenNewOfferModal}>
            <i className="fas fa-plus"></i> New Offer Letter
          </button>
        </div>

        <div className="table-wrapper">
          {offerLetters.length === 0 ? (
            <div className="no-employees">
              <div className="no-data-icon"><i className="fas fa-file-signature"></i></div>
              <div>No offer letters found.</div>
              <p className="no-data-subtext">Generate an offer letter to see it here.</p>
            </div>
          ) : (
            <>
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOfferLetters.map((offer) => (
                  <tr key={offer.id}>
                    <td>{offer.candidate_name || offer.form_data?.fullName}</td>
                    <td>{offer.candidate_email || offer.form_data?.email}</td>
                    <td>{offer.form_data?.designation || '-'}</td>
                    <td>{new Date(offer.issue_date).toLocaleDateString('en-IN')}</td>
                    <td>{getStatusBadge(offer.status)}</td>
                    <td className="actions-cell">
                      <button className="viewedit-btn" title="View PDF" onClick={() => handleViewPDF(offer)}>
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className="viewedit-btn" 
                        title="Resend Email to Candidate" 
                        onClick={() => handleResendEmail(offer)}
                        disabled={resendingId === offer.id}
                        style={{ marginLeft: '4px', background: '#3b82f6', color: 'white' }}
                      >
                        <i className={`fas ${resendingId === offer.id ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                      </button>
                      {canActOnOffer(offer.status) && (
                        <>
                          <button className="accept-btn" title="Accept Offer" onClick={() => handleUpdateStatus(offer.id, 'Accepted')}
                            >
                            <i className="fas fa-check"></i>
                          </button>
                          <button className="deletebtn" title="Reject Offer" onClick={() => handleUpdateStatus(offer.id, 'Rejected')}
                            >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <>
                <div className="pagination">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                  <div className="pagination-numbers">
                    {pageNumbers.map((number) => (
                      <button
                        key={number}
                        onClick={() => setCurrentPage(number)}
                        className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                      >
                        {number}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, offerLetters.length)} of {offerLetters.length} offer letters
                </div>
              </>
            )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="offer-letter-builder-overlay">
          <div className="offer-letter-builder-content">
            <div className="builder-header">
              <h2><i className="fas fa-file-signature"></i> Offer Letter Builder</h2>
              <div className="builder-header-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancel</button>
                <button type="button" onClick={handleSubmit} className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Generating...' : 'Generate and Save'}
                </button>
              </div>
            </div>
            <div className="builder-main">
              <div className="builder-form-side">
                <div className="builder-section">
                  <h3>General Info</h3>
                  <div className="form-group-builder">
                    <label>Letter Issue Date</label>
                    <input type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="builder-section">
                  <h3>Personal Info</h3>
                  <div className="row-2">
                    <div className="form-group-builder">
                      <label>Salutation</label>
                      <select name="salutation" value={formData.salutation} onChange={handleInputChange}>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                      </select>
                    </div>
                    <div className="form-group-builder">
                      <label>Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. admin" />
                    </div>
                  </div>
                  <div className="form-group-builder">
                    <label>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Enter full address" rows="2"></textarea>
                  </div>
                  <div className="row-2">
                    <div className="form-group-builder">
                      <label>Phone Number</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. +91 98765 43210" />
                    </div>
                    <div className="form-group-builder">
                      <label>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="admin@admin.com" />
                    </div>
                  </div>
                </div>

                <div className="builder-section">
                  <h3>Job & Salary</h3>
                  <div className="row-2">
                    <div className="form-group-builder">
                      <label>Designation</label>
                      <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g. Full Stack Developer" />
                    </div>
                    <div className="form-group-builder">
                      <label>Joining Date</label>
                      <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required />
                    </div>
                  </div>
                  {/* ── MONTHLY mode ── */}
                  {salaryFormat === 'Monthly' && !enableProbation && (
                    <div className="row-2">
                      <div className="form-group-builder">
                        <label>Monthly Salary (In-Hand) *</label>
                        <input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleInputChange} placeholder="e.g. 20000" />
                      </div>
                      <div className="form-group-builder">
                        <label>Salary in Words (Auto)</label>
                        <input type="text" name="monthlySalaryInWords" value={formData.monthlySalaryInWords} readOnly style={{ backgroundColor: '#f8fafc', color: '#334155', cursor: 'default', fontWeight: '500' }} placeholder="Auto generated" />
                      </div>
                    </div>
                  )}
                  {salaryFormat === 'Monthly' && enableProbation && (
                    <>
                      <div className="row-2">
                        <div className="form-group-builder">
                          <label>Salary During Probation (Per Month In-Hand) *</label>
                          <input type="number" name="salaryDuringProbation" value={formData.salaryDuringProbation} onChange={handleInputChange} placeholder="e.g. 15000" />
                        </div>
                        <div className="form-group-builder">
                          <label>In Words (Auto)</label>
                          <input type="text" name="salaryDuringProbationInWords" value={formData.salaryDuringProbationInWords} readOnly style={{ backgroundColor: '#f8fafc', color: '#334155', cursor: 'default', fontWeight: '500' }} placeholder="Auto generated" />
                        </div>
                      </div>
                      <div className="row-2">
                        <div className="form-group-builder">
                          <label>Salary After Probation (Per Month In-Hand) *</label>
                          <input type="number" name="salaryAfterProbation" value={formData.salaryAfterProbation} onChange={handleInputChange} placeholder="e.g. 20000" />
                        </div>
                        <div className="form-group-builder">
                          <label>In Words (Auto)</label>
                          <input type="text" name="salaryAfterProbationInWords" value={formData.salaryAfterProbationInWords} readOnly style={{ backgroundColor: '#f8fafc', color: '#334155', cursor: 'default', fontWeight: '500' }} placeholder="Auto generated" />
                        </div>
                      </div>
                    </>
                  )}
                  {/* ── YEARLY mode ── */}
                  {salaryFormat !== 'Monthly' && (
                    <>
                      <div className="row-2">
                        <div className="form-group-builder">
                          <label>Annual Salary (CTC) *</label>
                          <input type="number" name="ctc" value={formData.ctc} onChange={handleInputChange} placeholder="e.g. 240000" />
                        </div>
                        <div className="form-group-builder">
                          <label>CTC in Words (Auto)</label>
                          <input type="text" name="ctcInWords" value={formData.ctcInWords} readOnly style={{ backgroundColor: '#f8fafc', color: '#334155', cursor: 'default', fontWeight: '500' }} placeholder="Auto generated" />
                        </div>
                      </div>
                      <div className="row-2">
                        <div className="form-group-builder">
                          <label>Salary During Probation (Per Month In-Hand)</label>
                          <input type="number" name="salaryDuringProbation" value={formData.salaryDuringProbation} onChange={handleInputChange} placeholder="e.g. 15000" />
                        </div>
                        <div className="form-group-builder">
                          <label>In Words (Auto)</label>
                          <input type="text" name="salaryDuringProbationInWords" value={formData.salaryDuringProbationInWords} readOnly style={{ backgroundColor: '#f8fafc', color: '#334155', cursor: 'default', fontWeight: '500' }} placeholder="Auto generated" />
                        </div>
                      </div>
                      <div className="row-2">
                        <div className="form-group-builder">
                          <label>Salary After Probation (Per Month In-Hand)</label>
                          <input type="number" name="salaryAfterProbation" value={formData.salaryAfterProbation} onChange={handleInputChange} placeholder="e.g. 20000" />
                        </div>
                        <div className="form-group-builder">
                          <label>In Words (Auto)</label>
                          <input type="text" name="salaryAfterProbationInWords" value={formData.salaryAfterProbationInWords} readOnly style={{ backgroundColor: '#f8fafc', color: '#334155', cursor: 'default', fontWeight: '500' }} placeholder="Auto generated" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {salaryFormat !== 'Monthly' && (
                <div className="builder-section">
                  <h3>Salary Breakup</h3>
                  <table className="salary-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Per Month</th>
                        <th>Per Annum</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Basic Salary</td>
                        <td><input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleInputChange} placeholder="e.g. 6000" /></td>
                        <td>{formData.basicSalary ? formData.basicSalary * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>HRA</td>
                        <td><input type="number" name="hra" value={formData.hra} onChange={handleInputChange} placeholder="e.g. 6000" /></td>
                        <td>{formData.hra ? formData.hra * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>Conveyance Allowance</td>
                        <td><input type="number" name="conveyanceAllowance" value={formData.conveyanceAllowance} onChange={handleInputChange} placeholder="e.g. 6000" /></td>
                        <td>{formData.conveyanceAllowance ? formData.conveyanceAllowance * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>Special Allowance</td>
                        <td><input type="number" name="specialAllowance" value={formData.specialAllowance} onChange={handleInputChange} placeholder="e.g. 6000" /></td>
                        <td>{formData.specialAllowance ? formData.specialAllowance * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>Medical Allowance</td>
                        <td><input type="number" name="medicalAllowance" value={formData.medicalAllowance} onChange={handleInputChange} placeholder="e.g. 6000" /></td>
                        <td>{formData.medicalAllowance ? formData.medicalAllowance * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td><strong>Total Earning</strong></td>
                        <td><input type="number" name="totalEarning" value={formData.totalEarning} onChange={handleInputChange} placeholder="e.g. 30000" /></td>
                        <td>{formData.totalEarning ? formData.totalEarning * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>Professional Tax (PT)</td>
                        <td><input type="number" name="professionalTax" value={formData.professionalTax} onChange={handleInputChange} placeholder="e.g. 200" /></td>
                        <td>{formData.professionalTax ? formData.professionalTax * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>TDS</td>
                        <td><input type="number" name="tds" value={formData.tds} onChange={handleInputChange} placeholder="e.g. 0" /></td>
                        <td>{formData.tds ? formData.tds * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>Employer PF Contribution</td>
                        <td><input type="number" name="employerPf" value={formData.employerPf} onChange={handleInputChange} placeholder="e.g. 1800" /></td>
                        <td>{formData.employerPf ? formData.employerPf * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td>Employer ESI Contribution</td>
                        <td><input type="number" name="employerEsi" value={formData.employerEsi} onChange={handleInputChange} placeholder="e.g. 0" /></td>
                        <td>{formData.employerEsi ? formData.employerEsi * 12 : '-'}</td>
                      </tr>
                      <tr>
                        <td><strong>Net Pay</strong></td>
                        <td><input type="number" name="netPay" value={formData.netPay} onChange={handleInputChange} placeholder="e.g. 28000" /></td>
                        <td>{formData.netPay ? formData.netPay * 12 : '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                )}

                <div className="builder-section">
                  <h3>Terms & Conditions</h3>
                  <div className="form-group-builder terms-container">
                    {formData.terms.map((term, index) => (
                      <div key={index} className="term-row">
                        <textarea
                          value={term}
                          onChange={(e) => handleTermChange(index, e.target.value)}
                          placeholder={`Term ${index + 1}`}
                        ></textarea>
                      </div>
                    ))}
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Each line will be treated as a separate term. Current count: {formData.terms.length} terms</div>
                    <div className="term-actions">
                      <button type="button" className="add-term-btn" onClick={handleAddTerm}>Add Term</button>
                      <button type="button" className="add-term-btn" onClick={handleRemoveLastTerm}>Remove Last</button>
                      <button type="button" className="reset-term-btn" onClick={handleResetTerms}>Reset to Default</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="builder-preview-side">
                {/* Page 1 */}
                <div className="preview-page">
                  {renderPreviewHeader()}
                  <div className="preview-body">
                    <p>To,<br /><strong>{formData.salutation} {formData.fullName || '________________'}</strong></p>
                    <p>{formData.address || '________________'}</p>
                    <p>Tel : {formData.phone || '________________'}</p>
                    <p>E-mail: {formData.email || '________________'}</p>
                    <p>Date :- {formData.issueDate}</p>
                    <p><strong>Subject : Offer Letter</strong></p>
                    <p>Congratulations!</p>
                    <p>We are pleased to offer you the position of <strong>{formData.designation || '________________'}</strong> with the Company. The effective date of your appointment is agreed as <strong>{formData.joiningDate || 'DD-MM-YYYY'}</strong>.</p>

                    {/* ── Monthly, no probation ── */}
                    {salaryFormat === 'Monthly' && !enableProbation && (
                      <p>Your monthly in-hand salary will be <strong>Rs. {formData.monthlySalary || '___'}</strong> (<strong>{formData.monthlySalaryInWords || '_____ only'}</strong>) per month.</p>
                    )}

                    {/* ── Monthly, with probation ── */}
                    {salaryFormat === 'Monthly' && enableProbation && (
                      <p>
                        During the probation period of <strong>{probationMonths} month{Number(probationMonths) !== 1 ? 's' : ''}</strong>, your monthly in-hand salary will be <strong>Rs. {formData.salaryDuringProbation || '___'}</strong> (<strong>{formData.salaryDuringProbationInWords || '_____ only'}</strong>). Upon successful completion of probation, your monthly in-hand salary will be revised to <strong>Rs. {formData.salaryAfterProbation || '___'}</strong> (<strong>{formData.salaryAfterProbationInWords || '_____ only'}</strong>).
                      </p>
                    )}

                    {/* ── Yearly (CTC) ── */}
                    {salaryFormat !== 'Monthly' && (
                      <p>Your annual compensation (CTC) will be <strong>Rs. {formData.ctc || '___'}</strong> (<strong>{formData.ctcInWords || '_____ only'}</strong>) per annum.</p>
                    )}
                    {salaryFormat !== 'Monthly' && (formData.salaryDuringProbation || formData.salaryAfterProbation) && (
                      <p>
                        During the probation period of <strong>{probationMonths} month{Number(probationMonths) !== 1 ? 's' : ''}</strong>, your monthly in-hand salary will be <strong>Rs. {formData.salaryDuringProbation || '___'}</strong> (<strong>{formData.salaryDuringProbationInWords || '_____ only'}</strong>). Upon successful completion of probation, your monthly in-hand salary will be revised to <strong>Rs. {formData.salaryAfterProbation || '___'}</strong> (<strong>{formData.salaryAfterProbationInWords || '_____ only'}</strong>).
                      </p>
                    )}
                    <p>Your continued employment is contingent upon your satisfactorily meeting the Company's expectations.</p>
                    <p>Your salary structure is provided in Annexure 1.</p>
                    <p>On your first day, please bring the documents as provided in Annexure 2.</p>
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>Page 1</div>
                  </div>
                </div>

                {/* Page 2 */}
                <div className="preview-page">
                  {renderPreviewHeader()}
                  <div className="preview-body">
                    <p>Note that this Letter of Offer is valid for two (2) working days from the date of receipt.</p>
                    <p>We look forward to you joining {branding.company_name} and to a mutually rewarding working relationship.</p>
                    <br /><br />
                    {branding.stamp_url ? <img src={branding.stamp_url} alt="Stamp" style={{ maxWidth: '100px' }} /> : <p>Stamp</p>}
                    <p>Best Regards,</p>
                    <p>{branding.hr_name},<br />{branding.hr_designation},<br />{branding.company_name}</p>
                    <br /><br />
                    <p>I agree and accept this Letter of Offer which has been read, understood and accepted by me.</p>
                    <p>Signature : ________<br />Name :- {formData.salutation} {formData.fullName || '________________'}<br />Date : </p>
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>Page 2</div>
                  </div>
                </div>

                {/* Page 3 (Annexure 1) */}
                {companySettings.salary_format !== 'Monthly' && (
                <div className="preview-page">
                  {renderPreviewHeader()}
                  <div className="preview-body">
                    <h3 style={{ textAlign: 'center' }}>Annexure 1 - Salary Structure</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Component</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Per Month</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Per Annum</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Basic Salary</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.basicSalary || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.basicSalary ? formData.basicSalary * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>HRA</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.hra || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.hra ? formData.hra * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Conveyance Allowance</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.conveyanceAllowance || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.conveyanceAllowance ? formData.conveyanceAllowance * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Special Allowance</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.specialAllowance || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.specialAllowance ? formData.specialAllowance * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Medical Allowance</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.medicalAllowance || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.medicalAllowance ? formData.medicalAllowance * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Total Earning</strong></td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.totalEarning || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.totalEarning ? formData.totalEarning * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Professional Tax (PT)</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.professionalTax || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.professionalTax ? formData.professionalTax * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>TDS</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.tds || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.tds ? formData.tds * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Employer PF Contribution</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.employerPf || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.employerPf ? formData.employerPf * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Employer ESI Contribution</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.employerEsi || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.employerEsi ? formData.employerEsi * 12 : '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px' }}><strong>Net Pay</strong></td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.netPay || '-'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{formData.netPay ? formData.netPay * 12 : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>Page 3 (Annexure 1)</div>
                  </div>
                </div>
                )}

                {/* Annexure for Documents */}
                <div className="preview-page">
                  {renderPreviewHeader()}
                  <div className="preview-body">
                    <h3 style={{ textAlign: 'center' }}>
                      {companySettings.salary_format === 'Monthly' ? 'Annexure 1' : 'Annexure 2'} - Documents required at the time of joining
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '10pt' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>S. No.</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Documents Required</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Format</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Document Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>1.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Proof of Age and ID</td><td style={{ border: '1px solid #000', padding: '8px' }}>Photocopy</td><td style={{ border: '1px solid #000', padding: '8px' }}>Aadhar Card/ Driver License/10th Certificate/PAN Card</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>2.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Proof of Residence</td><td style={{ border: '1px solid #000', padding: '8px' }}>Photocopy</td><td style={{ border: '1px solid #000', padding: '8px' }}>Aadhar/Phone Bill/Ration Card/Voter ID/Electricity Bill/Rent Agreement</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>3.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Educational Qualifications</td><td style={{ border: '1px solid #000', padding: '8px' }}>Photocopy</td><td style={{ border: '1px solid #000', padding: '8px' }}>Graduation, Post-Graduation</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>4.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Experience Certificate/s</td><td style={{ border: '1px solid #000', padding: '8px' }}>Photocopy</td><td style={{ border: '1px solid #000', padding: '8px' }}>On the letterhead of the previous company</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>5.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Last 3 months' payslip/Bank Statement</td><td style={{ border: '1px solid #000', padding: '8px' }}>Original</td><td style={{ border: '1px solid #000', padding: '8px' }}>Letter with Stamp of the previous company/bank</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>6.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Relieving Letter</td><td style={{ border: '1px solid #000', padding: '8px' }}>Photocopy</td><td style={{ border: '1px solid #000', padding: '8px' }}>On the letterhead of the previous company</td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>7.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Updated Resume</td><td style={{ border: '1px solid #000', padding: '8px' }}></td><td style={{ border: '1px solid #000', padding: '8px' }}></td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>8.</td><td style={{ border: '1px solid #000', padding: '8px' }}>Cancelled Cheque</td><td style={{ border: '1px solid #000', padding: '8px' }}>Soft Copy</td><td style={{ border: '1px solid #000', padding: '8px' }}></td></tr>
                        <tr><td style={{ border: '1px solid #000', padding: '8px' }}>9.</td><td style={{ border: '1px solid #000', padding: '8px' }}>EPF Details</td><td style={{ border: '1px solid #000', padding: '8px' }}></td><td style={{ border: '1px solid #000', padding: '8px' }}>EPF number</td></tr>
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>
                      Page {companySettings.salary_format === 'Monthly' ? '3 (Annexure 1)' : '4 (Annexure 2)'}
                    </div>
                  </div>
                </div>

                {/* Page 5 (Terms & Conditions) */}
                <div className="preview-page">
                  {renderPreviewHeader()}
                  <div className="preview-body">
                    <h3 style={{ textAlign: 'center' }}>Terms & Conditions</h3>
                    <ul style={{ marginTop: '20px', paddingLeft: '20px' }}>
                      {formData.terms.filter(t => t.trim() !== '').map((term, index) => (
                        <li key={index} style={{ marginBottom: '10px' }}>{term}</li>
                      ))}
                    </ul>
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>Page 5 (Terms & Conditions)</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {isAcceptModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="modal-content1 convert-employee-modal">
            <div className="modal-header">
              <h2>
                <i className="fas fa-user-check" style={{ color: '#10b981' }}></i>
                Convert to Employee
              </h2>
              <button className="close-btn" onClick={() => setIsAcceptModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="convert-modal-desc">
                <div>Candidate: <strong>{selectedOfferLetter?.candidate_name || selectedOfferLetter?.form_data?.fullName || 'Candidate'}</strong></div>
                <div>Email: <strong>{selectedOfferLetter?.candidate_email || selectedOfferLetter?.form_data?.email || '-'}</strong></div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#64748b' }}>Provide an Employee ID, Department, and Employment Type to activate their employee profile and send welcome credentials.</div>
              </div>
              <form onSubmit={handleAcceptSubmit} className="employee-form" style={{ padding: 0 }}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={acceptFormData.employee_id}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, employee_id: e.target.value })}
                    placeholder="e.g. TEAMB01"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Department *</label>
                  <select
                    value={acceptFormData.department_id}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, department_id: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Employee Type *</label>
                  <select
                    value={acceptFormData.employment_type}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, employment_type: e.target.value })}
                    required
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Intern">Intern</option>
                    <option value="Contract">Contract</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div className="convert-form-actions">
                  <button type="button" onClick={() => setIsAcceptModalOpen(false)} className="convert-cancel-btn">
                    Cancel
                  </button>
                  <button type="submit" className="c-to-e-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Creating Employee...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        <span>Accept & Create</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="modal-overlay" onClick={() => setPreviewPdfUrl(null)}>
          <div className="modal-content preview-modal" style={{ width: '80%', maxWidth: '900px', height: '90vh', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Offer Letter Preview</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setPreviewPdfUrl(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ height: 'calc(100% - 60px)', padding: 0 }}>
              <iframe 
                src={`${previewPdfUrl}#toolbar=0`} 
                title="Offer Letter Preview" 
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SMTP Configuration Required Modal */}
      {isSmtpConfigModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '90%', textAlign: 'center', padding: '32px 24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              <i className="fas fa-envelope"></i>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 10px' }}>
              SMTP Email Setup Required
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 24px' }}>
              Your organization has not configured email (SMTP) settings yet. Before creating or emailing offer letters, you must configure your company SMTP credentials so emails can be sent to candidates.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsSmtpConfigModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSmtpConfigModalOpen(false);
                  localStorage.setItem("activeTab", "smtpconfig");
                  window.location.href = '/admin?tab=smtpconfig';
                }}
                style={{
                  padding: '10px 22px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-cog"></i> Go to SMTP Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetter;
