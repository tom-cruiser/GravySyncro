import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Download, Eye, Share2, Trash2 } from 'lucide-react';
import './FolderBrowser.css';

const createNode = () => ({ folders: {}, files: [] });

const buildTree = (documents = []) => {
  const root = createNode();

  documents.forEach((doc) => {
    const rawPath = typeof doc.folderPath === 'string'
      ? doc.folderPath
      : typeof doc.path === 'string'
        ? doc.path.replace(/^\/+|\/+$/g, '')
        : '';

    const segments = rawPath.split('/').filter(Boolean);
    let current = root;

    segments.forEach((segment) => {
      if (!current.folders[segment]) {
        current.folders[segment] = createNode();
      }
      current = current.folders[segment];
    });

    current.files.push(doc);
  });

  return root;
};

const countFiles = (node) => {
  let total = node.files.length;
  Object.values(node.folders).forEach((child) => {
    total += countFiles(child);
  });
  return total;
};

const FolderNode = ({
  node,
  folderName,
  path,
  expanded,
  toggle,
  onView,
  onDownload,
  onShare,
  onDelete,
}) => {
  const folderEntries = Object.entries(node.folders).sort((a, b) => a[0].localeCompare(b[0]));
  const fileEntries = [...node.files].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  return (
    <div className="folder-node">
      <button className="folder-row" onClick={() => toggle(path)}>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Folder size={16} className="folder-icon" />
        <span className="folder-name">{folderName}</span>
        <span className="folder-count">{countFiles(node)} files</span>
      </button>

      {expanded && (
        <div className="folder-children">
          {folderEntries.map(([childName, childNode]) => {
            const childPath = path ? `${path}/${childName}` : childName;
            return (
              <FolderNode
                key={childPath}
                node={childNode}
                folderName={childName}
                path={childPath}
                expanded={expanded && !!toggle.__expandedSet?.has(childPath)}
                toggle={toggle}
                onView={onView}
                onDownload={onDownload}
                onShare={onShare}
                onDelete={onDelete}
              />
            );
          })}

          {fileEntries.map((doc) => (
            <div key={doc.id} className="folder-file-row">
              <div className="folder-file-info">
                <FileText size={15} />
                <span className="folder-file-title">{doc.title}</span>
                <span className="folder-file-meta">{doc.type} • {doc.size}</span>
              </div>
              <div className="folder-file-actions">
                <button onClick={() => onView?.(doc)} title="View"><Eye size={14} /></button>
                <button onClick={() => onDownload?.(doc)} title="Download"><Download size={14} /></button>
                <button onClick={() => onShare?.(doc)} title="Share"><Share2 size={14} /></button>
                <button onClick={() => onDelete?.(doc)} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FolderBrowser = ({ documents, onView, onDownload, onShare, onDelete }) => {
  const tree = useMemo(() => buildTree(documents), [documents]);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const toggle = (path) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  toggle.__expandedSet = expandedPaths;

  const rootFolders = Object.entries(tree.folders).sort((a, b) => a[0].localeCompare(b[0]));
  const rootFiles = [...tree.files].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  if (documents.length === 0) {
    return (
      <div className="folder-empty">
        <p>No documents found</p>
        <span>Upload files or folders to see structure here.</span>
      </div>
    );
  }

  return (
    <div className="folder-browser">
      {rootFolders.map(([folderName, node]) => (
        <FolderNode
          key={folderName}
          node={node}
          folderName={folderName}
          path={folderName}
          expanded={expandedPaths.has(folderName)}
          toggle={toggle}
          onView={onView}
          onDownload={onDownload}
          onShare={onShare}
          onDelete={onDelete}
        />
      ))}

      {rootFiles.length > 0 && (
        <div className="folder-root-files">
          <h3>Root Files</h3>
          {rootFiles.map((doc) => (
            <div key={doc.id} className="folder-file-row">
              <div className="folder-file-info">
                <FileText size={15} />
                <span className="folder-file-title">{doc.title}</span>
                <span className="folder-file-meta">{doc.type} • {doc.size}</span>
              </div>
              <div className="folder-file-actions">
                <button onClick={() => onView?.(doc)} title="View"><Eye size={14} /></button>
                <button onClick={() => onDownload?.(doc)} title="Download"><Download size={14} /></button>
                <button onClick={() => onShare?.(doc)} title="Share"><Share2 size={14} /></button>
                <button onClick={() => onDelete?.(doc)} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderBrowser;
