import React, { useState, useEffect } from "react";
import { resignationAPI } from "../../services/resignationAPI";
import { API_BASE_URL } from "../../services/api";
import { HiOutlineDocumentText, HiOutlineEye } from "react-icons/hi2";

const EmployeeResignations = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <HiOutlineDocumentText size={28} color="#4f46e5" />
        My Resignation Requests
      </h2>

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
    </div>
  );
};

export default EmployeeResignations;
