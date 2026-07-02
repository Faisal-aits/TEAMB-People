import React, { useState, useEffect } from "react";
import { experienceLetterAPI } from "../../../services/experienceLetterAPI";
import { experiencePDFService } from "../../../services/experiencePDFService";
import { employeeAPI } from "../../../services/employeeAPI";
import { API_BASE_URL } from "../../../services/api";
import { useLocation } from "react-router-dom";
import { HiOutlineDocumentText, HiOutlineEye, HiOutlinePlus, HiOutlineTrash,HiOutlineArrowLeft  } from "react-icons/hi2";
const getEmployeeSelectId = (employee) => employee?.employee_id || employee?.id || employee?.user_id || "";
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
const ExperienceLetters  = ({ initialEmployee = null , onBack = null}) => {
    const location = useLocation();
      const routedEmployee = initialEmployee || location.state?.employee || null;
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    date_of_issue: new Date().toISOString().split('T')[0],
    date_of_joining: "",
    last_working_day: "",
    designation: "",
    department: "",
    employment_type: "Full-Time",
    custom_note: ""
  });
 const currentEmployeeName = routedEmployee ? getEmployeeName(routedEmployee) : null;

  // ✅ Auto-populate form when routedEmployee is available
  useEffect(() => {
    if (routedEmployee && routedEmployee.employee_id) {
      
      
      setFormData(prev => ({
        ...prev,
        employee_id: getEmployeeSelectId(routedEmployee),
        date_of_joining: routedEmployee.joining_date ? new Date(routedEmployee.joining_date).toISOString().split('T')[0] : "",
        last_working_day: routedEmployee.last_working_date ? new Date(routedEmployee.last_working_date).toISOString().split('T')[0] : "",
        designation: routedEmployee.designation || routedEmployee.position || "",
       department: getEmployeeDepartment(routedEmployee) 
      }));
    }
  }, [routedEmployee]);

  // ✅ When modal opens, ensure form is populated with routed employee
  useEffect(() => {
    if (showGenerateModal && routedEmployee && routedEmployee.employee_id) {
      setFormData(prev => ({
        ...prev,
        employee_id: getEmployeeSelectId(routedEmployee),
        date_of_joining: routedEmployee.joining_date ? new Date(routedEmployee.joining_date).toISOString().split('T')[0] : "",
        last_working_day: routedEmployee.last_working_date ? new Date(routedEmployee.last_working_date).toISOString().split('T')[0] : "",
        designation: routedEmployee.designation || routedEmployee.position || "",
          department: getEmployeeDepartment(routedEmployee)
      }));
    }
  }, [showGenerateModal, routedEmployee]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [letRes, empRes] = await Promise.all([
        experienceLetterAPI.getAllLetters(),
        employeeAPI.getAll()
      ]);
      setLetters(letRes.data?.data || []);
      setEmployees(empRes.data?.employees || empRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    const emp = employees.find(x => String(x.employee_id) === String(empId) || String(x.employee_id) === String(empId));
    if (emp) {
      setFormData({
        ...formData,
        employee_id: emp.employee_id || emp.employee_id,
        date_of_joining: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : "",
        last_working_day: emp.last_working_day ? new Date(emp.last_working_day).toISOString().split('T')[0] : "",
        designation: emp.designation || emp.position || "",
                department: getEmployeeDepartment(emp) 
      });
    } else {
      setFormData({ ...formData, employee_id: empId });
    }
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const emp = employees.find(x => String(x.employee_id) === String(formData.employee_id) || String(x.employee_id) === String(formData.employee_id));
      
      // Build custom note that includes the exceptional performance text from original document
      const defaultCustomNote = `${emp?.first_name || 'The employee'} demonstrated exceptional technical skills, a strong work ethic, and a keen ability to adapt to new challenges. Their contributions have significantly impacted the success of our projects and the overall growth of the company.`;
      
      const pdfData = {
               employeeName: getEmployeeName(emp),
        firstName: emp?.first_name || 'The employee',
        dateOfIssue: formData.date_of_issue,
        dateOfJoining: formData.date_of_joining,
        lastWorkingDay: formData.last_working_day,
        designation: formData.designation,
        department: formData.department,
        employmentType: formData.employment_type,
        customNote: formData.custom_note || defaultCustomNote,
        refNumber: `EXP/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      };

      const pdfBlob = await experiencePDFService.generatePDFBlob(pdfData);

      const fData = new FormData();
      fData.append('employee_id', formData.employee_id);
      fData.append('date_of_issue', formData.date_of_issue);
      fData.append('date_of_joining', formData.date_of_joining);
      fData.append('last_working_day', formData.last_working_day);
      fData.append('designation', formData.designation);
      fData.append('department', formData.department);
      fData.append('employment_type', formData.employment_type);
      fData.append('custom_note', formData.custom_note);
            fData.append('pdf', pdfBlob, 'experience_letter.pdf');

      await experienceLetterAPI.generateLetter(fData);
      setShowGenerateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error generating experience letter:", err);
      alert("Failed to generate letter. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: routedEmployee?.employee_id || "",
      date_of_issue: new Date().toISOString().split('T')[0],
      date_of_joining: routedEmployee?.joining_date ? new Date(routedEmployee.joining_date).toISOString().split('T')[0] : "",
      last_working_day: routedEmployee?.last_working_date ? new Date(routedEmployee.last_working_date).toISOString().split('T')[0] : "",
      designation: routedEmployee?.designation || routedEmployee?.position || "",
      department: routedEmployee?.department || "",
      employment_type: "Full-Time",
      custom_note: ""
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to revoke and delete this letter?")) return;
    try {
      await experienceLetterAPI.deleteLetter(id);
      fetchData();
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete letter.");
    }
  };

  const viewLetter = (url) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `${API_BASE_URL}${url}`, "_blank");
    }
  };

  const handlePreview = async () => {
    if (!formData.employee_id) {
      alert("Please select an employee first");
      return;
    }
    
    const emp = employees.find(x => String(getEmployeeSelectId(x)) === String(formData.employee_id));
    
    if (!formData.date_of_joining || !formData.last_working_day) {
      alert("Please fill in joining date and last working day");
      return;
    }
    
    const defaultCustomNote = `${emp?.first_name || 'The employee'} demonstrated exceptional technical skills, a strong work ethic, and a keen ability to adapt to new challenges. Their contributions have significantly impacted the success of our projects and the overall growth of the company.`;
    
    const pdfData = {
      employeeName: getEmployeeName(emp),
      firstName: emp?.first_name || 'The employee',
      dateOfIssue: formData.date_of_issue,
      dateOfJoining: formData.date_of_joining,
      lastWorkingDay: formData.last_working_day,
      designation: formData.designation,
      department: formData.department,
      employmentType: formData.employment_type,
      customNote: formData.custom_note || defaultCustomNote,
      refNumber: `PREVIEW/${new Date().getFullYear()}/001`
    };
    
    try {
      const pdfBlob = await experiencePDFService.generatePDFBlob(pdfData);
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Preview error:", err);
      alert("Failed to preview letter");
    }
  };

 // ✅ Filter letters for the routed employee
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
            Experience Letters
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
                date_of_joining: routedEmployee.joining_date ? new Date(routedEmployee.joining_date).toISOString().split('T')[0] : "",
                last_working_day: routedEmployee.last_working_date ? new Date(routedEmployee.last_working_date).toISOString().split('T')[0] : "",
                designation: routedEmployee.designation || routedEmployee.position || "",
                department: routedEmployee.department || ""
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
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "600px" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.9rem" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Ref Number</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Employee Name</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Designation</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Department</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Period</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Issue Date</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</td></tr>
            ) : filteredLetters.length > 0 ? (
              filteredLetters.map(letter => (
                <tr key={letter.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "bold", color: "#334155" }}>{letter.ref_number}</td>
                  <td style={{ padding: "16px", color: "#334155" }}>{letter.first_name} {letter.last_name}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{letter.designation}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{letter.department}</td>
                  <td style={{ padding: "16px", color: "#64748b", fontSize: "12px" }}>
                    {letter.date_of_joining && new Date(letter.date_of_joining).toLocaleDateString('en-GB')} - {letter.last_working_day && new Date(letter.last_working_day).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{letter.date_of_issue && new Date(letter.date_of_issue).toLocaleDateString('en-GB')}</td>
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
                <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  {routedEmployee 
                    ? `No experience letters issued for ${currentEmployeeName} yet.` 
                    : "No experience letters issued yet."}
                 </td>
               </tr>            )}
          </tbody>
        </table>
      </div>
 {showGenerateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", padding: "32px", borderRadius: "16px", width: "600px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #e2e8f0", paddingBottom: "15px" }}>
              <h3 style={{ margin: 0, color: "#1e293b", fontSize: "22px", fontWeight: "bold" }}>
                Generate Experience Letter
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
                        {getEmployeeName(emp)} - {emp.designation || emp.position || 'No Designation'}
                      </option>
                    ))}
                  </select>
                  
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Date of Issue *</label>
                  <input type="date" required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={formData.date_of_issue} onChange={e => setFormData({...formData, date_of_issue: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Employment Type *</label>
                  <select required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={formData.employment_type} onChange={e => setFormData({...formData, employment_type: e.target.value})}>
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Date of Joining *</label>
                  <input type="date" required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={formData.date_of_joining} onChange={e => setFormData({...formData, date_of_joining: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Last Working Day *</label>
                  <input type="date" required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={formData.last_working_day} onChange={e => setFormData({...formData, last_working_day: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Designation *</label>
                  <input type="text" required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Department *</label>
                  <input type="text" required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Custom Note (Optional)</label>
                  <textarea 
                    rows="3" 
                    placeholder="Add any additional achievements or notes about the employee..." 
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "inherit", fontSize: "14px" }} 
                    value={formData.custom_note} 
                    onChange={e => setFormData({...formData, custom_note: e.target.value})}
                  />
                  <small style={{ color: "#64748b", fontSize: "11px" }}>Leave empty to use the default exceptional performance statement</small>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} style={{ padding: "10px 20px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "14px" }}>
                  Cancel
                </button>
                <button type="button" onClick={handlePreview} style={{ padding: "10px 20px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500", fontSize: "14px" }}>
                  Preview
                </button>
                <button type="submit" disabled={isProcessing} style={{ padding: "10px 20px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", opacity: isProcessing ? 0.7 : 1, fontWeight: "500", fontSize: "14px" }}>
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

export default ExperienceLetters;