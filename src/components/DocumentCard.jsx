import React, { useState, useRef, useEffect } from 'react';
import { FileArchive, FileImage, FileSpreadsheet, FileText, FileType2, Download, Share2, MoreVertical, Lock, Trash2, Eye } from 'lucide-react';
import './DocumentCard.css';

const DocumentCard = ({ document: doc, onDownload, onShare, onDelete, onView }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const browserDocument = globalThis.document;
    if (!browserDocument || typeof browserDocument.addEventListener !== 'function') {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    browserDocument.addEventListener('mousedown', handleClickOutside);
    return () => browserDocument.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFileIcon = (type) => {
    const normalizedType = String(type || '').toUpperCase();
    if (normalizedType === 'PDF') return <FileType2 size={24} />;
    if (['DOC', 'DOCX'].includes(normalizedType)) return <FileText size={24} />;
    if (['XLS', 'XLSX', 'CSV'].includes(normalizedType)) return <FileSpreadsheet size={24} />;
    if (['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'].includes(normalizedType)) return <FileImage size={24} />;
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(normalizedType)) return <FileArchive size={24} />;
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
        <div className="document-icon" style={{ backgroundColor: `${getTypeColor(doc.type)}20`, color: getTypeColor(doc.type) }}>
          {getFileIcon(doc.type)}
        </div>
        <div className="more-menu" ref={menuRef}>
          <button className="more-btn" onClick={handleMenuClick}>
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={() => handleAction(() => onView?.(doc))}>
                <Eye size={16} /> View
              </button>
              <button onClick={() => handleAction(() => onDownload?.(doc))}>
                <Download size={16} /> Download
              </button>
              <button onClick={() => handleAction(() => onShare?.(doc))}>
                <Share2 size={16} /> Share
              </button>
              <button onClick={() => handleAction(() => onDelete?.(doc))} className="danger">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="document-card-body">
        <h3 className="document-title">{doc.title}</h3>
        <div className="document-meta">
          <span className="document-type" style={{ backgroundColor: `${getTypeColor(doc.type)}20`, color: getTypeColor(doc.type) }}>
            {doc.type}
          </span>
          <span className="document-size">{doc.size}</span>
        </div>
        <p className="document-date">{doc.date}</p>
      </div>

      <div className="document-card-footer">
        <button className="icon-btn" title="Download" onClick={() => onDownload?.(doc)}>
          <Download size={18} />
        </button>
        <button className="icon-btn" title="Share" onClick={() => onShare?.(doc)}>
          <Share2 size={18} />
        </button>
        {doc.encrypted && (
          <div className="encrypted-badge" title="Encrypted">
            <Lock size={14} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
