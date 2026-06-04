import React, { useState, useEffect, useCallback } from 'react';
import { offerLetterAPI } from '../../../services/offerLetterAPI';
import { employeeAPI } from '../../../services/employeeAPI';
import offerLetterPDFService from '../../../services/offerLetterPDFService';
import './Employee.css';
import './OfferLetterBuilder.css';
import logoUrl from '../../../assets/img/company.png';


const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; var str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() ? str.trim() + ' Rupees Only' : '';
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

const OfferLetter = ({ onEmployeeConverted }) => {
  const [offerLetters, setOfferLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedOfferLetter, setSelectedOfferLetter] = useState(null);
  const [acceptFormData, setAcceptFormData] = useState({ employee_id: '', department_id: '', employment_type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
    terms: [...defaultTerms]
  });

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

  useEffect(() => {
    loadOfferLetters();
    loadDepartments();
  }, [loadOfferLetters]);

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
      if (name === 'ctc' && value) {
        newData.ctcInWords = numberToWords(parseInt(value.replace(/,/g, ''), 10)) || '';
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const payload = {
        candidate_name: formData.fullName,
        candidate_email: formData.email,
        issue_date: formData.issueDate,
        form_data: { ...formData }
      };

      await offerLetterAPI.save(payload);
      alert('Offer letter generated successfully!');

      setIsModalOpen(false);
      setFormData({
        issueDate: new Date().toISOString().slice(0, 10),
        salutation: 'Mr.', fullName: '', address: '', phone: '', email: '',
        designation: '', joiningDate: '', ctc: '', ctcInWords: '',
        basicSalary: '', hra: '', conveyanceAllowance: '', specialAllowance: '', medicalAllowance: '',
        totalEarning: '', professionalTax: '', tds: '', employerPf: '', employerEsi: '', netPay: '',
        terms: [...defaultTerms]
      });
      loadOfferLetters();
    } catch (error) {
      console.error('Failed to generate offer letter:', error);
      alert(error.response?.data?.message || 'Failed to generate offer letter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (status === 'Accepted') {
      const offer = offerLetters.find(o => o.id === id);
      setSelectedOfferLetter(offer);
      setAcceptFormData({ employee_id: '', department_id: '', employment_type: '' });
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

  const handleViewPDF = (offer) => {
    offerLetterPDFService.viewOfferLetter(offer.form_data);
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
      <img src={logoUrl} alt="Logo" className="preview-logo" onError={(e) => { e.target.style.display = 'none' }} />
      <div className="preview-contact">
        <div className="preview-contact-item"><i className="fas fa-globe"></i> www.arhamitsolution.in</div>
        <div className="preview-contact-item"><i className="fas fa-envelope"></i> info@arhamitsolution.in</div>
      </div>
    </div>
  );

  if (loading) return <div className="employee-section"><div className="loading-container">Loading...</div></div>;

  return (
    <div className="employee-section">
      <div className="employee-table-container glass-form">
        <div className="table-header employee-management-header">
          <h3 style={{ margin: 0 }}>Offer Letters Tracking</h3>
          <button className="add-employee-btn" onClick={() => setIsModalOpen(true)}>
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
                      <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="row-2">
                    <div className="form-group-builder">
                      <label>Annual CTC</label>
                      <input type="number" name="ctc" value={formData.ctc} onChange={handleInputChange} placeholder="e.g. 96000" />
                    </div>
                    <div className="form-group-builder">
                      <label>CTC in Words</label>
                      <input type="text" name="ctcInWords" value={formData.ctcInWords} onChange={handleInputChange} placeholder="Auto generated or enter manually" />
                    </div>
                  </div>
                </div>

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
                    <p>Your annual compensation (CTC) will be <strong>Rs. {formData.ctc || '___'}</strong> (<strong>{formData.ctcInWords || '_____ only'}</strong>) per annum.</p>
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
                    <p>We look forward to you joining Arham IT Solution and to a mutually rewarding working relationship.</p>
                    <br /><br />
                    <p>Stamp</p>
                    <p>Best Regards,</p>
                    <p>Sharjeel Iqbal,<br />HR and BDE Executive,<br />Arham IT Solution</p>
                    <br /><br />
                    <p>I agree and accept this Letter of Offer which has been read, understood and accepted by me.</p>
                    <p>Signature : ________<br />Name :- {formData.salutation} {formData.fullName || '________________'}<br />Date : </p>
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>Page 2</div>
                  </div>
                </div>

                {/* Page 3 (Annexure 1) */}
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

                {/* Page 4 (Annexure 2) */}
                <div className="preview-page">
                  {renderPreviewHeader()}
                  <div className="preview-body">
                    <h3 style={{ textAlign: 'center' }}>Annexure 2 - Documents required at the time of joining</h3>
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
                    <div style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>Page 4 (Annexure 2)</div>
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
        <div className="modal-overlay">
          <div className="modal-content1">
            <div className="modal-header">
              <h2>Convert to Employee</h2>
              <button className="close-btn" onClick={() => setIsAcceptModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px' }}>Please provide an Employee ID, Department, and Employee Type to convert the candidate into an employee.</p>
              <form onSubmit={handleAcceptSubmit} className="employee-form">
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    value={acceptFormData.employee_id}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, employee_id: e.target.value })}
                    placeholder="e.g. AITS101"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
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
                <div className="form-group">
                  <label>Employee Type *</label>
                  <select
                    value={acceptFormData.employment_type}
                    onChange={(e) => setAcceptFormData({ ...acceptFormData, employment_type: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Intern">Intern</option>
                    <option value="Contract">Contract</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div className="form-actions" style={{ marginTop: '25px' }}>
                  <button type="button" onClick={() => setIsAcceptModalOpen(false)} className="cancel-btn">Cancel</button>
                  <button type="submit" className="c-to-e-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Accept & Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetter;
