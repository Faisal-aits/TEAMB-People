// src/components/Layout.jsx
import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HiShieldCheck, 
  HiSquares2X2, 
  HiBuildingOffice2, 
  HiArrowRightOnRectangle 
} from 'react-icons/hi2';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HiSquares2X2 },
    { path: '/tenants', label: 'Organizations', icon: HiBuildingOffice2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return 'SA';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
            <img src="/logo.png" alt="TEAM B People" style={{ height: '26px', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>Super Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className="nav-icon" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials()}</div>
            <div className="user-details">
              <h4>{user?.first_name} {user?.last_name}</h4>
              <span>Super Admin</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <HiArrowRightOnRectangle size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
