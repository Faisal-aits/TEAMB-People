// src/pages/Tenants.jsx
import React, { useState, useEffect } from 'react';
import { HiPlus, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import { superAdminAPI } from '../services/api';
import './Tenants.css';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '', slug: '', email: '', phone: '', address: '',
    subscription_plan: 'free', max_employees: 10,
    admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await superAdminAPI.getTenants({ search: search || undefined });
      setTenants(response.data.tenants);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    try {
      await superAdminAPI.createTenant(formData);
      setAlert({ type: 'success', message: 'Organization created successfully!' });
      setShowModal(false);
      setFormData({
        name: '', slug: '', email: '', phone: '', address: '',
        subscription_plan: 'free', max_employees: 10,
        admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: ''
      });
      fetchTenants();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create organization'
      });
    }
  };

  const handleToggleStatus = async (tenant) => {
    try {
      await superAdminAPI.updateTenant(tenant.id, { is_active: !tenant.is_active });
      fetchTenants();
      setAlert({
        type: 'success',
        message: `${tenant.name} has been ${tenant.is_active ? 'deactivated' : 'activated'}`
      });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update status' });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        Loading organizations...
      </div>
    );
  }

  return (
    <div className="tenants-page fade-in">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      )}

      <div className="page-header">
        <h1>Organizations</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <HiPlus size={18} /> Add Organization
        </button>
      </div>

      <div className="search-bar">
        <input
          id="tenant-search"
          type="text"
          className="search-input"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {tenants.length === 0 ? (
        <div className="empty-state">
          <h3>No Organizations Yet</h3>
          <p>Create your first organization to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <HiPlus size={18} /> Create Organization
          </button>
        </div>
      ) : (
        <div className="tenants-grid">
          {tenants.map((tenant) => (
            <div className="tenant-card" key={tenant.id}>
              <div className="tenant-card-header">
                <div>
                  <div className="tenant-name">{tenant.name}</div>
                  <div className="tenant-slug">/{tenant.slug}</div>
                </div>
                <span className={`badge ${tenant.is_active ? 'active' : 'inactive'}`}>
                  {tenant.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="tenant-info">
                <div className="info-item">
                  <span className="info-label">Plan</span>
                  <span className="info-value">
                    <span className={`badge ${tenant.subscription_plan}`}>
                      {tenant.subscription_plan}
                    </span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Users</span>
                  <span className="info-value">{tenant.total_users || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Employees</span>
                  <span className="info-value">{tenant.total_employees || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Departments</span>
                  <span className="info-value">{tenant.total_departments || 0}</span>
                </div>
              </div>

              <div className="tenant-card-footer">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {tenant.email}
                </span>
                <button
                  className={tenant.is_active ? 'btn-danger' : 'btn-secondary'}
                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(tenant); }}
                >
                  {tenant.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tenant Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Organization</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiXMark />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="form-section-title">Organization Details</div>
                  
                  <div className="form-group">
                    <label>Organization Name *</label>
                    <input
                      id="tenant-name"
                      type="text"
                      className="form-input"
                      placeholder="Acme Corporation"
                      value={formData.name}
                      onChange={handleNameChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Slug (URL identifier) *</label>
                      <input
                        id="tenant-slug"
                        type="text"
                        className="form-input"
                        placeholder="acme-corp"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        id="tenant-email"
                        type="email"
                        className="form-input"
                        placeholder="admin@acme.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="+91 XXXXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subscription Plan</label>
                      <select
                        className="form-select"
                        value={formData.subscription_plan}
                        onChange={(e) => setFormData(prev => ({ ...prev, subscription_plan: e.target.value }))}
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Max Employees</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.max_employees}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_employees: parseInt(e.target.value) || 10 }))}
                    />
                  </div>

                  <hr className="form-divider" />
                  <div className="form-section-title">Admin Account</div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Admin First Name *</label>
                      <input
                        id="admin-first-name"
                        type="text"
                        className="form-input"
                        placeholder="John"
                        value={formData.admin_first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, admin_first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Admin Last Name *</label>
                      <input
                        id="admin-last-name"
                        type="text"
                        className="form-input"
                        placeholder="Doe"
                        value={formData.admin_last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, admin_last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Admin Email *</label>
                      <input
                        id="admin-email"
                        type="email"
                        className="form-input"
                        placeholder="john@acme.com"
                        value={formData.admin_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Admin Password</label>
                      <input
                        id="admin-password"
                        type="password"
                        className="form-input"
                        placeholder="Leave empty for first-login setup"
                        value={formData.admin_password}
                        onChange={(e) => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
