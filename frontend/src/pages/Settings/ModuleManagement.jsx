import React, { useState, useEffect, useCallback } from 'react';
import { moduleAccessAPI } from '../../services/moduleAccessAPI';
import './ModuleManagement.css';

const ACCESS_OPTIONS = [
  { value: 'write', label: 'Read & Write' },
  { value: 'read', label: 'Read Only' },
  { value: 'none', label: 'No Access' },
];

const formatLastActive = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString();
};

const ModuleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [moduleAccess, setModuleAccess] = useState([]);
  const [saving, setSaving] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await moduleAccessAPI.listUsers();
      setUsers(response.data?.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openManageModal = async (user) => {
    setSelectedUser(user);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const response = await moduleAccessAPI.getUserAccess(user.id);
      const data = response.data?.data;
      setModuleAccess(data?.modules || []);
    } catch (err) {
      console.error('Failed to load access:', err);
      setError('Failed to load module access for this user.');
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setModuleAccess([]);
  };

  const handleAccessChange = (moduleKey, access) => {
    setModuleAccess((prev) =>
      prev.map((m) =>
        m.module_key === moduleKey ? { ...m, access } : m
      )
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await moduleAccessAPI.updateUserAccess(
        selectedUser.id,
        moduleAccess.map((m) => ({
          module_key: m.module_key,
          access: m.access,
        }))
      );
      await fetchUsers();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save module access.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="module-management">
      <div className="module-management-header">
        <div>
          <h2>Module Management</h2>
          <p className="module-management-subtitle">
            Manage which modules each user can access and their permission level.
          </p>
        </div>
        <button type="button" className="mm-refresh-btn" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      {error && <div className="mm-error">{error}</div>}

      <div className="mm-table-wrap glass-form">
        {loading ? (
          <p className="mm-loading">Loading users...</p>
        ) : (
          <table className="mm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Position</th>
                <th>Last Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="mm-empty">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.first_name} {user.last_name}
                      {user.system_role === 'admin' && (
                        <span className="mm-badge-admin">Admin</span>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.job_position}</td>
                    <td>{formatLastActive(user.last_active_at)}</td>
                    <td>
                      {user.system_role === 'admin' ? (
                        <span className="mm-full-access">Full access</span>
                      ) : (
                        <button
                          type="button"
                          className="mm-manage-btn"
                          onClick={() => openManageModal(user)}
                        >
                          Manage Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="mm-modal-overlay" onClick={closeModal} role="presentation">
          <div
            className="mm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="mm-modal-title"
          >
            <div className="mm-modal-header">
              <h3 id="mm-modal-title">
                Manage Module Access
                {selectedUser && (
                  <span className="mm-modal-user">
                    — {selectedUser.first_name} {selectedUser.last_name}
                  </span>
                )}
              </h3>
              <button type="button" className="mm-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            {modalLoading ? (
              <p className="mm-loading">Loading access...</p>
            ) : (
              <>
                <div className="mm-modal-modules">
                  {moduleAccess.map((mod) => (
                    <div key={mod.module_key} className="mm-module-row">
                      <span className="mm-module-name">{mod.name}</span>
                      <div className="mm-access-options">
                        {ACCESS_OPTIONS.map((opt) => (
                          <label key={opt.value} className="mm-access-label">
                            <input
                              type="radio"
                              name={`access-${mod.module_key}`}
                              value={opt.value}
                              checked={mod.access === opt.value}
                              onChange={() =>
                                handleAccessChange(mod.module_key, opt.value)
                              }
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mm-modal-actions">
                  <button type="button" className="mm-cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="mm-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Access'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleManagement;
