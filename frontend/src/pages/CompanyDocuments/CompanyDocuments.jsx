import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { companyDocumentAPI } from '../../services/companyDocumentAPI';
import { getFileUrl } from '../../services/api';
import { HiOutlineDocumentText, HiOutlineLink, HiOutlineTrash, HiOutlinePlus, HiOutlineDownload, HiOutlineExternalLink, HiOutlineSearch } from 'react-icons/hi';
import './CompanyDocuments.css';

const CompanyDocuments = () => {
  const { user } = useAuth();
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr' || user?.position === 'admin' || user?.position === 'hr';
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('file'); // 'file' or 'link'
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await companyDocumentAPI.getAll();
      setDocuments(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Title is required');
    if (type === 'file' && !file) return alert('Please select a file');
    if (type === 'link' && !linkUrl.trim()) return alert('Please provide a link URL');

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      
      if (type === 'file') {
        formData.append('file', file);
      } else {
        formData.append('link_url', linkUrl);
      }

      await companyDocumentAPI.create(formData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('file');
      setFile(null);
      setLinkUrl('');
      setIsModalOpen(false);
      
      fetchDocuments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await companyDocumentAPI.delete(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = async (doc, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const url = getFullUrl(doc.file_url);
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      // Extract original extension
      const ext = doc.file_url.split('.').pop() || 'pdf';
      const safeTitle = doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `${safeTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Force download failed, falling back to open:", error);
      window.open(getFullUrl(doc.file_url), '_blank');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getFullUrl = (path) => {
    return getFileUrl(path);
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="company-docs-container">
      <div className="company-docs-header">
        <div className="company-docs-title-area">
          <h2>Company Drive</h2>
          <p>Access company policies, resources, and shared links.</p>
        </div>
        <div className="company-docs-actions">
          {isAdminOrHr && (
            <button className="btn-add-doc" onClick={() => setIsModalOpen(true)}>
              <HiOutlinePlus /> Add Document
            </button>
          )}
        </div>
      </div>

      <div className="company-docs-toolbar">
        <div className="docs-search-container">
          <HiOutlineSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="docs-search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="docs-loading">Loading documents...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="docs-empty">
          <HiOutlineDocumentText className="empty-icon" />
          <h3>No documents found</h3>
          <p>{searchTerm ? 'Try adjusting your search.' : 'No documents have been added yet.'}</p>
        </div>
      ) : (
        <div className="docs-grid">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="doc-card">
              <div 
                className="doc-clickable-area" 
                onClick={() => doc.type === 'file' ? setPreviewDoc(doc) : window.open(doc.link_url, '_blank')}
                style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center' }}
              >
                <div className="doc-icon-wrapper">
                  {doc.type === 'link' ? <HiOutlineLink className="doc-icon link" /> : <HiOutlineDocumentText className="doc-icon file" />}
                </div>
                <div className="doc-content">
                  <h3 className="doc-title" title={doc.title}>{doc.title}</h3>
                  <p className="doc-desc">{doc.description || 'No description provided.'}</p>
                  <div className="doc-meta">
                    <span>Added by {doc.uploaded_by_name}</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="doc-actions">
                {doc.type === 'link' ? (
                  <a href={doc.link_url} target="_blank" rel="noopener noreferrer" className="btn-action open" title="Open Link">
                    <HiOutlineExternalLink />
                  </a>
                ) : (
                  <button onClick={(e) => handleDownload(doc, e)} className="btn-action download" title="Download File">
                    <HiOutlineDownload />
                  </button>
                )}
                
                {isAdminOrHr && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }} className="btn-action delete" title="Delete">
                    <HiOutlineTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Add Modal */}
      {isModalOpen && (
        <div className="doc-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="doc-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h3>Add New Document</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="doc-modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Employee Handbook"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Brief description..."
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <div className="type-toggle">
                  <label>
                    <input 
                      type="radio" 
                      name="type" 
                      value="file" 
                      checked={type === 'file'} 
                      onChange={() => setType('file')} 
                    /> File Upload
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="type" 
                      value="link" 
                      checked={type === 'link'} 
                      onChange={() => setType('link')} 
                    /> External Link
                  </label>
                </div>
              </div>

              {type === 'file' ? (
                <div className="form-group">
                  <label>File *</label>
                  <input 
                    type="file" 
                    onChange={e => setFile(e.target.files[0])} 
                    required={type === 'file'}
                    className="file-input"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>URL *</label>
                  <input 
                    type="url" 
                    value={linkUrl} 
                    onChange={e => setLinkUrl(e.target.value)} 
                    placeholder="https://..."
                    required={type === 'link'}
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="doc-preview-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="doc-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="doc-preview-header">
              <div className="doc-preview-title">
                <h3>{previewDoc.title}</h3>
                <span className="doc-preview-meta">Uploaded by {previewDoc.uploaded_by_name}</span>
              </div>
              <div className="doc-preview-actions">
                <button onClick={(e) => handleDownload(previewDoc, e)} className="btn-preview-download">
                  <HiOutlineDownload /> Download
                </button>
                <button className="close-preview-btn" onClick={() => setPreviewDoc(null)}>&times;</button>
              </div>
            </div>
            <div className="doc-preview-content">
              {previewDoc.file_url.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${getFullUrl(previewDoc.file_url)}#toolbar=0`} 
                  title={previewDoc.title} 
                  className="doc-preview-iframe"
                />
              ) : previewDoc.file_url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                <img 
                  src={getFullUrl(previewDoc.file_url)} 
                  alt={previewDoc.title} 
                  className="doc-preview-img"
                />
              ) : (
                <div className="doc-preview-unsupported">
                  <HiOutlineDocumentText className="unsupported-icon" />
                  <p>Preview not available for this file type.</p>
                  <button onClick={(e) => handleDownload(previewDoc, e)} className="btn-submit">
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="doc-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <HiOutlineTrash />
            </div>
            <h3>Delete Document</h3>
            <p>Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn-delete-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyDocuments;
