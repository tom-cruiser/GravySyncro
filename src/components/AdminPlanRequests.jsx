import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ClipboardList, Check, X, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import api from '../config/api';
import './AdminPlanRequests.css';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const formatDate = (value) => (value ? new Date(value).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—');

// Self-service plan switches (Billing.jsx) no longer apply immediately —
// they land here as a PlanChangeRequest for an admin to approve or reject.
// See userController.updateSubscriptionPlan / adminController.approvePlanRequest.
const AdminPlanRequests = () => {
  const { token } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actingId, setActingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await axios.get(api.endpoints.admin.planRequests(`?status=${statusFilter}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data?.data?.requests || []);
    } catch (error) {
      console.error('Error fetching plan requests:', error);
      setLoadError('Could not load plan change requests.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (request) => {
    const confirmed = window.confirm(
      `Approve switching this organization to the ${request.requestedPlanName} plan `
      + `(${request.requestedPlanGb} GB)? This bills them immediately.`
    );
    if (!confirmed) return;

    try {
      setActingId(request._id);
      await axios.patch(
        api.endpoints.admin.approvePlanRequest(request._id),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (error) {
      console.error('Error approving plan request:', error);
      alert(error?.response?.data?.message || 'Failed to approve request.');
    } finally {
      setActingId(null);
    }
  };

  const openReject = (request) => {
    setRejectTarget(request);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectTarget) return;

    try {
      setActingId(rejectTarget._id);
      await axios.patch(
        api.endpoints.admin.rejectPlanRequest(rejectTarget._id),
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRejectTarget(null);
      setRejectReason('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting plan request:', error);
      alert(error?.response?.data?.message || 'Failed to reject request.');
    } finally {
      setActingId(null);
    }
  };

  const statusIcon = (status) => {
    if (status === 'approved') return <CheckCircle size={14} />;
    if (status === 'rejected') return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="admin-plan-requests">
      <div className="plan-requests-header">
        <div>
          <h2><ClipboardList size={24} /> Plan Change Requests</h2>
          <p>Review self-service plan switches before they take effect and get billed.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchRequests}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="plan-requests-filters">
        {['pending', 'approved', 'rejected', 'all'].map((option) => (
          <button
            key={option}
            type="button"
            className={`filter-pill ${statusFilter === option ? 'active' : ''}`}
            onClick={() => setStatusFilter(option)}
          >
            {option === 'all' ? 'All' : STATUS_LABELS[option]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : loadError ? (
        <div className="no-results">
          <p>{loadError}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="no-results">
          <ClipboardList size={40} style={{ opacity: 0.3 }} />
          <p>No {statusFilter === 'all' ? '' : STATUS_LABELS[statusFilter].toLowerCase()} plan requests.</p>
        </div>
      ) : (
        <div className="plan-requests-table-container">
          <table className="plan-requests-table">
            <thead>
              <tr>
                <th>Requested By</th>
                <th>Tenant ID</th>
                <th>Plan Change</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Reviewed</th>
                <th className="requests-col-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>
                    <div className="requester-cell">
                      <div className="requester-name">
                        {request.requestedBy?.firstName} {request.requestedBy?.lastName}
                      </div>
                      <small>{request.requestedBy?.email}</small>
                    </div>
                  </td>
                  <td><code className="tenant-id">{String(request.tenantId).substring(0, 20)}...</code></td>
                  <td>
                    <span className="plan-change-cell">
                      {request.currentPlanGb} GB → <strong>{request.requestedPlanName}</strong> ({request.requestedPlanGb} GB)
                    </span>
                  </td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>
                    <span className={`status-badge status-${request.status}`}>
                      {statusIcon(request.status)} {STATUS_LABELS[request.status]}
                    </span>
                    {request.status === 'rejected' && request.reviewNote && (
                      <small className="reject-note">"{request.reviewNote}"</small>
                    )}
                  </td>
                  <td>
                    {request.reviewedBy
                      ? <>{request.reviewedBy.firstName} {request.reviewedBy.lastName}<br /><small>{formatDate(request.reviewedAt)}</small></>
                      : '—'}
                  </td>
                  <td className="requests-col-action">
                    {request.status === 'pending' ? (
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon btn-success"
                          onClick={() => handleApprove(request)}
                          disabled={actingId === request._id}
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => openReject(request)}
                          disabled={actingId === request._id}
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <div className="plan-request-modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="plan-request-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject plan change request?</h3>
            <p>
              <strong>{rejectTarget.requestedBy?.firstName} {rejectTarget.requestedBy?.lastName}</strong>'s
              request to switch to <strong>{rejectTarget.requestedPlanName}</strong> will be declined.
            </p>
            <div className="form-group">
              <label>Reason (optional, shown to the requester)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Let them know why..."
                rows={3}
              />
            </div>
            <div className="plan-request-modal-actions">
              <button className="btn-secondary" onClick={() => setRejectTarget(null)} disabled={actingId === rejectTarget._id}>
                Cancel
              </button>
              <button className="btn-primary btn-danger" onClick={handleReject} disabled={actingId === rejectTarget._id}>
                {actingId === rejectTarget._id ? 'Rejecting…' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlanRequests;
