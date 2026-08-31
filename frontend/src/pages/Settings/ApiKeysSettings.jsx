// src/pages/Settings/ApiKeysSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlineClipboard,
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineInformationCircle
} from 'react-icons/hi2';
import integrationAPI from '../../services/integrationAPI';
import './ApiKeysSettings.css';

const ApiKeysSettings = ({ projects = [] }) => {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys' or 'logs'
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  
  // Forms & Filters
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyProjectId, setNewKeyProjectId] = useState('');
  const [filterApiKey, setFilterApiKey] = useState('');
  const [filterLimit, setFilterLimit] = useState('50');
  
  // Modals & Messages
  const [createdKey, setCreatedKey] = useState(null); // { id, name, api_key }
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Expandable log rows
  const [expandedLogs, setExpandedLogs] = useState({});

  useEffect(() => {
    loadKeys();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, filterApiKey, filterLimit]);

  const showFeedback = (text, type = 'success') => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const loadKeys = async () => {
    try {
      setLoadingKeys(true);
      const response = await integrationAPI.listApiKeys();
      setKeys(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      showFeedback(error.response?.data?.message || 'Failed to load API keys.', 'error');
    } finally {
      setLoadingKeys(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await integrationAPI.getAuditLogs({
        api_key_id: filterApiKey,
        limit: filterLimit
      });
      setLogs(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      showFeedback(error.response?.data?.message || 'Failed to load audit logs.', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    const name = newKeyName.trim();
    if (!name) {
      showFeedback('Please enter a valid key name.', 'error');
      return;
    }

    try {
      setGeneratingKey(true);
      setMessage({ type: '', text: '' });
      const response = await integrationAPI.generateApiKey(name, newKeyProjectId ? Number(newKeyProjectId) : null);
      
      const keyData = response.data?.data || response.data;
      setCreatedKey(keyData);
      setShowSuccessModal(true);
      setNewKeyName('');
      setNewKeyProjectId('');
      
      // Reload keys
      await loadKeys();
      showFeedback('API key generated successfully!');
    } catch (error) {
      console.error('Error generating API key:', error);
      showFeedback(error.response?.data?.message || 'Failed to generate API key.', 'error');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key? External systems using this key will immediately lose access.')) {
      return;
    }

    try {
      setRevokingId(id);
      setMessage({ type: '', text: '' });
      await integrationAPI.revokeApiKey(id);
      
      showFeedback('API key revoked successfully.');
      await loadKeys();
      
      // If we are showing logs, reload them too
      if (activeTab === 'logs') {
        loadLogs();
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      showFeedback(error.response?.data?.message || 'Failed to revoke API key.', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = () => {
    if (createdKey?.api_key) {
      navigator.clipboard.writeText(createdKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleLogDetails = (id) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="apikeys-shell">
      <div className="apikeys-header">
        <div>
          <div className="apikeys-kicker">Admin Settings</div>
          <h2><HiOutlineKey /> API Keys & Integrations</h2>
        </div>
      </div>

      <div className="apikeys-tabs" role="tablist" aria-label="API integration sub-sections">
        <button
          type="button"
          className={activeTab === 'keys' ? 'active' : ''}
          onClick={() => setActiveTab('keys')}
        >
          <HiOutlineKey />
          Manage API Keys
        </button>
        <button
          type="button"
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          <HiOutlineDocumentText />
          Integration Audit Logs
        </button>
      </div>

      {message.text && (
        <div className={`apikeys-alert ${message.type === 'error' ? 'is-error' : ''}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'keys' ? (
        <div className="apikeys-grid">
          {/* Active Keys List */}
          <section className="apikeys-panel">
            <div className="apikeys-panel-title">
              <h3>Active Credentials</h3>
              <span>Authorized integrations</span>
            </div>

            {loadingKeys ? (
              <div className="apikeys-logs-loading">
                <div className="apikeys-spinner" />
                <span>Loading keys...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="apikeys-logs-empty">
                <HiOutlineInformationCircle style={{ fontSize: '24px', marginBottom: '8px' }} />
                <p>No integration keys generated yet.</p>
              </div>
            ) : (
              <div className="apikeys-table-wrapper">
                <table className="apikeys-table">
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((keyItem) => (
                      <tr key={keyItem.id}>
                        <td><strong>{keyItem.name}</strong></td>
                        <td>
                          <span className={`badge-project ${keyItem.project_name ? 'is-project' : 'is-global'}`}>
                            {keyItem.project_name || 'Global / All Projects'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${keyItem.status === 'active' ? 'active' : 'revoked'}`}>
                            {keyItem.status === 'active' ? 'Active' : 'Revoked'}
                          </span>
                        </td>
                        <td>{formatDate(keyItem.created_at)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn-revoke"
                            disabled={keyItem.status !== 'active' || revokingId === keyItem.id}
                            onClick={() => handleRevokeKey(keyItem.id)}
                          >
                            <HiOutlineTrash />
                            {revokingId === keyItem.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Key Generation Card */}
          <aside style={{ display: 'grid', gap: '24px' }}>
            <section className="apikeys-panel">
              <div className="apikeys-panel-title">
                <h3>Generate API Key</h3>
                <span>Authorize external tools</span>
              </div>

              <form onSubmit={handleGenerateKey} className="apikeys-form">
                <div className="apikeys-field">
                  <label htmlFor="keyName">Integration / App Name</label>
                  <input
                    id="keyName"
                    type="text"
                    placeholder="e.g. PHP Ticketing Agent"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                  />
                </div>
                <div className="apikeys-field">
                  <label htmlFor="projectSelect">Associate with Project</label>
                  <select
                    id="projectSelect"
                    value={newKeyProjectId}
                    onChange={(e) => setNewKeyProjectId(e.target.value)}
                  >
                    <option value="">Global / All Projects</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="apikeys-primary-btn"
                  disabled={generatingKey || !newKeyName.trim()}
                >
                  <HiOutlineKey />
                  {generatingKey ? 'Generating...' : 'Generate New Key'}
                </button>
              </form>
            </section>

            {/* SDK Reference Documentation */}
            <section className="apikeys-doc-panel">
              <h3><HiOutlineInformationCircle /> Integration SDK</h3>
              <p>
                API keys authorize external applications (like PHP HRMS, CRMs, or slackbots) to create support tickets in TEAM B People.
              </p>
              <div className="apikeys-doc-steps">
                <div className="apikeys-doc-step">
                  <div className="apikeys-doc-step-num">1</div>
                  <div>Add this API key to your configuration file.</div>
                </div>
                <div className="apikeys-doc-step">
                  <div className="apikeys-doc-step-num">2</div>
                  <div>Use the TEAM B People PHP SDK to submit external queries.</div>
                </div>
              </div>
              <div className="apikeys-doc-code">
                $client = new WorkDeskClient(<br />
                &nbsp;&nbsp;'https://workdesk.app',<br />
                &nbsp;&nbsp;'your_api_key_here'<br />
                );
              </div>
            </section>
          </aside>
        </div>
      ) : (
        /* Audit Logs Panel */
        <section className="apikeys-panel">
          <div className="apikeys-panel-title">
            <h3>API Integration Logs</h3>
            <span>Recent API calls and activity trail</span>
          </div>

          <div className="apikeys-filters">
            <select
              value={filterApiKey}
              onChange={(e) => setFilterApiKey(e.target.value)}
              aria-label="Filter by API Key"
            >
              <option value="">All Keys / Integrations</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} {k.status === 'revoked' ? '(Revoked)' : ''}
                </option>
              ))}
            </select>

            <select
              value={filterLimit}
              onChange={(e) => setFilterLimit(e.target.value)}
              aria-label="Records limit"
            >
              <option value="25">Show Last 25</option>
              <option value="50">Show Last 50</option>
              <option value="100">Show Last 100</option>
              <option value="200">Show Last 200</option>
            </select>

            <button
              type="button"
              className="btn-copy"
              onClick={loadLogs}
              disabled={loadingLogs}
              title="Refresh Logs"
            >
              <HiOutlineArrowPath className={loadingLogs ? 'apikeys-spinner' : ''} />
              Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div className="apikeys-logs-loading">
              <div className="apikeys-spinner" />
              <span>Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="apikeys-logs-empty">
              <HiOutlineDocumentText style={{ fontSize: '24px', marginBottom: '8px' }} />
              <p>No API activity logged yet.</p>
            </div>
          ) : (
            <div className="apikeys-table-wrapper">
              <table className="apikeys-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Source Key</th>
                    <th>Status Code</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((logItem) => {
                    const isSuccess = logItem.status_code >= 200 && logItem.status_code < 300;
                    const isExpanded = !!expandedLogs[logItem.id];
                    return (
                      <React.Fragment key={logItem.id}>
                        <tr>
                          <td><strong>{logItem.action}</strong></td>
                          <td>{logItem.api_key_name || <em style={{ color: '#888' }}>Revoked/Unknown</em>}</td>
                          <td>
                            <span className={`badge-status ${isSuccess ? 'success' : 'error'}`}>
                              {logItem.status_code}
                            </span>
                          </td>
                          <td><code>{logItem.ip_address || '-'}</code></td>
                          <td>{formatDate(logItem.created_at)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-toggle-details"
                              onClick={() => toggleLogDetails(logItem.id)}
                            >
                              {isExpanded ? (
                                <>
                                  Hide Details <HiOutlineChevronUp />
                                </>
                              ) : (
                                <>
                                  Show Details <HiOutlineChevronDown />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="apikeys-details-row">
                            <td colSpan="6">
                              <div className="apikeys-details-content">
                                <pre>
                                  {logItem.details
                                    ? JSON.stringify(JSON.parse(logItem.details), null, 2)
                                    : 'No payload details provided.'}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Success Modal for Key Reveal */}
      {showSuccessModal && createdKey && (
        <div className="apikeys-modal-overlay">
          <div className="apikeys-modal">
            <div className="apikeys-modal-header">
              <h3>API Key Generated</h3>
              <button
                type="button"
                className="apikeys-modal-close"
                onClick={() => setShowSuccessModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="apikeys-modal-warning">
              <HiOutlineExclamationTriangle style={{ fontSize: '24px', flexShrink: 0 }} />
              <div>
                <strong>Security Warning:</strong> For your security, this API key is only shown once. Make sure to copy it now. You will not be able to retrieve it later.
              </div>
            </div>

            <div className="apikeys-field" style={{ marginBottom: '14px' }}>
              <label>Key Name</label>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{createdKey.name}</div>
            </div>

            <div className="apikeys-field" style={{ marginBottom: '14px' }}>
              <label>Associated Project</label>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>
                {projects.find((p) => p.id === createdKey.project_id)?.name || 'Global / All Projects'}
              </div>
            </div>

            <div className="apikeys-field">
              <label>API Key</label>
              <div className="apikeys-key-display">
                <span className="apikeys-key-code">{createdKey.api_key}</span>
                <button
                  type="button"
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <HiOutlineCheck /> Copied
                    </>
                  ) : (
                    <>
                      <HiOutlineClipboard /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="apikeys-primary-btn"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => setShowSuccessModal(false)}
            >
              I have saved the key safely
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysSettings;
