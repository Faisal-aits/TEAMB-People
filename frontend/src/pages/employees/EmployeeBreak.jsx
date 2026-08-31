import React, { useState, useEffect, useMemo } from 'react';
import { breakAPI } from '../../services/breakAPI';
import { attendanceAPI } from '../../services/attendanceAPI';
import { useTableControls } from '../../hooks/useTableControls';
import '../../styles/tableControls.css';
import './EmployeeBreak.css';

const BREAK_SEARCH_FIELDS = ['date', 'breakIn', 'breakOut', 'status'];

const EmployeeBreak = () => {
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [todayStatus, setTodayStatus] = useState({
    isOnBreak: false,
    activeBreak: null,
    totalDuration: 0
  });
  const [todayAttendance, setTodayAttendance] = useState({
    isCheckedIn: false,
    isCheckedOut: false,
  });

  const fetchBreakHistory = async () => {
    try {
      setLoading(true);
      const response = await breakAPI.getMyHistory();
      if (response.data.success) {
        const transformedData = response.data.data.map((record, index) => ({
          id: record.id || `break-${index}`,
          date: record.break_date,
          breakIn: record.break_in_time ? new Date(record.break_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
          breakOut: record.break_out_time ? new Date(record.break_out_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--',
          duration: record.duration_minutes || 0,
          status: record.status
        }));
        setBreaks(transformedData);
      } else {
        setError(response.data.message || 'Failed to fetch break data');
      }
    } catch (err) {
      console.error('Error fetching break history:', err);
      setError(err.response?.data?.message || 'Error loading break data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayBreaks = async () => {
    try {
      const response = await breakAPI.getMyTodayBreaks();
      if (response.data.success) {
        setTodayStatus({
          isOnBreak: response.data.data.isOnBreak,
          activeBreak: response.data.data.activeBreak,
          totalDuration: response.data.data.totalDuration || 0
        });
      }
    } catch (err) {
      console.error('Error fetching today breaks:', err);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceAPI.getMyTodayAttendance();
      if (response.data && response.data.attendance) {
        const att = response.data.attendance;
        setTodayAttendance({
          isCheckedIn: Boolean(att.check_in_time || att.check_in),
          isCheckedOut: Boolean(att.check_out_time || att.check_out),
        });
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const handleBreakAction = async (type) => {
    try {
      if (type === 'break_in') {
        await breakAPI.breakIn();
      } else {
        await breakAPI.breakOut();
      }
      await fetchBreakHistory();
      await fetchTodayBreaks();
      await fetchTodayAttendance();
    } catch (err) {
      console.error(`Error during ${type}:`, err);
      alert(err.response?.data?.message || `Error during ${type === 'break_in' ? 'Take Break' : 'End Break'}`);
    }
  };

  useEffect(() => {
    fetchBreakHistory();
    fetchTodayBreaks();
    fetchTodayAttendance();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'break-status-active',
      'Completed': 'break-status-completed',
    };
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status}
      </span>
    );
  };

  const filteredBreaks = filterStatus === 'All'
    ? breaks
    : breaks.filter(record => record.status === filterStatus);

  const {
    controlledRows: visibleBreaks,
    searchTerm,
    setSearchTerm,
    requestSort,
    sortLabel,
  } = useTableControls(filteredBreaks, BREAK_SEARCH_FIELDS, { key: 'date', accessor: 'date', direction: 'desc' });

  const averageBreakDuration = useMemo(() => {
    const dateMap = new Map();
    breaks.forEach((record) => {
      if (!record.date) return;
      const dStr = typeof record.date === 'string' ? record.date.substring(0, 10) : new Date(record.date).toISOString().split('T')[0];
      const dur = record.duration || 0;
      const current = dateMap.get(dStr) || 0;
      dateMap.set(dStr, current + dur);
    });

    let totalMins = 0;
    let activeDays = 0;
    dateMap.forEach((mins) => {
      if (mins > 0) {
        totalMins += mins;
        activeDays++;
      }
    });

    if (activeDays === 0) return 0;
    const avg = totalMins / activeDays;
    return Number.isInteger(avg) ? avg : avg.toFixed(1);
  }, [breaks]);

  if (loading) {
    return (
      <div className="attendance-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading break data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-section">
        <div className="no-data">
          <p className="error-message">{error}</p>
          <button onClick={fetchBreakHistory} className="refresh-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-section">
      <div className="attendance-header">
        <h2>My Breaks</h2>
        <div className="attendance-actions">
          <button
            className="check-in-btn"
            onClick={() => handleBreakAction('break_in')}
            disabled={!todayAttendance.isCheckedIn || todayAttendance.isCheckedOut || todayStatus.isOnBreak}
            title={!todayAttendance.isCheckedIn ? 'Please check in first before taking a break' : ''}
          >
            Take Break
          </button>
          <button
            className="check-out-btn"
            onClick={() => handleBreakAction('break_out')}
            disabled={!todayStatus.isOnBreak}
          >
            End Break
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Today's Break Time</div>
          <div className="summary-card-value">{todayStatus.totalDuration} mins</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Average Break Time</div>
          <div className="summary-card-value">{averageBreakDuration} mins</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-title">Current Status</div>
          <div className="summary-card-value" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', height: '100%', color: todayStatus.isOnBreak ? '#1e40af' : '#6b7280' }}>
            {todayStatus.isOnBreak ? 'On Break' : 'Working'}
          </div>
        </div>
      </div>

      <div className="attendance-table-container">
        <div className="table-header">
          <h3>Break History</h3>
          <div className="table-actions">
            <input
              type="search"
              className="table-search-input"
              placeholder="Search breaks..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="filter-btn"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
            <button
              className="refresh-btn"
              onClick={() => {
                fetchBreakHistory();
                fetchTodayBreaks();
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {visibleBreaks.length === 0 ? (
          <div className="no-data">
            <p>No break records found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => requestSort('date', 'date')}>Date{sortLabel('date')}</th>
                  <th className="sortable-th" onClick={() => requestSort('breakIn', 'breakIn')}>Break In{sortLabel('breakIn')}</th>
                  <th className="sortable-th" onClick={() => requestSort('breakOut', 'breakOut')}>Break Out{sortLabel('breakOut')}</th>
                  <th className="sortable-th" onClick={() => requestSort('duration', 'duration')}>Duration (Mins){sortLabel('duration')}</th>
                  <th className="sortable-th" onClick={() => requestSort('status', 'status')}>Status{sortLabel('status')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleBreaks.map((record, index) => (
                  <tr key={record.id || `break-${index}`}>
                    <td>
                      <div className="date-cell">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="time-cell">{record.breakIn}</div>
                    </td>
                    <td>
                      <div className="time-cell">{record.breakOut}</div>
                    </td>
                    <td>
                       <div className="time-cell">{record.duration}</div>
                    </td>
                    <td>{getStatusBadge(record.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeBreak;
