// src/pages/employees/EmployeeTickets.jsx
import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/ticketAPI';
import { projectAPI } from '../../services/projectAPI';
import './EmployeeTickets.css';

const EmployeeTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'Medium',
    category: 'Bug / Error',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketAPI.getAll();
      setTickets(res.data.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectAPI.getMyProjects();
      setMyProjects(res.data.projects || res.data.data || []);
    } catch (err) {
      console.error('Error fetching my projects:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchProjects();

    const shouldOpen = localStorage.getItem('openRaiseTicketModal');
    if (shouldOpen === 'true') {
      setIsModalOpen(true);
      localStorage.removeItem('openRaiseTicketModal');
    }
  }, []);

  useEffect(() => {
    const project = myProjects.find((p) => String(p.id) === String(formData.project_id));
    const projectName = project ? project.name : 'General Support';
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    
    const autoTitle = `[${projectName}] ${formData.category} (${formData.priority}) - ${dateStr} ${timeStr}`;
    setFormData((prev) => ({ ...prev, title: autoTitle }));
  }, [formData.project_id, formData.priority, formData.category, myProjects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill out all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('priority', formData.priority);
      if (formData.project_id) {
        payload.append('project_id', Number(formData.project_id));
      }
      if (attachment) {
        payload.append('attachment', attachment);
      }

      await ticketAPI.create(payload);
      setFormData({
        title: '',
        description: '',
        project_id: '',
        priority: 'Medium',
        category: 'Bug / Error',
      });
      setAttachment(null);
      setIsModalOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert(err.response?.data?.message || 'Error submitting ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await ticketAPI.getComments(ticket.id);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await ticketAPI.addComment(selectedTicket.id, newComment);
      setNewComment('');
      // Reload comments
      const res = await ticketAPI.getComments(selectedTicket.id);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to send message');
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return;
    try {
      await ticketAPI.update(selectedTicket.id, { status: 'Closed' });
      // Refresh details
      const detailRes = await ticketAPI.getById(selectedTicket.id);
      setSelectedTicket(detailRes.data.data);
      fetchTickets();
    } catch (err) {
      console.error('Error closing ticket:', err);
      alert('Failed to close ticket');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.project_name && t.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="tickets-section">
      <div className="tickets-header-container">
        <div>
          <h2 className="tickets-title-text">Raise & Track Problems</h2>
          <p className="tickets-subtitle-text">Submit issues and link them to your assigned projects</p>
        </div>
        <button className="tickets-raise-btn" onClick={() => setIsModalOpen(true)}>
          <span className="plus-symbol">+</span> Raise Ticket
        </button>
      </div>

      <div className="tickets-filter-bar glass-ticket-card">
        <div className="filter-input-group">
          <label>Search Problems</label>
          <input
            type="search"
            placeholder="Search title, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-input-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="filter-input-group">
          <label>Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="tickets-content-grid">
        <div className="tickets-list-wrapper glass-ticket-card">
          {loading ? (
            <div className="tickets-loading">
              <div className="ticket-spinner"></div>
              <p>Fetching tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="tickets-empty">
              <span className="empty-emoji">🎫</span>
              <h3>No tickets found</h3>
              <p>Try clearing filters or raise a new ticket to get started.</p>
            </div>
          ) : (
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Project</th>
                  <th>Problem Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Raised</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`ticket-row-item ${selectedTicket?.id === t.id ? 'row-selected' : ''}`}
                    onClick={() => selectTicket(t)}
                  >
                    <td>#{t.id}</td>
                    <td>
                      <span className="ticket-project-tag">{t.project_name || 'General Support'}</span>
                    </td>
                    <td className="ticket-title-cell">{t.title}</td>
                    <td>
                      <span className={`priority-indicator priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-indicator status-${t.status.toLowerCase().replace(' ', '-')}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="ticket-date-cell">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedTicket && (
          <div className="ticket-detail-panel glass-ticket-card fade-in-right">
            <div className="detail-panel-header">
              <h3>Ticket Detail #{selectedTicket.id}</h3>
              <button className="close-panel-btn" onClick={() => setSelectedTicket(null)}>
                ✕
              </button>
            </div>

            <div className="detail-body-scroll">
              <div className="detail-meta-grid">
                <div>
                  <span className="meta-label">Associated Project</span>
                  <span className="meta-value">{selectedTicket.project_name || 'General Support'}</span>
                </div>
                <div>
                  <span className="meta-label">Priority Level</span>
                  <span className={`priority-indicator priority-${selectedTicket.priority.toLowerCase()}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <span className="meta-label">Current Status</span>
                  <span className={`status-indicator status-${selectedTicket.status.toLowerCase().replace(' ', '-')}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <div>
                  <span className="meta-label">Assigned Dev</span>
                  <span className="meta-value">{selectedTicket.assigned_to_name || 'Not Assigned'}</span>
                </div>
              </div>

              <div className="ticket-description-box">
                <h4>Description of Problem</h4>
                <p>{selectedTicket.description}</p>
              </div>

              {selectedTicket.attachment_url && (
                <div className="ticket-attachment-box">
                  <h4>Attachment</h4>
                  <button 
                    type="button" 
                    className="view-attachment-btn" 
                    onClick={async () => {
                      try {
                        const url = await ticketAPI.getAttachment(selectedTicket.id);
                        window.open(url, '_blank');
                      } catch (err) {
                        console.error('Error opening attachment:', err);
                        alert('Failed to load attachment');
                      }
                    }}
                  >
                    📄 View Attached File
                  </button>
                </div>
              )}

              {selectedTicket.status !== 'Closed' && (
                <button className="ticket-close-action-btn" onClick={handleCloseTicket}>
                  Mark Ticket as Closed
                </button>
              )}

              <div className="ticket-discussion-section">
                <h4>Discussion & Replies</h4>
                <div className="comments-chat-log">
                  {commentsLoading ? (
                    <p className="loading-chat">Loading chat...</p>
                  ) : comments.length === 0 ? (
                    <p className="no-chat">No discussion yet. Type below to send a message.</p>
                  ) : (
                    comments.map((c) => {
                      const isMe = c.user_id === selectedTicket.raised_by_user_id;
                      return (
                        <div key={c.id} className={`chat-message ${isMe ? 'message-me' : 'message-other'}`}>
                          <div className="message-header">
                            <span className="chat-user-name">{c.user_name}</span>
                            <span className="chat-user-role">({c.user_role === 'admin' ? 'Admin/Dev' : 'Employee'})</span>
                          </div>
                          <p className="chat-text">{c.comment}</p>
                          <span className="chat-time">{formatDate(c.created_at)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleAddComment} className="chat-reply-form">
                  <input
                    type="text"
                    placeholder="Type a message or updates..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={selectedTicket.status === 'Closed'}
                  />
                  <button type="submit" disabled={selectedTicket.status === 'Closed' || !newComment.trim()}>
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="ticket-modal-backdrop">
          <div className="ticket-modal-box glass-ticket-card scale-in-center">
            <div className="modal-header">
              <h2>Raise a Support Ticket</h2>
              <button className="close-panel-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleRaiseTicket} className="modal-form">
              <div className="form-input-group">
                <label>Associated Project</label>
                <select name="project_id" value={formData.project_id} onChange={handleInputChange}>
                  <option value="">General Support (No associated project)</option>
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-input-group">
                <label>Issue Category / Error Type *</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="Bug / Error">Bug / Error</option>
                  <option value="Performance / Slow Loading">Performance / Slow Loading</option>
                  <option value="Access / Permission Issue">Access / Permission Issue</option>
                  <option value="Data Correction">Data Correction</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div className="form-input-group">
                <label>Priority *</label>
                <select name="priority" value={formData.priority} onChange={handleInputChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-input-group">
                <label>Problem Title (System Generated) *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  readOnly
                  style={{ background: 'rgba(0, 0, 0, 0.05)', color: '#475569', cursor: 'not-allowed' }}
                  required
                />
              </div>

              <div className="form-input-group">
                <label>Detailed Description of Problem *</label>
                <textarea
                  name="description"
                  rows="5"
                  placeholder="Provide details about the issue. What were you doing? What was the expected output vs actual?"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <div className="form-input-group">
                <label>Attachment (Optional) - Images/PDF (Max 10MB)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setAttachment(e.target.files[0] || null)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Raise Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTickets;
