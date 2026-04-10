import React from 'react';
import DocumentCard from './DocumentCard';
import './DocumentList.css';

const DocumentList = ({ documents, onDownload, onShare, onDelete, onView, onConversation }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="empty-state">
        <p>No documents found</p>
        <span>Upload your first document to get started</span>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="documents-grid">
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDownload={onDownload}
            onShare={onShare}
            onDelete={onDelete}
            onView={onView}
            onConversation={onConversation}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
