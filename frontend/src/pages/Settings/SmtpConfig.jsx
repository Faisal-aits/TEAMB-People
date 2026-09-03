import React, { useState, useEffect } from 'react';
import { serviceSettingAPI } from '../../services/serviceSettingAPI';
import { useAuth } from '../../contexts/AuthContext';
import './SmtpConfig.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SmtpConfig = () => {
  const { user } = useAuth();
  
  const [configs, setConfigs] = useState({
    outlook_graph: { azure_tenant_id: '', azure_client_id: '', azure_client_secret: '', from_email: '', from_name: 'TEAM B People' },
    gmail: { host: 'smtp.gmail.com', port: '587', username: '', password: '', from_email: '', from_name: 'TEAM B People', encryption: 'tls' },
    smtp: { host: '', port: '587', username: '', password: '', from_email: '', from_name: 'TEAM B People', encryption: 'tls' }
  });
  const [provider, setProvider] = useState('outlook_graph');
  const [savedProvider, setSavedProvider] = useState('outlook_graph');

  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasPassword, setHasPassword] = useState(false);
  const [hasAzureSecret, setHasAzureSecret] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loginEmail = user?.email || '';
        const response = await serviceSettingAPI.getSmtpDetails();
        const smtp = response.data?.smtp;

        if (smtp) {
          const prov = smtp.provider || 'outlook_graph';
          setProvider(prov);
          setSavedProvider(prov);
          setHasPassword(Boolean(smtp.has_password));
          setHasAzureSecret(Boolean(smtp.has_azure_client_secret));
          setTestEmail(smtp.from_email || loginEmail);
          
          setConfigs(prev => ({
            ...prev,
            [prov]: {
              azure_tenant_id: smtp.azure_tenant_id || '',
              azure_client_id: smtp.azure_client_id || '',
              azure_client_secret: '',
              host: smtp.host || (prov === 'gmail' ? 'smtp.gmail.com' : 'smtp.office365.com'),
              port: smtp.port || '587',
              username: smtp.username || loginEmail,
              password: '',
              from_email: smtp.from_email || loginEmail,
              from_name: smtp.from_name || 'TEAM B People',
              encryption: smtp.encryption || 'tls'
            }
          }));
        } else {
          setConfigs(prev => ({
            ...prev,
            outlook_graph: { ...prev.outlook_graph, username: loginEmail, from_email: loginEmail }
          }));
          setTestEmail(loginEmail);
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load email settings' });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [user]);

  const selectProvider = (newProvider) => {
    setProvider(newProvider);
    setMessage({ type: '', text: '' });
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setConfigs(prev => {
      const updatedConfig = { ...prev[provider], [name]: value };
      if (name === 'username' && provider !== 'outlook_graph') {
        updatedConfig.from_email = value;
      }
      return { ...prev, [provider]: updatedConfig };
    });
  };

  const validateForm = () => {
    const errors = [];
    const activeForm = configs[provider];
    
    if (!emailRegex.test(activeForm.from_email.trim())) errors.push('Sender / From Email must be valid');
    if (!activeForm.from_name.trim()) errors.push('From Name is required');

    if (provider === 'outlook_graph') {
      if (!activeForm.azure_tenant_id.trim()) errors.push('Azure Directory (tenant) ID is required');
      if (!activeForm.azure_client_id.trim()) errors.push('Azure Application (client) ID is required');
      if (!hasAzureSecret && !activeForm.azure_client_secret.trim()) errors.push('Azure Client Secret is required');
    } else {
      const port = Number(activeForm.port);
      if (!activeForm.host.trim()) errors.push('SMTP Host is required');
      if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('SMTP Port must be between 1 and 65535');
      if (!activeForm.username.trim()) errors.push('SMTP Username is required');
      if (!hasPassword && !activeForm.password.trim()) errors.push('SMTP Password is required');
    }
    return errors;
  };

  const saveConfig = async (event) => {
    event.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join('. ') });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const payload = { provider, ...configs[provider] };
      await serviceSettingAPI.updateSmtpDetails(payload);
      setMessage({ type: 'success', text: 'Email Configuration saved successfully!' });
      setSavedProvider(provider);
      
      // Update has flags since we just saved
      if (provider === 'outlook_graph' && configs[provider].azure_client_secret) setHasAzureSecret(true);
      if (provider !== 'outlook_graph' && configs[provider].password) setHasPassword(true);
      
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!emailRegex.test(testEmail.trim())) {
      setMessage({ type: 'error', text: 'Enter a valid test recipient email address' });
      return;
    }

    if (provider !== savedProvider) {
      setMessage({ type: 'error', text: 'You have changed the mail provider. Please click "Save Email Configuration" first before testing.' });
      return;
    }

    try {
      setTesting(true);
      setMessage({ type: '', text: '' });
      const response = await serviceSettingAPI.sendSmtpTestEmail(testEmail.trim());
      setMessage({ type: 'success', text: response.data.message || 'Test email sent successfully! Please check your inbox.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send test email' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="smtp-settings-page"><div className="smtp-loading">Loading Email Settings...</div></div>;
  }

  const activeForm = configs[provider];

  return (
    <div className="smtp-settings-page">
      <div className="smtp-settings-header">
        <h2>Email &amp; SMTP Configuration</h2>
        <p>Configure your organization&apos;s outgoing mailbox for employee welcome credentials, offer letters, salary slips, and leave notifications.</p>
      </div>

      {message.text && (
        <div className={`smtp-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="provider-selector-container">
        <label className="provider-selector-label">Select Outgoing Mail Provider:</label>
        <div className="provider-cards-grid">
          <div
            className={`provider-card ${provider === 'outlook_graph' ? 'active' : ''}`}
            onClick={() => selectProvider('outlook_graph')}
          >
            <div className="provider-card-header">
              <span className="provider-badge microsoft-badge">Default (Recommended)</span>
              <span className="provider-icon">📘</span>
            </div>
            <div className="provider-card-body">
              <h4>Microsoft 365 / Outlook</h4>
              <p>Modern OAuth 2.0 via Microsoft Graph API. Works with business domains (e.g. <strong>@teambindia.com</strong>) without app passwords or basic auth issues.</p>
            </div>
          </div>

          <div
            className={`provider-card ${provider === 'gmail' ? 'active' : ''}`}
            onClick={() => selectProvider('gmail')}
          >
            <div className="provider-card-header">
              <span className="provider-badge google-badge">Google App Password</span>
              <span className="provider-icon">📕</span>
            </div>
            <div className="provider-card-body">
              <h4>Gmail / Google Workspace</h4>
              <p>Standard SMTP using Google&apos;s 16-character App Password. Works for personal <strong>@gmail.com</strong> and Google Workspace business domains.</p>
            </div>
          </div>

          <div
            className={`provider-card ${provider === 'smtp' ? 'active' : ''}`}
            onClick={() => selectProvider('smtp')}
          >
            <div className="provider-card-header">
              <span className="provider-badge custom-badge">Other Mail Servers</span>
              <span className="provider-icon">⚙️</span>
            </div>
            <div className="provider-card-body">
              <h4>Custom SMTP Server</h4>
              <p>Connect to any standard mail server, cPanel webmail, Amazon SES, SendGrid, or custom hosting provider.</p>
            </div>
          </div>
        </div>
      </div>

      {provider === 'outlook_graph' && (
        <div className="provider-guide-box microsoft-guide">
          <div className="guide-title">
            <span>📘</span> Microsoft 365 Setup Guide (One-Time Setup in ~3 Minutes)
          </div>
          <div className="guide-subtitle">
            Because Microsoft disabled legacy passwords in business mailboxes, your Microsoft 365 administrator registers a secure app key in Azure Portal:
          </div>
          <ol className="guide-steps">
            <li>
              <strong>Open Azure Portal:</strong> Go to <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" target="_blank" rel="noreferrer">Azure Portal +' App registrations +-</a> and sign in with your M365 admin account.
            </li>
            <li>
              <strong>Register App:</strong> Click <strong>+ New registration</strong> +' Name it <code>TEAM B HRMS</code> +' Select <em>Accounts in this organizational directory only</em> +' Click <strong>Register</strong>.
            </li>
            <li>
              <strong>Copy IDs:</strong> From the Overview page, copy the <strong>Application (client) ID</strong> and <strong>Directory (tenant) ID</strong> and paste them into the fields below.
            </li>
            <li>
              <strong>Create Secret:</strong> Click <strong>Certificates &amp; secrets</strong> (left sidebar) +' <strong>+ New client secret</strong> +' Description: <code>HRMS Email</code> +' Click <strong>Add</strong> +' Copy the <strong>Value</strong> and paste into <em>Client Secret</em> below.
            </li>
            <li>
              <strong>Grant Mail Permission:</strong> Click <strong>API permissions</strong> +' <strong>+ Add a permission</strong> +' <strong>Microsoft Graph</strong> +' <strong>Application permissions</strong> +' Check <code>Mail.Send</code> +' Click <strong>Add permissions</strong> +' Click &quot;<strong>Grant admin consent for [Your Company]</strong>&quot; (ensure a green checkmark appears).
            </li>
          </ol>
        </div>
      )}

      {provider === 'gmail' && (
        <div className="provider-guide-box google-guide">
          <div className="guide-title">
            <span>📕</span> Gmail / Google Workspace Setup Guide (1 Minute)
          </div>
          <div className="guide-subtitle">
            Google requires a 16-character <strong>App Password</strong> instead of your personal account password:
          </div>
          <ol className="guide-steps">
            <li>
              <strong>Enable 2-Step Verification:</strong> Ensure 2-Step Verification is active in your Google Account Security settings.
            </li>
            <li>
              <strong>Generate App Password:</strong> Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">Google App Passwords Generator +-</a>.
            </li>
            <li>
              <strong>Create Key:</strong> Enter app name (e.g. <code>HRMS</code>) and click <strong>Create</strong>.
            </li>
            <li>
              <strong>Copy &amp; Paste:</strong> Copy the generated 16-character code (e.g. <code>abcd efgh ijkl mnop</code>) and paste it into the <strong>SMTP Password</strong> field below.
            </li>
          </ol>
        </div>
      )}

      {provider === 'smtp' && (
        <div className="provider-guide-box custom-guide">
          <div className="guide-title">
            <span>⚙️</span> Custom SMTP Server Setup Guide
          </div>
          <div className="guide-subtitle">
            Enter your host, port, and authentication credentials as provided by your email hosting provider (cPanel, Amazon SES, SendGrid, etc.):
          </div>
          <div className="custom-guide-note">
            💡 <strong>Port Recommendation:</strong> Use Port <strong>587 with TLS</strong> (recommended) or Port <strong>465 with SSL</strong>.
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form className="smtp-form" onSubmit={saveConfig}>
        {provider === 'outlook_graph' ? (
          /* Microsoft 365 Form Fields */
          <div className="smtp-grid">
            <div className="form-group full-width">
              <label>Directory (tenant) ID *</label>
              <input
                name="azure_tenant_id"
                value={activeForm.azure_tenant_id}
                onChange={updateField}
                placeholder="e.g. a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
              />
              <span className="field-hint">Found in Azure Portal +' App registrations +' Overview</span>
            </div>

            <div className="form-group full-width">
              <label>Application (client) ID *</label>
              <input
                name="azure_client_id"
                value={activeForm.azure_client_id}
                onChange={updateField}
                placeholder="e.g. 98765432-abcd-ef01-2345-6789abcdef01"
              />
              <span className="field-hint">Found in Azure Portal +' App registrations +' Overview</span>
            </div>

            <div className="form-group full-width">
              <label>Client Secret {hasAzureSecret && savedProvider === 'outlook_graph' ? '(Leave blank to keep existing secret)' : '*'}</label>
              <input
                name="azure_client_secret"
                type="password"
                value={activeForm.azure_client_secret}
                onChange={updateField}
                placeholder={hasAzureSecret && savedProvider === 'outlook_graph' ? '•••••••••••••••• (Configured — leave blank to keep)' : 'Enter Client Secret Value from Azure'}
                autoComplete="new-password"
              />
              <span className="field-hint">Found under Certificates &amp; secrets +' Client secrets +' Value</span>
            </div>

            <div className="form-group">
              <label>Sender Email Address *</label>
              <input
                name="from_email"
                type="email"
                value={activeForm.from_email}
                onChange={updateField}
                placeholder="e.g. hr@teambindia.com"
              />
              <span className="field-hint">The Microsoft 365 mailbox that will send outgoing emails</span>
            </div>

            <div className="form-group">
              <label>Sender Display Name *</label>
              <input
                name="from_name"
                value={activeForm.from_name}
                onChange={updateField}
                placeholder="e.g. TEAM B People"
              />
              <span className="field-hint">Name displayed in recipients&apos; inboxes</span>
            </div>
          </div>
        ) : (
          /* Standard SMTP Form Fields (Gmail / Custom) */
          <div className="smtp-grid">
            <div className="form-group">
              <label>SMTP Host *</label>
              <input
                name="host"
                value={activeForm.host}
                onChange={updateField}
                placeholder={provider === 'gmail' ? 'smtp.gmail.com' : 'mail.yourdomain.com'}
              />
            </div>

            <div className="form-group">
              <label>SMTP Port *</label>
              <input
                name="port"
                type="number"
                min="1"
                max="65535"
                value={activeForm.port}
                onChange={updateField}
                placeholder="587"
              />
            </div>

            <div className="form-group">
              <label>SMTP Username / Email *</label>
              <input
                name="username"
                value={activeForm.username}
                onChange={updateField}
                placeholder="user@example.com"
              />
            </div>

            <div className="form-group">
              <label>SMTP Password {hasPassword && savedProvider === provider ? '(Leave blank to keep existing)' : '*'}</label>
              <input
                name="password"
                type="password"
                value={activeForm.password}
                onChange={updateField}
                placeholder={hasPassword && savedProvider === provider ? '•••••••••••••••• (Leave blank to keep)' : (provider === 'gmail' ? 'Enter 16-character Google App Password' : 'Enter SMTP Password')}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>From / Sender Email *</label>
              <input
                name="from_email"
                type="email"
                value={activeForm.from_email}
                onChange={updateField}
                placeholder="notifications@teambindia.com"
              />
            </div>

            <div className="form-group">
              <label>From Display Name *</label>
              <input
                name="from_name"
                value={activeForm.from_name}
                onChange={updateField}
                placeholder="TEAM B People"
              />
            </div>

            <div className="form-group">
              <label>Encryption *</label>
              <select name="encryption" value={activeForm.encryption} onChange={updateField}>
                <option value="tls">TLS (STARTTLS - Port 587)</option>
                <option value="ssl">SSL (Implicit - Port 465)</option>
                <option value="none">None (Port 25)</option>
              </select>
            </div>
          </div>
        )}

        <div className="smtp-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Saving Settings...' : 'Save Email Configuration'}
          </button>
        </div>
      </form>

      {/* Test Email Panel */}
      <div className="smtp-test-panel">
        <div className="test-panel-header">
          <h3>Test Outgoing Email Delivery</h3>
          <p>Send a live test email to verify that your credentials and permissions are working properly.</p>
        </div>
        <div className="smtp-test-row">
          <input
            type="email"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
            placeholder="Enter recipient email (e.g. your personal email)"
          />
          <button type="button" className="test-send-btn" onClick={sendTest} disabled={testing}>
            {testing ? 'Sending Test Email...' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmtpConfig;
