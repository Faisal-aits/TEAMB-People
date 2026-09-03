import React, { useState, useEffect, useRef } from 'react';
import { employeeAPI } from '../../services/employeeAPI';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { salarySlipPDFService } from '../../services/salarySlipPDFService';
import { incrementPDFService } from '../../services/incrementPDFService';
import { HiOutlineDownload, HiOutlineCamera, HiOutlineUpload, HiOutlineTrash, HiOutlineCheck } from 'react-icons/hi';
import '../HRModule/EmployeeManagement/Employee.css';
import './EmployeePersonalInfo.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const combineKYCDocuments = async (frontInput, backInput, docTitle) => {
  if (frontInput instanceof File && frontInput.type === 'application/pdf' && !backInput) {
    return frontInput;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const availableWidth = pageWidth - (margin * 2);

  const fileToDataUrl = (fileOrUrl) => {
    return new Promise((resolve, reject) => {
      if (typeof fileOrUrl === 'string') return resolve(fileOrUrl);
      if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrUrl);
      } else {
        reject(new Error('Invalid file type'));
      }
    });
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(docTitle || 'KYC Document', margin, 20);

  let currentY = 30;

  if (frontInput) {
    const frontDataUrl = await fileToDataUrl(frontInput);
    const frontImg = await loadImage(frontDataUrl);

    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text('Front Side:', margin, currentY);
    currentY += 5;

    const maxH = backInput ? 110 : 230;
    let frontW = availableWidth;
    let frontH = frontW * (frontImg.height / frontImg.width);
    if (frontH > maxH) {
      frontH = maxH;
      frontW = frontH * (frontImg.width / frontImg.height);
    }

    doc.addImage(frontDataUrl, 'JPEG', margin, currentY, frontW, frontH);
    currentY += frontH + 15;
  }

  if (backInput) {
    const backDataUrl = await fileToDataUrl(backInput);
    const backImg = await loadImage(backDataUrl);

    const maxH = 110;
    let backW = availableWidth;
    let backH = backW * (backImg.height / backImg.width);
    if (backH > maxH) {
      backH = maxH;
      backW = backH * (backImg.width / backImg.height);
    }

    if (currentY + backH + 10 > pageHeight) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text('Back Side:', margin, currentY);
    currentY += 5;

    doc.addImage(backDataUrl, 'JPEG', margin, currentY, backW, backH);
  }

  const pdfBlob = doc.output('blob');
  return new File([pdfBlob], `${(docTitle || 'kyc_document').replace(/\s+/g, '_')}_combined.pdf`, { type: 'application/pdf' });
};

