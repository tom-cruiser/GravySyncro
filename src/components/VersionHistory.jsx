import React, { useState } from 'react';
import { History, RotateCcw, Clock } from 'lucide-react';
import './VersionHistory.css';

const VersionHistory = ({ documentId, onRevert }) => {
  // Mock version history data
  const [versions] = useState([
    { id: 1, version: '1.3', author: 'John Doe', timestamp: '2024-01-08 14:30', changes: 'Updated section 3' },
    { id: 2, version: '1.2', author: 'Jane Smith', timestamp: '2024-01-07 10:15', changes: 'Fixed formatting issues' },
    { id: 3, version: '1.1', author: 'John Doe', timestamp: '2024-01-06 16:45', changes: 'Added new appendix' },
    { id: 4, version: '1.0', author: 'John Doe', timestamp: '2024-01-05 09:00', changes: 'Initial version' },
  ]);

  const handleRevert = (version) => {
    if (window.confirm(`Are you sure you want to revert to version ${version.version}?`)) {
      onRevert(version);
    }
  };

  return (
    <div className="version-history">
      <div className="version-header">
        <History size={20} />
        <h3>Version History</h3>
      </div>

      <div className="versions-list">
        {versions.map((version, index) => (
          <div key={version.id} className={`version-item ${index === 0 ? 'current' : ''}`}>
            <div className="version-badge">
              {index === 0 ? 'Current' : `v${version.version}`}
            </div>
            <div className="version-details">
              <div className="version-info">
                <strong>{version.author}</strong>
                <span className="version-changes">{version.changes}</span>
              </div>
              <div className="version-meta">
                <Clock size={14} />
                <span>{version.timestamp}</span>
              </div>
            </div>
            {index !== 0 && (
              <button
                className="revert-btn"
                onClick={() => handleRevert(version)}
                title="Revert to this version"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistory;
