import React, { useState, useEffect } from "react";
import { resignationAPI } from "../../services/resignationAPI";
import { API_BASE_URL } from "../../services/api";
import { HiOutlineDocumentText, HiOutlineEye } from "react-icons/hi2";

const EmployeeResignations = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showResignationModal, setShowResignationModal] = useState(false);
  const [resignationData, setResignationData] = useState({
    requested_last_day: '',
    reason: '',
    additional_note: ''
  });
  const [resignationSubmitting, setResignationSubmitting] = useState(false);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      const apiRes = await resignationAPI.getMyRequests();
      setRequests(apiRes.data?.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching my requests:", err);
      setError("Failed to load your resignation requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResignationSubmit = async (e) => {
    e.preventDefault();
    setResignationSubmitting(true);
    try {
      const res = await resignationAPI.submitRequest(resignationData);
      if (res.data?.success) {
        alert('Resignation request submitted successfully.');
        setShowResignationModal(false);
        setResignationData({ requested_last_day: '', reason: '', additional_note: '' });
        fetchMyRequests(); // Refresh list
      }
    } catch (err) {
      console.error('Error submitting resignation:', err);
      alert(err.response?.data?.message || 'Failed to submit resignation request.');
    } finally {
      setResignationSubmitting(false);
    }
  };

  const viewLetter = (url) => {
    window.open(url, "_blank");
  };

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'accepted': return <span style={{ color: "#15803d", background: "#dcfce7", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>Accepted</span>;
      case 'rejected': return <span style={{ color: "#b91c1c", background: "#fee2e2", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>Rejected</span>;
      default: return <span style={{ color: "#b45309", background: "#fef3c7", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "bold" }}>Pending</span>;
    }
  };

  return (
    <div style={{ padding: "30px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <HiOutlineDocumentText size={28} color="#4f46e5" />
          My Resignation Requests
        </h2>
        <button 
          onClick={() => setShowResignationModal(true)}
          style={{ padding: "10px 20px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span> Apply Resignation
        </button>
      </div>

      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.9rem" }}>
                <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Ref Number</th>
                <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Applied On</th>
                <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Req. Last Day</th>
                <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Reason</th>
                <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                <th style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#b91c1c" }}>{error}</td></tr>
              ) : requests.length > 0 ? (
                requests.map(req => (
                  <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "all 0.2s" }}>
                    <td style={{ padding: "16px", fontWeight: "bold", color: "#334155" }}>{req.ref_number}</td>
                    <td style={{ padding: "16px", color: "#64748b" }}>{new Date(req.created_at).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: "16px", color: "#64748b" }}>{new Date(req.requested_last_day).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: "16px", color: "#64748b", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={req.reason}>{req.reason}</td>
                    <td style={{ padding: "16px" }}><StatusBadge status={req.status} /></td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        {req.status === 'accepted' && req.letter_url ? (
                          <button onClick={() => viewLetter(API_BASE_URL + req.letter_url)} title="View Approved Letter" style={{ padding: "6px", background: "#f1f5f9", border: "none", borderRadius: "4px", cursor: "pointer", color: "#4f46e5" }}><HiOutlineEye size={18} /> View Letter</button>
                        ) : req.status === 'rejected' && req.rejection_reason ? (
                          <span style={{ fontSize: "0.85rem", color: "#64748b", cursor: "help" }} title={req.rejection_reason}>Hover for reason</span>
                        ) : (
                          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showResignationModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", width: "500px", maxWidth: "90%" }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#dc2626", fontSize: "20px" }}>Apply for Resignation</h3>
            <form onSubmit={handleResignationSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: "#334155" }}>Requested Last Working Day *</label>
                <input 
                  type="date" 
                  value={resignationData.requested_last_day}
                  onChange={(e) => setResignationData({...resignationData, requested_last_day: e.target.value})}
                  required 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: "border-box" }} 
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: "#334155" }}>Reason for Resignation *</label>
                <textarea 
                  value={resignationData.reason}
                  onChange={(e) => setResignationData({...resignationData, reason: e.target.value})}
                  required 
                  rows="3"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: "#334155" }}>Additional Note (Optional)</label>
                <textarea 
                  value={resignationData.additional_note}
                  onChange={(e) => setResignationData({...resignationData, additional_note: e.target.value})}
                  rows="2"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowResignationModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: "bold" }}>Cancel</button>
                <button type="submit" disabled={resignationSubmitting} style={{ padding: '10px 16px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: "bold", opacity: resignationSubmitting ? 0.7 : 1 }}>
                  {resignationSubmitting ? 'Submitting...' : 'Submit Resignation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeResignations;
