import { useEffect, useState } from 'react';
import { leaveAPI } from '../../services/leaveAPI';
import axios from 'axios';
import './CompanySettings.css';

const LeavePolicy = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const leaveRes = await leaveAPI.getLeaveTypeSettings();
      const types = (leaveRes.data?.leave_types || []).filter(t => String(t.name || '').trim().toLowerCase() !== 'unpaid');
      setLeaveTypes(types);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load settings'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateDraftType = (typeId, key, value) => {
    setLeaveTypes((prev) => prev.map((type) => (
      type.id === typeId ? { ...type, [key]: value } : type
    )));
  };

  const validateMaxDays = (value) => {
    const maxDays = Number.parseInt(value, 10);
    if (!Number.isInteger(maxDays) || maxDays < 0 || maxDays > 365) {
      setMessage({ type: 'error', text: 'Annual days must be between 0 and 365.' });
      return null;
    }
    return maxDays;
  };

  const saveLeaveType = async (type) => {
    const maxDays = validateMaxDays(type.max_days);
    if (maxDays === null) return;

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await leaveAPI.updateLeaveType(type.id, {
        max_days: maxDays,
        allocation_frequency: type.allocation_frequency || 'Yearly',
        is_paid: Boolean(type.is_paid),
        is_active: type.is_active
      });
      setMessage({ type: 'success', text: 'Leave type updated successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update leave type'
      });
    } finally {
      setSaving(false);
    }
  };

      // Probation Settings removed

  return (
    <div className="company-settings-container">
      <header className="company-settings-header">
        <h2>Leave Policy</h2>
        <p>Manage leave types, allowances, and allocation frequencies</p>
      </header>

      {message.text && (
        <div className={`app-alert app-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* General Settings removed to its own sub-module */}

      {/* Leave Policy Settings */}
      <section className="company-settings-section">
        <h3>Leave Policy</h3>
        <div className="company-settings-actions">
          {/* We only update existing statically seeded types now */}
        </div>

        {loading ? (
          <div className="company-settings-loading">Loading leave types...</div>
        ) : (
          <div className="company-settings-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Allowance (Per Period)</th>
                  <th>Frequency</th>
                  <th>Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((type) => (
                  <tr key={type.id}>
                    <td>
                      <strong>{type.name}</strong>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={type.max_days}
                        onChange={(event) => updateDraftType(type.id, 'max_days', event.target.value)}
                        disabled={saving}
                      />
                    </td>
                    <td>
                      <select
                        value={type.allocation_frequency || 'Yearly'}
                        onChange={(event) => updateDraftType(type.id, 'allocation_frequency', event.target.value)}
                        disabled={saving}
                        className="app-select"
                      >
                        <option value="Yearly">Yearly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="None">None</option>
                      </select>
                    </td>
                    <td>
                      {Boolean(type.is_paid) ? 'Yes' : 'No'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="app-button app-button-secondary"
                        onClick={() => saveLeaveType(type)}
                        disabled={saving}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaveTypes.length === 0 && (
              <div className="company-settings-empty">No leave types configured yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default LeavePolicy;
