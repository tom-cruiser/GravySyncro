import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  UserX,
  UserCheck,
  Trash2,
  Key,
  AlertCircle,
  CheckCircle,
  XCircle,
  HardDrive
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
  const [storagePlanFilter, setStoragePlanFilter] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkStoragePlanGb, setBulkStoragePlanGb] = useState(50);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storagePlanGb, setStoragePlanGb] = useState(50);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, storagePlanFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;
      if (storagePlanFilter) params.storagePlanGb = storagePlanFilter;

      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      const loadedUsers = response.data.data.users;
      setUsers(loadedUsers);
      setSelectedUserIds((current) => current.filter((id) => loadedUsers.some((user) => user._id === id)));
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
    setNewPassword('');
    setConfirmPassword('');
    setStoragePlanGb(user?.storagePlanGb || 50);
  };

  const formatBytes = (bytes = 0) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Number(bytes);
    let index = 0;

    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }

    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const actionLabels = {
    deactivate: 'Deactivate',
    activate: 'Activate',
    delete: 'Delete',
    resetPassword: 'Reset Password',
    setStorage: 'Set Storage Plan'
  };

  const selectableUsers = users.filter((user) => user.role !== 'Admin');
  const allSelectableSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) => selectedUserIds.includes(user._id));

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedUserIds([]);
      return;
    }

    setSelectedUserIds(selectableUsers.map((user) => user._id));
  };

  const handleBulkStorageUpdate = async () => {
    if (!selectedUserIds.length) {
      alert('Select at least one user first.');
      return;
    }

    const selectedCount = selectedUserIds.length;
    const confirmed = window.confirm(
      `Assign ${bulkStoragePlanGb} GB plan to ${selectedCount} selected user${selectedCount > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    try {
      setIsBulkUpdating(true);
      await Promise.all(
        selectedUserIds.map((userId) =>
          axios.patch(
            `${API_URL}/admin/users/${userId}/storage-limit`,
            { storagePlanGb: Number(bulkStoragePlanGb) },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      alert(`Storage plan updated to ${bulkStoragePlanGb} GB for ${selectedCount} users.`);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error('Bulk storage update error:', error);
      const message = error?.response?.data?.message || 'Bulk storage update failed.';
      alert(message);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const confirmAction = async () => {
    try {
      let url = '';
      let method = 'patch';
      let payload = { reason };

      if (actionType === 'resetPassword') {
        if (!newPassword || !confirmPassword) {
          alert('Please enter and confirm the new password.');
          return;
        }

        if (newPassword !== confirmPassword) {
          alert('Passwords do not match.');
          return;
        }

        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
        if (!strongPassword.test(newPassword)) {
          alert('Password must be 8-128 characters and include uppercase, lowercase, and a number.');
          return;
        }

        payload = { newPassword };
      }

      if (actionType === 'setStorage') {
        payload = { storagePlanGb: Number(storagePlanGb) };
      }
      
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
        case 'resetPassword':
          url = `${API_URL}/admin/users/${selectedUser._id}/password`;
          break;
        case 'setStorage':
          url = `${API_URL}/admin/users/${selectedUser._id}/storage-limit`;
          break;
        default:
          return;
      }

      await axios({
        method,
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
      alert(`${actionLabels[actionType]} completed successfully!`);
    } catch (error) {
      console.error('Error:', error);
      const message = error?.response?.data?.message || 'Failed to perform action. Check console for details.';
      alert(message);
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

        <select
          value={storagePlanFilter}
          onChange={(e) => setStoragePlanFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Storage Plans</option>
          <option value="50">50 GB</option>
          <option value="100">100 GB</option>
          <option value="200">200 GB</option>
        </select>
      </div>

      <div className="bulk-storage-actions">
        <div className="bulk-left">
          <span>{selectedUserIds.length} selected</span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setSelectedUserIds([])}
            disabled={!selectedUserIds.length}
          >
            Clear Selection
          </button>
        </div>
        <div className="bulk-right">
          <label>Assign Plan</label>
          <select
            value={bulkStoragePlanGb}
            onChange={(e) => setBulkStoragePlanGb(Number(e.target.value))}
          >
            <option value={50}>50 GB</option>
            <option value={100}>100 GB</option>
            <option value={200}>200 GB</option>
          </select>
          <button
            type="button"
            className="btn-primary"
            onClick={handleBulkStorageUpdate}
            disabled={!selectedUserIds.length || isBulkUpdating}
          >
            {isBulkUpdating ? 'Applying...' : 'Apply to Selected'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all users"
                  />
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tenant ID</th>
                <th>Status</th>
                <th>Storage</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td className="checkbox-col">
                    {user.role !== 'Admin' ? (
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={() => toggleSelectUser(user._id)}
                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                      />
                    ) : null}
                  </td>
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
                  <td>
                    <div className="storage-cell">
                      <div className="storage-values">
                        <span>{formatBytes(user.storageUsed)}</span>
                        <span>/ {formatBytes(user.storageLimit)}</span>
                      </div>
                      <div className="storage-progress">
                        <div
                          className={`storage-progress-fill ${(user.storageUsedPercentage || 0) >= 80 ? 'warning' : ''}`}
                          style={{ width: `${Math.min(user.storageUsedPercentage || 0, 100)}%` }}
                        />
                      </div>
                      <small className="storage-percent">
                        {(user.storageUsedPercentage || 0).toFixed(1)}% used
                      </small>
                    </div>
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
                            className="btn-icon btn-warning"
                            onClick={() => handleAction(user, 'resetPassword')}
                            title="Reset Password"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            className="btn-icon btn-info"
                            onClick={() => handleAction(user, 'setStorage')}
                            title="Set Storage Plan"
                          >
                            <HardDrive size={16} />
                          </button>
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
              Confirm {actionLabels[actionType]}
            </h3>
            <p>
              Are you sure you want to {actionType === 'resetPassword' ? 'reset password for' : actionType} user{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            </p>

            {actionType === 'resetPassword' && (
              <>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="warning-box">
                  <AlertCircle size={20} />
                  <p>User will need to log in again with the new password.</p>
                </div>
              </>
            )}

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

            {actionType === 'setStorage' && (
              <div className="form-group">
                <label>Storage Plan</label>
                <select
                  value={storagePlanGb}
                  onChange={(e) => setStoragePlanGb(Number(e.target.value))}
                >
                  <option value={50}>50 GB</option>
                  <option value={100}>100 GB</option>
                  <option value={200}>200 GB</option>
                </select>
                <small className="storage-help">
                  Current usage: {formatBytes(selectedUser?.storageUsed || 0)}
                </small>
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
                Confirm {actionLabels[actionType]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
