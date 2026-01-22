import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Share2, Users, Mail, Copy, Check } from 'lucide-react';
import { shareDocumentStart, shareDocumentSuccess } from '../features/sharing/sharingSlice';
import { addNotification } from '../features/notifications/notificationsSlice';
import './ShareDocument.css';

const ShareDocument = ({ document, onClose }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!email) return;

    dispatch(shareDocumentStart());

    try {
      // Mock API call
      const shareData = {
        documentId: document.id,
        email,
        permission,
        timestamp: new Date().toISOString(),
      };

      setSharedUsers([...sharedUsers, { email, permission, id: Date.now() }]);
      dispatch(shareDocumentSuccess(shareData));
      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: `Document shared with ${email}`,
        read: false,
        timestamp: new Date().toISOString(),
      }));

      setEmail('');
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/shared/${document.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-document">
      <div className="share-header">
        <Share2 size={24} />
        <h2>Share Document</h2>
      </div>

      <div className="document-info">
        <h3>{document.title}</h3>
        <p className="document-meta">{document.type} • {document.size}</p>
      </div>

      <div className="share-form">
        <div className="input-group">
          <Mail size={20} className="input-icon" />
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleShare()}
          />
        </div>

        <div className="permission-select">
          <label>Permission:</label>
          <select value={permission} onChange={(e) => setPermission(e.target.value)}>
            <option value="view">Can View</option>
            <option value="edit">Can Edit</option>
          </select>
        </div>

        <button className="btn-primary" onClick={handleShare} disabled={!email}>
          Share
        </button>
      </div>

      <div className="share-link">
        <h3>Share Link</h3>
        <div className="link-container">
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/shared/${document.id}`}
            className="link-input"
          />
          <button className="copy-btn" onClick={handleCopyLink}>
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {sharedUsers.length > 0 && (
        <div className="shared-users">
          <h3>
            <Users size={20} />
            Shared With
          </h3>
          <ul>
            {sharedUsers.map(user => (
              <li key={user.id} className="shared-user-item">
                <span className="user-email">{user.email}</span>
                <span className="user-permission">{user.permission === 'view' ? 'Viewer' : 'Editor'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareDocument;
