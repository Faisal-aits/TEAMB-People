import React, { useState, useEffect } from 'react';
import { HiPaperAirplane, HiExclamationTriangle, HiEnvelope, HiLockClosed, HiCheckBadge } from 'react-icons/hi2';
import { superAdminAPI } from '../services/api';
import './SmtpSettings.css';

const defaultGmailForm = {
  host: 'smtp.gmail.com',
  port: '587',
  username: '',
  password: '',
  from_email: '',
  from_name: 'TEAM B People',
  encryption: 'tls',
};

const SmtpSettings = () => {
  const [form, setForm] = useState(defaultGmailForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    const fetchSmtpConfig = async () => {
      try {
        setLoading(true);
        const res = await superAdminAPI.getSmtpConfig();
        if (res.data?.smtp) {
          const s = res.data.smtp;
          setForm({
            host: s.host || 'smtp.gmail.com',
            port: String(s.port || '587'),
            username: s.username || 'kf94482@gmail.com',
            password: '',
            from_email: s.from_email || s.username || 'kf94482@gmail.com',
            from_name: s.from_name || 'TEAM B People',
            encryption: s.encryption || 'tls',
          });
          setHasPassword(Boolean(s.has_password));
        }
      } catch (err) {
        console.error('Failed to load SMTP config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmtpConfig();
  }, []);

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!hasPassword && !form.password) {
      showAlert('error', 'Please enter your 16-character Gmail App Password');
      return;
    }

    try {
      setSaving(true);
      const res = await superAdminAPI.updateSmtpConfig(form);
      showAlert('success', res.data?.message || 'Gmail App Password saved successfully!');
      if (form.password) {
        setHasPassword(true);
        setForm(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save App Password');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      showAlert('error', 'Please enter a recipient email for testing');
      return;
    }

    try {
      setTesting(true);
      const res = await superAdminAPI.testSmtpConfig({ to: testEmail });
      showAlert('success', res.data?.message || `Test email sent to ${testEmail}`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'SMTP Test Failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        Loading Gmail settings...
      </div>
    );
  }

  return (
    <div className="smtp-settings-page fade-in">
      {alert && (
        <div
          className={`alert alert-${alert.type}`}
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 999999,
            maxWidth: '480px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {alert.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Gmail App Password Setup</h1>
          <p className="page-subtitle">
            All Gmail SMTP server settings are pre-configured automatically. Simply enter your 16-character Gmail App Password below to enable automated welcome emails.
          </p>
        </div>
      </div>

      <div className="smtp-card main-app-password-card">
        <form onSubmit={handleSave} className="smtp-form">
          
          {/* Main App Password Field - Front & Center */}
          <div className="app-password-hero-section">
            <div className="hero-label">
              <HiLockClosed className="hero-icon" />
              <span>Gmail App Password {hasPassword && <HiCheckBadge className="verified-badge" title="App Password Active" />}</span>
            </div>
            <input
              type="password"
              name="password"
              className="hero-input"
              placeholder={hasPassword ? '•••• •••• •••• •••• (App Password active - enter new one to change)' : 'Enter 16-character Gmail App Password (e.g. abcd efgh ijkl mnop)'}
              value={form.password}
              onChange={updateField}
              autoComplete="new-password"
            />
            {hasPassword && (
              <div className="status-pill active">
                ✓ Gmail App Password is configured and ready to send organization welcome emails
              </div>
            )}
          </div>

          {/* Guidance Box */}
          <div className="smtp-guidance-box">
            <div className="guidance-title">
              <HiExclamationTriangle /> How to get your Gmail App Password:
            </div>
            <div className="guidance-body">
              Google requires a <strong>16-character App Password</strong> (not your normal email password) to allow automated email delivery.
            </div>
            <div className="guidance-links">
              <span>📌 Step 1: Open Google Security Settings:</span>
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">
                Generate Gmail App Password ↗
              </a>
            </div>
            <div className="guidance-steps">
              <strong>Step 2 Steps:</strong> Select App → <em>Mail</em>, Select Device → <em>Other (TEAM B People)</em> → Click <strong>Generate</strong> → Copy the 16-character code and paste it above.
            </div>
          </div>

          {/* Pre-filled Gmail Details */}
          <div className="prefilled-section">
            <h3 className="section-title">Gmail Configuration Defaults</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Gmail / Admin Email Address</label>
                <input
                  type="email"
                  name="username"
                  className="form-input"
                  value={form.username}
                  onChange={updateField}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sender Name</label>
                <input
                  type="text"
                  name="from_name"
                  className="form-input"
                  value={form.from_name}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SMTP Host</label>
                <input
                  type="text"
                  name="host"
                  className="form-input"
                  value={form.host}
                  onChange={updateField}
                  required
                />
              </div>
              <div className="form-group">
                <label>SMTP Port</label>
                <input
                  type="number"
                  name="port"
                  className="form-input"
                  value={form.port}
                  onChange={updateField}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary hero-btn" disabled={saving}>
              {saving ? 'Saving App Password...' : 'Save App Password & Enable Emails'}
            </button>
          </div>
        </form>
      </div>

      {/* Test Email Panel */}
      <div className="smtp-card test-card">
        <div className="card-title">
          <HiEnvelope /> Send Test Email
        </div>
        <p className="card-subtitle">
          Test sending an email to verify your 16-character App Password connection.
        </p>

        <form onSubmit={handleTestEmail} className="test-form">
          <div className="test-input-group">
            <input
              type="email"
              className="form-input"
              placeholder="Enter recipient email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn-secondary" disabled={testing}>
              <HiPaperAirplane />
              {testing ? 'Sending Test...' : 'Send Test Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmtpSettings;
