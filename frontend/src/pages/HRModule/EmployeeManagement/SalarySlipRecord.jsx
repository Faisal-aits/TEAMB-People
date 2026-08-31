import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineEye, HiOutlineTrash, HiArrowLeft, HiOutlineDownload } from 'react-icons/hi';
import './Employee.css';

const SalarySlipRecord = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const employee = location.state?.employee;
  
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('Salary Slip');

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  useEffect(() => {
    fetchSalarySlips();
  }, [employee]);

  const fetchSalarySlips = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = employee
        ? `${API_URL}/api/documents/employee/${employee.employee_id || employee.id}`
        : `${API_URL}/api/documents/type/salary_slip`;

      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        const docs = response.data.documents || [];
        const salaryDocs = employee ? docs.filter(d => d.document_type === 'salary_slip') : docs;
        setSlips(salaryDocs);
      }
    } catch (err) {
      console.error('Failed to fetch salary slips:', err);
      setError('Failed to load salary slips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (doc) => {
    let url = doc.file_url || doc.file_path || doc.url || doc.pdf_url;
    if (url) {
      if (!url.startsWith('http')) {
        url = `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      setPdfPreviewTitle(doc.title || 'Salary Slip');
      setPdfPreviewUrl(url);
    } else {
      alert("Document URL not available.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfPreviewUrl) return;

    try {
      let downloadUrl = pdfPreviewUrl;
      let shouldRevoke = false;

      if (!pdfPreviewUrl.startsWith('blob:')) {
        const response = await fetch(pdfPreviewUrl);
        const blob = await response.blob();
        downloadUrl = window.URL.createObjectURL(blob);
        shouldRevoke = true;
      }

      const fileName = `${(pdfPreviewTitle || 'Salary_Slip').replace(/[^a-zA-Z0-9_\- ]/g, '_')}.pdf`;
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

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to permanently delete this salary slip? This action will remove it from both the admin and employee portals.")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/documents/${docId}`, {
        headers: getAuthHeaders()
      });
      alert("Salary slip deleted successfully.");
      setSlips(slips.filter(s => s.id !== docId));
    } catch (err) {
      console.error('Failed to delete salary slip:', err);
      alert('Failed to delete salary slip. Please try again.');
    }
  };

  const employeeDisplayName = employee
    ? (employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee')
    : null;

  return (
    <div className="employee-management-container">
      {employee && (
        <div className="header-actions">
          <button className="back-btn" onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px'
          }}>
            <HiArrowLeft /> Back
          </button>
        </div>
      )}

      <div className="table-container" style={{ padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>
          {employeeDisplayName ? `Salary Slips Record: ${employeeDisplayName}` : 'Salary Slips Records'}
        </h2>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading records...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : slips.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            {employee ? 'No salary slips have been generated for this employee yet.' : 'No salary slips found.'}
          </div>
        ) : (
          <table className="employee-table">
            <thead>
              <tr>
                {!employee && <th>Employee</th>}
                <th>Title / Month</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slips.map((doc) => (
                <tr key={doc.id}>
                  {!employee && (
                    <td>
                      <strong>{doc.employee_name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || doc.employee_id || 'Employee'}</strong>
                    </td>
                  )}
                  <td>
                    <strong>{doc.title || 'Salary Slip'}</strong>
                  </td>
                  <td>
                    {new Date(doc.generated_at || doc.upload_date || doc.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                      background: doc.is_sent ? '#dcfce7' : '#f1f5f9',
                      color: doc.is_sent ? '#166534' : '#475569'
                    }}>
                      {doc.is_sent ? 'Sent to Employee' : 'Generated'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleView(doc)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <HiOutlineEye size={18} /> View
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <HiOutlineTrash size={18} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
    </div>
  );
};

export default SalarySlipRecord;
