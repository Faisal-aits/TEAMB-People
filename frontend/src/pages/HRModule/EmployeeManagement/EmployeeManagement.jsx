import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Employee.css';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../../services/employeeAPI';
import { usePortalBase } from '../../../contexts/PortalContext';
import BulkUploadModal from '../../../components/EmployeeBulkUpload/BulkUploadModal';
import OfferLetterComponent from './OfferLetter';
import aiDocumentGeneratorAPI from '../../../services/aiDocumentGeneratorAPI';
import brandingAPI from '../../../services/brandingAPI';
import companyLogo from '../../../assets/img/company.png';
import stampPng from '../../../assets/img/stamp.png';
import BrandingValidationModal from '../../../components/BrandingValidationModal';
import { API_BASE_URL, getFileUrl } from '../../../services/api';

const emptyForm = {
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  joining_date: '',
  last_working_date: '',
  position: '',
  employment_type: '',
  address: '',
  emergency_contact: '',
  bank_account_number: '',
  ifsc_code: '',
  pan_number: '',
  aadhar_number: '',
  salary: '',
  salary_basic: '',
  salary_hra: '',
  salary_medical_allowance: '',
  salary_travel_allowance: '',
  salary_other_allowance: '',
  is_active: true,
  department_ids: [],
  is_on_probation: false,
  probation_months: '',
  probation_end_date: '',
  salary_during_probation: '',
  salary_after_probation: ''
};

const API_URL = API_BASE_URL;
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Intern', 'Contract', 'Consultant', 'Temporary'];

