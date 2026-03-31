import React, { useState, useEffect } from "react";
import { incrementLetterAPI } from "../../../services/incrementLetterAPI";
import { incrementPDFService } from "../../../services/incrementPDFService";
import { employeeAPI } from "../../../services/employeeAPI";
import { API_BASE_URL } from "../../../services/api";
import { HiOutlineDocumentText, HiOutlineEye, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

const IncrementLetters = () => {
  const [letters, setLetters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    employee_id: "",
    date_of_issue: new Date().toISOString().split('T')[0],
    effective_date: "",
    previous_ctc: "",
    revised_ctc: "",
    currency: "INR",
    designation: "",
    department: "",
    performance_note: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [letRes, empRes] = await Promise.all([
        incrementLetterAPI.getAllLetters(),
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
    const emp = employees.find(x => String(x.employee_id) === String(empId) || String(x.user_id) === String(empId));
    if (emp) {
      setFormData({
        ...formData,
        employee_id: emp.employee_id || emp.user_id,
        designation: emp.designation || emp.position || "",
        department: emp.department || "",
        previous_ctc: emp.salary || "" // if available
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

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const emp = employees.find(x => String(x.employee_id) === String(formData.employee_id) || String(x.user_id) === String(formData.employee_id));
      
      const pdfData = {
        employeeName: `${emp.first_name} ${emp.last_name}`,
        dateOfIssue: formData.date_of_issue,
        effectiveDate: formData.effective_date,
        previousCtc: formData.previous_ctc,
        revisedCtc: formData.revised_ctc,
        currency: formData.currency,
        incrementPercentage: calculatePercentage(),
        designation: formData.designation,
        department: formData.department,
        performanceNote: formData.performance_note,
        refNumber: "INC-DRAFT"
      };

      const pdfBlob = await incrementPDFService.generatePDFBlob(pdfData);

      const fData = new FormData();
      Object.keys(formData).forEach(key => fData.append(key, formData[key]));
      fData.append('pdf', pdfBlob, 'increment.pdf');

      await incrementLetterAPI.generateLetter(fData);
      setShowGenerateModal(false);
      fetchData();
    } catch (err) {
      console.error("Error generating increment letter:", err);
      alert("Failed to generate letter.");
    } finally {
      setIsProcessing(false);
    }
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

  const viewLetter = (url) => window.open(url, "_blank");

  return (
    <div style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <HiOutlineDocumentText size={28} color="#4f46e5" />
          Increment Letters
        </h2>
        <button onClick={() => setShowGenerateModal(true)} style={{ background: "#4f46e5", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <HiOutlinePlus size={20} /> Generate Letter
        </button>
      </div>

      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.9rem" }}>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Ref Number</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Employee Name</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Department</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Effective Date</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Rev. CTC</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Inc. %</th>
              <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</td></tr>
            ) : letters.length > 0 ? (
              letters.map(req => (
                <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "bold", color: "#334155" }}>{req.ref_number}</td>
                  <td style={{ padding: "16px", color: "#334155" }}>{req.first_name} {req.last_name}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{req.department}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{new Date(req.effective_date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: "16px", color: "#15803d", fontWeight: "bold" }}>{Number(req.revised_ctc).toLocaleString()} {req.currency}</td>
                  <td style={{ padding: "16px", color: "#64748b" }}>{req.increment_percentage}%</td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                      <button onClick={() => viewLetter(API_BASE_URL + req.letter_url)} title="View" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#4f46e5" }}><HiOutlineEye size={18} /></button>
                      <button onClick={() => handleDelete(req.id)} title="Revoke" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#b91c1c" }}><HiOutlineTrash size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No letters issued yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showGenerateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "600px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Generate Increment Letter</h3>
            <form onSubmit={handleGenerateSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px", color: "#334155" }}>Select Employee *</label>
                  <select required style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.employee_id} onChange={handleEmployeeSelect}>
                    <option value="">-- Select Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id || emp.user_id} value={emp.employee_id || emp.user_id}>{emp.first_name} {emp.last_name} ({emp.department_name || emp.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Date of Issue *</label>
                  <input type="date" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.date_of_issue} onChange={e => setFormData({...formData, date_of_issue: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Effective Date *</label>
                  <input type="date" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.effective_date} onChange={e => setFormData({...formData, effective_date: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Previous CTC *</label>
                  <input type="number" step="0.01" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.previous_ctc} onChange={e => setFormData({...formData, previous_ctc: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Revised CTC *</label>
                  <input type="number" step="0.01" required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.revised_ctc} onChange={e => setFormData({...formData, revised_ctc: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Currency / Increment %</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "80px" }} value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                      <option>INR</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                    <div style={{ padding: "8px", background: "#f1f5f9", borderRadius: "6px", flexGrow: 1, textAlign: "center", color: "#15803d", fontWeight: "bold" }}>
                      + {calculatePercentage()}%
                    </div>
                  </div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Performance Note (Optional)</label>
                  <textarea rows="2" placeholder="e.g. Based on your outstanding work in Q4..." style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={formData.performance_note} onChange={e => setFormData({...formData, performance_note: e.target.value})}></textarea>
                </div>
                <div style={{ display: "none" }}>
                  <input type="hidden" value={formData.designation} />
                  <input type="hidden" value={formData.department} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} style={{ padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={isProcessing} style={{ padding: "8px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", opacity: isProcessing ? 0.7 : 1 }}>
                  {isProcessing ? 'Generating...' : 'Generate Letter'}
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
