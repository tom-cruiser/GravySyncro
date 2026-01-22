import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Activity, 
  TrendingUp, 
  Database,
  Shield,
  AlertCircle,
  Building2,
  HeartPulse,
  MessageCircle
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import AdminUsers from '../components/AdminUsers';
import AdminTenants from '../components/AdminTenants';
import AdminActivityLogs from '../components/AdminActivityLogs';
import AdminMessages from '../components/AdminMessages';
import SystemHealth from '../components/SystemHealth';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { token } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Handle navigation from notification
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats?.stats?.totalUsers || 0,
      color: '#667eea',
      subtext: `${stats?.stats?.activeUsers || 0} active`
    },
    {
      icon: Building2,
      label: 'Total Tenants',
      value: stats?.stats?.totalTenants || 0,
      color: '#48bb78',
      subtext: 'Organizations'
    },
    {
      icon: FileText,
      label: 'Total Documents',
      value: stats?.stats?.totalDocuments || 0,
      color: '#ed8936',
      subtext: 'Files stored'
    },
    {
      icon: Activity,
      label: 'Recent Activity',
      value: stats?.stats?.recentActivity || 0,
      color: '#f56565',
      subtext: 'Last 24 hours'
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1><Shield size={32} /> Admin Dashboard</h1>
          <p className="subtitle">System monitoring and user management</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
        <button
          className={`admin-tab ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          <Building2 size={18} />
          Tenants
        </button>
        <button
          className={`admin-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={18} />
          Activity
        </button>
        <button
          className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageCircle size={18} />
          Messages
        </button>
        <button
          className={`admin-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={18} />
          Documents
        </button>
        <button
          className={`admin-tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <HeartPulse size={18} />
          System Health
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            {statCards.map((stat, index) => (
              <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                  <stat.icon size={24} />
                </div>
                <div className="stat-content">
                  <p className="stat-label">{stat.label}</p>
                  <h2 className="stat-value">{stat.value}</h2>
                  <small className="stat-subtext">{stat.subtext}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-content">
            <div className="admin-card">
              <h3><TrendingUp size={20} /> User Growth (Last 7 Days)</h3>
              <div className="growth-chart">
                {stats?.userGrowth?.map((day, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar" 
                      style={{ height: `${Math.max(day.count * 10, 5)}px` }}
                    />
                    <span className="bar-label">{day.date.split('-')[2]}</span>
                    <span className="bar-value">{day.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card">
              <h3><Database size={20} /> Storage Usage</h3>
              <div className="storage-info">
                <p>Total: {((stats?.stats?.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB</p>
                <div className="storage-bar">
                  <div 
                    className="storage-fill" 
                    style={{ width: '35%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="admin-tab-content">
          <AdminUsers />
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="admin-tab-content">
          <AdminTenants />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="admin-tab-content">
          <AdminActivityLogs />
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="admin-tab-content">
          <AdminMessages />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="admin-tab-content">
          <div className="coming-soon">
            <AlertCircle size={48} />
            <p>Document Management Component Loading...</p>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="admin-tab-content">
          <SystemHealth />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
