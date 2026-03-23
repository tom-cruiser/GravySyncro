import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { Share2, Users, Mail, UserMinus, X } from 'lucide-react';
import { addNotification } from '../features/notifications/notificationsSlice';
import './ShareDocument.css';

const ShareDocument = ({ document: doc, onClose, onShared }) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  const documentId = useMemo(() => doc?.id || doc?._id, [doc]);

  const mapSharedUsers = useCallback((sharedWith = []) => {
    return sharedWith.map((entry) => {
      const sharedUser = entry?.user || {};
      const userId = sharedUser?._id || entry?.user;
      const userEmail = sharedUser?.email || 'Unknown email';
      const fullName = `${sharedUser?.firstName || ''} ${sharedUser?.lastName || ''}`.trim();

      return {
        userId,
        email: userEmail,
        name: fullName || userEmail,
        permission: entry?.permission || 'view',
      };
    });
  }, []);

  const loadSharedUsers = useCallback(async () => {
    if (!documentId || !token) return;

    try {
      setIsLoadingShares(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const latestDocument = response.data?.data?.document;
      setSharedUsers(mapSharedUsers(latestDocument?.sharedWith || []));
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load current sharing list.';
      dispatch(addNotification({
        id: Date.now(),
        type: 'error',
        message,
        timestamp: new Date().toISOString(),
      }));
    } finally {
      setIsLoadingShares(false);
    }
  }, [dispatch, documentId, mapSharedUsers, token]);

  useEffect(() => {
    loadSharedUsers();
  }, [loadSharedUsers]);

  const handleShare = async () => {
    if (!email.trim() || !documentId || !token) return;

    try {
      setIsSubmitting(true);
      const normalizedEmail = email.trim().toLowerCase();

      await axios.post(
        `${import.meta.env.VITE_API_URL}/documents/${documentId}/share`,
        { userEmail: normalizedEmail, permission },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadSharedUsers();

      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: `Document shared with ${normalizedEmail}`,
        timestamp: new Date().toISOString(),
      }));

      setEmail('');
      if (onShared) onShared();
    } catch (err) {
      console.error('Share failed:', err);
      let message = err?.response?.data?.message || 'Failed to share document';
      if (err?.response?.status === 404 && message.toLowerCase().includes('not found in your organization')) {
        message = `${message} Ask the user to register with your Organization Code (tenantId).`;
      }
      dispatch(addNotification({
        id: Date.now(),
        type: 'error',
        message,
        timestamp: new Date().toISOString(),
      }));
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnshare = async (userId) => {
    if (!userId || !documentId || !token) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/documents/${documentId}/share/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSharedUsers((prev) => prev.filter((user) => String(user.userId) !== String(userId)));
      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: 'Document access removed successfully',
        timestamp: new Date().toISOString(),
      }));
      if (onShared) onShared();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to unshare document';
      dispatch(addNotification({
        id: Date.now(),
        type: 'error',
        message,
        timestamp: new Date().toISOString(),
      }));
      alert(message);
    }
  };

  return (
    <div className="share-document">
      <div className="share-header">
        <Share2 size={24} />
        <h2>Share Document</h2>
        <button type="button" className="share-close-btn" onClick={onClose} aria-label="Close sharing panel">
          <X size={18} />
        </button>
      </div>

      <div className="document-info">
        <h3>{doc?.title}</h3>
        <p className="document-meta">{doc?.type} • {doc?.size}</p>
      </div>

      <div className="share-form">
        <div className="input-group">
          <Mail size={20} className="input-icon" />
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleShare()}
            disabled={isSubmitting}
          />
        </div>

        <div className="permission-select">
          <label>Permission:</label>
          <select value={permission} onChange={(e) => setPermission(e.target.value)} disabled={isSubmitting}>
            <option value="view">Can View</option>
            <option value="edit">Can Edit</option>
            <option value="admin">Can Manage</option>
          </select>
        </div>

        <button className="btn-primary" onClick={handleShare} disabled={!email.trim() || isSubmitting}>
          {isSubmitting ? 'Sharing...' : 'Share'}
        </button>
      </div>

      {isLoadingShares ? (
        <p className="share-loading">Loading shared users...</p>
      ) : sharedUsers.length > 0 ? (
        <div className="shared-users">
          <h3>
            <Users size={20} />
            Shared With
          </h3>
          <ul>
            {sharedUsers.map(user => (
              <li key={`${user.userId}-${user.email}`} className="shared-user-item">
                <div>
                  <p className="user-email">{user.name}</p>
                  <small className="user-meta">{user.email}</small>
                </div>
                <div className="shared-user-actions">
                  <span className="user-permission">
                    {user.permission === 'view' ? 'Viewer' : user.permission === 'edit' ? 'Editor' : 'Manager'}
                  </span>
                  <button
                    type="button"
                    className="btn-unshare"
                    onClick={() => handleUnshare(user.userId)}
                    title="Remove access"
                  >
                    <UserMinus size={14} />
                    Unshare
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="share-empty">This document is not shared with anyone yet.</p>
      )}
    </div>
  );
};

export default ShareDocument;
