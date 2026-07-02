import React, { useState, useEffect, useMemo } from 'react';
import './ManagementHub.css';
import { clientAPI } from '../../services/clientAPI';
import { projectAPI } from '../../services/projectAPI';
import { serviceAPI } from '../../services/serviceAPI';
import { FiEdit, FiTrash2, FiSearch, FiSidebar, FiPieChart, FiUsers, FiFolder, FiSettings, FiActivity, FiClipboard, FiCheckCircle, FiDollarSign, FiX, FiPlus, FiInfo } from 'react-icons/fi';
import '../../styles/tableControls.css';
import ApiKeysSettings from '../Settings/ApiKeysSettings.jsx';

const ServiceManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [formType, setFormType] = useState('client'); // 'client', 'project', 'service'
  const [formData, setFormData] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState('setup');
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsRes, projectsRes, servicesRes] = await Promise.all([
        clientAPI.getAll(),
        projectAPI.getAll(),
        serviceAPI.getAll()
      ]);
      
      const clientsData = clientsRes.data?.clients || clientsRes.data || [];
      const projectsData = projectsRes.data?.data || projectsRes.data?.projects || projectsRes.data || [];
      const servicesData = servicesRes.data?.services || servicesRes.data || [];

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    }
  };

  const showToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // Derived state
  const totalRevenue = services.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalPaid = services.reduce((sum, s) => sum + (Number(s.paid) || 0), 0);
  const outstanding = totalRevenue - totalPaid;

  const getClientName = (id) => clients.find(c => c.id === id)?.name || '—';
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '—';

  // Handling Forms
  const openSidePanel = (type, data = null) => {
    setFormType(type);
    if (data) {
      setFormData(data);
    } else {
      setFormData({});
    }
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sortRows = (rows, accessors = {}) => {
    const accessor = accessors[sortConfig.key] || sortConfig.key;
    return [...rows].sort((a, b) => {
      const rawA = typeof accessor === 'function' ? accessor(a) : a?.[accessor];
      const rawB = typeof accessor === 'function' ? accessor(b) : b?.[accessor];
      const aValue = rawA ?? '';
      const bValue = rawB ?? '';
      const aNumber = Number(aValue);
      const bNumber = Number(bValue);
      const comparison = Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: 'base' });

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const sortBy = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortLabel = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ^' : ' v';
  };

  const handleSaveClient = async () => {
    if (!formData.name) return showToast('Name required', 'error');
    try {
      if (formData.id) {
        await clientAPI.update(formData.id, formData);
        showToast('Client Updated');
      } else {
        await clientAPI.create(formData);
        showToast('Client Added');
      }
      fetchData();
      closeSidePanel();
    } catch (e) {
      showToast('Error saving client', 'error');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Delete client and all linked projects/services?')) return;
    try {
      await clientAPI.delete(id);
      showToast('Client Deleted');
      fetchData();
    } catch (e) {
      showToast('Error deleting client', 'error');
    }
  };

  const handleSaveProject = async () => {
    if (!formData.client_id || !formData.name) return showToast('Client & Name required', 'error');
    try {
      if (formData.id) {
        await projectAPI.update(formData.id, formData);
        showToast('Project Updated');
      } else {
        await projectAPI.create(formData);
        showToast('Project Added');
      }
      fetchData();
      closeSidePanel();
    } catch (e) {
      showToast('Error saving project', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete project?')) return;
    try {
      await projectAPI.delete(id);
      showToast('Project Deleted');
      fetchData();
    } catch (e) {
      showToast('Error deleting project', 'error');
    }
  };

  const handleSaveService = async () => {
    if (!formData.client_id || !formData.project_id || !formData.name) return showToast('Required fields missing', 'error');
    try {
      if (formData.id) {
        await serviceAPI.update(formData.id, formData);
        showToast('Service Updated');
      } else {
        await serviceAPI.create(formData);
        showToast('Service Added');
      }
      fetchData();
      closeSidePanel();
    } catch (e) {
      showToast('Error saving service', 'error');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete service?')) return;
    try {
      await serviceAPI.delete(id);
      showToast('Service Deleted');
      fetchData();
    } catch (e) {
      showToast('Error deleting service', 'error');
    }
  };

  const renderDashboard = () => {
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const overdueServices = services.filter(s => s.due_date && new Date(s.due_date) < new Date() && s.status !== 'Completed').length;
    const recent = [...services].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);

    return (
      <div id="dashboardContent">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-value">{clients.length}</div>
            <div className="dashboard-card-title">Total Clients</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-value">{projects.length}</div>
            <div className="dashboard-card-title">Projects</div>
            <div className="dashboard-card-sub">{activeProjects} active</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-value">{services.length}</div>
            <div className="dashboard-card-title">Services</div>
            <div className="dashboard-card-sub">{overdueServices} overdue</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-value">₹{totalRevenue.toLocaleString()}</div>
            <div className="dashboard-card-title">Total Revenue</div>
          </div>
        </div>
        <div className="recent-services-panel">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px' }}><FiClipboard /> Recent Services</h3>
          {recent.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s.id}>
                    <td>{s.name || s.service_name}</td>
                    <td>{getClientName(s.client_id)}</td>
                    <td>₹{Number(s.amount || 0).toLocaleString()}</td>
                    <td><span className="badge badge-blue">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No services yet</div>
          )}
        </div>
      </div>
    );
  };

  const renderClients = () => {
    const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || '').toLowerCase().includes(search.toLowerCase()));
    const sorted = sortRows(filtered);
    return (
      <div style={{ display: 'flex', height: '100%', gap: 20 }}>
        <div className="data-grid-wrapper" style={{ flex: 1 }}>
          {filtered.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => sortBy('name')}>Name{sortLabel('name')}</th>
                  <th className="sortable-th" onClick={() => sortBy('company')}>Company{sortLabel('company')}</th>
                  <th className="sortable-th" onClick={() => sortBy('email')}>Email{sortLabel('email')}</th>
                  <th className="sortable-th" onClick={() => sortBy('phone')}>Phone{sortLabel('phone')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.company || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <button className="btn-icon" onClick={() => openSidePanel('client', c)}><i className="fa-solid fa-pen-to-square"></i></button>
                      <button className="btn-icon" onClick={() => handleDeleteClient(c.id)} style={{ color: 'var(--danger)' }}><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">No clients found</div>}
        </div>
        <div className={`side-panel ${sidePanelOpen && formType === 'client' ? '' : 'collapsed'}`}>
          <div className="side-panel-header">
            {formData.id ? 'Edit Client' : 'Add Client'}
            <button onClick={closeSidePanel} className="btn-icon"><FiX /></button>
          </div>
          <div className="side-panel-body">
            <div className="form-group"><label>Full name *</label><input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Company</label><input type="text" name="company" value={formData.company || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Phone</label><input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Address</label><textarea name="address" rows="2" value={formData.address || ''} onChange={handleInputChange} /></div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveClient}>Save Client</button>
              <button className="btn btn-secondary" onClick={closeSidePanel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    if (showApiKeys) {
      return <ApiKeysSettings projects={projects} />;
    }
    const filtered = projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || getClientName(p.client_id)?.toLowerCase().includes(search.toLowerCase()));
    const sorted = sortRows(filtered, { client: (project) => getClientName(project.client_id) });
    return (
      <div style={{ display: 'flex', height: '100%', gap: 20 }}>
        <div className="data-grid-wrapper" style={{ flex: 1 }}>
          {filtered.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => sortBy('name')}>Project{sortLabel('name')}</th>
                  <th className="sortable-th" onClick={() => sortBy('client')}>Client{sortLabel('client')}</th>
                  <th className="sortable-th" onClick={() => sortBy('status')}>Status{sortLabel('status')}</th>
                  <th className="sortable-th" onClick={() => sortBy('start_date')}>Start{sortLabel('start_date')}</th>
                  <th className="sortable-th" onClick={() => sortBy('end_date')}>End{sortLabel('end_date')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{getClientName(p.client_id)}</td>
                    <td><span className="badge badge-green">{p.status}</span></td>
                    <td>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</td>
                    <td>{p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</td>
                    <td>
                      <button className="btn-icon" onClick={() => openSidePanel('project', p)}><FiEdit /></button>
                      <button className="btn-icon" onClick={() => handleDeleteProject(p.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">No projects found</div>}
        </div>
        <div className={`side-panel ${sidePanelOpen && formType === 'project' ? '' : 'collapsed'}`}>
          <div className="side-panel-header">
            {formData.id ? 'Edit Project' : 'Add Project'}
            <button onClick={closeSidePanel} className="btn-icon"><FiX /></button>
          </div>
          <div className="side-panel-body">
            <div className="form-group">
              <label>Client *</label>
              <select name="client_id" value={formData.client_id || ''} onChange={handleInputChange}>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Project Name *</label><input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Description</label><textarea name="description" rows="2" value={formData.description || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Start Date</label><input type="date" name="start_date" value={formData.start_date ? formData.start_date.split('T')[0] : ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>End Date</label><input type="date" name="end_date" value={formData.end_date ? formData.end_date.split('T')[0] : ''} onChange={handleInputChange} /></div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status || 'Active'} onChange={handleInputChange}>
                <option>Active</option><option>On Hold</option><option>Completed</option><option>Cancelled</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveProject}>Save</button>
              <button className="btn btn-secondary" onClick={closeSidePanel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServices = () => {
    const filtered = services.filter(s => (s.name || s.service_name)?.toLowerCase().includes(search.toLowerCase()) || getClientName(s.client_id)?.toLowerCase().includes(search.toLowerCase()));
    const sorted = sortRows(filtered, {
      service: (service) => service.name || service.service_name || '',
      client: (service) => getClientName(service.client_id),
      project: (service) => getProjectName(service.project_id),
      amount: (service) => service.amount,
      paid: (service) => service.paid_amount ?? service.paid,
    });
    
    // Derived filtered projects for the select dropdown based on selected client
    const clientProjects = projects.filter(p => p.client_id == formData.client_id);

    return (
      <div style={{ display: 'flex', height: '100%', gap: 20 }}>
        <div className="data-grid-wrapper" style={{ flex: 1 }}>
          {filtered.length ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => sortBy('service')}>Service{sortLabel('service')}</th>
                  <th className="sortable-th" onClick={() => sortBy('client')}>Client{sortLabel('client')}</th>
                  <th className="sortable-th" onClick={() => sortBy('project')}>Project{sortLabel('project')}</th>
                  <th className="sortable-th" onClick={() => sortBy('amount')}>Amount{sortLabel('amount')}</th>
                  <th className="sortable-th" onClick={() => sortBy('paid')}>Paid{sortLabel('paid')}</th>
                  <th className="sortable-th" onClick={() => sortBy('due_date')}>Due Date{sortLabel('due_date')}</th>
                  <th className="sortable-th" onClick={() => sortBy('status')}>Status{sortLabel('status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name || s.service_name}</strong></td>
                    <td>{getClientName(s.client_id)}</td>
                    <td>{getProjectName(s.project_id)}</td>
                    <td>₹{Number(s.amount || 0).toLocaleString()}</td>
                    <td>₹{Number(s.paid || 0).toLocaleString()}</td>
                    <td>{s.due_date ? new Date(s.due_date).toLocaleDateString() : '—'}</td>
                    <td><span className="badge badge-blue">{s.status}</span></td>
                    <td>
                      <button className="btn-icon" onClick={() => openSidePanel('service', { ...s, name: s.name || s.service_name, type: s.type || s.service_type })}><FiEdit /></button>
                      <button className="btn-icon" onClick={() => handleDeleteService(s.id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty-state">No services found</div>}
        </div>
        <div className={`side-panel ${sidePanelOpen && formType === 'service' ? '' : 'collapsed'}`}>
          <div className="side-panel-header">
            {formData.id ? 'Edit Service' : 'Add Service'}
            <button onClick={closeSidePanel} className="btn-icon"><FiX /></button>
          </div>
          <div className="side-panel-body">
            <div className="form-group">
              <label>Client *</label>
              <select name="client_id" value={formData.client_id || ''} onChange={(e) => { handleInputChange(e); setFormData(p => ({ ...p, project_id: '' })); }}>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Project *</label>
              <select name="project_id" value={formData.project_id || ''} onChange={handleInputChange}>
                <option value="">Select Project</option>
                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Service Name *</label><input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} /></div>
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type || 'Consulting'} onChange={handleInputChange}>
                <option>Consulting</option><option>Development</option><option>Design</option><option>Support</option>
              </select>
            </div>
            <div className="form-group"><label>Amount (₹)</label><input type="number" name="amount" value={formData.amount || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Paid (₹)</label><input type="number" name="paid" value={formData.paid || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Due Date</label><input type="date" name="due_date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={handleInputChange} /></div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status || 'Pending'} onChange={handleInputChange}>
                <option>Pending</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSaveService}>Save</button>
              <button className="btn btn-secondary" onClick={closeSidePanel}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const byClient = {};
    services.forEach(s => {
      const cn = getClientName(s.client_id);
      if (!byClient[cn]) byClient[cn] = { rev: 0, count: 0 };
      byClient[cn].rev += Number(s.amount || 0);
      byClient[cn].count++;
    });

    return (
      <div className="reports-panel">
        <h3>Financial Summary</h3>
        <p>Total Revenue: ₹{totalRevenue.toLocaleString()} | Outstanding: ₹{outstanding.toLocaleString()}</p>
        <div style={{ marginTop: 20 }}>
          <h4>Revenue by Client</h4>
          <table className="data-table" style={{ marginTop: 10 }}>
            <thead>
              <tr><th>Client</th><th>Services</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {Object.keys(byClient).length ? Object.entries(byClient).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v.count}</td><td>₹{v.rev.toLocaleString()}</td></tr>
              )) : <tr><td colSpan="3">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="service-hub-app">
      <div className="filter-bar">
        <div className="filter-group">
          <span><FiSearch /></span>
          <input 
            type="text" 
            placeholder="Search clients, projects, services..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'projects' && (
            <>
              {showApiKeys ? (
                <button
                  type="button"
                  className="btn-info-guide"
                  onClick={() => setShowApiKeys(false)}
                  title="Back to Projects"
                >
                  Back to Projects
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-info-guide"
                    onClick={() => setShowGuideModal(true)}
                    title="Show Configuration Guide"
                  >
                    <FiInfo /> Info
                  </button>
                  <button
                    type="button"
                    className="btn-info-guide"
                    onClick={() => setShowApiKeys(true)}
                    title="Manage Integration API Keys"
                  >
                    <FiSettings /> API Keys
                  </button>
                </>
              )}
            </>
          )}
          {!showApiKeys && ['clients', 'projects', 'services'].includes(activeTab) && (
            <button className="btn-action btn-primary-action" onClick={() => openSidePanel(activeTab.slice(0, -1))} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiPlus /> New
            </button>
          )}
        </div>
      </div>

      <div className="main-tabs">
        <button className={`main-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setShowApiKeys(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiPieChart /> Dashboard</button>
        <button className={`main-tab ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => { setActiveTab('clients'); setShowApiKeys(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiUsers /> Clients <span className="tab-badge">{clients.length}</span></button>
        <button className={`main-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => { setActiveTab('projects'); setShowApiKeys(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiFolder /> Projects <span className="tab-badge">{projects.length}</span></button>
        <button className={`main-tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => { setActiveTab('services'); setShowApiKeys(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiSettings /> Services <span className="tab-badge">{services.length}</span></button>
        <button className={`main-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); setShowApiKeys(false); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiActivity /> Reports</button>
      </div>

      <div className="main-content">
        <div className={`panel ${activeTab === 'dashboard' ? 'active' : ''}`}>{activeTab === 'dashboard' && renderDashboard()}</div>
        <div className={`panel ${activeTab === 'clients' ? 'active' : ''}`}>{activeTab === 'clients' && renderClients()}</div>
        <div className={`panel ${activeTab === 'projects' ? 'active' : ''}`}>{activeTab === 'projects' && renderProjects()}</div>
        <div className={`panel ${activeTab === 'services' ? 'active' : ''}`}>{activeTab === 'services' && renderServices()}</div>
        <div className={`panel ${activeTab === 'reports' ? 'active' : ''}`}>{activeTab === 'reports' && renderReports()}</div>
      </div>

      <div className="status-bar">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiCheckCircle /> Ready</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiClipboard /> Total Revenue: <strong>₹{totalRevenue.toLocaleString()}</strong></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FiDollarSign /> Outstanding: <strong>₹{outstanding.toLocaleString()}</strong></span>
      </div>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>

      {/* Configuration Guide Modal */}
      {showGuideModal && (
        <div className="apikeys-modal-overlay">
          <div className="apikeys-modal" style={{ maxWidth: '600px', width: '90%', background: '#fff', padding: '24px', borderRadius: '12px', zIndex: 1000 }}>
            <div className="apikeys-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Integration Setup Guide</h3>
              <button
                type="button"
                className="apikeys-modal-close"
                onClick={() => {
                  setShowGuideModal(false);
                  setGuideActiveTab('setup');
                }}
              >
                &times;
              </button>
            </div>

            {/* Mini Modal Tabs */}
            <div className="apikeys-tabs" style={{ marginBottom: '16px', display: 'flex', width: '100%' }}>
              <button
                type="button"
                style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                className={guideActiveTab === 'setup' ? 'active' : ''}
                onClick={() => setGuideActiveTab('setup')}
              >
                Setup Steps
              </button>
              <button
                type="button"
                style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                className={guideActiveTab === 'sdk' ? 'active' : ''}
                onClick={() => setGuideActiveTab('sdk')}
              >
                SDK Reference
              </button>
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
              {guideActiveTab === 'setup' ? (
                <>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
                    Follow this step-by-step process to connect your external ticketing system with any project:
                  </p>

                  <div className="apikeys-doc-steps" style={{ fontSize: '0.88rem', gap: '14px', display: 'flex', flexDirection: 'column' }}>
                    <div className="apikeys-doc-step" style={{ display: 'flex', gap: '10px' }}>
                      <div className="apikeys-doc-step-num">1</div>
                      <div>
                        <strong>Generate API Key:</strong> Go to the <strong>Settings &rarr; API Keys</strong> module, enter a name, and generate an API key.
                      </div>
                    </div>

                    <div className="apikeys-doc-step" style={{ display: 'flex', gap: '10px' }}>
                      <div className="apikeys-doc-step-num">2</div>
                      <div>
                        <strong>Find Project ID:</strong> Go to the **Projects** tab (here in the Services module). Select your project and note its numeric ID in the URL or check the database.
                      </div>
                    </div>

                    <div className="apikeys-doc-step" style={{ display: 'flex', gap: '10px' }}>
                      <div className="apikeys-doc-step-num">3</div>
                      <div>
                        <strong>Configure SDK/API:</strong> Call the endpoint <code>POST /api/integration/tickets</code> with header <code>X-API-KEY</code> set, or use the pre-built PHP SDK:
                        <div className="apikeys-doc-code" style={{ marginTop: '8px' }}>
{`// PHP SDK example:
$client = new WorkDeskClient($apiUrl, $apiKey);
$client->createTicket([
  'project_id' => 5,
  'subject'    => 'Login Failure',
  'source_app' => 'HRMS',
  ...
]);`}
                        </div>
                      </div>
                    </div>

                    <div className="apikeys-doc-step" style={{ display: 'flex', gap: '10px' }}>
                      <div className="apikeys-doc-step-num">4</div>
                      <div>
                        <strong>Submit Ticket:</strong> The ticket will automatically appear in the <strong>External Tickets</strong> section of your helpdesk.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>
                    The pre-built PHP SDK provides an object-oriented wrapper around the Work Desk REST APIs.
                  </p>

                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>1. Client Instantiation</h4>
                    <div className="apikeys-doc-code" style={{ marginTop: '4px' }}>
{`$client = new WorkDeskClient($apiUrl, $apiKey, [
  'verify_ssl' => true, // false for localhost dev
  'timeout'    => 30
]);`}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>2. Available Client Methods</h4>
                    <ul style={{ margin: '4px 0 0 20px', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>
                        <strong><code>createTicket(array $data, ?string $file): array</code></strong>
                        <br />
                        Creates a ticket. Accepts parameters like <code>project_id</code>, <code>subject</code>, <code>description</code>, <code>source_app</code>, <code>raised_by_email</code>, and <code>raised_by_name</code>.
                      </li>
                      <li>
                        <strong><code>getTicket(int $id): Ticket</code></strong>
                        <br />
                        Fetches full ticket details and maps it into an object-oriented <code>Ticket</code> model.
                      </li>
                      <li>
                        <strong><code>getTicketStatus(int $id): array</code></strong>
                        <br />
                        Lightweight status check returned as an associative array.
                      </li>
                      <li>
                        <strong><code>addComment(int $ticketId, string $comment): array</code></strong>
                        <br />
                        Appends a text comment/update onto the ticket thread.
                      </li>
                      <li>
                        <strong><code>uploadAttachment(int $id, string $path): array</code></strong>
                        <br />
                        Attaches a file to the ticket.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>3. Error Handling</h4>
                    <div className="apikeys-doc-code" style={{ marginTop: '4px' }}>
{`try {
  $client->createTicket($data);
} catch (ApiException $e) {
  // HTTP level errors (e.g. 401, 400, 422)
  echo $e->getApiMessage();
} catch (NetworkException $e) {
  // Connection / timeout errors
  echo $e->getMessage();
}`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="apikeys-primary-btn"
              style={{ width: '100%', marginTop: '20px' }}
              onClick={() => {
                setShowGuideModal(false);
                setGuideActiveTab('setup');
              }}
            >
              Close Setup Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
