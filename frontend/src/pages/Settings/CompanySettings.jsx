import { useEffect, useState } from 'react';
import axios from 'axios';
import './CompanySettings.css';

const CompanySettings = () => {
  const [enableProbation, setEnableProbation] = useState(true);
  const [probationMonths, setProbationMonths] = useState('');
  const [salaryFormat, setSalaryFormat] = useState('Monthly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadSettings = async () => {
    try {
      setLoading(true);

      const settingsRes = await axios.get('/api/settings/probation_months', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProbationMonths(settingsRes.data?.value || '4');

      const enableRes = await axios.get('/api/settings/enable_probation', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const rawVal = enableRes.data?.value;
      setEnableProbation(rawVal === null || rawVal === undefined || rawVal === '' ? true : rawVal === 'true');

      const formatRes = await axios.get('/api/settings/salary_format', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSalaryFormat(formatRes.data?.value || 'Monthly');
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

  const saveProbationSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await axios.put('/api/settings/probation_months', 
        { value: probationMonths },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      await axios.put('/api/settings/enable_probation', 
        { value: enableProbation ? 'true' : 'false' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      await axios.put('/api/settings/salary_format', 
        { value: salaryFormat },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessage({ type: 'success', text: 'General settings updated successfully.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update general settings'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="company-settings-container">
      <header className="company-settings-header">
        <h2>Company Settings</h2>
        <p>Manage global configurations like probation and salary formats</p>
      </header>

      {message.text && (
        <div className={`app-alert app-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Probation Settings */}
      <section className="company-settings-section">
        <h3>General Settings</h3>
        {loading ? (
          <div className="company-settings-loading">Loading settings...</div>
        ) : (
          <div className="company-settings-card">
             <div className="form-group" style={{ maxWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <input
                    type="checkbox"
                    checked={enableProbation}
                    onChange={(e) => setEnableProbation(e.target.checked)}
                    disabled={saving}
                    style={{ width: 'auto', marginBottom: 0 }}
                  />
                  <label style={{ marginBottom: 0 }}>Enable Probation Period</label>
                </div>
                <label>Default Probation Period (Months)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={probationMonths}
                    onChange={(e) => setProbationMonths(e.target.value)}
                    disabled={saving || !enableProbation}
                  />
                </div>
             </div>
             <div className="form-group" style={{ maxWidth: '300px', marginTop: '15px' }}>
                <label>Default Salary Format</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={salaryFormat}
                    onChange={(e) => setSalaryFormat(e.target.value)}
                    disabled={saving}
                    className="app-select"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly (CTC)</option>
                  </select>
                </div>
             </div>
             <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={saveProbationSettings}
                  disabled={saving}
                >
                  Save Settings
                </button>
             </div>
          </div>
        )}
      </section>

      {/* Leave Policy Settings removed to its own sub-module */}
    </div>
  );
};

export default CompanySettings;
