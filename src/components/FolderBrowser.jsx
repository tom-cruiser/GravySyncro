import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  MessageCircle,
  Share2,
  Trash2,
} from 'lucide-react';
import FolderIconGraphic from './FolderIconGraphic';
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

const getNodeForPath = (tree, pathSegments) => {
  let node = tree;
  for (const segment of pathSegments) {
    if (!node?.folders?.[segment]) {
      return null;
    }
    node = node.folders[segment];
  }
  return node;
};

const getCurrentLevelEntries = (tree, currentPath) => {
  const currentNode = getNodeForPath(tree, currentPath);
  if (!currentNode) {
    return { folders: [], files: [] };
  }

  const folders = Object.keys(currentNode.folders)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, fullPath: [...currentPath, name].join('/') }));

  const files = [...currentNode.files].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  return { folders, files };
};

const detectFileKind = (doc) => {
  const type = String(doc.mimeType || doc.type || '').toLowerCase();
  const name = String(doc.title || doc.originalName || '').toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return 'image';
  if (type.includes('word') || /\.(doc|docx)$/.test(name)) return 'doc';
  if (type.includes('excel') || type.includes('sheet') || /\.(xls|xlsx|csv)$/.test(name)) return 'sheet';
  if (type.includes('zip') || type.includes('rar') || /\.(zip|rar|7z|tar|gz)$/.test(name)) return 'archive';
  if (type.includes('json') || type.includes('xml') || /\.(json|xml|yaml|yml)$/.test(name)) return 'code';
  return 'generic';
};

const iconForFile = (doc) => {
  const kind = detectFileKind(doc);
  if (kind === 'pdf') return <FileType2 size={16} className="folder-file-icon file-pdf" />;
  if (kind === 'image') return <FileImage size={16} className="folder-file-icon file-image" />;
  if (kind === 'doc') return <FileText size={16} className="folder-file-icon file-doc" />;
  if (kind === 'sheet') return <FileSpreadsheet size={16} className="folder-file-icon file-sheet" />;
  if (kind === 'archive') return <FileArchive size={16} className="folder-file-icon file-archive" />;
  if (kind === 'code') return <FileCode2 size={16} className="folder-file-icon file-code" />;
  return <FileText size={16} className="folder-file-icon file-generic" />;
};

const FolderBrowser = ({ documents, onView, onConversation, onDownload, onShare, onDelete, onDeleteFolder, rootLabel = 'Root' }) => {
  const tree = useMemo(() => buildTree(documents), [documents]);
  const [currentPath, setCurrentPath] = useState([]);

  const { folders, files } = useMemo(() => getCurrentLevelEntries(tree, currentPath), [tree, currentPath]);

  const breadcrumbs = useMemo(() => {
    const items = [{ label: rootLabel, path: [] }];
    currentPath.forEach((segment, index) => {
      items.push({ label: segment, path: currentPath.slice(0, index + 1) });
    });
    return items;
  }, [currentPath, rootLabel]);

  const openFolder = (folderName) => {
    setCurrentPath((prev) => [...prev, folderName]);
  };

  const resolveDocumentId = (doc) => String(doc?.id || doc?._id || '');

  const goToPath = (path) => setCurrentPath(path);
  const goUp = () => setCurrentPath((prev) => prev.slice(0, -1));

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
      <div className="folder-toolbar">
        <div className="folder-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              {idx > 0 && <ChevronRight size={14} className="crumb-separator" />}
              <button type="button" className="crumb-btn" onClick={() => goToPath(crumb.path)}>
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="folder-toolbar-actions">
          <button type="button" className="folder-mini-btn" onClick={goUp} disabled={currentPath.length === 0}>
            Up
          </button>
        </div>
      </div>

      {folders.length === 0 && files.length === 0 ? (
        <div className="folder-empty-state">This folder is empty.</div>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="folder-entry-wrap grid">
              {folders.map((folder) => (
                <div key={folder.fullPath} className="folder-entry folder-entry-folder">
                  <button type="button" className="folder-entry-folder-main" onClick={() => openFolder(folder.name)}>
                    <span className="folder-icon-stack">
                      <FolderIconGraphic size={84} />
                      <span className="folder-icon-label">{folder.name}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="folder-folder-delete"
                    title="Delete folder and all files inside"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteFolder?.(folder.fullPath);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="folder-entry-wrap list">
              {files.map((doc) => (
                <div
                  key={doc.id || doc._id}
                  className="folder-entry folder-entry-file"
                  onClick={() => onView?.(resolveDocumentId(doc), doc)}
                >
                  <div className="folder-file-info">
                    {iconForFile(doc)}
                    <div className="folder-file-meta-col">
                      <span className="folder-file-title">{doc.title}</span>
                      <span className="folder-file-meta">{doc.type} • {doc.size}</span>
                    </div>
                  </div>
                  <div className="folder-file-actions">
                    <button onClick={(event) => { event.stopPropagation(); onView?.(resolveDocumentId(doc), doc); }} title="View Document"><Eye size={14} /></button>
                    {onConversation && (
                      <button onClick={(event) => { event.stopPropagation(); onConversation?.(resolveDocumentId(doc), doc); }} title="Open Conversation"><MessageCircle size={14} /></button>
                    )}
                    <button onClick={(event) => { event.stopPropagation(); onDownload?.(doc); }} title="Download"><Download size={14} /></button>
                    <button onClick={(event) => { event.stopPropagation(); onShare?.(doc); }} title="Share"><Share2 size={14} /></button>
                    <button onClick={(event) => { event.stopPropagation(); onDelete?.(doc); }} title="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FolderBrowser;
