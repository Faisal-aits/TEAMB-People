import { useEffect, useState } from "react";
import { employeeAPI } from "../../../services/employeeAPI";
import { offerLetterPDFService } from "../../../services/offerLetterPDFService";
import companyLogo from "../../../assets/img/company.png";
import stampPng from "../../../assets/img/stamp.png";
import { TbWorld } from "react-icons/tb";
import { TfiEmail } from "react-icons/tfi";
import { HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineBriefcase, HiOutlineArrowDownOnSquare, HiOutlineEye, HiOutlineArrowDownTray } from "react-icons/hi2";
import offerLetterAPI from "../../../services/offerLetterAPI";

const OfferLetter = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    issueDate: new Date().toISOString().split('T')[0],
    salutation: "Mr.",
    fullName: "",
    address: "",
    phone: "",
    email: "",
    designation: "",
    joiningDate: "",
    ctc: "",
    ctcInWords: ""
  });

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeeAPI.getAll();
        console.log("Employees API Response:", res.data);
        const employeesData = res.data.employees || res.data.data || (Array.isArray(res.data) ? res.data : []);
        setEmployees(employeesData);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await offerLetterAPI.getAll();
      setHistory(res.data.data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelect = async (e) => {
    const empId = e.target.value;
    setSelectedEmployee(empId);

    if (!empId) {
      setSelectedUserId(null);
      setFormData({
        issueDate: new Date().toISOString().split('T')[0],
        fullName: "",
        address: "",
        phone: "",
        email: "",
        designation: "",
        joiningDate: "",
        ctc: "",
        ctcInWords: ""
      });
      return;
    }

    try {
      const res = await employeeAPI.getById(empId);
      const emp = res.data.employee || res.data;

      setSelectedUserId(emp.user_id);
      setFormData((prev) => ({
        ...prev,
        fullName: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
        email: emp.email || "",
        phone: emp.phone || emp.mobile || "",
        address: emp.address || "",
        designation: emp.position || emp.role_name || "",
        joiningDate: emp.joining_date || ""
      }));
    } catch (err) {
      console.error("Error fetching employee details:", err);
    }
  };

  const handleDownload = async () => {
    if (!formData.fullName) {
      alert("Please select or enter employee details first.");
      return;
    }
    setIsGenerating(true);
    try {
      await offerLetterPDFService.downloadOfferLetter(formData);
    } catch (err) {
      console.error("Error in generation:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      alert("Please select an existing employee from the search list to save to their dashboard.");
      return;
    }
    
    setIsGenerating(true);
    try {
      await offerLetterAPI.save({
        employee_id: selectedUserId,
        form_data: formData,
        issue_date: formData.issueDate
      });
      alert("Offer letter successfully saved to employee's dashboard!");
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error("Error saving to database:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const inputStyle = {
    padding: "10px 14px",
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "15px",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    background: "#f8fafc"
  };

  const sectionHeaderStyle = {
    fontSize: "16px",
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1.5px solid #eef2ff",
    paddingBottom: "8px"
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "6px",
    display: "block"
  };

  const formatDate = (dateString) => {
    if (!dateString) return "DD-MM-YYYY";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  return (
    <div style={{ padding: "20px", background: "#f4f7f6", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: 0, color: "#2c3e50", fontSize: "28px" }}>Offer Letter Generator</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={handleSave}
            disabled={isGenerating}
            style={{
              padding: "12px 24px",
              background: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            <HiOutlineArrowDownOnSquare size={20} />
            {isGenerating ? "Saving..." : "Save to Dashboard"}
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            style={{
              padding: "12px 24px",
              background: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            <HiOutlineArrowDownTray size={20} />
            {isGenerating ? "Processing..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "30px" }}>
        {/* 🔥 LEFT COLUMN: FORM */}
        <div style={{ background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
          
          <section style={{ marginBottom: "25px" }}>
            <h3 style={sectionHeaderStyle}>
              <HiOutlineDocumentText size={20} /> General Info
            </h3>
            <div>
              <label style={labelStyle}>Letter Issue Date</label>
              <input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} style={inputStyle} />
            </div>
          </section>

          <section style={{ marginBottom: "25px" }}>
            <h3 style={sectionHeaderStyle}>
              <HiOutlineUserGroup size={20} /> Personal Info
            </h3>
            <label style={labelStyle}>Full Name & Salutation</label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <select
                value={formData.salutation}
                onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                style={{ ...inputStyle, width: "80px", marginBottom: 0 }}
              >
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
              </select>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  list="employee-list"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, fullName: val });

                    // Auto-populate search
                    const match = employees.find(emp => 
                      `${emp.first_name} ${emp.last_name}`.trim().toLowerCase() === val.trim().toLowerCase()
                    );
                    if (match) {
                      const empId = match.id || match.employee_id;
                      if (empId) handleSelect({ target: { value: empId } });
                    }
                  }}
                  style={{ ...inputStyle, marginBottom: 0 }}
                />
                <datalist id="employee-list">
                  {employees.map(emp => (
                    <option key={emp.id || emp.employee_id} value={`${emp.first_name} ${emp.last_name}`.trim()} />
                  ))}
                </datalist>
              </div>
            </div>
            <label style={labelStyle}>Address</label>
            <input placeholder="Enter full address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={inputStyle} />
            
            <label style={labelStyle}>Phone Number</label>
            <input placeholder="e.g. +91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
            
            <label style={labelStyle}>Email Address</label>
            <input placeholder="e.g. employee@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h3 style={sectionHeaderStyle}>
              <HiOutlineBriefcase size={20} /> Job & Salary
            </h3>
            <label style={labelStyle}>Designation</label>
            <input placeholder="e.g. Full Stack Developer" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} style={inputStyle} />
            
            <div style={{ marginBottom: "12px" }}>
              <label style={labelStyle}>Joining Date</label>
              <input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} style={inputStyle} />
            </div>

            <label style={labelStyle}>Annual CTC</label>
            <input placeholder="e.g. 96,000" value={formData.ctc} onChange={(e) => setFormData({ ...formData, ctc: e.target.value })} style={inputStyle} />
            
            <label style={labelStyle}>CTC in Words</label>
            <input placeholder="e.g. Ninety Six Thousand" value={formData.ctcInWords} onChange={(e) => setFormData({ ...formData, ctcInWords: e.target.value })} style={inputStyle} />
          </section>
        </div>

        {/* 🔥 RIGHT COLUMN: LIVE PREVIEW */}
        <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", position: "sticky", top: "20px", maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
          <div style={{ border: "1px solid #eee", minHeight: "1000px", background: "white", color: "#000", fontSize: "11pt", lineHeight: "1.6", display: "flex", flexDirection: "column", boxShadow: "0 0 10px rgba(0,0,0,0.05)" }}>
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: "50px",
              borderBottom: "5px solid #000",
              padding: "20px 40px 10px 40px",
              marginBottom: "30px",
              boxSizing: "border-box",
              width: "100%"
            }}>
              <div style={{ flex: "0 0 auto" }}>
                <img src={companyLogo} alt="Logo" style={{ height: "120px", width: "auto", maxWidth: "300px", objectFit: "contain", display: "block", padding: "0 2px" }} />
              </div>
              <div style={{
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                justifyContent: "center",
                maxWidth: "60%",
                flex: "0 0 auto",
                wordBreak: "break-all"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "10px" }}>
                  <div style={{ background: "#000", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TbWorld size={18} />
                  </div>
                  <span style={{ fontWeight: "bold", fontSize: "11pt" }}>www.arhamitsolution.in</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "10px" }}>
                  <div style={{ background: "#000", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TfiEmail size={16} />
                  </div>
                  <span style={{ fontWeight: "bold", fontSize: "11pt" }}>info@arhamitsolution.in</span>
                </div>
              </div>
            </div>

            {/* Content area with margins */}
            <div style={{ padding: "0 40px 60px 40px", flexGrow: 1 }}>
              {/* Date & Address */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>To,</p>
                  <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{formData.salutation} {formData.fullName || "________________"}</p>
                  <p style={{ margin: "0 0 5px 0" }}>{formData.address || "________________"}</p>
                  <p style={{ margin: "0 0 5px 0" }}>Tel : {formData.phone || "________________"}</p>
                  <p style={{ margin: "0 0 5px 0" }}>E-mail: {formData.email || "________________"}</p>
                </div>
                <div style={{ textAlign: "right", fontWeight: "bold" }}>
                  Date :- {formatDate(formData.issueDate)}
                </div>
              </div>

              <h3 style={{ textAlign: "center", marginBottom: "15px", fontSize: "12pt", fontWeight: "bold" }}>Subject : Offer Letter</h3>

              {/* Content */}
              <div style={{ textAlign: "justify", fontFamily: "'Times New Roman', Times, serif", fontSize: "11pt", marginTop: "27px" }}>
                <p>Congratulations!</p>
                <br/>
                <p>We are pleased to offer you the position of <strong>{formData.designation || "________________"}</strong> with the Company. The effective date of your appointment is agreed as <strong>{formatDate(formData.joiningDate)}</strong>.</p>
                <p>Your annual compensation (CTC) will be <strong>Rs. {formData.ctc || "________"} ({formData.ctcInWords || "________________"} only)</strong> per annum, subject to statutory deductions. Performance assessment will be conducted periodically.</p>
                <p>Your continued employment is contingent upon your satisfactorily meeting the Company's expectations.</p>
                <p>On your first day of work, you will be required to sign the <strong>Employment Agreement</strong>, which will contain detailed terms and conditions of your employment with the Company. You are expected to follow the policies, rules, and regulations laid out by the Company. On your first day of employment, you will be given additional information about the Company, its procedures, policies, benefit programs, and more.</p>
                <p>Any female employee who has conceived prior to joining the Company is expected to inform the Company of her pregnancy before signing the Offer Letter and the Employee Agreement.</p>
                <p>This Letter of Offer is contingent upon the successful completion of all background and reference checks and required documentation. On your first day, please bring the documents as provided in <strong>Annexure 1</strong>.</p>
              </div>

              {/* Stamp & Signature */}
              <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ textAlign: "center", marginRight: "0px" }}>
                  <img src={stampPng} alt="Stamp" style={{ width: "120px", marginBottom: "10px" }} />
                  <div style={{ fontWeight: "bold", fontSize: "11pt" }}>Best Regards,</div>
                  <div style={{ fontWeight: "bold", fontSize: "11pt" }}>Sharjeel iqbal,</div>
                  <div style={{ fontSize: "10pt" }}>HR and BDE Executive,</div>
                  <div style={{ fontWeight: "bold", fontSize: "11pt" }}>Arham It Solution</div>
                </div>
              </div>
            </div>
            {/* Blank space for stamp */}
            <div style={{ height: "150px" }}></div>
          </div>
        </div>
      </div>

      {/* 🔥 BOTTOM SECTION: HISTORY */}
      <div style={{ marginTop: "40px", background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
        <h3 style={{ ...sectionHeaderStyle, borderBottom: "none", marginBottom: "20px" }}>
          <HiOutlineDocumentText size={24} /> Recent Offer Letters
        </h3>
        
        {isLoadingHistory ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading history...</div>
        ) : history.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b", fontSize: "13px" }}>
                  <th style={{ padding: "12px 16px", fontWeight: "600" }}>Employee Name</th>
                  <th style={{ padding: "12px 16px", fontWeight: "600" }}>Employee ID</th>
                  <th style={{ padding: "12px 16px", fontWeight: "600" }}>Designation</th>
                  <th style={{ padding: "12px 16px", fontWeight: "600" }}>Issue Date</th>
                  <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "14px", transition: "background 0.2s" }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.first_name} {item.last_name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.email}</div>
                    </td>
                    <td style={{ padding: "16px", color: "#64748b" }}>{item.employee_display_id || "N/A"}</td>
                    <td style={{ padding: "16px", color: "#1e293b" }}>{item.form_data.designation}</td>
                    <td style={{ padding: "16px", color: "#64748b" }}>{new Date(item.issue_date).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: "16px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button 
                          onClick={() => offerLetterPDFService.viewOfferLetter(item.form_data)}
                          title="View"
                          style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#4f46e5" }}
                        >
                          <HiOutlineEye size={18} />
                        </button>
                        <button 
                          onClick={() => offerLetterPDFService.downloadOfferLetter(item.form_data)}
                          title="Download"
                          style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#2ecc71" }}
                        >
                          <HiOutlineArrowDownTray size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setFormData(item.form_data);
                            setSelectedEmployee(item.employee_display_id);
                            setSelectedUserId(item.employee_id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          title="Edit"
                          style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#64748b" }}
                        >
                          <HiOutlineArrowDownOnSquare size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No offer letters found in history.</div>
        )}
      </div>
    </div>
  );
};

export default OfferLetter;