const EmployeePersonalInfo = () => {
  const hrDocumentTypes = ['increment_letter', 'offer_letter', 'experience_letter', 'resignation_letter', 'resignation', 'salary_slip', 'epf_declaration'];
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [viewDocumentsModalOpen, setViewDocumentsModalOpen] = useState(false);
  const [documentTab, setDocumentTab] = useState('kyc'); // 'kyc' or 'hr'
  
  // Resignation State
  const [showResignationModal, setShowResignationModal] = useState(false);
  const [resignationData, setResignationData] = useState({
    requested_last_day: '',
    reason: '',
    additional_note: ''
  });
  const [resignationSubmitting, setResignationSubmitting] = useState(false);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('Document');

  // KYC Upload & Camera State
  const [showUploadKycForm, setShowUploadKycForm] = useState(false);
  const [kycUploadData, setKycUploadData] = useState({
    document_type: 'aadhar_card',
    title: ''
  });
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [kycUploading, setKycUploading] = useState(false);

  // Live Camera State
  const [activeCameraSide, setActiveCameraSide] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async (side) => {
    setActiveCameraSide(side);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please check camera permissions or upload a file.');
      setActiveCameraSide(null);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setActiveCameraSide(null);
  };

  useEffect(() => {
    if (activeCameraSide && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [activeCameraSide, cameraStream]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (activeCameraSide === 'front') {
      setFrontFile(dataUrl);
      setFrontPreview(dataUrl);
    } else if (activeCameraSide === 'back') {
      setBackFile(dataUrl);
      setBackPreview(dataUrl);
    }
    stopCamera();
  };

  const handleFileChange = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (side === 'front') {
        setFrontFile(file);
        setFrontPreview(file.type.startsWith('image/') ? event.target.result : null);
      } else {
        setBackFile(file);
        setBackPreview(file.type.startsWith('image/') ? event.target.result : null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadKycSubmit = async (e) => {
    e.preventDefault();
    if (!frontFile) {
      alert('Please upload or capture the Front Side of the document');
      return;
    }
    if (!kycUploadData.title.trim()) {
      alert('Please enter a document title');
      return;
    }

    setKycUploading(true);
    try {
      const finalFile = await combineKYCDocuments(frontFile, backFile, kycUploadData.title.trim());

      const formData = new FormData();
      formData.append('document_type', kycUploadData.document_type);
      formData.append('title', kycUploadData.title.trim());
      formData.append('file', finalFile);

      const res = await axios.post(`${API_URL}/api/documents/upload-my-kyc`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.data.success) {
        alert('KYC Document merged and uploaded successfully!');
        setShowUploadKycForm(false);
        setKycUploadData({ document_type: 'aadhar_card', title: '' });
        setFrontFile(null);
        setFrontPreview(null);
        setBackFile(null);
        setBackPreview(null);
        await loadProfile();
      }
    } catch (err) {
      console.error('Error uploading KYC document:', err);
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setKycUploading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfPreviewUrl) return;

    try {
      let downloadUrl = pdfPreviewUrl;
      let shouldRevoke = false;

      // Fetch blob for remote URLs to ensure cross-origin download works
      if (!pdfPreviewUrl.startsWith('blob:')) {
        const response = await fetch(pdfPreviewUrl);
        const blob = await response.blob();
        downloadUrl = window.URL.createObjectURL(blob);
        shouldRevoke = true;
      }

      const fileName = `${(pdfPreviewTitle || 'Document').replace(/[^a-zA-Z0-9_\- ]/g, '_')}.pdf`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (shouldRevoke) {
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 200);
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
      window.open(pdfPreviewUrl, '_blank');
    }
  };

  // Form state
  const [editFormData, setEditFormData] = useState({
    bank_account_number: '',
    ifsc_code: '',
    pan_number: '',
    aadhar_number: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getMyProfile();
      if (response.data && response.data.employee) {
        setProfile(response.data.employee);
        setEditFormData({
          bank_account_number: response.data.employee.bank_account_number || '',
          ifsc_code: response.data.employee.ifsc_code || '',
          pan_number: response.data.employee.pan_number || '',
          aadhar_number: response.data.employee.aadhar_number || ''
        });
      } else {
        setError('Profile data not found');
      }

      // Fetch documents
      const docsRes = await axios.get(`${API_URL}/api/documents/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (docsRes.data && docsRes.data.documents) {
        setDocuments(docsRes.data.documents);
      }
    } catch (err) {
      console.error('Error loading profile or docs:', err);
      setError(err.response?.data?.message || 'Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (!profile) return 'U';
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (!profile) return 'User';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResignationSubmit = async (e) => {
    e.preventDefault();
    setResignationSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/resignation-requests`, resignationData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        alert('Resignation request submitted successfully.');
        setShowResignationModal(false);
        setResignationData({ requested_last_day: '', reason: '', additional_note: '' });
      }
    } catch (err) {
      console.error('Error submitting resignation:', err);
      alert(err.response?.data?.message || 'Failed to submit resignation request.');
    } finally {
      setResignationSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await employeeAPI.updateMyProfile(editFormData);
      if(res.data.success) {
        setProfile(res.data.employee);
        window.alert('Profile updated successfully');
        setShowEditModal(false);
      }
    } catch (err) {
      window.alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await employeeAPI.resetMyPassword({ new_password: passwordForm.new_password });
      if(res.data.success) {
        window.alert('Password reset successfully');
        setShowResetPasswordForm(false);
        setPasswordForm({ new_password: '', confirm_password: '' });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    setPdfPreviewTitle(doc.title || doc.document_type || 'Document');
    if (doc.file_url) {
      setPdfPreviewUrl(`${API_URL}${doc.file_url}`);
      return;
    }

    if (doc.document_type === 'salary_slip') {
      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
      try {
        let formData = {
           employeeId: profile.employee_id,
           fullName: getFullName(),
           department: profile.department_name,
           designation: profile.position,
           monthYear: doc.title,
           month: metadata?.month || '',
           year: metadata?.year || '',
           dateOfJoining: profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : '',
           bankAccountNo: profile.bank_account_number || '',
           pan: profile.pan_number || '',
           uan: profile.aadhar_number || '',
           presentDays: metadata?.presentDays !== undefined ? metadata.presentDays : "-",
           nonPaidDays: metadata?.nonPaidDays !== undefined ? metadata.nonPaidDays : "-",
           earnings: { basic: metadata?.generatedSalary || profile.salary || 0 },
           deductions: { pf: 0, pt: 0, tds: 0 }
        };

        if (metadata?.salary_record_id) {
          const res = await axios.get(`${API_URL}/api/salary/slip/${metadata.salary_record_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.data && res.data.salary_slip) {
             const record = res.data.salary_slip;
             const details = (typeof record.details === 'string' ? JSON.parse(record.details || '{}') : record.details) || {};
             formData = {
                ...formData,
                basicSalary: Math.round(record.basic_salary || 0),
                grossSalary: Math.round(record.gross_salary || record.basic_salary || 0),
                netSalary: Math.round(record.net_salary || record.basic_salary || 0),
                deductionAmount: Math.round(record.deduction_amount || 0),
                presentDays:     details.present_days      ?? record.present_days     ?? '-',
                absentDays:      details.absent_days       ?? record.absent_days      ?? '-',
                halfDays:        details.half_days         ?? record.half_days        ?? '-',
                paidLeaveDays:   details.paid_leave_days   ?? record.paid_leave_days  ?? '-',
                unpaidLeaveDays: details.unpaid_leave_days ?? record.unpaid_leave_days ?? '-',
                payableDays:     details.paid_days         ?? record.paid_days        ?? '-',
                nonPayableDays:  details.deduction_days    ?? record.deduction_days   ?? '-',
                earnings: { basic: Math.round(record.basic_salary || 0) }
             };
          }
        }

        const pdfBlob = await salarySlipPDFService.generatePDFBlob(formData);
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(blobUrl);
      } catch (err) {
        console.error("Failed to view salary slip", err);
      }
    } else if (doc.document_type === 'increment_letter') {
       try {
         const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {});
         const pdfData = {
           employeeId: profile.employee_id,
           fullName: getFullName(),
           date: new Date(doc.created_at).toLocaleDateString(),
           currentSalary: metadata.salary_during_probation || profile.salary || '0',
           newSalary: metadata.salary_after_probation || profile.salary || '0',
           effectiveDate: new Date(metadata.probation_end_date || doc.created_at).toLocaleDateString()
         };
         const pdfBlob = await incrementPDFService.generatePDFBlob(pdfData);
         const blobUrl = URL.createObjectURL(pdfBlob);
         setPdfPreviewUrl(blobUrl);
       } catch (err) {
         console.error("Failed to view increment letter", err);
       }
    }
  };

  if (loading) {
    return (
      <div className="personal-info-section">
        <div className="pi-loading-container">
          <div className="pi-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personal-info-section">
        <div className="pi-error-container">
          <p className="pi-error-message">{error}</p>
          <button onClick={loadProfile} className="pi-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-info-section">
      <h2 className="pi-page-title">Profile</h2>

      <div className="pi-profile-card">
        {/* Profile Header */}
        <div className="pi-profile-header">
          <div className="pi-avatar">
            <span className="pi-avatar-text">{getInitials()}</span>
          </div>
          <div className="pi-profile-details">
            <h3 className="pi-full-name">{getFullName()}</h3>
            <p className="pi-designation">
              {profile?.position || profile?.designation || 'Employee'}
            </p>
            <p className="pi-department">
              {profile?.department_name || '-'}
            </p>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="pi-info-grid">
          <div className="pi-info-card">
            <span className="pi-info-label">EMPLOYEE ID</span>
            <span className="pi-info-value">{profile?.employee_id || profile?.id || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">EMAIL</span>
            <span className="pi-info-value">{profile?.email || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">PHONE</span>
            <span className="pi-info-value">{profile?.phone || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">DATE OF JOINING</span>
            <span className="pi-info-value">{formatDate(profile?.joining_date)}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">POSITION</span>
            <span className="pi-info-value">{profile?.position || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">DEPARTMENT</span>
            <span className="pi-info-value">{profile?.department_name || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">BANK ACCOUNT</span>
            <span className="pi-info-value">{profile?.bank_account_number || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">IFSC CODE</span>
            <span className="pi-info-value">{profile?.ifsc_code || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">PAN NUMBER</span>
            <span className="pi-info-value">{profile?.pan_number || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">AADHAR NUMBER</span>
            <span className="pi-info-value">{profile?.aadhar_number || '-'}</span>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <button type="button" className="reset-password-btn footer-btn" onClick={() => setShowResetPasswordForm(true)}>
            <i className="fas fa-key"></i> Reset Password
          </button>
          <button type="button" className="viewdocuments-btn footer-btn" onClick={() => setViewDocumentsModalOpen(true)}>
            <i className="fas fa-file-alt"></i> Documents
          </button>
          <button type="button" className="edit-btn footer-btn" onClick={() => setShowEditModal(true)}>
            <i className="fas fa-edit"></i> Edit
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content1 edit-employee-modal">
            <div className="modal-header">
              <h2><i className="fas fa-user-edit"></i> Edit Profile</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            
            <div className="modal-body scrollable-content">
              <form onSubmit={handleEditSubmit}>
                <div className="form-section">
                  <h3>Bank Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Bank Account Number</label>
                      <input
                        type="text"
                        name="bank_account_number"
                        value={editFormData.bank_account_number}
                        onChange={handleEditChange}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input
                        type="text"
                        name="ifsc_code"
                        value={editFormData.ifsc_code}
                        onChange={handleEditChange}
                        placeholder="Enter IFSC code"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Identity Documents</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>PAN Number</label>
                      <input
                        type="text"
                        name="pan_number"
                        value={editFormData.pan_number}
                        onChange={handleEditChange}
                        placeholder="Enter PAN"
                      />
                    </div>
                    <div className="form-group">
                      <label>Aadhar Number</label>
                      <input
                        type="text"
                        name="aadhar_number"
                        value={editFormData.aadhar_number}
                        onChange={handleEditChange}
                        placeholder="Enter Aadhar"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submitLoading}>
                    {submitLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordForm && (
        <div className="modal-overlay">
          <div className="modal-content1 reset-password-modal">
            <div className="modal-header">
              <h2><i className="fas fa-key"></i> Reset Password</h2>
              <button className="close-btn" onClick={() => setShowResetPasswordForm(false)}>×</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-body">
                {passwordError && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{passwordError}</div>}
                
                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-group">
                    <i className="fas fa-lock"></i>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      required
                      placeholder="Enter new password"
                      minLength="6"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="password-input-group">
                    <i className="fas fa-lock"></i>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      required
                      placeholder="Confirm new password"
                      minLength="6"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="cancel-btn footer-btn" onClick={() => setShowResetPasswordForm(false)}>Cancel</button>
                <button type="submit" className="submit-btn footer-btn" disabled={submitLoading}>
                  {submitLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {viewDocumentsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content1 documents-modal" style={{ maxWidth: '650px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <h2 
                  onClick={() => { setDocumentTab('kyc'); setShowUploadKycForm(false); }}
                  style={{ cursor: 'pointer', margin: 0, paddingBottom: '5px', borderBottom: documentTab === 'kyc' ? '2px solid #2563eb' : 'none', color: documentTab === 'kyc' ? '#2563eb' : '#64748b' }}
                >
                  <i className="fas fa-id-card"></i> KYC Documents
                </h2>
                <h2 
                  onClick={() => { setDocumentTab('hr'); setShowUploadKycForm(false); }}
                  style={{ cursor: 'pointer', margin: 0, paddingBottom: '5px', borderBottom: documentTab === 'hr' ? '2px solid #2563eb' : 'none', color: documentTab === 'hr' ? '#2563eb' : '#64748b' }}
                >
                  <i className="fas fa-file-signature"></i> HR Documents
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {documentTab === 'kyc' && (
                  <button
                    type="button"
                    onClick={() => setShowUploadKycForm(!showUploadKycForm)}
                    style={{ padding: '6px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                  >
                    {showUploadKycForm ? 'View Documents' : '+ Upload KYC Document'}
                  </button>
                )}
                {documentTab === 'hr' && (
                  <button
                    type="button"
                    onClick={() => setShowResignationModal(true)}
                    style={{ padding: '6px 14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                  >
                    + Apply Resignation
                  </button>
                )}
                <button className="close-btn" onClick={() => setViewDocumentsModalOpen(false)}>x</button>
              </div>
            </div>
            
            {showUploadKycForm && documentTab === 'kyc' ? (
              <form onSubmit={handleUploadKycSubmit} style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Upload & Combine KYC Document</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>Document Type *</label>
                  <select
                    value={kycUploadData.document_type}
                    onChange={(e) => setKycUploadData({ ...kycUploadData, document_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    required
                  >
                    <option value="aadhar_card">Aadhar Card</option>
                    <option value="pan_card">PAN Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="kyc_document">Other KYC Document</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>Document Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Aadhar Card (Front & Back)"
                    value={kycUploadData.title}
                    onChange={(e) => setKycUploadData({ ...kycUploadData, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    required
                  />
                </div>

                {/* Dual Upload Section: Front & Back */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  {/* Front Side */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>Front Side *</h4>
                    
                    {frontPreview ? (
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <img src={frontPreview} alt="Front Preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                        <button
                          type="button"
                          onClick={() => { setFrontFile(null); setFrontPreview(null); }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    ) : frontFile ? (
                      <div style={{ padding: '10px', fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                        <HiOutlineCheck style={{ display: 'inline', marginRight: '4px' }} /> PDF File Selected
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Upload file or capture photo</div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        <HiOutlineUpload /> File
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'front')} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => startCamera('front')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        <HiOutlineCamera /> Camera
                      </button>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>Back Side (Optional)</h4>
                    
                    {backPreview ? (
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <img src={backPreview} alt="Back Preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                        <button
                          type="button"
                          onClick={() => { setBackFile(null); setBackPreview(null); }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    ) : backFile ? (
                      <div style={{ padding: '10px', fontSize: '13px', color: '#166534', fontWeight: '500' }}>
                        <HiOutlineCheck style={{ display: 'inline', marginRight: '4px' }} /> PDF File Selected
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Upload file or capture photo</div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        <HiOutlineUpload /> File
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'back')} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => startCamera('back')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        <HiOutlineCamera /> Camera
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadKycForm(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={kycUploading}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                  >
                    {kycUploading ? 'Combining & Uploading...' : 'Combine & Upload Document'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="documents-grid" style={{ padding: '20px' }}>
                {documentTab === 'kyc' && documents.filter(doc => !hrDocumentTypes.includes(doc.document_type)).length > 0 ? (
                  documents
                    .filter(doc => !hrDocumentTypes.includes(doc.document_type))
                    .map(doc => (
                      <div className="document-card" key={doc.id} onClick={() => handleViewDocument(doc)} style={{ cursor: 'pointer' }}>
                        <div className="document-icon">
                          <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="document-info">
                          <h3 style={{ textTransform: 'capitalize' }}>{doc.document_type.replace(/_/g, ' ')}</h3>
                          <p>{doc.title} - {formatDate(doc.created_at)}</p>
                        </div>
                        <div className="document-arrow">
                          <i className="fas fa-eye"></i>
                        </div>
                      </div>
                    ))
                ) : documentTab === 'hr' && documents.filter(doc => hrDocumentTypes.includes(doc.document_type)).length > 0 ? (
                  documents
                    .filter(doc => hrDocumentTypes.includes(doc.document_type))
                    .map(doc => (
                      <div className="document-card" key={doc.id} onClick={() => handleViewDocument(doc)} style={{ cursor: 'pointer' }}>
                        <div className="document-icon">
                          <i className="fas fa-file-pdf"></i>
                        </div>
                        <div className="document-info">
                          <h3 style={{ textTransform: 'capitalize' }}>{doc.document_type.replace(/_/g, ' ')}</h3>
                          <p>{doc.title} - {formatDate(doc.created_at)}</p>
                        </div>
                        <div className="document-arrow">
                          <i className="fas fa-eye"></i>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="no-documents-msg" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                     <p>No {documentTab === 'kyc' ? 'KYC' : 'HR'} documents available.</p>
                  </div>
                )}
              </div>
            )}
            <div className="modal-footer" style={{ padding: '0 20px 20px' }}>
              <button className="cancel-btn footer-btn" onClick={() => setViewDocumentsModalOpen(false)} style={{ marginLeft: 'auto' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Resignation Modal */}
      {showResignationModal && (
        <div className="modal-overlay" style={{ zIndex: 9990 }}>
          <div className="modal-content1" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#dc2626' }}><i className="fas fa-sign-out-alt"></i> Apply for Resignation</h2>
              <button className="close-btn" onClick={() => setShowResignationModal(false)}>x</button>
            </div>
            <form onSubmit={handleResignationSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Requested Last Working Day *</label>
                <input 
                  type="date" 
                  value={resignationData.requested_last_day}
                  onChange={(e) => setResignationData({...resignationData, requested_last_day: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Reason for Resignation *</label>
                <textarea 
                  value={resignationData.reason}
                  onChange={(e) => setResignationData({...resignationData, reason: e.target.value})}
                  required 
                  rows="3"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Additional Note (Optional)</label>
                <textarea 
                  value={resignationData.additional_note}
                  onChange={(e) => setResignationData({...resignationData, additional_note: e.target.value})}
                  rows="2"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowResignationModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={resignationSubmitting} style={{ padding: '8px 16px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}>
                  {resignationSubmitting ? 'Submitting...' : 'Submit Resignation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content1" style={{ width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}><i className="fas fa-file-pdf"></i> Document Preview</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleDownloadPDF} 
                  className="btn-submit" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  <HiOutlineDownload /> Download
                </button>
                <button 
                  onClick={() => setPdfPreviewUrl(null)} 
                  className="close-btn"
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>
            </div>
            <div style={{ flex: 1, width: '100%', background: '#e2e8f0' }}>
              <iframe 
                src={`${pdfPreviewUrl}#toolbar=0`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Modal Overlay */}
      {activeCameraSide && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content1" style={{ maxWidth: '500px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>
              <HiOutlineCamera style={{ display: 'inline', marginRight: '6px' }} />
              Capture {activeCameraSide === 'front' ? 'Front Side' : 'Back Side'} Photo
            </h3>
            <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '2px dashed rgba(255,255,255,0.7)', borderRadius: '6px', pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={stopCamera}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#059669', color: 'white', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <HiOutlineCamera /> Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeePersonalInfo;
