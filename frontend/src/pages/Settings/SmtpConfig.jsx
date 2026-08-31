import { useEffect, useState } from 'react';
import { serviceSettingAPI } from '../../services/serviceSettingAPI';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './SmtpConfig.css';

const emptyForm = {
  host: '',
  port: '587',
  username: '',
  password: '',
  from_email: '',
  from_name: '',
  encryption: 'tls',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SmtpConfig = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await serviceSettingAPI.getSmtpDetails();
        const smtp = response.data.smtp;
        const loginEmail = user?.email || '';
        if (smtp) {
          setForm({
            host: smtp.host || '',
            port: smtp.port || '',
            username: smtp.username || loginEmail,
            password: '',
            from_email: smtp.from_email || loginEmail,
            from_name: smtp.from_name || '',
            encryption: smtp.encryption || 'tls',
          });
          setHasPassword(Boolean(smtp.has_password));
          setTestEmail(smtp.from_email || loginEmail);
        } else {
          // No config saved yet — pre-fill with logged-in admin's email
          setForm((prev) => ({
            ...prev,
            username: loginEmail,
            from_email: loginEmail,
          }));
          setTestEmail(loginEmail);
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load SMTP settings' });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-sync From Email with SMTP Username
      if (name === 'username') {
        updated.from_email = value;
      }
      return updated;
    });
  };

  const validateForm = () => {
    const errors = [];
    const port = Number(form.port);
    if (!form.host.trim()) errors.push('SMTP Host is required');
    if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('SMTP Port must be between 1 and 65535');
    if (!form.username.trim()) errors.push('SMTP Username is required');
    if (!hasPassword && !form.password.trim()) errors.push('SMTP Password is required');
    if (!emailRegex.test(form.from_email.trim())) errors.push('From Email must be valid');
    if (!form.from_name.trim()) errors.push('From Name is required');
    return errors;
  };

  const saveConfig = async (event) => {
    event.preventDefault();
    const errors = validateForm();
    if (errors.length) {
      setMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const response = await serviceSettingAPI.updateSmtpDetails({
        ...form,
        port: Number(form.port),
      });
      setHasPassword(Boolean(response.data.smtp?.has_password));
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage({ type: 'success', text: response.data.message || 'SMTP settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save SMTP settings' });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!emailRegex.test(testEmail.trim())) {
      setMessage({ type: 'error', text: 'Enter a valid test email address' });
      return;
    }

    try {
      setTesting(true);
      setMessage({ type: '', text: '' });
      const response = await serviceSettingAPI.sendSmtpTestEmail(testEmail.trim());
      setMessage({ type: 'success', text: response.data.message || 'Test email sent successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send test email' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="smtp-settings-page">Loading SMTP settings...</div>;
  }

  return (
    <div className="smtp-settings-page">
      <div className="smtp-settings-header">
        <h2>SMTP Config</h2>
        <p>Configure outgoing email for employee credentials and system notifications.</p>
      </div>

      {message.text && (
        <div className={`smtp-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="smtp-form" onSubmit={saveConfig}>
        <div className="smtp-grid">
          <div className="form-group">
            <label>SMTP Host *</label>
            <input name="host" value={form.host} onChange={updateField} placeholder="smtp.example.com" />
          </div>
          <div className="form-group">
            <label>SMTP Port *</label>
            <input name="port" type="number" min="1" max="65535" value={form.port} onChange={updateField} placeholder="587" />
          </div>
          <div className="form-group">
            <label>SMTP Username *</label>
            <input name="username" value={form.username} onChange={updateField} placeholder="user@example.com" />
          </div>
          <div className="form-group smtp-password-group">
            <label>SMTP Password {hasPassword ? '' : '*'}</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder={hasPassword ? 'Leave blank to keep existing password' : 'Enter App Password (not your email password)'}
              autoComplete="new-password"
            />
            <div className="smtp-password-hint">
              <div className="smtp-hint-title">⚠️ This is NOT your regular email password</div>
              <div className="smtp-hint-body">
                Gmail and Outlook require an <strong>App Password</strong> — a special 16-character code generated from your account security settings.
              </div>
              <div className="smtp-hint-links">
                <span>📌 How to get it:</span>
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">Gmail App Password ↗</a>
                <a href="https://account.microsoft.com/security" target="_blank" rel="noreferrer">Outlook App Password ↗</a>
              </div>
              <div className="smtp-hint-steps">
                <strong>Gmail steps:</strong> Google Account → Security → 2-Step Verification → App Passwords → Select app → Generate
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>From Email *</label>
            <input name="from_email" type="email" value={form.from_email} onChange={updateField} placeholder="no-reply@work-desk.tech" />
          </div>
          <div className="form-group">
            <label>From Name *</label>
            <input name="from_name" value={form.from_name} onChange={updateField} placeholder="TEAM B People" />
          </div>
          <div className="form-group">
            <label>Encryption *</label>
            <select name="encryption" value={form.encryption} onChange={updateField}>
              <option value="none">None</option>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
            </select>
          </div>
        </div>

        <div className="smtp-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save SMTP Config'}
          </button>
        </div>
      </form>

      <div className="smtp-test-panel">
        <h3>Send Test Email</h3>
        <div className="smtp-test-row">
          <input
            type="email"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
            placeholder="recipient@example.com"
          />
          <button type="button" className="cancel-btn" onClick={sendTest} disabled={testing}>
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmtpConfig;
