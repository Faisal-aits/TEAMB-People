import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { HiOutlineBell } from 'react-icons/hi2';
import './NotificationBell.css';
import { API_BASE_URL } from '../services/api';

const API_URL = API_BASE_URL;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        const notifs = res.data.notifications || [];
        const unread = res.data.unreadCount || 0;
        setNotifications(notifs);
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      document.body.classList.add('has-unread-notifications');
    } else {
      document.body.classList.remove('has-unread-notifications');
    }
    return () => {
      document.body.classList.remove('has-unread-notifications');
    };
  }, [unreadCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setIsOpen(false);
      document.body.classList.remove('has-unread-notifications');
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  // Do not render bell icon at all if there are no unread notifications and dropdown is closed
  if (unreadCount === 0 && !isOpen) {
    return null;
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`notification-bell-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <HiOutlineBell className="notification-icon" />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read-btn">
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => { if(!notif.is_read) markAsRead(notif.id); }}
                >
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
