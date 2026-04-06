import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Clock, Bell, FolderKanban, Users, HardDrive } from 'lucide-react';
import axios from 'axios';
import { logout } from '../features/auth/authSlice';
import { fetchDocumentsSuccess } from '../features/documents/documentsSlice';
import DocumentCard from '../components/DocumentCard';
import api from '../config/api';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector(state => state.auth);
  const { recentDocuments, isLoading } = useSelector(state => state.documents);
  const { unreadCount } = useSelector(state => state.notifications);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    thisMonth: 0,
    recent: 0,
    workspaceCount: 0,
  });
  const [spaceUsage, setSpaceUsage] = useState({
    storageUsed: 0,
    storageLimit: 0,
    storageRemaining: 0,
    storageUsedPercentage: 0,
  });
  const [spaceUsers, setSpaceUsers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [workspaceLabel, setWorkspaceLabel] = useState('Workspaces');

  useEffect(() => {
    if (!token) return;
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      const [statsResult, workspaceResult] = await Promise.allSettled([
        axios.get(
          `${import.meta.env.VITE_API_URL}/documents/dashboard-stats`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        ),
        axios.get(api.endpoints.workspaces.list(), {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (statsResult.status !== 'fulfilled') {
        throw statsResult.reason;
      }

      const response = statsResult.value;
      const workspaceResponse = workspaceResult.status === 'fulfilled' ? workspaceResult.value : null;
      
      const {
        totalDocuments,
        thisMonth,
        recent,
        recentDocuments: docs = [],
        spaceUsage: nextSpaceUsage = {},
        spaceUsers: nextSpaceUsers = [],
      } = response.data.data || {};
      const workspaceCount = workspaceResponse?.data?.data?.workspaces?.length || 0;
      setWorkspaceLabel('Workspaces');
      
      setStats({ totalDocuments, thisMonth, recent, workspaceCount });
      setSpaceUsage({
        storageUsed: Number(nextSpaceUsage.storageUsed || 0),
        storageLimit: Number(nextSpaceUsage.storageLimit || 0),
        storageRemaining: Number(nextSpaceUsage.storageRemaining || 0),
        storageUsedPercentage: Number(nextSpaceUsage.storageUsedPercentage || 0),
      });
      setSpaceUsers(Array.isArray(nextSpaceUsers) ? nextSpaceUsers : []);
      
      // Format documents for display
      const formattedDocs = docs.map((doc) => {
        const mimeType = String(doc?.mimeType || 'application/octet-stream');
        const parts = mimeType.split('/');
        const extension = (parts[1] || 'FILE').toUpperCase();
        return {
        id: doc._id,
        title: doc.name,
        type: extension,
        size: formatFileSize(doc.size),
        date: new Date(doc.createdAt).toLocaleDateString(),
        fileKey: doc.fileKey,
        uploadedBy: doc.uploadedBy,
        };
      });
      
      dispatch(fetchDocumentsSuccess(formattedDocs));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
    } finally {
      setLoadingStats(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const dashboardStats = [
    { icon: FileText, label: t('dashboard.totalDocuments'), value: stats.totalDocuments, color: '#667eea' },
    { icon: Upload, label: t('dashboard.thisMonth'), value: stats.thisMonth, color: '#48bb78' },
    { icon: Clock, label: t('dashboard.recent'), value: stats.recent, color: '#ed8936' },
    { icon: FolderKanban, label: workspaceLabel, value: stats.workspaceCount, color: '#0891b2' },
    { icon: Bell, label: t('dashboard.notifications'), value: unreadCount, color: '#f56565' },
  ];

  const handleDownload = async (doc) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const signedUrl = response.data?.data?.url;
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      throw new Error('No download URL received');
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleShare = (document) => {
    // Navigate to documents page with share modal
    window.location.href = `/documents?share=${document.id}`;
  };

  const handleView = (document) => {
    // Navigate to documents page
    window.location.href = `/documents?view=${document.id}`;
  };

  const handleDelete = async (document) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/documents/${document.id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        // Refresh dashboard data
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document');
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{t('dashboard.welcomeBack', { name: user?.firstName || 'User' })}</h1>
          <p className="subtitle">{t('dashboard.subtitle')} · {stats.workspaceCount} {workspaceLabel.toLowerCase()}</p>
        </div>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h2 className="stat-value">{loadingStats ? '...' : stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="space-usage-card">
        <div className="space-usage-header">
          <div>
            <h2><HardDrive size={20} /> Space Usage</h2>
            <p>See total used space and how it is distributed across your members.</p>
          </div>
          <div className="space-usage-summary">
            <span>{formatFileSize(spaceUsage.storageUsed)} used</span>
            <span>/ {formatFileSize(spaceUsage.storageLimit)} total</span>
          </div>
        </div>

        <div className="space-progress-track">
          <div
            className={`space-progress-fill ${spaceUsage.storageUsedPercentage >= 80 ? 'warning' : ''}`}
            style={{ width: `${Math.min(spaceUsage.storageUsedPercentage, 100)}%` }}
          />
        </div>

        <div className="space-usage-meta">
          <span>{spaceUsage.storageUsedPercentage.toFixed(1)}% consumed</span>
          <span>{formatFileSize(spaceUsage.storageRemaining)} remaining</span>
        </div>

        <div className="space-users-header">
          <h3><Users size={16} /> Space Users</h3>
          <span>{spaceUsers.length} active member{spaceUsers.length === 1 ? '' : 's'}</span>
        </div>

        {spaceUsers.length === 0 ? (
          <div className="space-users-empty">No active users found for this space.</div>
        ) : (
          <div className="space-users-list">
            {spaceUsers.map((member) => (
              <div className="space-user-item" key={member._id}>
                <div className="space-user-main">
                  <div className="space-user-name">{member.firstName} {member.lastName}</div>
                  <div className="space-user-email">{member.email}</div>
                </div>
                <div className="space-user-role">{member.role}</div>
                <div className="space-user-usage">
                  <span>{formatFileSize(member.storageUsed)}</span>
                  <small>{Number(member.usagePercentOfTenant || 0).toFixed(2)}% of tenant limit</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>{t('dashboard.recentDocuments')}</h2>
          <a href="/documents" className="view-all-link">{t('dashboard.viewAll')}</a>
        </div>

        {isLoading || loadingStats ? (
          <div className="loading">{t('dashboard.loading')}</div>
        ) : recentDocuments.length === 0 ? (
          <div className="no-documents">
            <FileText size={48} style={{ opacity: 0.3 }} />
            <p>No documents yet. Upload your first document!</p>
          </div>
        ) : (
          <div className="documents-grid">
            {recentDocuments.map(doc => (
              <DocumentCard 
                key={doc.id} 
                document={doc}
                onDownload={handleDownload}
                onShare={handleShare}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
