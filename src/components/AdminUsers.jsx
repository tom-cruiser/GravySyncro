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
  HardDrive,
  Calendar,
  Unlock,
  Lock,
  Clock
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import api from '../config/api';
import './AdminUsers.css';

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
  const [bulkPlanId, setBulkPlanId] = useState('starter');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('starter');
  const [extendDays, setExtendDays] = useState('');
  const [tenantStorageEndpointAvailable, setTenantStorageEndpointAvailable] = useState(true);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, storagePlanFilter]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(api.endpoints.users.subscriptionPlans(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(response.data.data.plans || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  // Storage size alone can't tell an annual enterprise plan apart from a
  // monthly one of the same size (e.g. 1 TB) — find the plan whose id
  // matches, falling back to the first plan of the right size/cycle.
  const findPlanForUser = (user) => {
    if (!user) return plans[0] || null;
    const billingCycle = user.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    return (
      plans.find((plan) => plan.storageGb === (user.storagePlanGb || 50) && plan.billingCycle === billingCycle)
      || plans.find((plan) => plan.storageGb === (user.storagePlanGb || 50))
      || plans[0]
      || null
    );
  };

  const uniqueStorageSizesGb = [...new Set(plans.map((plan) => plan.storageGb))].sort((a, b) => a - b);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;
      if (storagePlanFilter) params.storagePlanGb = storagePlanFilter;

      const response = await axios.get(api.endpoints.admin.users(), {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      const loadedUsers = response.data.data.users;
      setUsers(loadedUsers);
      setSelectedUserIds((current) => current.filter((id) => loadedUsers.some((user) => user._id === id)));
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
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
    setSelectedPlanId(findPlanForUser(user)?.id || 'starter');
    setExtendDays('');
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

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');

  const subscriptionStatusLabels = {
    active: 'Active',
    pending_renewal: 'Renewal Due',
    expired: 'Expired',
  };

  // accessLevel/isSubscriptionActive/trialExpiresAt are set by
  // jobs/trialAccessLock.js (cron) and admin overrides — unrelated to the
  // isActive/subscriptionStatus fields shown in the other two columns.
  // A user created before this feature shipped has accessLevel `undefined`,
  // which is deliberately treated as unrestricted (see models/User.js).
  const accessLevelLabels = {
    trial: 'Trial',
    active: 'Active',
    locked: 'Locked',
    'admin-approved': 'Admin Approved',
  };

  const actionLabels = {
    deactivate: 'Deactivate',
    activate: 'Activate',
    delete: 'Delete',
    resetPassword: 'Reset Password',
    setStorage: 'Set Enterprise Plan',
    reactivateAccess: 'Reactivate Access',
  };

  const actionPrompts = {
    deactivate: 'deactivate',
    activate: 'activate',
    delete: 'delete',
    resetPassword: 'reset password for',
    setStorage: 'set the enterprise plan for',
    reactivateAccess: 'reactivate trial access for',
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

  const updateEnterpriseStorage = async ({ tenantId, userId, planId }) => {
    if (!tenantStorageEndpointAvailable) {
      await axios.patch(
        `${api.endpoints.admin.users()}/${userId}/storage-limit`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return;
    }

    try {
      await axios.patch(
        api.endpoints.admin.tenantStorageLimit(tenantId),
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      if (error?.response?.status !== 404) {
        throw error;
      }

      setTenantStorageEndpointAvailable(false);

      await axios.patch(
        `${api.endpoints.admin.users()}/${userId}/storage-limit`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  };

  const handleBulkStorageUpdate = async () => {
    if (!selectedUserIds.length) {
      alert('Select at least one member first.');
      return;
    }

    const selectedUsers = users.filter((user) => selectedUserIds.includes(user._id));
    const uniqueTenants = [...new Map(selectedUsers.map((user) => [user.tenantId, user])).values()];
    const selectedEnterpriseCount = uniqueTenants.length;
    const bulkPlan = plans.find((plan) => plan.id === bulkPlanId);
    const bulkPlanLabel = bulkPlan?.name || `${bulkPlanId}`;
    const confirmed = window.confirm(
      `Assign ${bulkPlanLabel} plan to ${selectedEnterpriseCount} selected enterprise${selectedEnterpriseCount > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    try {
      setIsBulkUpdating(true);
      await Promise.all(
        uniqueTenants.map((tenantUser) =>
          updateEnterpriseStorage({
            tenantId: tenantUser.tenantId,
            userId: tenantUser._id,
            planId: bulkPlanId,
          })
        )
      );

      alert(`Enterprise storage plan updated to ${bulkPlanLabel} for ${selectedEnterpriseCount} enterprise${selectedEnterpriseCount > 1 ? 's' : ''}.`);
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

  const handleBulkDeleteUsers = async () => {
    if (!selectedUserIds.length) {
      alert('Select at least one member first.');
      return;
    }

    const selectedCount = selectedUserIds.length;
    const confirmed = window.confirm(
      `Delete ${selectedCount} selected member${selectedCount > 1 ? 's' : ''}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setIsBulkDeleting(true);
      const results = await Promise.allSettled(
        selectedUserIds.map((userId) =>
          axios.delete(`${api.endpoints.admin.users()}/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      const deletedCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - deletedCount;

      alert(`Deleted ${deletedCount} member${deletedCount === 1 ? '' : 's'}${failedCount ? `, ${failedCount} failed.` : '.'}`);
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      const message = error?.response?.data?.message || 'Bulk delete failed.';
      alert(message);
    } finally {
      setIsBulkDeleting(false);
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

      switch (actionType) {
        case 'deactivate':
          url = `${api.endpoints.admin.users()}/${selectedUser._id}/deactivate`;
          break;
        case 'activate':
          url = `${api.endpoints.admin.users()}/${selectedUser._id}/activate`;
          break;
        case 'delete':
          url = `${api.endpoints.admin.users()}/${selectedUser._id}`;
          method = 'delete';
          break;
        case 'resetPassword':
          url = `${api.endpoints.admin.users()}/${selectedUser._id}/password`;
          break;
        case 'setStorage':
          await updateEnterpriseStorage({
            tenantId: selectedUser.tenantId,
            userId: selectedUser._id,
            planId: selectedPlanId,
          });
          setShowModal(false);
          setSelectedUser(null);
          fetchUsers();
          alert(`${actionLabels[actionType]} completed successfully!`);
          return;
        case 'reactivateAccess': {
          const days = Number(extendDays);
          const body = days > 0 ? { accessLevel: 'active', extendDays: days } : {};
          await axios.patch(
            api.endpoints.admin.subscriptionAccess(selectedUser._id),
            body,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setShowModal(false);
          setSelectedUser(null);
          fetchUsers();
          alert(`${actionLabels[actionType]} completed successfully!`);
          return;
        }
        default:
          return;
      }

      const requestConfig = {
        method,
        url,
        headers: { Authorization: `Bearer ${token}` }
      };

      if (method !== 'delete') {
        requestConfig.data = payload;
      }

      await axios(requestConfig);

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
          <h2><Users size={24} /> Enterprise Access Control</h2>
          <p>Manage enterprise members and shared storage plans across all tenants</p>
        </div>
      </div>

      <div className="users-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search members by name or email..."
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
          <option value="">All Enterprise Plans</option>
          {uniqueStorageSizesGb.map((gb) => (
            <option key={gb} value={gb}>{gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`}</option>
          ))}
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
          <label>Assign Enterprise Plan</label>
          <select
            value={bulkPlanId}
            onChange={(e) => setBulkPlanId(e.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}{plan.billingCycle === 'yearly' ? ` — $${plan.priceUsdPerYear}/yr` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            onClick={handleBulkStorageUpdate}
            disabled={!selectedUserIds.length || isBulkUpdating}
          >
            {isBulkUpdating ? 'Applying...' : 'Apply to Selected Enterprises'}
          </button>
          <button
            type="button"
            className="btn-danger-outline"
            onClick={handleBulkDeleteUsers}
            disabled={!selectedUserIds.length || isBulkDeleting}
          >
            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
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
                    aria-label="Select all members"
                  />
                </th>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tenant ID</th>
                <th>Status</th>
                <th>Trial/Access</th>
                <th>Enterprise Storage</th>
                <th>Subscription</th>
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
                        aria-label={`Select member ${user.firstName} ${user.lastName}`}
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
                    <div className="access-cell">
                      <span className={`status-badge access-${user.accessLevel || 'legacy'}`}>
                        {user.accessLevel === 'locked' && <Lock size={14} />}
                        {user.accessLevel === 'trial' && <Clock size={14} />}
                        {(user.accessLevel === 'active' || user.accessLevel === 'admin-approved') && <CheckCircle size={14} />}
                        {accessLevelLabels[user.accessLevel] || 'No Trial Limit'}
                      </span>
                      {user.accessLevel === 'trial' && user.trialExpiresAt && (
                        <small className="access-expiry">
                          <Calendar size={12} /> Trial ends {formatDate(user.trialExpiresAt)}
                        </small>
                      )}
                      {user.accessLevel === 'locked' && user.trialExpiresAt && (
                        <small className="access-expiry">
                          <Calendar size={12} /> Expired {formatDate(user.trialExpiresAt)}
                        </small>
                      )}
                    </div>
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
                  <td>
                    <div className="subscription-cell">
                      <span className={`status-badge subscription-${user.subscriptionStatus || 'active'}`}>
                        {subscriptionStatusLabels[user.subscriptionStatus] || 'Active'}
                      </span>
                      {user.billingCycle === 'yearly' && (
                        <small className="subscription-renewal">
                          <Calendar size={12} /> Renews {formatDate(user.currentPeriodEnd)}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {user.role !== 'Admin' && (
                        <>
                          {user.accessLevel === 'locked' && (
                            <button
                              className="btn-icon btn-success"
                              onClick={() => handleAction(user, 'reactivateAccess')}
                              title="Reactivate Access (Trial Expired)"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                          {user.isActive ? (
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleAction(user, 'deactivate')}
                              title="Deactivate Member"
                            >
                              <UserX size={16} />
                            </button>
                          ) : (
                            <button
                              className="btn-icon btn-success"
                              onClick={() => handleAction(user, 'activate')}
                              title="Activate Member"
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
                            title="Set Enterprise Plan"
                          >
                            <HardDrive size={16} />
                          </button>
                          <button
                            className="btn-icon btn-danger btn-icon-label"
                            onClick={() => handleAction(user, 'delete')}
                            title="Delete Member"
                          >
                            <Trash2 size={16} />
                            <span>Delete Member</span>
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
              <p>No members found matching your criteria</p>
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
              Are you sure you want to {actionPrompts[actionType] || actionType} member{' '}
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
                  <p>This member will need to log in again with the new password.</p>
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
                <label>Enterprise Storage Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}{plan.billingCycle === 'yearly' ? ` — $${plan.priceUsdPerYear}/yr` : ` — $${plan.priceUsdPerMonth}/mo`}
                    </option>
                  ))}
                </select>
                <small className="storage-help">
                  Current enterprise usage: {formatBytes(selectedUser?.storageUsed || 0)} / {formatBytes(selectedUser?.storageLimit || 0)}
                </small>
                {plans.find((plan) => plan.id === selectedPlanId)?.billingCycle === 'yearly' && (
                  <div className="warning-box">
                    <AlertCircle size={20} />
                    <p>
                      This is billed once a year. Assigning it (re)starts a new 1-year period from today —
                      {selectedUser?.billingCycle === 'yearly' && selectedUser?.currentPeriodEnd
                        ? ` current period ends ${formatDate(selectedUser.currentPeriodEnd)}.`
                        : ' the client will need a renewal invoice around this date next year.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {actionType === 'delete' && (
              <div className="warning-box">
                <AlertCircle size={20} />
                <p>This action cannot be undone. All member data will be permanently deleted.</p>
              </div>
            )}

            {actionType === 'reactivateAccess' && (
              <div className="form-group">
                <label>Extend trial by (days) — optional</label>
                <input
                  type="number"
                  min="1"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  placeholder="Leave blank to grant permanent access"
                />
                <small className="storage-help">
                  Leave blank to grant indefinite access (accessLevel set to "Admin Approved").
                  Enter a number of days to instead reopen a limited trial window.
                </small>
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
