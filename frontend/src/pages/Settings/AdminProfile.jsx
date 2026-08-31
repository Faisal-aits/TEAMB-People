import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminProfile = () => {
  const { user } = useAuth();
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    try {
      setSubmitLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      window.alert('Password changed successfully');
      setShowResetPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="employee-info-container">
      <div className="info-header">
        <h2><i className="fas fa-user-circle"></i> Admin Profile</h2>
      </div>

      <div className="info-content" style={{ marginTop: '20px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Name</p>
            <p style={{ margin: 0, fontWeight: '500', fontSize: '16px' }}>{user?.first_name} {user?.last_name}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Email</p>
            <p style={{ margin: 0, fontWeight: '500', fontSize: '16px' }}>{user?.email}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Role</p>
            <p style={{ margin: 0, fontWeight: '500', fontSize: '16px', textTransform: 'capitalize' }}>{user?.position}</p>
          </div>
        </div>
        
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button 
            type="button" 
            className="reset-password-btn footer-btn" 
            onClick={() => setShowResetPasswordForm(true)}
            style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fas fa-key"></i> Change Password
          </button>
        </div>
      </div>

      {showResetPasswordForm && (
        <div className="modal-overlay">
          <div className="modal-content1 reset-password-modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2><i className="fas fa-key"></i> Change Password</h2>
              <button className="close-btn" onClick={() => setShowResetPasswordForm(false)}>×</button>
            </div>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                {passwordError && <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', background: '#fef2f2', borderRadius: '4px', fontSize: '14px' }}>{passwordError}</div>}
                
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#374151' }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="cancel-btn footer-btn" onClick={() => setShowResetPasswordForm(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn footer-btn" disabled={submitLoading} style={{ padding: '8px 16px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  {submitLoading ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
