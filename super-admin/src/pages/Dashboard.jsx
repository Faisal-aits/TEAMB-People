// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBuildingOffice2, HiUsers, HiUserGroup, HiChartBar } from 'react-icons/hi2';
import { superAdminAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await superAdminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <h1>Platform Dashboard</h1>
        <p>Overview of your multi-tenant platform</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon primary"><HiBuildingOffice2 /></div>
          <div className="stat-value">{stats?.total_tenants || 0}</div>
          <div className="stat-label">Total Organizations</div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon success"><HiChartBar /></div>
          <div className="stat-value">{stats?.active_tenants || 0}</div>
          <div className="stat-label">Active Organizations</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon warning"><HiUsers /></div>
          <div className="stat-value">{stats?.total_users || 0}</div>
          <div className="stat-label">Total Users</div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon info"><HiUserGroup /></div>
          <div className="stat-value">{stats?.total_employees || 0}</div>
          <div className="stat-label">Total Employees</div>
        </div>
      </div>

      {/* Plan Distribution */}
      {stats?.plan_distribution && stats.plan_distribution.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2>Subscription Distribution</h2>
          </div>
          <div className="plan-grid">
            {stats.plan_distribution.map((plan) => (
              <div className="plan-item" key={plan.subscription_plan}>
                <div className="plan-count">{plan.count}</div>
                <div className="plan-name">{plan.subscription_plan}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tenants */}
      <div className="section-card">
        <div className="section-header">
          <h2>Recent Organizations</h2>
          <button onClick={() => navigate('/tenants')}>View All →</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Plan</th>
              <th>Users</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recent_tenants?.length > 0 ? (
              stats.recent_tenants.map((tenant) => (
                <tr key={tenant.id} onClick={() => navigate(`/tenants/${tenant.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tenant.name}</td>
                  <td><span className={`badge ${tenant.subscription_plan}`}>{tenant.subscription_plan}</span></td>
                  <td>{tenant.user_count}</td>
                  <td><span className={`badge ${tenant.is_active ? 'active' : 'inactive'}`}>{tenant.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>{new Date(tenant.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No organizations yet. Create your first one!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
