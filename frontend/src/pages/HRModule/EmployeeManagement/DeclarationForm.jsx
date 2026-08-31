import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../../services/employeeAPI';
import companyLogo from "../../../assets/img/company.png";
import stampPng from "../../../assets/img/stamp.png";
import { useLocation } from "react-router-dom";
import { 
  HiOutlineArrowDownTray,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineEnvelope,
  HiOutlineArrowLeft
} from "react-icons/hi2";
import './DeclarationForm.css';
import pfDeclarationPDFService from '../../../services/pfDeclarationPDFService';
import brandingAPI from '../../../services/brandingAPI';
import declarationFormAPI from '../../../services/declarationFormAPI';
import BrandingValidationModal from '../../../components/BrandingValidationModal';

const getEmployeeSelectId = (employee) => employee?.employee_id || employee?.id || employee?.user_id || "";
const getEmployeeName = (employee) => {
  const fullName = `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();
  return fullName || employee?.name || employee?.employee_name || employee?.email || "Unnamed Employee";
};

const DeclarationForm = ({ initialEmployee = null, onBack = null }) => {
  const location = useLocation();
  const routedEmployee = initialEmployee || location.state?.employee || null;
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedForms, setSavedForms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const companyId = localStorage.getItem('companyId') || '1';

  const [formData, setFormData] = useState({
    nameOfMember: "",
    fatherName: "",
    spouseName: "",
    selectedRelation: "father",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    emailId: "",
    mobileNo: "",
    wasEPFMember: "",
    wasEPSMember: "",
    previousUAN: "",
    previousPFAccount: "",
    previousExitDate: "",
    schemeCertificateNo: "",
    ppoNo: "",
    isInternationalWorker: "",
    countryOfOrigin: "India",
    otherCountry: "",
    passportNo: "",
    passportValidFrom: "",
    passportValidTo: "",
    bankAccountNo: "",
    ifscCode: "",
    aadharNumber: "",
    panNumber: "",
    undertakingDate: new Date().toISOString().split('T')[0],
    undertakingPlace: "",
    memberSalutation: "Mr.",
    joiningDate: "",
    pfNumber: "",
    uanNumber: "",
    kycStatus: "",
    transferRequestGenerated: "",
    employerDate: new Date().toISOString().split('T')[0]
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

  const currentEmployeeName = routedEmployee ? getEmployeeName(routedEmployee) : null;

  // Helper function to get numeric employee ID
  const getNumericEmployeeId = (employee) => {
    if (!employee) return null;
    // Try to get numeric ID from various possible fields
    return employee.id || employee.employee_id_numeric || 
           (typeof employee.employee_id === 'number' ? employee.employee_id : null) ||
           (typeof employee.user_id === 'number' ? employee.user_id : null);
  };

  // Auto-populate form when routedEmployee is available
  useEffect(() => {
    if (routedEmployee && routedEmployee.employee_id) {
     
      
      // Get numeric ID for saving
      const numericId = getNumericEmployeeId(routedEmployee) || routedEmployee.id;
    
      
      setSelectedEmployeeId(numericId || "");
      setFormData(prev => ({
        ...prev,
        nameOfMember: `${routedEmployee.first_name || ''} ${routedEmployee.last_name || ''}`.trim(),
        emailId: routedEmployee.email || "",
        mobileNo: routedEmployee.phone || "",
        dateOfBirth: routedEmployee.date_of_birth || "",
        gender: routedEmployee.gender || "",
        maritalStatus: routedEmployee.marital_status || "",
        fatherName: routedEmployee.father_name || "",
        aadharNumber: routedEmployee.aadhar_number || routedEmployee.aadharNumber || "",
        panNumber: routedEmployee.pan_number || routedEmployee.panNumber || "",
      }));
    }
  }, [routedEmployee]);

  // When modal opens, ensure form is populated with routed employee
  useEffect(() => {
    if (showModal && routedEmployee && routedEmployee.employee_id && !selectedEmployeeId) {
      const numericId = getNumericEmployeeId(routedEmployee) || routedEmployee.id;
      setSelectedEmployeeId(numericId || "");
      setFormData(prev => ({
        ...prev,
        nameOfMember: `${routedEmployee.first_name || ''} ${routedEmployee.last_name || ''}`.trim(),
        emailId: routedEmployee.email || "",
        mobileNo: routedEmployee.phone || "",
        dateOfBirth: routedEmployee.date_of_birth || "",
        gender: routedEmployee.gender || "",
        maritalStatus: routedEmployee.marital_status || "",
        fatherName: routedEmployee.father_name || "",  
        aadharNumber: routedEmployee.aadhar_number || routedEmployee.aadharNumber || "",
        panNumber: routedEmployee.pan_number || routedEmployee.panNumber || "",
      }));
    }
  }, [showModal, routedEmployee, selectedEmployeeId]);

  // Function to load all forms for the company
  const loadForms = async () => {
    try {
     
      const response = await declarationFormAPI.getAll(companyId);
     
      
      // Check different response structures
      let forms = [];
      if (response.data?.data) {
        forms = response.data.data;
      } else if (response.data?.forms) {
        forms = response.data.forms;
      } else if (Array.isArray(response.data)) {
        forms = response.data;
      } else if (response.data) {
        forms = [response.data];
      }
     
      setSavedForms(forms);
      return forms;
    } catch (err) {
      console.error("Error loading forms:", err);
      setSavedForms([]);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [employeesRes, brandingRes] = await Promise.all([
          employeeAPI.getAll(),
          brandingAPI.get(),
        ]);
        
        const employeesList = employeesRes.data.employees || employeesRes.data.data || [];
      
        setEmployees(employeesList);
        
        if (brandingRes.data?.success && brandingRes.data?.branding) {
          const b = brandingRes.data.branding;
          if (!b.company_name) {
            setIsBrandingModalOpen(true);
          }
          setBranding(prev => ({
            ...prev,
            company_name: b.company_name || "",
            company_address: b.company_address || "",
            company_email: b.company_email || "",
            company_website: b.company_website || "",
            hr_name: b.hr_name || "",
            hr_designation: b.hr_designation || "",
            logo_url: b.logo_url ? brandingAPI.getImageUrl(b.logo_url) : "",
            stamp_url: b.stamp_url ? brandingAPI.getImageUrl(b.stamp_url) : ""
          }));
        } else {
          setIsBrandingModalOpen(true);
        }
        
        // Load forms
        await loadForms();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getEmployeeId = (emp) => {
    // Return numeric ID for saving
    return emp.id || emp.employee_id_numeric || 
           (typeof emp.employee_id === 'number' ? emp.employee_id : null) ||
           (typeof emp.user_id === 'number' ? emp.user_id : null);
  };

  const handleEmployeeSelect = (employeeId) => {
    const match = employees.find(emp => {
      const empId = emp.id || emp.employee_id;
      return String(empId) === String(employeeId);
    });
    
    if (match) {
      const numericId = getEmployeeId(match);
    
      setSelectedEmployeeId(numericId || "");
      setFormData(prev => ({
        ...prev,
        nameOfMember: `${match.first_name} ${match.last_name}`.trim(),
        emailId: match.email || "",
        mobileNo: match.phone || "",
        dateOfBirth: match.date_of_birth || "",
        gender: match.gender || "",
        maritalStatus: match.marital_status || "",
        fatherName: match.father_name || "",
        aadharNumber: match.aadhar_number || match.aadharNumber || "",
        panNumber: match.pan_number || match.panNumber || "",
      }));
    }
  };

  const validateForm = () => {
    if (!formData.nameOfMember.trim()) return "Name of member is required";
    if (!formData.dateOfBirth) return "Date of birth is required";
    if (!formData.emailId.trim()) return "Email ID is required";
    if (!formData.mobileNo.trim()) return "Mobile number is required";
    if (!formData.aadharNumber.trim()) return "Aadhar number is required";
    if (formData.aadharNumber.length !== 12) return "Aadhar number must be 12 digits";
    if (formData.panNumber && formData.panNumber.length !== 10) return "PAN number must be 10 characters";
    return null;
  };

  const handleSave = async () => {
    if (!selectedEmployeeId) {
      alert("Please select an employee");
      return;
    }

    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    setIsGenerating(true);
    try {
      const saveData = {
        employee_id: parseInt(selectedEmployeeId), // Ensure it's a number
        company_id: parseInt(companyId),
        form_data: formData,
        issue_date: new Date().toISOString().split('T')[0]
      };
      
      
      let response;
      if (editingForm) {
       
        alert("Form updated successfully!");
      } else {
        response = await declarationFormAPI.save(saveData);
     
        alert("Form saved successfully!");
      }
      
      // Reload forms after save
      await loadForms();
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving:", err);
      console.error("Error response:", err.response);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save";
      alert(`Failed to save: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // View PDF - opens in new tab
  const handleViewPDF = async (formDataToView) => {
    setIsGenerating(true);
    try {
      const pdfBlob = await pfDeclarationPDFService.generatePDFBlob({ ...formDataToView, branding });
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF
  const handleDownload = async (formDataToDownload) => {
    setIsGenerating(true);
    try {
      await pfDeclarationPDFService.downloadPFDeclaration({ ...formDataToDownload, branding });
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    const numericId = routedEmployee ? (getNumericEmployeeId(routedEmployee) || routedEmployee.id) : null;
    
    setFormData({
      nameOfMember: routedEmployee ? `${routedEmployee.first_name || ''} ${routedEmployee.last_name || ''}`.trim() : "",
      fatherName: routedEmployee?.father_name || "",
      spouseName: "",
      selectedRelation: "father",
      dateOfBirth: routedEmployee?.date_of_birth || "",
      gender: routedEmployee?.gender || "",
      maritalStatus: routedEmployee?.marital_status || "",
      emailId: routedEmployee?.email || "",
      mobileNo: routedEmployee?.phone || "",
      wasEPFMember: "",
      wasEPSMember: "",
      previousUAN: "",
      previousPFAccount: "",
      previousExitDate: "",
      schemeCertificateNo: "",
      ppoNo: "",
      isInternationalWorker: "",
      countryOfOrigin: "India",
      otherCountry: "",
      passportNo: "",
      passportValidFrom: "",
      passportValidTo: "",
      bankAccountNo: "",
      ifscCode: "",
      aadharNumber: routedEmployee?.aadhar_number || routedEmployee?.aadharNumber || "",
      panNumber: routedEmployee?.pan_number || routedEmployee?.panNumber || "",
      undertakingDate: new Date().toISOString().split('T')[0],
      undertakingPlace: "",
      memberSalutation: "Mr.",
      joiningDate: "",
      pfNumber: "",
      uanNumber: "",
      kycStatus: "",
      transferRequestGenerated: "",
      employerDate: new Date().toISOString().split('T')[0]
    });
    setSelectedEmployeeId(numericId || "");
    setEditingForm(null);
  };

  const handleEdit = (form) => {
    setFormData(form.form_data);
    setSelectedEmployeeId(form.employee_id);
    setEditingForm(form);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await declarationFormAPI.delete(id);
        await loadForms();
        alert('Deleted successfully');
      } catch (err) {
        console.error("Error deleting:", err);
        alert('Failed to delete: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Filter forms for the routed employee - compare using numeric ID
  const filteredForms = routedEmployee && routedEmployee.employee_id
    ? savedForms.filter(form => {
        // Get the numeric ID of the routed employee
        const routedNumericId = getNumericEmployeeId(routedEmployee) || routedEmployee.id;
        const formEmployeeId = form.employee_id;
   
        // Compare as numbers
        const match = Number(formEmployeeId) === Number(routedNumericId);
        return match;
      })
    : savedForms;

 
  return (
    <div className="declaration-container" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <BrandingValidationModal isOpen={isBrandingModalOpen} onClose={() => setIsBrandingModalOpen(false)} />
      {/* Header with Back Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {onBack && (
            <button 
              onClick={onBack}
              style={{ 
                background: "#f1f5f9", 
                border: "none", 
                borderRadius: "8px", 
                padding: "8px", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <HiOutlineArrowLeft size={20} />
            </button>
          )}
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <HiOutlineDocumentText size={28} color="#4f46e5" />
            EPF Form 11 (Revised)
            {currentEmployeeName && (
              <span style={{ fontSize: "18px", color: "#64748b", fontWeight: "normal" }}>
                - {currentEmployeeName}
              </span>
            )}
          </h2>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }} 
          style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <HiOutlinePlus size={20} /> Add Information
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.9rem" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Member Name</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Email</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Mobile</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>AADHAR</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>PAN</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Created Date</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>Actions</th>
             </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</td></tr>
            ) : filteredForms.length > 0 ? (
              filteredForms.map(form => (
                <tr key={form.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "bold", color: "#334155" }}>{form.form_data?.nameOfMember || 'N/A'}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{form.form_data?.emailId || 'N/A'}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{form.form_data?.mobileNo || 'N/A'}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{form.form_data?.aadharNumber ? `****${form.form_data.aadharNumber.slice(-4)}` : 'N/A'}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{form.form_data?.panNumber || 'N/A'}</td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: form.status === 'approved' ? '#dcfce7' : form.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: form.status === 'approved' ? '#15803d' : form.status === 'rejected' ? '#b91c1c' : '#b45309'
                    }}>
                      {form.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{new Date(form.created_at).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                      <button 
                        onClick={() => handleViewPDF(form.form_data)} 
                        title="View PDF" 
                        style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#4f46e5" }}
                        disabled={isGenerating}
                      >
                        <HiOutlineEye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownload(form.form_data)} 
                        title="Download PDF" 
                        style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#10b981" }}
                        disabled={isGenerating}
                      >
                        <HiOutlineArrowDownTray size={18} />
                      </button>
                      <button onClick={() => handleEdit(form)} title="Edit" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#f59e0b" }}>
                        <HiOutlinePencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(form.id)} title="Delete" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#b91c1c" }}>
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  {savedForms.length > 0 
                    ? `Found ${savedForms.length} form(s) but none match the current employee.` 
                    : (routedEmployee 
                      ? `No EPF forms found for ${currentEmployeeName}. Click "Add Information" to create a new form.` 
                      : "No forms found. Click \"Add Information\" to create a new EPF declaration form.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Form */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "800px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
              {editingForm ? "Edit EPF Declaration Form" : "Add New EPF Declaration Form"}
              {routedEmployee && !editingForm && (
                <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "normal", display: "block", marginTop: "5px" }}>
                  For: {getEmployeeName(routedEmployee)}
                </span>
              )}
            </h3>
            
            
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {/* Select Employee */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Select Employee *</label>
                  <select 
                    required 
                    style={{ 
                      width: "100%", 
                      padding: "8px 12px", 
                      borderRadius: "6px", 
                      border: "1px solid #cbd5e1",
                      backgroundColor: routedEmployee && !editingForm ? "#f1f5f9" : "white"
                    }} 
                    value={selectedEmployeeId} 
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    disabled={!!routedEmployee && !editingForm}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => {
                      const empId = getEmployeeId(emp);
                      return (
                        <option key={empId} value={empId}>
                          {getEmployeeName(emp)} ({emp.email}) - ID: {empId}
                        </option>
                      );
                    })}
                  </select>
                 
                </div>

                {/* Rest of your form fields remain the same - keeping them to save space, but they should be copied from your working version */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>1. Name of the member *</label>
                  <input type="text" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.nameOfMember} onChange={(e) => handleInputChange('nameOfMember', e.target.value)} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>2. Father's / Spouse's Name</label>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "8px" }}>
                    <label><input type="radio" name="relation" value="father" checked={formData.selectedRelation === 'father'} onChange={() => handleInputChange('selectedRelation', 'father')} /> Father</label>
                    <label><input type="radio" name="relation" value="spouse" checked={formData.selectedRelation === 'spouse'} onChange={() => handleInputChange('selectedRelation', 'spouse')} /> Spouse</label>
                  </div>
                  <input type="text" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} placeholder={formData.selectedRelation === 'father' ? "Father's name" : "Spouse's name"} value={formData.selectedRelation === 'father' ? formData.fatherName : formData.spouseName} onChange={(e) => handleInputChange(formData.selectedRelation === 'father' ? 'fatherName' : 'spouseName', e.target.value)} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>3. Date of Birth *</label>
                  <input type="date" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>4. Gender</label>
                  <select style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>5. Marital Status</label>
                  <select style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.maritalStatus} onChange={(e) => handleInputChange('maritalStatus', e.target.value)}>
                    <option value="">Select</option>
                    <option value="Married">Married</option>
                    <option value="Unmarried">Unmarried</option>
                    <option value="Widow">Widow</option>
                    <option value="Widower">Widower</option>
                    <option value="Divorce">Divorce</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>6(a). Email ID *</label>
                  <input type="email" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.emailId} onChange={(e) => handleInputChange('emailId', e.target.value)} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>6(b). Mobile No. *</label>
                  <input type="tel" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.mobileNo} onChange={(e) => handleInputChange('mobileNo', e.target.value)} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>AADHAR Number *</label>
                  <input type="text" required placeholder="12 digits" maxLength="12" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.aadharNumber} onChange={(e) => handleInputChange('aadharNumber', e.target.value.replace(/\D/g, ''))} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>PAN Number</label>
                  <input type="text" placeholder="ABCDE1234F" maxLength="10" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.panNumber} onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Undertaking Date</label>
                  <input type="date" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.undertakingDate} onChange={(e) => handleInputChange('undertakingDate', e.target.value)} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Place *</label>
                  <input type="text" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.undertakingPlace} onChange={(e) => handleInputChange('undertakingPlace', e.target.value)} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>PF Number</label>
                  <input type="text" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.pfNumber} onChange={(e) => handleInputChange('pfNumber', e.target.value)} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>UAN Number</label>
                  <input type="text" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.uanNumber} onChange={(e) => handleInputChange('uanNumber', e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={isGenerating} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", opacity: isGenerating ? 0.7 : 1 }}>
                  {isGenerating ? 'Saving...' : (editingForm ? 'Update Form' : 'Save Form')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeclarationForm;