import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import './EmployeeHoliday.css';

const EmployeeHoliday = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/salary/holidays`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          // Sort by date ascending and filter only upcoming holidays
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const upcoming = response.data.holidays
            .filter(h => new Date(h.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
          setHolidays(upcoming);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="employee-holiday-container">
      <div className="holiday-header-container">
        <h2 className="holiday-page-title">Upcoming Holidays</h2>
        <p className="holiday-page-subtitle">View all scheduled company holidays for the year</p>
      </div>

      <div className="holiday-content-card">
        {loading ? (
          <div className="holiday-loading">Loading holidays...</div>
        ) : holidays.length > 0 ? (
          <div className="holiday-list">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="holiday-item-card">
                <div className="holiday-date-box">
                  <span className="holiday-day">{new Date(holiday.date).getDate()}</span>
                  <span className="holiday-month">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div className="holiday-details">
                  <h3 className="holiday-name">{holiday.name}</h3>
                  <p className="holiday-date-full">{formatDate(holiday.date)}</p>
                  {holiday.description && (
                    <span className="holiday-description-badge">
                      {holiday.description.replace(/^\[.*?\]\s*/, '')}
                    </span>
                  )}
                </div>
                <div className="holiday-status">
                  <span className="upcoming-badge">Upcoming</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-holidays-message">
            <p>No upcoming holidays scheduled at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeHoliday;
