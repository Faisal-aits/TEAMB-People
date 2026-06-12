// src/pages/admin/TicketManagement.jsx
import { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/ticketAPI';
import { projectAPI } from '../../services/projectAPI';
import './TicketManagement.css';

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('All'); // 'All' | 'Internal' | 'External'

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

  const fetchFiltersData = async () => {
    try {
      // Fetch employees for assignment dropdown
      const empRes = await projectAPI.getEmployees();
      setEmployees(empRes.data.employees || empRes.data.data || []);

      // Fetch all projects for filter dropdown
      const projRes = await projectAPI.getAll();
      setProjects(projRes.data.projects || projRes.data.data || []);
    } catch (err) {
      console.error('Error fetching filters data:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchFiltersData();
  }, []);

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

  const handleUpdateField = async (field, value) => {
    if (!selectedTicket) return;
    try {
      const payload = {
        [field]: value === '' ? null : value,
      };
      await ticketAPI.update(selectedTicket.id, payload);
      
      // Refresh current details
      const detailRes = await ticketAPI.getById(selectedTicket.id);
      setSelectedTicket(detailRes.data.data);
      fetchTickets();
    } catch (err) {
      console.error(`Error updating ticket ${field}:`, err);
      alert(err.response?.data?.message || 'Failed to update ticket');
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
    const matchesProject = projectFilter === 'All' || String(t.project_id) === projectFilter;
    const matchesOrigin =
      originFilter === 'All' ||
      (originFilter === 'External' && t.source_app) ||
      (originFilter === 'Internal' && !t.source_app);
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.raised_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.project_name && t.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesPriority && matchesProject && matchesOrigin && matchesSearch;
  });

  return (
    <div className="tickets-admin-section">
      <div className="admin-header-container">
        <div>
          <h2 className="admin-title-text">Helpdesk & Ticket Management</h2>
          <p className="admin-subtitle-text">Respond to problem reports, assign assignees, and track resolutions</p>
        </div>
        
        <div className="ticket-source-tabs">
          <button
            type="button"
            className={`source-tab-btn ${originFilter === 'All' ? 'active' : ''}`}
            onClick={() => setOriginFilter('All')}
          >
            All Tickets
          </button>
          <button
            type="button"
            className={`source-tab-btn ${originFilter === 'Internal' ? 'active' : ''}`}
            onClick={() => setOriginFilter('Internal')}
          >
            Internal
          </button>
          <button
            type="button"
            className={`source-tab-btn ${originFilter === 'External' ? 'active' : ''}`}
            onClick={() => setOriginFilter('External')}
          >
            External
          </button>
        </div>
      </div>

      <div className="admin-filter-bar glass-admin-card">
        <div className="filter-input-group">
          <label>Search Tickets</label>
          <input
            type="search"
            placeholder="Search title, raiser, project..."
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
        <div className="filter-input-group">
          <label>Project</label>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-content-grid">
        <div className="admin-list-wrapper glass-admin-card">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
              <p>Fetching helpdesk board...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="admin-empty">
              <span className="empty-emoji">🎉</span>
              <h3>No tickets pending</h3>
              <p>All tickets are resolved or no reports match your filters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Raised By</th>
                  <th>Project</th>
                  <th>Problem Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Date Raised</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`admin-row-item ${selectedTicket?.id === t.id ? 'row-selected' : ''}`}
                    onClick={() => selectTicket(t)}
                  >
                    <td>#{t.id}</td>
                    <td className="admin-user-cell">
                      {t.raised_by_name}
                      {t.source_app && (
                        <span className="source-app-badge" title={`External Ref: ${t.external_ref || 'N/A'}`}>
                          via {t.source_app}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="admin-project-tag">
                        {t.source_app 
                          ? `${t.source_app}${t.external_ref ? ` (#${t.external_ref})` : ''}`
                          : (t.project_name || 'General Support')}
                      </span>
                    </td>
                    <td className="admin-title-cell">{t.title}</td>
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
                    <td className="admin-assignee-cell">{t.assigned_to_name || 'Unassigned'}</td>
                    <td className="admin-date-cell">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedTicket && (
          <div className="admin-detail-panel glass-admin-card fade-in-right">
            <div className="detail-panel-header">
              <h3>Manage Ticket #{selectedTicket.id}</h3>
              <button className="close-panel-btn" onClick={() => setSelectedTicket(null)}>
                ✕
              </button>
            </div>

            <div className="detail-body-scroll">
              <div className="detail-meta-grid">
                <div>
                  <span className="meta-label">Raised By</span>
                  <span className="meta-value">{selectedTicket.raised_by_name}</span>
                </div>
                <div>
                  <span className="meta-label">Associated Project / App ID</span>
                  <span className="meta-value">
                    {selectedTicket.source_app 
                      ? `${selectedTicket.source_app}${selectedTicket.external_ref ? ` (#${selectedTicket.external_ref})` : ''}`
                      : (selectedTicket.project_name || 'General Support')}
                  </span>
                </div>
                <div>
                  <span className="meta-label">Date Raised</span>
                  <span className="meta-value-small">{formatDate(selectedTicket.created_at)}</span>
                </div>
                {selectedTicket.source_app && (
                  <div>
                    <span className="meta-label">Source App</span>
                    <span className="meta-value" style={{ color: '#8b5cf6', fontWeight: 700 }}>
                      {selectedTicket.source_app}
                    </span>
                  </div>
                )}
                {selectedTicket.external_ref && (
                  <div>
                    <span className="meta-label">External Ref</span>
                    <span className="meta-value-small" style={{ fontWeight: 600 }}>
                      {selectedTicket.external_ref}
                    </span>
                  </div>
                )}
              </div>

              {/* Editable Status, Priority and Assignment */}
              <div className="admin-edit-meta-form">
                <div className="form-input-group">
                  <label>Assign to Developer</label>
                  <select
                    value={selectedTicket.assigned_to_user_id || ''}
                    onChange={(e) => handleUpdateField('assigned_to_user_id', e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-input-group">
                  <label>Update Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateField('status', e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="form-input-group">
                  <label>Update Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateField('priority', e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="ticket-description-box">
                <h4>Problem Description</h4>
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

              <div className="ticket-discussion-section">
                <h4>Discussion & Reply Thread</h4>
                <div className="comments-chat-log">
                  {commentsLoading ? (
                    <p className="loading-chat">Loading chat...</p>
                  ) : comments.length === 0 ? (
                    <p className="no-chat">No replies yet. Type below to write a message.</p>
                  ) : (
                    comments.map((c) => {
                      const isMe = c.user_id !== selectedTicket.raised_by_user_id;
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
                    placeholder="Type reply or status update notes..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={selectedTicket.status === 'Closed'}
                  />
                  <button type="submit" disabled={selectedTicket.status === 'Closed' || !newComment.trim()}>
                    Reply
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketManagement;
