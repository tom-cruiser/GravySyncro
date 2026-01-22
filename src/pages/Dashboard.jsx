import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, Clock, Bell } from 'lucide-react';
import axios from 'axios';
import { fetchDocumentsSuccess } from '../features/documents/documentsSlice';
import DocumentCard from '../components/DocumentCard';
import './Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const { recentDocuments, isLoading } = useSelector(state => state.documents);
  const { unreadCount } = useSelector(state => state.notifications);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    thisMonth: 0,
    recent: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/documents/dashboard-stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const { totalDocuments, thisMonth, recent, recentDocuments: docs } = response.data.data;
      
      setStats({ totalDocuments, thisMonth, recent });
      
      // Format documents for display
      const formattedDocs = docs.map(doc => ({
        id: doc._id,
        title: doc.name,
        type: doc.mimeType.split('/')[1].toUpperCase(),
        size: formatFileSize(doc.size),
        date: new Date(doc.createdAt).toLocaleDateString(),
        fileKey: doc.fileKey,
        uploadedBy: doc.uploadedBy,
      }));
      
      dispatch(fetchDocumentsSuccess(formattedDocs));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const dashboardStats = [
    { icon: FileText, label: t('dashboard.totalDocuments'), value: stats.totalDocuments, color: '#667eea' },
    { icon: Upload, label: t('dashboard.thisMonth'), value: stats.thisMonth, color: '#48bb78' },
    { icon: Clock, label: t('dashboard.recent'), value: stats.recent, color: '#ed8936' },
    { icon: Bell, label: t('dashboard.notifications'), value: unreadCount, color: '#f56565' },
  ];

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/documents/${document.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
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
          <p className="subtitle">{t('dashboard.subtitle')}</p>
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
