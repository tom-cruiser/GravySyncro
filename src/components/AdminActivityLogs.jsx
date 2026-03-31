import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import './AdminActivityLogs.css';

const AdminActivityLogs = () => {
  const { token } = useSelector((state) => state.auth);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const actionTypes = [
    'login',
    'logout',
    'register',
    'password_change',
    'profile_update',
    'document_upload',
    'document_view',
    'document_download',
    'document_edit',
    'document_delete',
    'document_share',
    'document_unshare',
    'comment_add',
    'comment_edit',
    'comment_delete',
    'permission_change',
    'settings_change'
  ];

  useEffect(() => {
    fetchActivities();
  }, [page, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        ...filters
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/activities`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );

      setActivities(response.data.data.activities);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('login') || action.includes('register')) return 'action-auth';
    if (action.includes('upload') || action.includes('share')) return 'action-create';
    if (action.includes('delete')) return 'action-delete';
    if (action.includes('download')) return 'action-read';
    return 'action-update';
  };

  return (
    <div className="admin-activity-logs">
      <div className="activity-header">
        <h2>Activity Logs</h2>
        <button onClick={fetchActivities} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      <div className="activity-filters">
        <input
          type="text"
          placeholder="Search by user name or email..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="filter-input"
        />

        <select
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          className="filter-select"
        >
          <option value="">All Actions</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          className="filter-input"
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          className="filter-input"
          placeholder="End Date"
        />

        <button onClick={clearFilters} className="btn-clear-filters">
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading activities...</div>
      ) : (
        <>
          <div className="activity-table-container">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Tenant ID</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No activity logs found
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity._id}>
                      <td className="activity-date">
                        {formatDate(activity.createdAt)}
                      </td>
                      <td className="activity-user">
                        <div className="user-info">
                          <div className="user-avatar">
                            {activity.user?.firstName?.charAt(0)}
                            {activity.user?.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="user-name">
                              {activity.user?.firstName} {activity.user?.lastName}
                            </div>
                            <div className="user-email">{activity.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge ${getActionBadgeClass(activity.action)}`}>
                          {activity.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="activity-details">
                        {activity.details && (
                          <div className="details-text">
                            {typeof activity.details === 'object' 
                              ? JSON.stringify(activity.details, null, 2)
                              : activity.details}
                          </div>
                        )}
                      </td>
                      <td className="activity-ip">{activity.ipAddress || 'N/A'}</td>
                      <td className="activity-tenant">
                        <code>{activity.tenantId.substring(0, 8)}...</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-page"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminActivityLogs;
