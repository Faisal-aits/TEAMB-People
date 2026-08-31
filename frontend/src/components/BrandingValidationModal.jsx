import React from 'react';

const BrandingValidationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleNavigate = () => {
    // Determine the correct branding tab depending on whether user is admin or something else
    // Most common is "company-branding" for admin or "branding" for main admin layout
    // We will set branding and reload to ensure the layout picks it up
    localStorage.setItem("activeTab", "branding");
    window.location.href = '/admin';
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-content" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '450px', width: '100%', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Branding Setup Required</h3>
        <p style={{ color: '#475569', marginBottom: '25px', lineHeight: '1.5' }}>
          Please configure your Company Branding in the Settings menu before generating HR documents. This ensures your documents are properly branded with your company details.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button
            type="button"
            className="submit-btn"
            style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
            onClick={handleNavigate}
          >
            Go to Settings
          </button>
          <button
            type="button"
            className="cancel-btn"
            style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandingValidationModal;
