import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineBanknotes,
  HiOutlineArrowUpTray,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlinePhoto,
  HiOutlineTrash
} from 'react-icons/hi2';
import brandingAPI from '../../services/brandingAPI';
import BillingSettings from '../Accounts/BillingSettings';
import './BrandingSettings.css';

const defaultTerms = [
  'The employee shall abide by all company policies, rules, and regulations.',
  'This offer is contingent upon satisfactory background verification and reference checks.',
  'The first three months shall be a probationary period, during which either party may terminate employment with one week notice.',
  'The company reserves the right to modify terms with prior notice.',
  'Confidentiality of company information must be maintained during and after employment.',
  'All intellectual property created during employment shall belong to the company.',
  'The employee agrees not to engage in any competing business during employment and for six months after termination.',
  'Employment may be terminated by either party with one month notice or payment in lieu thereof.'
];

const emptyForm = {
  company_name: '',
  hr_name: '',
  hr_designation: '',
  company_email: '',
  company_phone: '',
  company_website: '',
  company_address: '',
  default_terms: defaultTerms.join('\n')
};

const assetFields = [
  { key: 'company_logo', dbKey: 'logo_url', label: 'Company Logo' },
  { key: 'hr_signature', dbKey: 'signature_url', label: 'HR Signature' },
  { key: 'company_stamp', dbKey: 'stamp_url', label: 'Company Stamp' }
];

