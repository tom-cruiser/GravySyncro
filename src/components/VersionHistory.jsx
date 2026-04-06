import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { History, RotateCcw, Clock } from 'lucide-react';
import api from '../config/api';
import './VersionHistory.css';

const VersionHistory = ({ documentId, token, onRevert }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadVersions = async () => {
    if (!documentId || !token) return;

    setLoading(true);
    try {
      const response = await axios.get(api.endpoints.documents.versions(documentId), authHeaders);
      const rows = response.data?.data?.versions || [];
      const sorted = [...rows].sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0));
      setVersions(sorted);
    } catch (_) {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [documentId, token]);

  const handleRevert = async (version) => {
    if (!window.confirm(`Are you sure you want to restore version v${version.version}?`)) return;

    setRestoringVersion(version.version);
    try {
      await axios.post(api.endpoints.documents.restoreVersion(documentId, version.version), {}, authHeaders);
      await loadVersions();
      if (onRevert) onRevert(version);
    } catch (_) {
      // Keep interaction lightweight in sidebar.
    } finally {
      setRestoringVersion(null);
    }
  };

  return (
    <div className="version-history">
      <div className="version-header">
        <History size={20} />
        <h3>Version History</h3>
      </div>

      <div className="versions-list">
        {loading ? (
          <p className="version-empty">Loading history...</p>
        ) : versions.length === 0 ? (
          <p className="version-empty">No version history available yet.</p>
        ) : versions.map((version, index) => {
          const author = version.uploadedBy
            ? `${version.uploadedBy.firstName || ''} ${version.uploadedBy.lastName || ''}`.trim()
            : 'Unknown user';
          return (
            <div key={`${version.version}-${version.uploadedAt || index}`} className={`version-item ${index === 0 ? 'current' : ''}`}>
              <div className="version-badge">{index === 0 ? 'Current' : `v${version.version}`}</div>
              <div className="version-details">
                <div className="version-info">
                  <strong>{author || 'Unknown user'}</strong>
                  <span className="version-changes">{version.changes || 'Uploaded new version'}</span>
                </div>
                <div className="version-meta">
                  <Clock size={14} />
                  <span>{version.uploadedAt ? new Date(version.uploadedAt).toLocaleString() : 'Unknown date'}</span>
                </div>
              </div>
              {index !== 0 && (
                <button
                  className="revert-btn"
                  onClick={() => handleRevert(version)}
                  title="Restore this version"
                  disabled={restoringVersion === version.version}
                >
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VersionHistory;
