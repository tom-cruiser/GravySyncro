import React, { useState, useRef, useEffect } from 'react';
import { FileText, Download, Share2, MoreVertical, Lock, Trash2, Edit, Eye } from 'lucide-react';
import './DocumentCard.css';

const DocumentCard = ({ document, onDownload, onShare, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFileIcon = (type) => {
    return <FileText size={24} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      PDF: '#f56565',
      DOCX: '#4299e1',
      DOC: '#4299e1',
      XLSX: '#48bb78',
      XLS: '#48bb78',
      PPTX: '#ed8936',
      PPT: '#ed8936',
      default: '#667eea',
    };
    return colors[type] || colors.default;
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (action) => {
    setShowMenu(false);
    action();
  };

  return (
    <div className="document-card">
      <div className="document-card-header">
        <div className="document-icon" style={{ backgroundColor: `${getTypeColor(document.type)}20`, color: getTypeColor(document.type) }}>
          {getFileIcon(document.type)}
        </div>
        <div className="more-menu" ref={menuRef}>
          <button className="more-btn" onClick={handleMenuClick}>
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={() => handleAction(() => onView?.(document))}>
                <Eye size={16} /> View
              </button>
              <button onClick={() => handleAction(() => onDownload?.(document))}>
                <Download size={16} /> Download
              </button>
              <button onClick={() => handleAction(() => onShare?.(document))}>
                <Share2 size={16} /> Share
              </button>
              <button onClick={() => handleAction(() => onDelete?.(document))} className="danger">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="document-card-body">
        <h3 className="document-title">{document.title}</h3>
        <div className="document-meta">
          <span className="document-type" style={{ backgroundColor: `${getTypeColor(document.type)}20`, color: getTypeColor(document.type) }}>
            {document.type}
          </span>
          <span className="document-size">{document.size}</span>
        </div>
        <p className="document-date">{document.date}</p>
      </div>

      <div className="document-card-footer">
        <button className="icon-btn" title="Download" onClick={() => onDownload?.(document)}>
          <Download size={18} />
        </button>
        <button className="icon-btn" title="Share" onClick={() => onShare?.(document)}>
          <Share2 size={18} />
        </button>
        {document.encrypted && (
          <div className="encrypted-badge" title="Encrypted">
            <Lock size={14} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