const BrandingSettings = ({ initialTab = 'branding' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [form, setForm] = useState(emptyForm);
  const [assets, setAssets] = useState({ logo_url: null, signature_url: null, stamp_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const parsedTerms = useMemo(
    () => form.default_terms.split('\n').map((term) => term.trim()).filter(Boolean),
    [form.default_terms]
  );

  const completedAssets = assetFields.filter((asset) => assets[asset.dbKey]).length;
  const requiredDetails = ['company_name', 'hr_name', 'hr_designation', 'company_email', 'company_phone', 'company_website', 'company_address'];
  const completedDetails = requiredDetails.filter((field) => String(form[field] || '').trim()).length;

  useEffect(() => {
    loadBranding();
  }, []);

  const parseTerms = (value) => {
    if (!value) return defaultTerms.join('\n');
    if (Array.isArray(value)) return value.join('\n');

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join('\n') : String(value);
    } catch {
      return String(value);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadBranding = async () => {
    try {
      setLoading(true);
      const res = await brandingAPI.get();
      const branding = res.data?.branding || {};

      setForm({
        company_name: branding.company_name || '',
        hr_name: branding.hr_name || '',
        hr_designation: branding.hr_designation || '',
        company_email: branding.company_email || '',
        company_phone: branding.company_phone || '',
        company_website: branding.company_website || '',
        company_address: branding.company_address || '',
        default_terms: parseTerms(branding.default_terms)
      });
      setAssets({
        logo_url: branding.logo_url || null,
        signature_url: branding.signature_url || null,
        stamp_url: branding.stamp_url || null
      });
    } catch (error) {
      console.error('Error loading branding settings:', error);
      showMessage('Unable to load branding settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await brandingAPI.update({
        ...form,
        hr_officer_name: form.hr_name,
        default_terms: parsedTerms
      });
      showMessage('Branding settings saved successfully.');
      await loadBranding();
    } catch (error) {
      console.error('Error saving branding settings:', error);
      showMessage(error.response?.data?.message || 'Failed to save branding settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploadingField(field);
    setMessage('');

    try {
      await brandingAPI.uploadImage(field, file);
      showMessage('Image uploaded successfully.');
      await loadBranding();
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage(error.response?.data?.message || 'Failed to upload image.', 'error');
    } finally {
      setUploadingField('');
    }
  };

  const handleDelete = async (field) => {
    setUploadingField(field);
    setMessage('');

    try {
      await brandingAPI.deleteImage(field);
      showMessage('Image removed successfully.');
      await loadBranding();
    } catch (error) {
      console.error('Error removing image:', error);
      showMessage(error.response?.data?.message || 'Failed to remove image.', 'error');
    } finally {
      setUploadingField('');
    }
  };

  if (loading) {
    return (
      <div className="branding-shell">
        <div className="branding-loading">Loading branding settings...</div>
      </div>
    );
  }

  return (
    <div className="branding-shell">
      <div className="branding-header">
        <div>
          <div className="branding-kicker">Settings</div>
          <h2><HiOutlineBuildingOffice2 /> Branding</h2>
        </div>
        {activeTab === 'branding' && (
          <button className="branding-primary-btn" type="button" onClick={handleSave} disabled={saving}>
            <HiOutlineCheckCircle />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        )}
      </div>

      <div className="branding-tabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          className={activeTab === 'branding' ? 'active' : ''}
          onClick={() => setActiveTab('branding')}
        >
          <HiOutlineBuildingOffice2 />
          Branding Information
        </button>
        <button
          type="button"
          className={activeTab === 'billing' ? 'active' : ''}
          onClick={() => setActiveTab('billing')}
        >
          <HiOutlineBanknotes />
          Billing Settings
        </button>
      </div>

      {activeTab === 'branding' && message && (
        <div className={`branding-alert ${messageType === 'error' ? 'is-error' : ''}`}>
          {message}
        </div>
      )}

      {activeTab === 'branding' ? (
        <>
          <div className="branding-stats">
            <div className="branding-stat">
              <span>Company Details</span>
              <strong>{completedDetails}/{requiredDetails.length}</strong>
            </div>
            <div className="branding-stat">
              <span>Brand Assets</span>
              <strong>{completedAssets}/{assetFields.length}</strong>
            </div>
            <div className="branding-stat">
              <span>Offer Terms</span>
              <strong>{parsedTerms.length}</strong>
            </div>
          </div>

          <form onSubmit={handleSave} className="branding-grid">
            <section className="branding-panel">
              <div className="branding-panel-title">
                <h3>Basic Information</h3>
                <span>Used on HR documents</span>
              </div>

              <div className="branding-form-grid">
                <label className="branding-field">
                  <span>Company Name</span>
                  <input value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} />
                </label>
                <label className="branding-field">
                  <span>HR Officer Name</span>
                  <input value={form.hr_name} onChange={(e) => handleChange('hr_name', e.target.value)} />
                </label>
                <label className="branding-field">
                  <span>HR Designation</span>
                  <input value={form.hr_designation} onChange={(e) => handleChange('hr_designation', e.target.value)} />
                </label>
                <label className="branding-field">
                  <span>Company Email</span>
                  <input type="email" value={form.company_email} onChange={(e) => handleChange('company_email', e.target.value)} />
                </label>
                <label className="branding-field">
                  <span>Company Phone</span>
                  <input value={form.company_phone} onChange={(e) => handleChange('company_phone', e.target.value)} />
                </label>
                <label className="branding-field">
                  <span>Company Website</span>
                  <input value={form.company_website} onChange={(e) => handleChange('company_website', e.target.value)} />
                </label>
              </div>

              <label className="branding-field is-wide">
                <span>Company Address</span>
                <textarea value={form.company_address} onChange={(e) => handleChange('company_address', e.target.value)} />
              </label>

              <label className="branding-field is-wide">
                <span><HiOutlineDocumentText /> Default Terms and Conditions</span>
                <textarea className="branding-terms" value={form.default_terms} onChange={(e) => handleChange('default_terms', e.target.value)} />
              </label>
            </section>

            <aside className="branding-side">
              <section className="branding-panel">
                <div className="branding-panel-title">
                  <h3>Brand Assets</h3>
                  <span>Logo, signature and stamp</span>
                </div>

                <div className="branding-assets">
                  {assetFields.map((asset) => {
                    const currentUrl = assets[asset.dbKey] ? brandingAPI.getImageUrl(assets[asset.dbKey]) : null;
                    const busy = uploadingField === asset.key;

                    return (
                      <div key={asset.key} className="branding-asset-card">
                        <div className="branding-asset-head">
                          <div>
                            <h4>{asset.label}</h4>
                            <p>PNG, JPG, SVG up to 2MB</p>
                          </div>
                          {currentUrl && (
                            <button
                              className="branding-icon-btn danger"
                              type="button"
                              onClick={() => handleDelete(asset.key)}
                              disabled={busy}
                              title={`Remove ${asset.label}`}
                            >
                              <HiOutlineTrash />
                            </button>
                          )}
                        </div>

                        <div className="branding-preview-box">
                          {currentUrl ? (
                            <img src={currentUrl} alt={asset.label} />
                          ) : (
                            <div className="branding-empty-preview">
                              <HiOutlinePhoto />
                              <span>No image uploaded</span>
                            </div>
                          )}
                        </div>

                        <label className={`branding-upload-btn ${busy ? 'is-busy' : ''}`}>
                          <HiOutlineArrowUpTray />
                          {busy ? 'Uploading...' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                            disabled={busy}
                            onChange={(e) => handleUpload(asset.key, e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="branding-letter-preview">
                <div className="preview-top">
                  {assets.logo_url ? <img src={brandingAPI.getImageUrl(assets.logo_url)} alt="Company Logo" /> : <HiOutlineBuildingOffice2 />}
                  <div>
                    <strong>{form.company_name || 'Company Name'}</strong>
                    <span>{form.company_website || 'company website'}</span>
                    <span>{form.company_email || 'company email'}</span>
                  </div>
                </div>
                <div className="preview-lines">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="preview-sign">
                  <span>{form.hr_name || 'HR Officer'}</span>
                  <small>{form.hr_designation || 'Designation'}</small>
                </div>
              </section>
            </aside>
          </form>
        </>
      ) : (
        <div className="branding-tab-panel">
          <BillingSettings />
        </div>
      )}
    </div>
  );
};

export default BrandingSettings;
