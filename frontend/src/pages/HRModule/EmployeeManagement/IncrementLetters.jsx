import React, { useState, useEffect } from "react";
import { incrementLetterAPI } from "../../../services/incrementLetterAPI";
import { incrementPDFService } from "../../../services/incrementPDFService";
import { employeeAPI } from "../../../services/employeeAPI";
import { API_BASE_URL } from "../../../services/api";
import { useLocation } from "react-router-dom";
import { HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlineEye, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

const getEmployeeSelectId = (employee) => employee?.employee_id || employee?.id || employee?.user_id || "";
const getEmployeeCode = (employee) => employee?.employee_code || employee?.employee_id || employee?.id || "";

const getEmployeeName = (employee) => {
  const fullName = `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();
  return fullName || employee?.name || employee?.employee_name || employee?.email || "Unnamed Employee";
};

const getEmployeeDepartment = (employee) => (
  employee?.department_names?.join(", ") ||
  employee?.department_name ||
  employee?.department ||
  ""
);

const isEmployeeActive = (employee) => {
  const status = String(employee?.status || "").toLowerCase();
  const isActiveValue = employee?.is_active;
  const isActive = isActiveValue === true || isActiveValue === 1 || isActiveValue === "1";
  return isActive && status !== "inactive";
};

const IncrementLetters = ({ initialEmployee = null, onBack = null }) => {
  const location = useLocation();
  const routedEmployee = initialEmployee || location.state?.employee || null;
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_code: "",
    date_of_issue: new Date().toISOString().split('T')[0],
    effective_date: "",
    previous_ctc: "",
    revised_ctc: "",
    currency: "INR",
    designation: "",
    department: "",
    performance_note: ""
  });
  
  const currentEmployeeName = routedEmployee ? getEmployeeName(routedEmployee) : null;

  // Auto-populate form when routedEmployee is available
  useEffect(() => {
    if (routedEmployee && routedEmployee.employee_id) {
      
      setFormData(prev => ({
        ...prev,
        employee_id: getEmployeeSelectId(routedEmployee),
        employee_code: getEmployeeCode(routedEmployee),
        designation: routedEmployee.designation || routedEmployee.position || "",
        department: getEmployeeDepartment(routedEmployee),
        previous_ctc: routedEmployee.ctc || routedEmployee.salary || ""
      }));
    }
  }, [routedEmployee]);

  // When modal opens, ensure form is populated with routed employee
  useEffect(() => {
    if (showGenerateModal && routedEmployee && routedEmployee.employee_id) {
      setFormData(prev => ({
        ...prev,
        employee_id: getEmployeeSelectId(routedEmployee),
        employee_code: getEmployeeCode(routedEmployee),
        designation: routedEmployee.designation || routedEmployee.position || "",
        department: getEmployeeDepartment(routedEmployee),
        previous_ctc: routedEmployee.ctc || routedEmployee.salary || ""
      }));
    }
  }, [showGenerateModal, routedEmployee]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lettersResult, employeesResult] = await Promise.allSettled([
        incrementLetterAPI.getAllLetters(),
        employeeAPI.getAll({ is_active: true })
      ]);

      if (lettersResult.status === "fulfilled") {
        setLetters(lettersResult.value.data?.data || []);
      } else {
      
        setLetters([]);
      }

      if (employeesResult.status === "fulfilled") {
        const employeesPayload = employeesResult.value.data;
        const employeesList = employeesPayload?.employees || employeesPayload?.data || [];
        setEmployees(Array.isArray(employeesList) ? employeesList.filter(isEmployeeActive) : []);
      } else {
       
        setEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    const emp = employees.find(x => String(getEmployeeSelectId(x)) === String(empId));
    if (emp) {
      setFormData({
        ...formData,
        employee_id: getEmployeeSelectId(emp),
        employee_code: getEmployeeCode(emp),
        designation: emp.designation || emp.position || "",
        department: getEmployeeDepartment(emp),
        previous_ctc: emp.ctc || emp.salary || ""
      });
    } else {
      setFormData({ ...formData, employee_id: empId });
    }
  };

  const calculatePercentage = () => {
    const prev = parseFloat(formData.previous_ctc);
    const rev = parseFloat(formData.revised_ctc);
    if (!isNaN(prev) && !isNaN(rev) && prev > 0) {
      return ((rev - prev) / prev * 100).toFixed(2);
    }
    return "0.00";
  };

  const handlePreview = async () => {
    if (!formData.employee_id) {
      alert("Please select an employee");
      return;
    }
    
    const emp = employees.find(x => String(getEmployeeSelectId(x)) === String(formData.employee_id));
    
    const pdfData = {
      employeeName: getEmployeeName(emp),
      employeeCode: formData.employee_code || getEmployeeCode(emp),
      designation: formData.designation,
      department: formData.department,
      dateOfIssue: formData.date_of_issue,
      effectiveDate: formData.effective_date,
      previousCtc: formData.previous_ctc,
      revisedCtc: formData.revised_ctc,
      currency: formData.currency,
      incrementPercentage: calculatePercentage(),
      performanceNote: formData.performance_note,
      refNumber: `PREVIEW/${new Date().getFullYear()}/001`
    };
    
    try {
      const pdfBlob = await incrementPDFService.generatePDFBlob(pdfData);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Preview error:", err);
      alert("Failed to preview letter: " + err.message);
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const emp = employees.find(x => String(getEmployeeSelectId(x)) === String(formData.employee_id));
      
      if (!emp) {
        alert("Employee not found");
        setIsProcessing(false);
        return;
      }
      
      const pdfData = {
        employeeName: getEmployeeName(emp),
        employeeCode: formData.employee_code || getEmployeeCode(emp),
        designation: formData.designation,
        department: formData.department,
        dateOfIssue: formData.date_of_issue,
        effectiveDate: formData.effective_date,
        previousCtc: formData.previous_ctc,
        revisedCtc: formData.revised_ctc,
        currency: formData.currency,
        incrementPercentage: calculatePercentage(),
        performanceNote: formData.performance_note,
        refNumber: `INC/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      };

      const pdfBlob = await incrementPDFService.generatePDFBlob(pdfData);

      const fData = new FormData();
      fData.append('employee_id', formData.employee_id);
      fData.append('employee_code', formData.employee_code);
      fData.append('date_of_issue', formData.date_of_issue);
      fData.append('effective_date', formData.effective_date);
      fData.append('previous_ctc', formData.previous_ctc);
      fData.append('revised_ctc', formData.revised_ctc);
      fData.append('currency', formData.currency);
      fData.append('designation', formData.designation);
      fData.append('department', formData.department);
      fData.append('performance_note', formData.performance_note);
      fData.append('pdf', pdfBlob, 'increment_letter.pdf');

      await incrementLetterAPI.generateLetter(fData);
      setShowGenerateModal(false);
      resetForm();
      fetchData();
      alert("Increment letter generated successfully!");
    } catch (err) {
      console.error("Error generating increment letter:", err);
      alert(`Failed to generate letter: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: routedEmployee?.employee_id || "",
      employee_code: routedEmployee?.employee_code || routedEmployee?.employee_id || "",
      date_of_issue: new Date().toISOString().split('T')[0],
      effective_date: "",
      previous_ctc: routedEmployee?.ctc || routedEmployee?.salary || "",
      revised_ctc: "",
      currency: "INR",
      designation: routedEmployee?.designation || routedEmployee?.position || "",
      department: routedEmployee ? getEmployeeDepartment(routedEmployee) : "",
      performance_note: ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this increment letter?")) return;
    try {
      await incrementLetterAPI.deleteLetter(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const viewLetter = (url) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, "_blank");
    }
  };

  // ✅ FIXED: Use filteredLetters instead of letters
  const filteredLetters = routedEmployee && routedEmployee.employee_id
    ? letters.filter(letter => 
        String(letter.employee_id) === String(routedEmployee.employee_id) ||
        String(letter.user_id) === String(routedEmployee.user_id)
      )
    : letters;

  return (
    <div style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
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
            Increment Letters
            {currentEmployeeName && (
              <span style={{ fontSize: "18px", color: "#64748b", fontWeight: "normal" }}>
                - {currentEmployeeName}
              </span>
            )}
          </h2>
        </div>
        <button 
          onClick={() => {
            if (routedEmployee && routedEmployee.employee_id) {
              setFormData({
                ...formData,
                employee_id: getEmployeeSelectId(routedEmployee),
                employee_code: getEmployeeCode(routedEmployee),
                designation: routedEmployee.designation || routedEmployee.position || "",
                department: getEmployeeDepartment(routedEmployee),
                previous_ctc: routedEmployee.ctc || routedEmployee.salary || ""
              });
            }
            setShowGenerateModal(true);
          }} 
          style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <HiOutlinePlus size={20} /> Generate Letter
        </button>
      </div>

      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.9rem" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Ref Number</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Employee Name</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Designation</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Effective Date</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Previous CTC</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Revised CTC</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Increment %</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>Actions</th>
             </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</td></tr>
            ) : filteredLetters.length > 0 ? (  // ✅ FIXED: Use filteredLetters
              filteredLetters.map(letter => (
                <tr key={letter.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "bold", color: "#334155" }}>{letter.ref_number}</td>
                  <td style={{ padding: "16px", color: "#334155" }}>{letter.first_name} {letter.last_name}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{letter.designation}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{letter.effective_date && new Date(letter.effective_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{Number(letter.previous_ctc).toLocaleString()} {letter.currency}</td>
                  <td style={{ padding: "16px", color: "#15803d", fontWeight: "bold" }}>{Number(letter.revised_ctc).toLocaleString()} {letter.currency}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{letter.increment_percentage}%</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => viewLetter(letter.letter_url)} title="View" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#4f46e5" }}>
                        <HiOutlineEye size={18} />
                      </button>
                      <button onClick={() => handleDelete(letter.id)} title="Revoke" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#b91c1c" }}>
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  {routedEmployee 
                    ? `No increment letters issued for ${currentEmployeeName} yet.` 
                    : "No increment letters issued yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal with improved styling */}
      {showGenerateModal && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: "rgba(0,0,0,0.5)", 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          zIndex: 9999,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{ 
            background: "white", 
            padding: "32px", 
            borderRadius: "16px", 
            width: "700px", 
            maxWidth: "90%", 
            maxHeight: "90vh", 
            overflowY: "auto",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #e2e8f0", paddingBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "22px", fontWeight: "bold" }}>
                Generate Increment Letter
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "0 8px"
                }}
              >
                ×
              </button>
            </div>
           
            
            <form onSubmit={handleGenerateSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Select Employee *</label>
                  <select 
                    required 
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      borderRadius: "8px", 
                      border: "1px solid #cbd5e1",
                      backgroundColor: routedEmployee ? "#f1f5f9" : "white",
                      fontSize: "14px"
                    }} 
                    value={formData.employee_id} 
                    onChange={handleEmployeeSelect}
                    disabled={!!routedEmployee}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={getEmployeeSelectId(emp)} value={getEmployeeSelectId(emp)}>
                        {getEmployeeName(emp)} - {emp.designation || emp.position || 'No Designation'} ({getEmployeeCode(emp)})
                      </option>
                    ))}
                  </select>
                 
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Employee Code *</label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.employee_code} 
                    onChange={e => setFormData({...formData, employee_code: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Date of Issue *</label>
                  <input 
                    type="date" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.date_of_issue} 
                    onChange={e => setFormData({...formData, date_of_issue: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Effective Date *</label>
                  <input 
                    type="date" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.effective_date} 
                    onChange={e => setFormData({...formData, effective_date: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Previous CTC *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.previous_ctc} 
                    onChange={e => setFormData({...formData, previous_ctc: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Revised CTC *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.revised_ctc} 
                    onChange={e => setFormData({...formData, revised_ctc: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Currency</label>
                  <select 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.currency} 
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  >
                    <option>INR</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Increment %</label>
                  <div style={{ 
                    padding: "10px", 
                    background: "#dcfce7", 
                    borderRadius: "8px", 
                    textAlign: "center", 
                    color: "#15803d", 
                    fontWeight: "bold", 
                    fontSize: "16px" 
                  }}>
                    {calculatePercentage()}%
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Designation *</label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.designation} 
                    onChange={e => setFormData({...formData, designation: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Department *</label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} 
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value})} 
                  />
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Performance Note (Optional)</label>
                  <textarea 
                    rows="3" 
                    placeholder="We extend our warm congratulations to you for your outstanding contributions..." 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit" }} 
                    value={formData.performance_note} 
                    onChange={e => setFormData({...formData, performance_note: e.target.value})} 
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                <button 
                  type="button" 
                  onClick={() => setShowGenerateModal(false)} 
                  style={{ 
                    padding: "10px 20px", 
                    background: "#f1f5f9", 
                    color: "#475569", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px"
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handlePreview} 
                  style={{ 
                    padding: "10px 20px", 
                    background: "#10b981", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "14px"
                  }}
                >
                  Preview
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  style={{ 
                    padding: "10px 20px", 
                    background: "#4f46e5", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    opacity: isProcessing ? 0.7 : 1,
                    fontWeight: "500",
                    fontSize: "14px"
                  }}
                >
                  {isProcessing ? 'Generating...' : 'Generate & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncrementLetters;