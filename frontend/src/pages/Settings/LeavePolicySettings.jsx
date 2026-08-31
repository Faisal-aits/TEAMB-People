import { useEffect, useState } from 'react';
import { leaveAPI } from '../../services/leaveAPI';
import './LeavePolicySettings.css';

const emptyLeaveType = {
  name: '',
  max_days: '',
  is_paid: true
};

const LeavePolicySettings = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getLeaveTypeSettings();
      const types = (response.data?.leave_types || []).filter(t => String(t.name || '').trim().toLowerCase() !== 'unpaid');
      setLeaveTypes(types);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load leave policy settings'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
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
        is_active: Boolean(type.is_active)
      });
      setMessage({ type: 'success', text: 'Leave policy updated.' });
      await loadLeaveTypes();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save leave policy'
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="leave-policy-page app-page">
      <div className="leave-policy-header app-page-header">
        <div>
          <h2 className="app-page-title">Leave Policy Settings</h2>
          <p className="app-page-subtitle">Configure annual leave allocation and leave type availability.</p>
        </div>
      </div>

      {message.text && (
        <div className={`app-message ${message.type === 'success' ? 'app-message-success' : 'app-message-error'}`}>
          {message.text}
        </div>
      )}


      <section className="leave-policy-panel app-card">
        <div className="leave-policy-table-header">
          <h3 className="app-section-title">Configured Leave Types</h3>
          <span>{leaveTypes.length} total</span>
        </div>

        {loading ? (
          <div className="leave-policy-empty">Loading leave policy settings...</div>
        ) : (
          <div className="leave-policy-table-wrap">
            <table className="leave-policy-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Total Annual Days</th>
                  <th>Frequency</th>
                  <th>Paid</th>
                  <th>Action</th>
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
              <div className="leave-policy-empty">No leave types configured yet.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default LeavePolicySettings;
