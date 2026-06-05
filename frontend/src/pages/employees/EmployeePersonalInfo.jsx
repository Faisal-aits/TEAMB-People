// src/pages/employees/EmployeePersonalInfo.jsx
import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../services/employeeAPI';
import './EmployeePersonalInfo.css';

const EmployeePersonalInfo = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getMyProfile();
      if (response.data && response.data.employee) {
        setProfile(response.data.employee);
      } else {
        setError('Profile data not found');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.message || 'Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = () => {
    if (!profile) return 'U';
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (!profile) return 'User';
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  };

  if (loading) {
    return (
      <div className="personal-info-section">
        <div className="pi-loading-container">
          <div className="pi-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personal-info-section">
        <div className="pi-error-container">
          <p className="pi-error-message">{error}</p>
          <button onClick={loadProfile} className="pi-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-info-section">
      <h2 className="pi-page-title">Profile</h2>

      <div className="pi-profile-card">
        {/* Profile Header */}
        <div className="pi-profile-header">
          <div className="pi-avatar">
            <span className="pi-avatar-text">{getInitials()}</span>
          </div>
          <div className="pi-profile-details">
            <h3 className="pi-full-name">{getFullName()}</h3>
            <p className="pi-designation">
              {profile?.position || profile?.designation || 'Employee'}
            </p>
            <p className="pi-department">
              {profile?.department_name || '-'}
            </p>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="pi-info-grid">
          <div className="pi-info-card">
            <span className="pi-info-label">EMPLOYEE ID</span>
            <span className="pi-info-value">{profile?.employee_id || profile?.id || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">EMAIL</span>
            <span className="pi-info-value">{profile?.email || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">PHONE</span>
            <span className="pi-info-value">{profile?.phone || '-'}</span>
          </div>
          <div className="pi-info-card">
            <span className="pi-info-label">DATE OF JOINING</span>
            <span className="pi-info-value">{formatDate(profile?.joining_date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePersonalInfo;
