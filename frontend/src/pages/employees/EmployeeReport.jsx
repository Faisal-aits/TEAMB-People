import React, { useState, useEffect } from 'react';
import { reportAPI } from '../../services/reportAPI';
import { HiOutlineDocumentText, HiOutlinePlus, HiOutlineSearch, HiOutlineEye } from 'react-icons/hi';
import './EmployeeReport.css';

const EmployeeReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState(null);
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getMyReports();
      setReports(res.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    try {
      setSubmitting(true);
      await reportAPI.create({ report_text: reportText });
      setReportText('');
      setIsModalOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (report) => {
    const isReviewed = Boolean(report.admin_remark && report.admin_remark.trim());
    const status = report.status || (isReviewed ? 'Reviewed' : 'Pending');

    if (status === 'Reviewed' || status === 'Approved' || status === 'Resolved') {
      return <span className="ticket-status-badge ticket-status--reviewed">{status}</span>;
    }
    return <span className="ticket-status-badge ticket-status--pending">Pending</span>;
  };

  const filteredReports = reports.filter(report => {
    const isReviewed = Boolean(report.admin_remark && report.admin_remark.trim());
    const status = report.status || (isReviewed ? 'Reviewed' : 'Pending');

    const matchesStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
    const textMatch = (report.report_text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (report.admin_remark || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && textMatch;
  });

  return (
    <div className="employee-report-page">
      <div className="report-page-header">
        <div>
          <h2>Tickets & Notifications</h2>
          <p>Submit and track your daily work updates, tickets, and blockers.</p>
        </div>
        <button className="new-report-btn" onClick={() => setIsModalOpen(true)}>
          <HiOutlinePlus /> Notify
        </button>
      </div>

      <div className="report-list-container">
        {/* Filter and Search Bar */}
        <div className="report-table-controls">
          <div className="report-search-box">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="report-search-input"
            />
          </div>
          <div className="report-filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="report-filter-select"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="report-loading">Loading tickets...</div>
        ) : filteredReports.length === 0 ? (
          <div className="report-empty-state">
            <HiOutlineDocumentText className="empty-icon" />
            <h3>No tickets found</h3>
            <p>
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search or status filter.'
                : "You haven't submitted any tickets or notifications yet."}
            </p>
            {statusFilter === 'All' && !searchTerm && (
              <button className="new-report-btn-outline" onClick={() => setIsModalOpen(true)}>
                + Notify
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Date</th>
                  <th>Description / Update</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th>Admin Remark</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="ticket-table-row">
                    <td className="ticket-td-date">
                      {formatDate(report.report_date || report.created_at)}
                    </td>
                    <td className="ticket-td-text">
                      <div className="ticket-text-cell">{report.report_text}</div>
                    </td>
                    <td className="ticket-td-status">
                      {getStatusBadge(report)}
                    </td>
                    <td className="ticket-td-remark">
                      {report.admin_remark ? (
                        <div className="ticket-remark-cell">{report.admin_remark}</div>
                      ) : (
                        <span className="no-remark-text">—</span>
                      )}
                    </td>
                    <td className="ticket-td-actions" style={{ textAlign: 'center' }}>
                      <button
                        className="ticket-view-btn"
                        onClick={() => setViewModalData(report)}
                        title="View Details"
                      >
                        <HiOutlineEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Notify Modal */}
      {isModalOpen && (
        <div className="report-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3>Submit Work Update / Ticket</h3>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="report-modal-form">
              <div className="form-group">
                <label>Description / Message</label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Write today's work, blockers, or update..."
                  rows={6}
                  maxLength={3000}
                  required
                  autoFocus
                />
                <div className="char-count">{reportText.length}/3000</div>
              </div>
              <div className="report-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting || !reportText.trim()}>
                  {submitting ? 'Submitting...' : 'Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewModalData && (
        <div className="report-modal-overlay" onClick={() => setViewModalData(null)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3>Ticket Details ({formatDate(viewModalData.report_date || viewModalData.created_at)})</h3>
              <button className="close-modal-btn" onClick={() => setViewModalData(null)}>&times;</button>
            </div>
            <div className="report-modal-form">
              <div className="form-group">
                <label>Status</label>
                <div>{getStatusBadge(viewModalData)}</div>
              </div>
              <div className="form-group">
                <label>Description / Message</label>
                <div className="view-modal-text">{viewModalData.report_text}</div>
              </div>
              {viewModalData.admin_remark && (
                <div className="form-group">
                  <label>Admin Remark</label>
                  <div className="view-modal-remark">{viewModalData.admin_remark}</div>
                </div>
              )}
              <div className="report-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setViewModalData(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;
