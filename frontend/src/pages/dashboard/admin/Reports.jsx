import React, { useState, useEffect } from 'react';
import './Reports.css';
import { reportAPI } from '../../../services/reportAPI';
import { FaEdit, FaTrash, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';

const Reports = () => {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
     dateFrom: '',
     dateTo: ''
   });

  // Check if we have reports from dashboard navigation
  useEffect(() => {
    console.log('Location state:', location.state);
    
    if (location.state?.fromDashboard) {
      console.log('Reports from dashboard navigation:', location.state.reports);
      
      let reportsData = [];
      
      if (Array.isArray(location.state.reports)) {
        reportsData = location.state.reports;
        console.log('Reports is an array with length:', reportsData.length);
      } else if (location.state.reports?.data && Array.isArray(location.state.reports.data)) {
        reportsData = location.state.reports.data;
      } else if (location.state.reports?.reports && Array.isArray(location.state.reports.reports)) {
        reportsData = location.state.reports.reports;
      }
      
      console.log('Processed reports data:', reportsData);
      
      const processedReports = reportsData.map(report => ({
        id: report.id || report.report_id || Math.random().toString(),
        date_generated: report.date_generated || report.date || new Date().toISOString(),
        description: report.description || 'No description',
        generated_by_name: report.generated_by_name || 'Employee',
        ...report
      }));
      
      console.log('Final processed reports:', processedReports);
      setReports(processedReports);
      setFilteredReports(processedReports); // Set filtered reports immediately
      setLoading(false);
    } else {
      fetchAllReports();
    }
  }, [location.state]);

  // Apply filters whenever reports or filters change
  useEffect(() => {
    applyFilters();
  }, [reports, filters]);


  // Debug API endpoints
  useEffect(() => {
    const debugAPIs = async () => {
      try {
        console.log('Testing API endpoints...');
        const recentResponse = await reportAPI.getRecent(3);
        console.log('getRecent(3) response:', recentResponse);
        const allResponse = await reportAPI.getAll();
        console.log('getAll() response:', allResponse);
      } catch (error) {
        console.error('Debug error:', error);
      }
    };
    
    debugAPIs();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getRecent(100);
      console.log('getRecent response:', response);
      
      let reportsData = [];
      
      if (response.data && Array.isArray(response.data.reports)) {
        reportsData = response.data.reports;
      } else if (Array.isArray(response.data)) {
        reportsData = response.data;
      } else if (response.data && response.data.data) {
        reportsData = response.data.data;
      }
      
      console.log('Extracted reports data:', reportsData);
      setReports(reportsData);
      setFilteredReports(reportsData); // Set filtered reports immediately
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports. Please try again.');
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    console.log('Applying filters with:', filters);
    console.log('Current reports:', reports);
    
    let filtered = [...reports];

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date_generated);
        return reportDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date_generated);
        return reportDate <= toDate;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date_generated) - new Date(a.date_generated));
    
    console.log('Filtered results:', filtered);
    setFilteredReports(filtered);
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: ''
    });
    // No need to call applyFilters here as useEffect will trigger it
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // No need to call applyFilters here as useEffect will trigger it
  };

  const formatReportDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const handleExport = () => {
    try {
      if (filteredReports.length === 0) {
        alert('No reports to export');
        return;
      }

      const exportData = filteredReports.map(report => ({
        'Date': formatFullDate(report.date_generated),
        'Description': report.description,
        'Generated By': report.generated_by_name || 'Jubeda Shaikh',
        'Report ID': report.id
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');
      
      const fileName = `Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert(`✅ Exported ${filteredReports.length} reports successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting reports. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="leave-management-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-management-section">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Reports</h3>
          <p>{error}</p>
          <button onClick={fetchAllReports} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leave-management-section">
      <div className="reports-section">
        <div className="reports-header">
          <h2 className="reports-title">All Reports</h2>
          <div className="header-actions">
            <button 
              className="reports-export-btn"
              onClick={handleExport}
              disabled={filteredReports.length === 0}
            >
             
              Export 
            </button>
          </div>
        </div>

        <div className="reports-table-container glass-form-leave">
          <div className="reports-table-header">
            <div className="header-left">
              <h3 className="reports-table-title">Report History</h3>
            </div>
         <div className="filter-controls-header">
  <div className="date-filter-group">
    <input
      type="date"
      name="dateFrom"
      value={filters.dateFrom}
      onChange={handleFilterChange}
      className="date-filter-input"
      placeholder="From"
    />
    <span className="date-separator">to</span>
    <input
      type="date"
      name="dateTo"
      value={filters.dateTo}
      onChange={handleFilterChange}
      className="date-filter-input"
      placeholder="To"
    />
  </div>
  {/* Clear button always visible */}
  <button className="clear-filters-btn-small" onClick={clearFilters}>
    Clear
  </button>
</div>
          </div>

          <table className="reports-records-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Generated By</th>
               
              </tr>
            </thead>
            <tbody>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="reports-table-row">
                    <td>
                      <div className="reports-date-cell">
                        {formatFullDate(report.date_generated)}
                        <span className="reports-relative-date">
                          ({formatReportDate(report.date_generated)})
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="reports-description-cell">
                        {report.description}
                      </div>
                    </td>
                    <td>
                      <div className="reports-author-cell">
                        <span className="author-name">
                          {report.generated_by_name }
                        </span>
                      </div>
                    </td>
                 <td>
  
</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data-cell">
                    <div className="no-reports">
                      <div className="no-data-icon">📊</div>
                      <p>No reports found</p>
                      <p className="no-data-subtext">
                        {reports.length > 0 
                          ? 'Try adjusting your date filters.'
                          : 'No reports available.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      
      </div>
    </div>
  );
};

export default Reports;