const parseAmount = (value) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const calculatePayrollFields = (data) => {
  const salary_basic = parseAmount(data.salary_basic);
  const salary_hra = parseAmount(data.salary_hra);
  const salary_medical_allowance = parseAmount(data.salary_medical_allowance);
  const salary_travel_allowance = parseAmount(data.salary_travel_allowance);
  const salary_other_allowance = parseAmount(data.salary_other_allowance);
  const round = (value) => Math.round(value * 100) / 100;
  const salary_gross = round(salary_basic + salary_hra + salary_medical_allowance + salary_travel_allowance + salary_other_allowance);
  const salary_pf = round(salary_basic * 0.12);
  const salary_esic = salary_gross > 0 && salary_gross <= 21000 ? round(salary_gross * 0.0075) : 0;
  const salary_professional_tax = salary_gross > 10000 ? 200 : 0;
  const salary_lwf = 0;
  const salary_total_deduction = round(salary_pf + salary_esic + salary_professional_tax + salary_lwf);
  const salary_net = round(Math.max(0, salary_gross - salary_total_deduction));
  const employer_pf = round(salary_basic * 0.13);
  const employer_esic = salary_gross > 0 && salary_gross <= 21000 ? round(salary_gross * 0.0325) : 0;

  return {
    salary_gross,
    salary_pf,
    salary_esic,
    salary_professional_tax,
    salary_lwf,
    salary_total_deduction,
    salary_net,
    employer_pf,
    employer_esic
  };
};

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

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const portalBase = usePortalBase();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [editFormData, setEditFormData] = useState(emptyForm);
  const [viewDocumentsModalOpen, setViewDocumentsModalOpen] = useState(false);

  // Admin KYC Documents Management State
  const [adminKycModalOpen, setAdminKycModalOpen] = useState(false);
  const [adminKycDocs, setAdminKycDocs] = useState([]);
  const [adminKycLoading, setAdminKycLoading] = useState(false);
  const [showAdminUploadKycForm, setShowAdminUploadKycForm] = useState(false);
  const [adminKycUploadData, setAdminKycUploadData] = useState({
    document_type: 'aadhar_card',
    title: ''
  });
  const [adminFrontFile, setAdminFrontFile] = useState(null);
  const [adminFrontPreview, setAdminFrontPreview] = useState(null);
  const [adminBackFile, setAdminBackFile] = useState(null);
  const [adminBackPreview, setAdminBackPreview] = useState(null);
  const [adminKycUploading, setAdminKycUploading] = useState(false);

  // Admin Live Camera State
  const [adminActiveCameraSide, setAdminActiveCameraSide] = useState(null);
  const [adminCameraStream, setAdminCameraStream] = useState(null);
  const adminVideoRef = useRef(null);

  const [adminPdfPreviewUrl, setAdminPdfPreviewUrl] = useState(null);
  const [adminPdfPreviewTitle, setAdminPdfPreviewTitle] = useState('Document');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState([]);
  const [aiTemplates, setAiTemplates] = useState([]);
  const [aiDocumentModalOpen, setAiDocumentModalOpen] = useState(false);
  const [selectedAiTemplate, setSelectedAiTemplate] = useState(null);
  const [aiDocumentFormData, setAiDocumentFormData] = useState({});
  const [aiDocumentBranding, setAiDocumentBranding] = useState({
    company_name: '',
    company_address: '',
    company_email: '',
    company_website: '',
    hr_name: '',
    hr_designation: '',
    logo_url: '',
    stamp_url: '',
    signature_url: null
  });
  
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isAiDocumentGenerating, setIsAiDocumentGenerating] = useState(false);
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const aiSlipPreviewRef = useRef(null);
  
  const [companySettings, setCompanySettings] = useState({
    salary_format: 'Monthly',
    probation_months: '3'
  });
  
  const token = localStorage.getItem('token');
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const handleRequestError = useCallback((error, fallbackMessage) => {
    if (error.response?.status === 401) {
      alert('Session expired. Please login again.');
      window.location.assign('/login');
      return;
    }
    alert(error.response?.data?.message || fallbackMessage);
  }, []);

  const loadAdminEmployeeKycDocs = useCallback(async (empId) => {
    try {
      setAdminKycLoading(true);
      const res = await axios.get(`${API_URL}/api/documents/employee/${empId}`, {
        headers: authHeaders
      });
      setAdminKycDocs(res.data.documents || []);
    } catch (err) {
      console.error('Error loading employee documents:', err);
      setAdminKycDocs([]);
    } finally {
      setAdminKycLoading(false);
    }
  }, [authHeaders]);

  const handleOpenAdminKycModal = () => {
    setViewDocumentsModalOpen(false);
    setAdminKycModalOpen(true);
    if (selectedEmployee) {
      const targetId = selectedEmployee.id || selectedEmployee.employee_id;
      loadAdminEmployeeKycDocs(targetId);
    }
  };

  useEffect(() => {
    if (adminKycModalOpen && selectedEmployee) {
      const targetId = selectedEmployee.id || selectedEmployee.employee_id;
      loadAdminEmployeeKycDocs(targetId);
    }
  }, [adminKycModalOpen, selectedEmployee, loadAdminEmployeeKycDocs]);

  const handleAdminDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this KYC document?')) return;
    try {
      await axios.delete(`${API_URL}/api/documents/${docId}`, { headers: authHeaders });
      alert('Document deleted successfully');
      if (selectedEmployee) loadAdminEmployeeKycDocs(selectedEmployee.id || selectedEmployee.employee_id);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    }
  };

  const startAdminCamera = async (side) => {
    setAdminActiveCameraSide(side);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setAdminCameraStream(stream);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please check camera permissions or upload a file.');
      setAdminActiveCameraSide(null);
    }
  };

  const stopAdminCamera = () => {
    if (adminCameraStream) {
      adminCameraStream.getTracks().forEach(track => track.stop());
      setAdminCameraStream(null);
    }
    setAdminActiveCameraSide(null);
  };

  useEffect(() => {
    if (adminActiveCameraSide && adminVideoRef.current && adminCameraStream) {
      adminVideoRef.current.srcObject = adminCameraStream;
    }
  }, [adminActiveCameraSide, adminCameraStream]);

  const captureAdminPhoto = () => {
    if (!adminVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = adminVideoRef.current.videoWidth || 1280;
    canvas.height = adminVideoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(adminVideoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    if (adminActiveCameraSide === 'front') {
      setAdminFrontFile(dataUrl);
      setAdminFrontPreview(dataUrl);
    } else if (adminActiveCameraSide === 'back') {
      setAdminBackFile(dataUrl);
      setAdminBackPreview(dataUrl);
    }
    stopAdminCamera();
  };

  const handleAdminFileChange = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (side === 'front') {
        setAdminFrontFile(file);
        setAdminFrontPreview(file.type.startsWith('image/') ? event.target.result : null);
      } else {
        setAdminBackFile(file);
        setAdminBackPreview(file.type.startsWith('image/') ? event.target.result : null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdminUploadKycSubmit = async (e) => {
    e.preventDefault();
    if (!adminFrontFile) {
      alert('Please upload or capture the Front Side of the document');
      return;
    }
    if (!adminKycUploadData.title.trim()) {
      alert('Please enter a document title');
      return;
    }

    setAdminKycUploading(true);
    try {
      const finalFile = await combineKYCDocuments(adminFrontFile, adminBackFile, adminKycUploadData.title.trim());

      const formData = new FormData();
      formData.append('employee_id', selectedEmployee.id || selectedEmployee.employee_id);
      formData.append('document_type', adminKycUploadData.document_type);
      formData.append('title', adminKycUploadData.title.trim());
      formData.append('file', finalFile);

      const res = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        alert('KYC Document merged and uploaded successfully for employee!');
        setShowAdminUploadKycForm(false);
        setAdminKycUploadData({ document_type: 'aadhar_card', title: '' });
        setAdminFrontFile(null);
        setAdminFrontPreview(null);
        setAdminBackFile(null);
        setAdminBackPreview(null);
        if (selectedEmployee) loadAdminEmployeeKycDocs(selectedEmployee.id || selectedEmployee.employee_id);
      }
    } catch (err) {
      console.error('Error uploading KYC document for employee:', err);
      alert(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setAdminKycUploading(false);
    }
  };

  const triggerFileDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error, falling back to direct link:', err);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', fileName || 'document.pdf');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const loadCompanySettings = useCallback(async () => {
    try {
      const [formatRes, probRes, enableProbRes] = await Promise.all([
        axios.get('/api/settings/salary_format', { headers: authHeaders }),
        axios.get('/api/settings/probation_months', { headers: authHeaders }),
        axios.get('/api/settings/enable_probation', { headers: authHeaders })
      ]);
      setCompanySettings({
        salary_format: formatRes.data?.value || 'Monthly',
        probation_months: probRes.data?.value || '4',
        enable_probation: enableProbRes.data?.value === 'true'
      });
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  }, [authHeaders]);

  // Load departments
  const getInitialFormData = useCallback(() => {
    const defaultDept = departments.find(d => ['bim', 'beam'].includes(String(d.name || '').toLowerCase())) || departments[0];
    return {
      ...emptyForm,
      probation_months: companySettings.probation_months || '',
      department_ids: defaultDept ? [defaultDept.id] : []
    };
  }, [departments, companySettings.probation_months]);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/employees/departments`, {
        headers: authHeaders
      });
      const depts = response.data.departments || [];
      setDepartments(depts);
      const defaultDept = depts.find(d => ['bim', 'beam'].includes(String(d.name || '').toLowerCase())) || depts[0];
      if (defaultDept) {
        setFormData(prev => ({
          ...prev,
          department_ids: prev.department_ids?.length ? prev.department_ids : [defaultDept.id]
        }));
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  }, [authHeaders]);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/employees`, {
        headers: authHeaders
      });
      setEmployees(response.data.employees || []);
      // Reset to first page when data changes
      setCurrentPage(1);
    } catch (error) {
      handleRequestError(error, 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handleRequestError]);

  const loadBranding = useCallback(async () => {
    try {
      const res = await brandingAPI.get();
      if (res.data?.success && res.data?.branding) {
        const b = res.data.branding;
        if (!b.company_name) {
          setIsBrandingModalOpen(true);
        }
        setAiDocumentBranding({
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
  }, []);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadBranding();
    loadCompanySettings();
  }, [loadEmployees, loadDepartments, loadBranding, loadCompanySettings]);

  // Filter employees - FIXED to properly filter out soft-deleted employees
  const filteredEmployees = useMemo(() => {
    let filtered;
    
    // Status Filter
    if (statusFilter === 'active') {
      filtered = employees.filter(employee => {
        const isActive = employee.is_active === true || employee.is_active === 1 || employee.is_active === '1';
        const hasActiveStatus = employee.status === 'active';
        return isActive && hasActiveStatus;
      });
    } else if (statusFilter === 'inactive') {
      filtered = employees.filter(employee => {
        const isInactive = employee.is_active === false || employee.is_active === 0 || employee.is_active === '0';
        const hasInactiveStatus = employee.status === 'inactive';
        return isInactive || hasInactiveStatus;
      });
    } else {
      filtered = employees.filter(employee => {
        const isActive = employee.is_active === true || employee.is_active === 1 || employee.is_active === '1';
        const hasActiveStatus = employee.status === 'active' || !employee.status;
        return isActive && hasActiveStatus;
      });
    }

    // Search Term Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.first_name?.toLowerCase().includes(lowerSearch) ||
        emp.last_name?.toLowerCase().includes(lowerSearch) ||
        emp.email?.toLowerCase().includes(lowerSearch) ||
        emp.employee_id?.toString().toLowerCase().includes(lowerSearch) ||
        emp.phone?.toLowerCase().includes(lowerSearch) ||
        emp.position?.toLowerCase().includes(lowerSearch)
      );
    }
    
    return filtered;
  }, [employees, statusFilter, searchTerm]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Pagination functions
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'department_ids') {
      const options = e.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(parseInt(options[i].value));
        }
      }
      setFormData(prev => ({ ...prev, department_ids: selectedValues }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
        if (name === 'joining_date' && newData.joining_date && companySettings.enable_probation) {
          const months = parseInt(companySettings.probation_months, 10);
          if (!isNaN(months) && months > 0) {
            const d = new Date(newData.joining_date);
            d.setMonth(d.getMonth() + months);
            newData.probation_end_date = d.toISOString().slice(0, 10);
          }
        }
        return newData;
      });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'department_ids') {
      const options = e.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(parseInt(options[i].value));
        }
      }
      setEditFormData(prev => ({ ...prev, department_ids: selectedValues }));
    } else {
      setEditFormData(prev => {
        const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
        if (name === 'joining_date' && newData.joining_date && companySettings.enable_probation) {
          const months = parseInt(companySettings.probation_months, 10);
          if (!isNaN(months) && months > 0) {
            const d = new Date(newData.joining_date);
            d.setMonth(d.getMonth() + months);
            newData.probation_end_date = d.toISOString().slice(0, 10);
          }
        }
        return newData;
      });
    }
  };

  const validateEmployee = (data) => {
    if (!data.employee_id || !data.first_name || !data.last_name || !data.email) {
      alert('Please fill in Employee ID, first name, last name, and email.');
      return false;
    }

    if (companySettings.salary_format === 'Monthly') {
      if (!data.department_ids?.length || !data.position || !data.employment_type || !data.joining_date || data.salary_during_probation === '' || data.salary_after_probation === '') {
        alert('Please fill in Department, Designation, Employment Type, Joining Date, Salary During Probation, and Salary After Probation.');
        return false;
      }
      if (parseAmount(data.salary_during_probation) <= 0 || parseAmount(data.salary_after_probation) <= 0) {
        alert('Salary values must be greater than 0.');
        return false;
      }
    } else {
      if (!data.department_ids?.length || !data.position || !data.employment_type || !data.joining_date || data.salary === '' || data.salary_basic === '') {
        alert('Please fill in Department, Designation, Employment Type, Joining Date, CTC, and Basic.');
        return false;
      }
      if (parseAmount(data.salary) <= 0 || parseAmount(data.salary_basic) <= 0) {
        alert('CTC and Basic must be greater than 0.');
        return false;
      }
    }

    return true;
  };

  const buildPayload = (data) => {
    const isMonthly = companySettings.salary_format === 'Monthly';
    const payloadSalary = isMonthly ? data.salary_after_probation : data.salary;
    const payloadBasic = isMonthly ? data.salary_after_probation : data.salary_basic;

    return {
      employee_id: data.employee_id?.trim() || null,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || '',
      date_of_birth: data.date_of_birth || null,
      joining_date: data.joining_date || null,
      last_working_date: data.last_working_date || null,
      address: data.address || '',
      emergency_contact: data.emergency_contact || '',
      bank_account_number: data.bank_account_number || '',
      ifsc_code: data.ifsc_code || '',
      pan_number: data.pan_number || '',
      aadhar_number: data.aadhar_number || '',
      salary: payloadSalary === '' ? null : Number(payloadSalary),
      salary_basic: payloadBasic === '' ? 0 : Number(payloadBasic),
      salary_hra: data.salary_hra === '' ? 0 : Number(data.salary_hra),
      salary_medical_allowance: data.salary_medical_allowance === '' ? 0 : Number(data.salary_medical_allowance),
      salary_travel_allowance: data.salary_travel_allowance === '' ? 0 : Number(data.salary_travel_allowance),
      salary_other_allowance: data.salary_other_allowance === '' ? 0 : Number(data.salary_other_allowance),
      is_active: data.is_active === true || data.is_active === 'true',
      department_id: data.department_ids?.[0] || null,
      department_ids: data.department_ids || [],
      position: data.position || null,
      employment_type: data.employment_type || null,
      is_on_probation: companySettings.enable_probation,
      probation_end_date: data.probation_end_date || null,
      salary_during_probation: data.salary_during_probation === '' ? null : Number(data.salary_during_probation),
      salary_after_probation: data.salary_after_probation === '' ? null : Number(data.salary_after_probation)
    };
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!validateEmployee(formData)) return;

    try {
      setIsSubmitting(true);
      const response = await axios.post(`${API_URL}/api/employees`, buildPayload(formData), {
        headers: authHeaders
      });
      
      if (response.data.message) {
        alert(response.data.message);
      }
      
      setFormData(getInitialFormData());
      setIsModalOpen(false);
      await loadEmployees();
    } catch (error) {
      handleRequestError(error, 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowResetPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedEmployee(null);
    setShowResetPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (!window.confirm(`Reset password for ${selectedEmployee.first_name} ${selectedEmployee.last_name}?`)) {
      return;
    }

    try {
      setIsResettingPassword(true);
      await employeeAPI.resetPassword(selectedEmployee.employee_id, {
        new_password: newPassword,
      });
      alert('Password reset successfully.');
      setShowResetPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      handleRequestError(error, 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const stopRowClick = (e) => e.stopPropagation();

  const handleEditEmployee = (employee) => {
    const nextForm = {
      employee_id: employee.employee_id || '',
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      date_of_birth: formatDateForInput(employee.date_of_birth),
      joining_date: formatDateForInput(employee.joining_date),
      last_working_date: formatDateForInput(employee.last_working_date),
      address: employee.address || '',
      emergency_contact: employee.emergency_contact || '',
      bank_account_number: employee.bank_account_number || '',
      ifsc_code: employee.ifsc_code || '',
      pan_number: employee.pan_number || '',
      aadhar_number: employee.aadhar_number || '',
      salary: employee.salary ?? '',
      salary_basic: employee.salary_basic ?? '',
      salary_hra: employee.salary_hra ?? '',
      salary_medical_allowance: employee.salary_medical_allowance ?? '',
      salary_travel_allowance: employee.salary_travel_allowance ?? '',
      salary_other_allowance: employee.salary_other_allowance ?? '',
      is_active: Boolean(employee.is_active),
      department_ids: employee.department_ids || (employee.department_id ? [employee.department_id] : []),
      position: employee.position || '',
      employment_type: employee.employment_type || '',
      salary_during_probation: employee.salary_during_probation ?? '',
      salary_after_probation: employee.salary_after_probation ?? '',
      probation_end_date: formatDateForInput(employee.probation_end_date)
    };

    setSelectedEmployee(employee);
    setEditFormData(nextForm);
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !validateEmployee(editFormData)) return;

    const updateId = selectedEmployee.employee_id;
    
    try {
      setIsSubmitting(true);
      await axios.put(`${API_URL}/api/employees/${updateId}`, buildPayload(editFormData), {
        headers: authHeaders
      });
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
      alert('Employee updated successfully.');
    } catch (error) {
      console.error('Update error:', error.response?.data);
      handleRequestError(error, 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCredentials = async (employee) => {
    if (!window.confirm(`Send login credentials email to ${employee.first_name} ${employee.last_name} (${employee.email})?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`${API_URL}/api/employees/${employee.employee_id}/send-credentials`, {}, {
        headers: authHeaders
      });
      // Remove the pending flag from local state so the button disappears immediately
      setEmployees(prev => prev.map(emp =>
        emp.employee_id === employee.employee_id
          ? { ...emp, has_pending_credentials: false }
          : emp
      ));
      alert(`✅ Login credentials sent successfully to ${employee.email}`);
    } catch (error) {
      console.error('Send credentials error:', error.response?.data);
      const msg = error.response?.data?.message || 'Failed to send credentials email';
      alert('❌ ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIXED: Delete employee with proper handling
  const handleDeleteEmployee = async (employee) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
      return;
    }

    const deleteId = employee.employee_id;
    
    try {
      setIsSubmitting(true);
      await axios.delete(`${API_URL}/api/employees/${deleteId}`, {
        headers: authHeaders
      });
      setIsViewModalOpen(false);
      await loadEmployees(); // This will reload and filter out soft-deleted employees
      alert('Employee deleted successfully.');
    } catch (error) {
      console.error('Delete error:', error.response?.data);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        handleRequestError(error, 'Failed to delete employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDocuments = (employee) => {
    setSelectedEmployee(employee);
    setViewDocumentsModalOpen(true);
    loadAiTemplates();
  };

  const loadAiTemplates = async () => {
    try {
      const response = await aiDocumentGeneratorAPI.listTemplates();
      setAiTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to load AI document templates:', error);
      setAiTemplates([]);
    }
  };

  const handleGenerateSalarySlip = () => {
    setViewDocumentsModalOpen(false);
    navigate(`${portalBase}/salary-slip-record`, { 
      state: { employee: selectedEmployee } 
    });
  };

  const handleGenerateResignationRequests = () => {
    setViewDocumentsModalOpen(false);
    navigate(`${portalBase}/resignation-requests`, { 
      state: { employee: selectedEmployee } 
    });
  };

  const handleGenerateExperienceLetter = () => {
    setViewDocumentsModalOpen(false);
    navigate(`${portalBase}/experience-letters`, { 
      state: { employee: selectedEmployee } 
    });
  };

  const handleGenerateIncrementLetter = () => {
    setViewDocumentsModalOpen(false);
    navigate(`${portalBase}/increment-letters`, { 
      state: { employee: selectedEmployee } 
    });
  };

  const handleGenerateEPFDeclaration = () => {
    setViewDocumentsModalOpen(false);
    navigate(`${portalBase}/declaration-form`, { 
      state: { employee: selectedEmployee } 
    });
  };

  const getTemplateFields = (template) => (
    template?.schema_json?.sections || []
  ).flatMap(section => section.fields || []);

  const getEmployeeAutoFillValue = (fieldKey, employee) => {
    const key = String(fieldKey || '').toLowerCase();
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    const aliases = {
      full_name: fullName,
      employee_name: fullName,
      name: fullName,
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      mobile: employee.phone || '',
      contact: employee.phone || employee.emergency_contact || '',
      address: employee.address || '',
      designation: employee.position || '',
      position: employee.position || '',
      department: employee.department_names?.join(', ') || employee.department_name || '',
      joining_date: formatDateForInput(employee.joining_date),
      date_of_joining: formatDateForInput(employee.joining_date),
      salary: employee.salary || '',
      annual_salary: employee.salary || '',
      basic_salary: employee.salary_basic || '',
      hra: employee.salary_hra || '',
      medical: employee.salary_medical_allowance || '',
      conveyance: employee.salary_travel_allowance || '',
      special: employee.salary_other_allowance || '',
      pf: employee.salary_pf || '',
      pt: employee.salary_professional_tax || '',
      tds: '',
      pan_number: employee.pan_number || '',
      aadhar_number: employee.aadhar_number || '',
      bank_account_number: employee.bank_account_number || '',
      ifsc_code: employee.ifsc_code || '',
      issue_date: new Date().toISOString().slice(0, 10),
      date: new Date().toISOString().slice(0, 10),
    };
    return aliases[key] ?? '';
  };

  const openAiTemplate = (template) => {
    const form = {};
    getTemplateFields(template).forEach((field) => {
      form[field.key] = getEmployeeAutoFillValue(field.key, selectedEmployee);
    });
    setSelectedAiTemplate(template);
    setAiDocumentFormData(form);
    setViewDocumentsModalOpen(false);
    setAiDocumentModalOpen(true);
    loadAiDocumentBranding();
  };

  const loadAiDocumentBranding = async () => {
    try {
      const response = await brandingAPI.get();
      const branding = response.data?.branding || {};
      setAiDocumentBranding(prev => ({
        ...prev,
        company_name: branding.company_name || prev.company_name,
        company_address: branding.company_address || prev.company_address,
        company_email: branding.company_email || prev.company_email,
        company_website: branding.company_website || prev.company_website,
        hr_name: branding.hr_name || prev.hr_name,
        hr_designation: branding.hr_designation || prev.hr_designation,
        logo_url: branding.logo_url ? brandingAPI.getImageUrl(branding.logo_url) : prev.logo_url,
        stamp_url: branding.stamp_url ? brandingAPI.getImageUrl(branding.stamp_url) : prev.stamp_url,
        signature_url: branding.signature_url ? brandingAPI.getImageUrl(branding.signature_url) : prev.signature_url
      }));
    } catch (error) {
      console.error('Failed to load AI document branding:', error);
    }
  };

  const handleAiDocumentInputChange = (field, value) => {
    setAiDocumentFormData(prev => ({ ...prev, [field.key]: value }));
  };

  const renderAiDocumentInput = (field) => {
    const value = aiDocumentFormData[field.key] || '';
    const commonProps = {
      name: field.key,
      value,
      required: Boolean(field.required),
      onChange: (e) => handleAiDocumentInputChange(field, e.target.value),
    };

    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows="3" placeholder={field.placeholder || ''} />;
    }
    if (field.type === 'dropdown') {
      return (
        <select {...commonProps}>
          <option value="">Select</option>
          {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    if (field.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={Boolean(aiDocumentFormData[field.key])}
          onChange={(e) => handleAiDocumentInputChange(field, e.target.checked)}
        />
      );
    }
    if (field.type === 'signature') {
      return <input {...commonProps} placeholder="Signature name or signatory" />;
    }
    if (field.type === 'table' || field.type === 'file') {
      return <textarea {...commonProps} rows="3" placeholder={field.placeholder || 'Enter details'} />;
    }
    return (
      <input
        {...commonProps}
        type={field.type === 'number' || field.type === 'date' || field.type === 'email' || field.type === 'tel' ? field.type : 'text'}
        placeholder={field.placeholder || ''}
      />
    );
  };

  const validateAiDocumentForm = () => {
    const missingField = getTemplateFields(selectedAiTemplate).find(
      field => field.required && !String(aiDocumentFormData[field.key] || '').trim()
    );
    if (missingField) {
      alert(`Please fill ${missingField.label}.`);
      return false;
    }
    return true;
  };

  const handleSaveAiDocumentToDashboard = async () => {
    if (!selectedAiTemplate || !selectedEmployee) return;
    if (!validateAiDocumentForm()) return;

    setIsAiDocumentGenerating(true);
    try {
      await aiDocumentGeneratorAPI.recordGeneratedDocument(selectedAiTemplate.id, {
        employee_id: selectedEmployee.employee_id,
        form_data: aiDocumentFormData,
      });
      alert('Document saved to dashboard.');
    } catch (error) {
      console.error('AI document save failed:', error);
      alert(error.response?.data?.message || 'Failed to save AI document.');
    } finally {
      setIsAiDocumentGenerating(false);
    }
  };

  const handleDownloadAiDocument = async () => {
    if (!selectedAiTemplate || !selectedEmployee) return;
    if (!validateAiDocumentForm()) return;

    setIsAiDocumentGenerating(true);
    try {
      const previewNode = aiSlipPreviewRef.current;
      if (!previewNode) throw new Error('Preview is not ready.');

      const canvas = await html2canvas(previewNode, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${selectedAiTemplate.name}_${selectedEmployee.first_name}_${selectedEmployee.last_name}`.replace(/\s+/g, '_') + '.pdf');
    } catch (error) {
      console.error('AI document download failed:', error);
      alert(error.response?.data?.message || 'Failed to download AI document.');
    } finally {
      setIsAiDocumentGenerating(false);
    }
  };

  const getAiValue = (key, fallback = '') => aiDocumentFormData[key] || fallback;

  const formatAiCurrency = (value) => {
    const amount = Number(String(value || '').replace(/[^0-9.-]/g, ''));
    if (!Number.isFinite(amount) || amount === 0) return value ? `₹ ${value}` : '-';
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  };

  const renderAiSalarySlipPreview = () => {
    const fullName = getAiValue('full_name', `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim());
    const designation = getAiValue('designation', selectedEmployee.position || '-');
    const monthYear = getAiValue('month_year', getAiValue('month', 'June 2026'));
    const paymentMode = getAiValue('payment_mode_statement', 'Salary paid by bank transfer:');
    const basicSalary = Number(String(getAiValue('basic_salary', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const hra = Number(String(getAiValue('hra', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const conveyance = Number(String(getAiValue('conveyance', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const medical = Number(String(getAiValue('medical', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const special = Number(String(getAiValue('special', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const pf = Number(String(getAiValue('pf', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const pt = Number(String(getAiValue('pt', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const tds = Number(String(getAiValue('tds', 0)).replace(/[^0-9.-]/g, '')) || 0;
    const totalEarnings = basicSalary + hra + conveyance + medical + special;
    const totalDeductions = pf + pt + tds;
    const netPay = totalEarnings - totalDeductions;

    return (
      <div className="ai-slip-preview-page" ref={aiSlipPreviewRef}>
        <div className="ai-slip-brand-header">
          <img src={aiDocumentBranding.logo_url} alt="Company logo" />
          <div className="ai-slip-brand-contact">
            <div>{aiDocumentBranding.company_website}</div>
            <div>{aiDocumentBranding.company_email}</div>
          </div>
        </div>

        <h2>Employee Salary Slip</h2>
        <div className="ai-slip-info">
          <p><strong>Employee Name:</strong> {fullName || '-'}</p>
          <p><strong>Month & Year:</strong> {monthYear || '-'}</p>
          <p><strong>Designation:</strong> {designation || '-'}</p>
          <p>{paymentMode || 'Salary paid by bank transfer:'}</p>
        </div>

        <table className="ai-slip-table">
          <thead>
            <tr>
              <th>Earnings (₹)</th>
              <th>Amount (₹)</th>
              <th>Deductions (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Basic Salary</td><td>{formatAiCurrency(basicSalary)}</td><td>Provident Fund (PF)</td><td>{formatAiCurrency(pf)}</td></tr>
            <tr><td>House Rent Allowance (HRA)</td><td>{formatAiCurrency(hra)}</td><td>Professional Tax (PT)</td><td>{formatAiCurrency(pt)}</td></tr>
            <tr><td>Conveyance Allowance</td><td>{formatAiCurrency(conveyance)}</td><td>Income Tax (TDS)</td><td>{formatAiCurrency(tds)}</td></tr>
            <tr><td>Medical Allowance</td><td>{formatAiCurrency(medical)}</td><td>Total Deductions</td><td>{formatAiCurrency(totalDeductions)}</td></tr>
            <tr><td>Special Allowance</td><td>{formatAiCurrency(special)}</td><td></td><td></td></tr>
            <tr className="ai-slip-total-row"><td>Total Earnings</td><td>{formatAiCurrency(totalEarnings)}</td><td>Net Pay (Take-home)</td><td>{formatAiCurrency(netPay)}</td></tr>
          </tbody>
        </table>

        <div className="ai-slip-footer">
          <div>
            <div className="ai-slip-sign-line"></div>
            <p>Employee Signature</p>
          </div>
          <div className="ai-slip-hr">
            {aiDocumentBranding.signature_url && <img src={aiDocumentBranding.signature_url} alt="HR signature" className="ai-slip-signature" />}
            {aiDocumentBranding.stamp_url && <img src={aiDocumentBranding.stamp_url} alt="Stamp" className="ai-slip-stamp" />}
            <p><strong>Best Regards,</strong></p>
            <p>{aiDocumentBranding.hr_name}</p>
            <p>{aiDocumentBranding.hr_designation}</p>
            <p><strong>{aiDocumentBranding.company_name}</strong></p>
          </div>
        </div>
        <div className="ai-slip-address-bottom">{aiDocumentBranding.company_address}</div>
      </div>
    );
  };

  const getStatusBadge = (isActive, status) => {
    // Check both is_active and status fields
    const isActuallyActive = (isActive === true || isActive === 1 || isActive === '1') && status !== 'inactive';
    return (
      <span className={`status-badge ${isActuallyActive ? 'status-active' : 'status-inactive'}`}>
        {isActuallyActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    return new Date(dateString).toISOString().slice(0, 10);
  };

  const formatSalary = (salary) => {
    if (salary === null || salary === undefined || salary === '') return '-';
    return Number(salary).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const renderEmployeeForm = (data, onChange, onSubmit, submitText, onCancel) => {
    const payroll = calculatePayrollFields(data);

    return (
    <form onSubmit={onSubmit} className="employee-form">
      <div className="form-section">
        <h3 className="section-title">Basic Information</h3>
        <div className="form-row-four">
          <div className="form-group">
            <label>Employee ID *</label>
            <input
              type="text"
              name="employee_id"
              value={data.employee_id}
              onChange={onChange}
              maxLength="20"
              placeholder="e.g. TEAMB01"
              required
            />
          </div>
          <div className="form-group">
            <label>First Name *</label>
            <input type="text" name="first_name" value={data.first_name} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input type="text" name="last_name" value={data.last_name} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" value={data.email} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" name="phone" value={data.phone} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="form-section">
          <h3 className="section-title">Employment Details</h3>
          <div className="form-row-three">
            <div className="form-group">
              <label>Joining Date *</label>
              <input type="date" name="joining_date" value={data.joining_date} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Last Working Date</label>
              <input type="date" name="last_working_date" value={data.last_working_date} onChange={onChange} />
            </div>
            {companySettings.salary_format !== 'Monthly' && (
              <div className="form-group">
                <label>Yearly CTC *</label>
                <input type="number" name="salary" step="0.01" value={data.salary} onChange={onChange} required />
              </div>
            )}
            <div className="form-group">
              <label>Designation *</label>
              <input type="text" name="position" value={data.position} onChange={onChange} placeholder="e.g., Software Engineer" required />
            </div>
            <div className="form-group">
              <label>Employment Type *</label>
              <select name="employment_type" value={data.employment_type} onChange={onChange} required>
                <option value="">Select type</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="is_active" value={data.is_active ? 'true' : 'false'} onChange={onChange}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {companySettings.enable_probation && (
            <div className="form-row-three" style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>Probation End Date</label>
                <input type="date" name="probation_end_date" value={data.probation_end_date || ''} readOnly disabled />
              </div>
              <div className="form-group">
                <label>Salary During Probation ({companySettings.salary_format === 'Monthly' ? 'Monthly' : 'Yearly'}) *</label>
                <input type="number" name="salary_during_probation" value={data.salary_during_probation || ''} onChange={onChange} required={companySettings.salary_format === 'Monthly'} />
              </div>
              <div className="form-group">
                <label>Salary After Probation ({companySettings.salary_format === 'Monthly' ? 'Monthly' : 'Yearly'}) *</label>
                <input type="number" name="salary_after_probation" value={data.salary_after_probation || ''} onChange={onChange} required={companySettings.salary_format === 'Monthly'} />
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3 className="section-title">Departments</h3>
          <div className="form-row-three">
            <div className="form-group">
              <label>Departments (Multi-select) *</label>
              <select 
                name="department_ids" 
                multiple 
                value={data.department_ids || []} 
                onChange={onChange}
                style={{ height: '100px' }}
                required
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <small>Hold Ctrl/Cmd to select multiple departments</small>
            </div>
          </div>
        </div>

        {companySettings.salary_format !== 'Monthly' && (
          <div className="form-section">
            <h3 className="section-title">Salary Structure</h3>
            <div className="form-row-three">
              <div className="form-group">
                <label>Basic *</label>
                <input type="number" name="salary_basic" step="0.01" value={data.salary_basic} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>HRA</label>
                <input type="number" name="salary_hra" step="0.01" value={data.salary_hra} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Medical Allowance</label>
                <input type="number" name="salary_medical_allowance" step="0.01" value={data.salary_medical_allowance} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Travel Allowance</label>
                <input type="number" name="salary_travel_allowance" step="0.01" value={data.salary_travel_allowance} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Other</label>
                <input type="number" name="salary_other_allowance" step="0.01" value={data.salary_other_allowance} onChange={onChange} />
              </div>
            </div>
            <div className="payroll-summary-grid">
              <div><span>Gross</span><strong>{formatSalary(payroll.salary_gross)}</strong></div>
              <div><span>PF</span><strong>{formatSalary(payroll.salary_pf)}</strong></div>
              <div><span>ESIC</span><strong>{formatSalary(payroll.salary_esic)}</strong></div>
              <div><span>P.Tax</span><strong>{formatSalary(payroll.salary_professional_tax)}</strong></div>
              <div><span>LWF</span><strong>{formatSalary(payroll.salary_lwf)}</strong></div>
              <div><span>Total Deduction</span><strong>{formatSalary(payroll.salary_total_deduction)}</strong></div>
              <div><span>Net Salary</span><strong>{formatSalary(payroll.salary_net)}</strong></div>
              <div><span>Employer PF 13%</span><strong>{formatSalary(payroll.employer_pf)}</strong></div>
              <div><span>Employer ESIC 3.25%</span><strong>{formatSalary(payroll.employer_esic)}</strong></div>
            </div>
          </div>
        )}

      <div className="form-section">
        <h3 className="section-title">Personal Information</h3>
        <div className="form-row-three">
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" name="date_of_birth" value={data.date_of_birth} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={data.address} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Emergency Contact</label>
            <input type="tel" name="emergency_contact" value={data.emergency_contact} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Bank Details</h3>
        <div className="form-row-four">
          <div className="form-group">
            <label>Bank Account Number</label>
            <input type="text" name="bank_account_number" value={data.bank_account_number} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>IFSC Code</label>
            <input type="text" name="ifsc_code" value={data.ifsc_code} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>PAN Number</label>
            <input type="text" name="pan_number" value={data.pan_number} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Aadhar Number</label>
            <input type="text" name="aadhar_number" value={data.aadhar_number} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitText}
        </button>
      </div>
    </form>
    );
  };

  if (loading) {
    return (
      <div className="employee-section">
        <div className="loading-container">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="employee-section">
      <BrandingValidationModal isOpen={isBrandingModalOpen} onClose={() => setIsBrandingModalOpen(false)} />
      <div className="employee-title-block employee-page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Employee Management</h2>
          {activeTab === 'employees' && <p>{filteredEmployees.length} employees in directory</p>}
        </div>
        <div className="employee-tabs">
           <button
             className={`employee-tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
             onClick={() => setActiveTab('employees')}
           >
             <i className="fas fa-users"></i> Employees
           </button>
           <button
             className={`employee-tab-btn ${activeTab === 'offerLetters' ? 'active' : ''}`}
             onClick={() => setActiveTab('offerLetters')}
           >
             <i className="fas fa-envelope-open-text"></i> Offer Letters
           </button>
        </div>
      </div>

      {activeTab === 'offerLetters' ? (
        <OfferLetterComponent companySettings={companySettings} onEmployeeConverted={() => {
          loadEmployees();
          setActiveTab('employees');
        }} />
      ) : (
      <>
      <div className="employee-table-container glass-form">
        <div className="table-header employee-management-header">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="Search by name, email, ID..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          <select className="filter-btn" value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1); // Reset to first page on filter change
          }}>
            <option value="">All Employees</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="add-employee-btn" onClick={() => { 
            setFormData(getInitialFormData()); 
            setIsModalOpen(true); 
          }}>
            <i className="fas fa-plus"></i> Add Employee
          </button>
          <button className="import-btn" onClick={() => setIsBulkUploadModalOpen(true)}>
            <i className="fas fa-cloud-upload-alt"></i> Bulk Upload
          </button>
        </div>

        <div className="table-wrapper">
          {currentEmployees.length === 0 ? (
            <div className="no-employees">
              <div className="no-data-icon">
                <i className="fas fa-users"></i>
              </div>
              <div>No employees found.</div>
              <p className="no-data-subtext">Add employees manually, via bulk upload, or convert from Offer Letters.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="add-first-btn" onClick={() => { 
                  setFormData(getInitialFormData()); 
                  setIsModalOpen(true); 
                }} style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
                  <i className="fas fa-plus"></i> Add Employee
                </button>
                <button className="add-first-btn" onClick={() => setIsBulkUploadModalOpen(true)}>
                  <i className="fas fa-cloud-upload-alt"></i> Bulk Upload
                </button>
              </div>
            </div>
          ) : (
            <>
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee Id</th>
                    <th>Employee Name</th>
                    <th>Contact</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.map(employee => (
                    <tr
                      key={employee.employee_id}
                      className="employee-row-clickable"
                      onClick={() => handleViewEmployee(employee)}
                    >
                      <td>{employee.employee_id}</td>
                      <td>
                        <span className="employee-name">{employee.first_name} {employee.last_name}</span>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span className="employee-email">{employee.email}</span>
                          <span className="employee-phone" style={{ color: 'var(--theme-text-subtle)' }}>{employee.phone || '-'}</span>
                        </div>
                      </td>
                      <td>{employee.department_names?.join(', ') || '-'}</td>
                      <td className="position-cell">{employee.position || '-'}</td>
                      <td className="actions-cell" onClick={stopRowClick}>

                        <button
                          type="button"
                          className="viewedit-btn"
                          onClick={() => handleEditEmployee(employee)}
                          title="Edit Employee"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          className="viewdocuments-btn"
                          onClick={() => handleViewDocuments(employee)}
                          title="Generate Documents"
                        >
                          <i className="fas fa-file-alt"></i>
                        </button>
                        <button
                          type="button"
                          className="deletebtn"
                          onClick={() => handleDeleteEmployee(employee)}
                          disabled={isSubmitting}
                          title="Delete Employee"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={goToPrevPage} 
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {getPageNumbers().map(number => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
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
              )}
              
             
            </>
          )}
        </div>
      </div>

      {/* Rest of your modals remain the same */}
      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content1 large-modal">
            <div className="modal-header">
              <h2><i className="fas fa-user-plus"></i> Add Employee</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>x</button>
            </div>
            {renderEmployeeForm(formData, handleInputChange, handleCreateEmployee, 'Create Employee', () => setIsModalOpen(false))}
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {isViewModalOpen && selectedEmployee && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content1 view-employee-modal" onClick={stopRowClick}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-user"></i> Employee Details
              </h2>
              <button type="button" className="close-btn" onClick={closeViewModal}>x</button>
            </div>

            <div className="view-employee-body">
              <div className="view-employee-hero">
                <div className="view-employee-avatar">
                  {(selectedEmployee.first_name?.[0] || '') + (selectedEmployee.last_name?.[0] || '')}
                </div>
                <div>
                  <h3 className="view-employee-name">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <p className="view-employee-id">ID: {selectedEmployee.employee_id}</p>
                  {getStatusBadge(selectedEmployee.is_active, selectedEmployee.status)}
                </div>
              </div>

              <div className="view-details-grid">
                <div className="view-detail-section">
                  <h4>Contact</h4>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Email</span>
                    <span className="view-detail-value">{selectedEmployee.email || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Phone</span>
                    <span className="view-detail-value">{selectedEmployee.phone || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Emergency Contact</span>
                    <span className="view-detail-value">{selectedEmployee.emergency_contact || '-'}</span>
                  </div>
                </div>

                <div className="view-detail-section">
                  <h4>Employment</h4>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Department</span>
                    <span className="view-detail-value">
                      {selectedEmployee.department_names?.join(', ') || selectedEmployee.department_name || '-'}
                    </span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Position</span>
                    <span className="view-detail-value">{selectedEmployee.position || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Employment Type</span>
                    <span className="view-detail-value">{selectedEmployee.employment_type || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Joining Date</span>
                    <span className="view-detail-value">{formatDate(selectedEmployee.joining_date)}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Last Working Date</span>
                    <span className="view-detail-value">{formatDate(selectedEmployee.last_working_date)}</span>
                  </div>
                  {companySettings.enable_probation && selectedEmployee.probation_end_date && (
                    <div className="view-detail-row">
                      <span className="view-detail-label">Probation End Date</span>
                      <span className="view-detail-value">{formatDate(selectedEmployee.probation_end_date)}</span>
                    </div>
                  )}
                  {companySettings.salary_format === 'Monthly' ? (
                    companySettings.enable_probation ? (
                      <>
                        <div className="view-detail-row">
                          <span className="view-detail-label">Salary During Probation</span>
                          <span className="view-detail-value">{formatSalary(selectedEmployee.salary_during_probation)}</span>
                        </div>
                        <div className="view-detail-row">
                          <span className="view-detail-label">Salary After Probation</span>
                          <span className="view-detail-value">{formatSalary(selectedEmployee.salary_after_probation)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="view-detail-row">
                        <span className="view-detail-label">Monthly Salary</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary || selectedEmployee.salary_after_probation)}</span>
                      </div>
                    )
                  ) : (
                    <div className="view-detail-row">
                      <span className="view-detail-label">CTC</span>
                      <span className="view-detail-value">{formatSalary(selectedEmployee.salary)}</span>
                    </div>
                  )}
                </div>

                {companySettings.salary_format !== 'Monthly' && (
                  <>
                    <div className="view-detail-section">
                      <h4>Salary Structure</h4>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Basic</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_basic)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">HRA</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_hra)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Medical Allowance</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_medical_allowance)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Travel Allowance</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_travel_allowance)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Other</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_other_allowance)}</span>
                      </div>
                    </div>

                    <div className="view-detail-section">
                      <h4>Payroll Calculation</h4>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Gross</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_gross)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">PF</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_pf)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">ESIC</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_esic)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">P.Tax</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_professional_tax)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">LWF</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_lwf)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Total Deduction</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_total_deduction)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Net Salary</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.salary_net)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Employer PF 13%</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.employer_pf)}</span>
                      </div>
                      <div className="view-detail-row">
                        <span className="view-detail-label">Employer ESIC 3.25%</span>
                        <span className="view-detail-value">{formatSalary(selectedEmployee.employer_esic)}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="view-detail-section">
                  <h4>Personal</h4>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Date of Birth</span>
                    <span className="view-detail-value">{formatDate(selectedEmployee.date_of_birth)}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Address</span>
                    <span className="view-detail-value">{selectedEmployee.address || '-'}</span>
                  </div>
                </div>

                <div className="view-detail-section">
                  <h4>Bank & Tax</h4>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Account Number</span>
                    <span className="view-detail-value">{selectedEmployee.bank_account_number || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">IFSC</span>
                    <span className="view-detail-value">{selectedEmployee.ifsc_code || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">PAN</span>
                    <span className="view-detail-value">{selectedEmployee.pan_number || '-'}</span>
                  </div>
                  <div className="view-detail-row">
                    <span className="view-detail-label">Aadhar</span>
                    <span className="view-detail-value">{selectedEmployee.aadhar_number || '-'}</span>
                  </div>
                </div>
              </div>

              {showResetPasswordForm && (
                <form className="reset-password-form" onSubmit={handleResetPassword}>
                  <h4>Set New Password</h4>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="reset-password-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowResetPasswordForm(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={isResettingPassword}>
                      {isResettingPassword ? 'Resetting...' : 'Confirm Reset'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="view-employee-footer">
              <button
                type="button"
                className="reset-password-btn"
                onClick={() => setShowResetPasswordForm((prev) => !prev)}
              >
                <i className="fas fa-key"></i>
                {showResetPasswordForm ? 'Hide Reset Password' : 'Reset Password'}
              </button>
              <button
                type="button"
                className="viewdocuments-btn footer-btn"
                onClick={() => {
                  closeViewModal();
                  handleViewDocuments(selectedEmployee);
                }}
              >
                <i className="fas fa-file-alt"></i> Documents
              </button>
              <button
                type="button"
                className="viewedit-btn footer-btn"
                onClick={() => handleEditEmployee(selectedEmployee)}
              >
                <i className="fas fa-edit"></i> Edit
              </button>
              <button type="button" className="cancel-btn" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {isEditModalOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content1 large-modal">
            <div className="modal-header">
              <h2><i className="fas fa-user-edit"></i> Edit Employee</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>x</button>
            </div>
            {renderEmployeeForm(editFormData, handleEditInputChange, handleUpdateEmployee, 'Update Employee', () => setIsEditModalOpen(false))}
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {viewDocumentsModalOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content1 documents-modal">
            <div className="modal-header">
              <h2><i className="fas fa-file-alt"></i> Generate Documents</h2>
              <h3 className="employee-name-header">
                For: {selectedEmployee.first_name} {selectedEmployee.last_name}
              </h3>
              <button className="close-btn" onClick={() => setViewDocumentsModalOpen(false)}>x</button>
            </div>
            
            <div className="documents-grid">
              <div className="document-card" onClick={handleGenerateSalarySlip}>
                <div className="document-icon salary">
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <div className="document-info">
                  <h3>Salary Slip Record</h3>
                  <p>View generated monthly salary slips</p>
                </div>
                <div className="document-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="document-card" onClick={handleGenerateResignationRequests}>
                <div className="document-icon resignation">
                  <i className="fas fa-door-open"></i>
                </div>
                <div className="document-info">
                  <h3>Resignation</h3>
                  <p>Process resignation and exit</p>
                </div>
                <div className="document-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="document-card" onClick={handleGenerateExperienceLetter}>
                <div className="document-icon experience">
                  <i className="fas fa-award"></i>
                </div>
                <div className="document-info">
                  <h3>Experience Letter</h3>
                  <p>Generate experience certificate</p>
                </div>
                <div className="document-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="document-card" onClick={handleGenerateIncrementLetter}>
                <div className="document-icon increment">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="document-info">
                  <h3>Increment Letter</h3>
                  <p>Generate salary increment letter</p>
                </div>
                <div className="document-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="document-card" onClick={handleGenerateEPFDeclaration}>
                <div className="document-icon epf">
                  <i className="fas fa-file-contract"></i>
                </div>
                <div className="document-info">
                  <h3>EPF Declaration Form</h3>
                  <p>Generate EPF declaration</p>
                </div>
                <div className="document-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              <div className="document-card" onClick={handleOpenAdminKycModal}>
                <div className="document-icon kyc" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <i className="fas fa-id-card"></i>
                </div>
                <div className="document-info">
                  <h3>KYC & Profile Documents</h3>
                  <p>View, upload & manage employee KYC documents</p>
                </div>
                <div className="document-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>

              {aiTemplates.map(template => (
                <div className="document-card" key={template.id} onClick={() => openAiTemplate(template)}>
                  <div className="document-icon offer">
                    <i className="fas fa-wand-magic-sparkles"></i>
                  </div>
                  <div className="document-info">
                    <h3>{template.name}</h3>
                    <p>AI generated {template.document_type || 'document'} template</p>
                  </div>
                  <div className="document-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" className="cancel-btn" onClick={() => setViewDocumentsModalOpen(false)}>
                <i className="fas fa-times"></i> Close
              </button>
            </div>
          </div>
        </div>
        )}

      {aiDocumentModalOpen && selectedAiTemplate && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content1 ai-document-generate-modal">
            <div className="modal-header">
              <h2><i className="fas fa-wand-magic-sparkles"></i> {selectedAiTemplate.name}</h2>
              <h3 className="employee-name-header">
                For: {selectedEmployee.first_name} {selectedEmployee.last_name}
              </h3>
              <button
                className="close-btn"
                onClick={() => {
                  setAiDocumentModalOpen(false);
                  setSelectedAiTemplate(null);
                }}
              >
                &times;
              </button>
            </div>

            <div className="ai-document-generator-split">
              <div className="ai-document-form-panel">
                <form className="employee-form">
                  {(selectedAiTemplate.schema_json?.sections || []).map((section, sectionIndex) => (
                    <div className="form-section" key={`${section.section_title}-${sectionIndex}`}>
                      <h3 className="section-title">{section.section_title}</h3>
                      <div className="ai-document-form-grid">
                        {(section.fields || []).map((field) => (
                          <div className="form-group" key={field.key}>
                            <label>
                              {field.label}
                              {field.required ? ' *' : ''}
                            </label>
                            {renderAiDocumentInput(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setAiDocumentModalOpen(false);
                        setSelectedAiTemplate(null);
                      }}
                      disabled={isAiDocumentGenerating}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <div className="ai-document-preview-panel">
                <div className="ai-document-preview-actions">
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={handleSaveAiDocumentToDashboard}
                    disabled={isAiDocumentGenerating}
                  >
                    <i className="fas fa-save"></i>
                    {isAiDocumentGenerating ? 'Saving...' : 'Save to Dashboard'}
                  </button>
                  <button
                    type="button"
                    className="submit-btn download-action"
                    onClick={handleDownloadAiDocument}
                    disabled={isAiDocumentGenerating}
                  >
                    <i className="fas fa-download"></i>
                    {isAiDocumentGenerating ? 'Processing...' : 'Download PDF'}
                  </button>
                </div>
                {renderAiSalarySlipPreview()}
              </div>
            </div>
          </div>
        </div>
      )}

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUploadComplete={loadEmployees}
        departments={departments}
      />

      {/* Admin KYC Documents Modal */}
      {adminKycModalOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content1 documents-modal" style={{ maxWidth: '750px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2><i className="fas fa-id-card"></i> KYC & Profile Documents</h2>
                <h3 className="employee-name-header" style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  For: {selectedEmployee.first_name} {selectedEmployee.last_name} ({selectedEmployee.employee_id || 'ID#'})
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowAdminUploadKycForm(!showAdminUploadKycForm)}
                  style={{ padding: '6px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >
                  {showAdminUploadKycForm ? 'View Documents' : '+ Upload KYC Document'}
                </button>
                <button className="close-btn" onClick={() => setAdminKycModalOpen(false)}>×</button>
              </div>
            </div>

            {showAdminUploadKycForm ? (
              <form onSubmit={handleAdminUploadKycSubmit} style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Upload & Combine KYC Document for Employee</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500', color: '#475569' }}>Document Type *</label>
                  <select
                    value={adminKycUploadData.document_type}
                    onChange={(e) => setAdminKycUploadData({ ...adminKycUploadData, document_type: e.target.value })}
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
                    value={adminKycUploadData.title}
                    onChange={(e) => setAdminKycUploadData({ ...adminKycUploadData, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    required
                  />
                </div>

                {/* Dual Upload Section: Front & Back */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  {/* Front Side */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>Front Side *</h4>
                    {adminFrontPreview ? (
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <img src={adminFrontPreview} alt="Front Preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                        <button
                          type="button"
                          onClick={() => { setAdminFrontFile(null); setAdminFrontPreview(null); }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : adminFrontFile ? (
                      <div style={{ padding: '10px', fontSize: '13px', color: '#166534', fontWeight: '500' }}>PDF File Selected</div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Upload file or capture photo</div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        File
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleAdminFileChange(e, 'front')} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => startAdminCamera('front')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Camera
                      </button>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div style={{ border: '1px dashed #cbd5e1', padding: '15px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155' }}>Back Side (Optional)</h4>
                    {adminBackPreview ? (
                      <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <img src={adminBackPreview} alt="Back Preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                        <button
                          type="button"
                          onClick={() => { setAdminBackFile(null); setAdminBackPreview(null); }}
                          style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : adminBackFile ? (
                      <div style={{ padding: '10px', fontSize: '13px', color: '#166534', fontWeight: '500' }}>PDF File Selected</div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Upload file or capture photo</div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                        File
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleAdminFileChange(e, 'back')} style={{ display: 'none' }} />
                      </label>
                      <button
                        type="button"
                        onClick={() => startAdminCamera('back')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Camera
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdminUploadKycForm(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminKycUploading}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                  >
                    {adminKycUploading ? 'Combining & Uploading...' : 'Combine & Upload Document'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="documents-grid" style={{ padding: '20px' }}>
                {adminKycLoading ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#64748b' }}>
                    Loading employee documents...
                  </div>
                ) : adminKycDocs.filter(d => !['increment_letter', 'offer_letter', 'experience_letter', 'resignation_letter', 'resignation', 'salary_slip', 'epf_declaration'].includes(d.document_type)).length > 0 ? (
                  adminKycDocs
                    .filter(d => !['increment_letter', 'offer_letter', 'experience_letter', 'resignation_letter', 'resignation', 'salary_slip', 'epf_declaration'].includes(d.document_type))
                    .map(doc => (
                      <div className="document-card" key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => { setAdminPdfPreviewTitle(doc.title); setAdminPdfPreviewUrl(getFileUrl(doc.file_url)); }}>
                          <div className="document-icon">
                            <i className="fas fa-file-pdf"></i>
                          </div>
                          <div className="document-info">
                            <h3 style={{ textTransform: 'capitalize', margin: 0, fontSize: '14px' }}>{doc.document_type.replace('_', ' ')}</h3>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{doc.title} - {new Date(doc.generated_at || doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => { setAdminPdfPreviewTitle(doc.title); setAdminPdfPreviewUrl(getFileUrl(doc.file_url)); }}
                            style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            title="View Document"
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(getFileUrl(doc.file_url), `${doc.title || doc.document_type}.pdf`)}
                            style={{ padding: '6px 10px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            title="Download Document"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminDeleteDoc(doc.id)}
                            style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            title="Delete Document"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="no-documents-msg" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                     <p>No KYC or Profile documents uploaded for this employee yet.</p>
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer" style={{ padding: '0 20px 20px' }}>
              <button className="cancel-btn footer-btn" onClick={() => setAdminKycModalOpen(false)} style={{ marginLeft: 'auto' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Live Camera Modal Overlay */}
      {adminActiveCameraSide && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content1" style={{ maxWidth: '500px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>
              Capture {adminActiveCameraSide === 'front' ? 'Front Side' : 'Back Side'} Photo
            </h3>
            <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '15px' }}>
              <video ref={adminVideoRef} autoPlay playsInline style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '2px dashed rgba(255,255,255,0.7)', borderRadius: '6px', pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={stopAdminCamera}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureAdminPhoto}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#059669', color: 'white', cursor: 'pointer', fontWeight: '600' }}
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin PDF Preview Modal */}
      {adminPdfPreviewUrl && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content1" style={{ width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}><i className="fas fa-file-pdf"></i> {adminPdfPreviewTitle || 'Document Preview'}</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => triggerFileDownload(adminPdfPreviewUrl, `${(adminPdfPreviewTitle || 'document').replace(/\s+/g, '_')}.pdf`)} 
                  className="btn-submit" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  <i className="fas fa-download"></i> Download
                </button>
                <button 
                  onClick={() => setAdminPdfPreviewUrl(null)} 
                  className="close-btn"
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>
            </div>
            <div style={{ flex: 1, width: '100%', background: '#e2e8f0' }}>
              <iframe 
                src={`${adminPdfPreviewUrl}#toolbar=0`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default EmployeeManagement;
