import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Filter,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import './AdminUsers.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AdminUsers = () => {
  const { t } = useTranslation();
  const { token } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;

      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowModal(true);
    setReason('');
  };

  const confirmAction = async () => {
    try {
      let url = '';
      let method = 'patch';
      
      switch (actionType) {
        case 'deactivate':
          url = `${API_URL}/admin/users/${selectedUser._id}/deactivate`;
          break;
        case 'activate':
          url = `${API_URL}/admin/users/${selectedUser._id}/activate`;
          break;
        case 'delete':
          url = `${API_URL}/admin/users/${selectedUser._id}`;
          method = 'delete';
          break;
        default:
          return;
      }

      await axios({
        method,
        url,
        data: { reason },
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert(`User ${actionType}d successfully!`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to perform action. Check console for details.');
    }
  };

  return (
    <div className="admin-users">
      <div className="users-header">
        <div>
          <h2><Users size={24} /> User Management</h2>
          <p>Manage all users across all tenants</p>
        </div>
      </div>

      <div className="users-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="Student">Student</option>
          <option value="Teacher">Teacher</option>
          <option value="Notary">Notary</option>
          <option value="Lawyer">Lawyer</option>
          <option value="Professional">Professional</option>
          <option value="Admin">Admin</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tenant ID</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="user-name">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.organization && (
                          <small className="user-org">{user.organization}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <code className="tenant-id">{user.tenantId.substring(0, 20)}...</code>
                  </td>
                  <td>
                    {user.isActive ? (
                      <span className="status-badge status-active">
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span className="status-badge status-inactive">
                        <XCircle size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {user.role !== 'Admin' && (
                        <>
                          {user.isActive ? (
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleAction(user, 'deactivate')}
                              title="Deactivate User"
                            >
                              <UserX size={16} />
                            </button>
                          ) : (
                            <button
                              className="btn-icon btn-success"
                              onClick={() => handleAction(user, 'activate')}
                              title="Activate User"
                            >
                              <UserCheck size={16} />
                            </button>
                          )}
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleAction(user, 'delete')}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="no-results">
              <AlertCircle size={48} />
              <p>No users found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </h3>
            <p>
              Are you sure you want to {actionType} user{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            </p>

            {actionType === 'deactivate' && (
              <div className="form-group">
                <label>Reason (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for deactivation..."
                  rows={3}
                />
              </div>
            )}

            {actionType === 'delete' && (
              <div className="warning-box">
                <AlertCircle size={20} />
                <p>This action cannot be undone. All user data will be permanently deleted.</p>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`btn-primary ${actionType === 'delete' ? 'btn-danger' : ''}`}
                onClick={confirmAction}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
