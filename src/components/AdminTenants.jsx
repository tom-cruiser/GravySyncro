import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './AdminTenants.css';

const AdminTenants = () => {
  const { token } = useSelector((state) => state.auth);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/tenants`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setTenants(response.data.data.tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTenantDetails = async (tenant) => {
    setSelectedTenant(tenant);
    setShowModal(true);
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenant.tenantId }
        }
      );
      setTenantUsers(response.data.data.users);
    } catch (error) {
      console.error('Error fetching tenant users:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTenant(null);
    setTenantUsers([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateStoragePercentage = (used) => {
    const maxStorage = 5 * 1024 * 1024 * 1024; // 5GB in bytes
    return ((used / maxStorage) * 100).toFixed(1);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="loading">Loading tenants...</div>;
  }

  return (
    <div className="admin-tenants">
      <div className="tenants-header">
        <h2>Tenant Management</h2>
        <div className="tenants-summary">
          <div className="summary-item">
            <span className="summary-label">Total Tenants:</span>
            <span className="summary-value">{tenants.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Users:</span>
            <span className="summary-value">
              {tenants.reduce((sum, t) => sum + t.userCount, 0)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Documents:</span>
            <span className="summary-value">
              {tenants.reduce((sum, t) => sum + t.documentCount, 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="tenants-grid">
        {tenants.map((tenant) => (
          <div key={tenant.tenantId} className="tenant-card">
            <div className="tenant-card-header">
              <div className="tenant-icon">
                {tenant.primaryUser?.firstName?.charAt(0)}
                {tenant.primaryUser?.lastName?.charAt(0)}
              </div>
              <div className="tenant-info">
                <h3 className="tenant-name">
                  {tenant.primaryUser?.firstName} {tenant.primaryUser?.lastName}
                </h3>
                <p className="tenant-id">ID: {tenant.tenantId.substring(0, 16)}...</p>
              </div>
            </div>

            <div className="tenant-stats">
              <div className="stat-item">
                <span className="stat-icon">👥</span>
                <div>
                  <div className="stat-value">{tenant.userCount}</div>
                  <div className="stat-label">Users</div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📄</span>
                <div>
                  <div className="stat-value">{tenant.documentCount}</div>
                  <div className="stat-label">Documents</div>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <div>
                  <div className="stat-value">{tenant.commentCount || 0}</div>
                  <div className="stat-label">Comments</div>
                </div>
              </div>
            </div>

            <div className="tenant-storage">
              <div className="storage-header">
                <span>Storage Used</span>
                <span className="storage-percentage">
                  {calculateStoragePercentage(tenant.storageUsed)}%
                </span>
              </div>
              <div className="storage-bar">
                <div
                  className="storage-progress"
                  style={{ width: `${calculateStoragePercentage(tenant.storageUsed)}%` }}
                />
              </div>
              <div className="storage-info">
                {formatBytes(tenant.storageUsed)} / 5 GB
              </div>
            </div>

            <div className="tenant-dates">
              <div className="date-item">
                <span className="date-label">Created:</span>
                <span className="date-value">
                  {tenant.createdAt ? formatDate(tenant.createdAt) : 'N/A'}
                </span>
              </div>
              <div className="date-item">
                <span className="date-label">Last Activity:</span>
                <span className="date-value">
                  {tenant.lastActivity ? formatDate(tenant.lastActivity) : 'N/A'}
                </span>
              </div>
            </div>

            <button
              className="btn-view-details"
              onClick={() => viewTenantDetails(tenant)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {showModal && selectedTenant && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tenant Details</h3>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Tenant Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Tenant ID:</span>
                    <code className="detail-value">{selectedTenant.tenantId}</code>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Primary User:</span>
                    <span className="detail-value">
                      {selectedTenant.primaryUser?.firstName}{' '}
                      {selectedTenant.primaryUser?.lastName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">
                      {selectedTenant.primaryUser?.email}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {selectedTenant.createdAt
                        ? new Date(selectedTenant.createdAt).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Users ({tenantUsers.length})</h4>
                <div className="users-list">
                  {tenantUsers.length === 0 ? (
                    <p className="no-data">Loading users...</p>
                  ) : (
                    tenantUsers.map((user) => (
                      <div key={user._id} className="user-item">
                        <div className="user-avatar-small">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div className="user-details">
                          <div className="user-name-small">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="user-email-small">{user.email}</div>
                        </div>
                        <span className={`role-badge-small ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                        <span className={`status-badge-small ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTenants;
