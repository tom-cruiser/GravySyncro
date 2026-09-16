import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, FolderUp, Search, X, Download, Trash2, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../config/api';
import { addNotification } from '../features/notifications/notificationsSlice';
import {
  setSearchTerm,
  setLoadingList,
  setMyFiles,
  removeMyFile,
  removeMyFiles,
  clearFinishedQueueItems,
} from '../features/plusFiles/plusFilesSlice';
import { enqueueFiles, retryItem } from '../features/plusFiles/uploadManager';
import './PlusFiles.css';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const PlusFiles = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  // Queue and myFiles live in Redux (features/plusFiles/plusFilesSlice.js),
  // not component state — they need to survive the user navigating to
  // another page and back, which a useState here would not.
  const { queue, myFiles, loadingList, searchTerm } = useSelector((state) => state.plusFiles);

  const [searchInput, setSearchInput] = useState(searchTerm);
  // Selection is ephemeral, view-only state — unlike the queue/myFiles data
  // itself it doesn't need to survive navigating away, so plain component
  // state (not the Redux slice) is the right place for it.
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const folderInputRef = useRef(null);
  const didMountSearchRef = useRef(false);

  // webkitdirectory/directory aren't real React DOM props (no JSX attribute
  // maps to them), so they're set imperatively on the underlying <input> —
  // this is what turns its native picker into a folder-only chooser.
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.webkitdirectory = true;
      folderInputRef.current.directory = true;
    }
  }, []);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchFiles = useCallback(async (search) => {
    dispatch(setLoadingList(true));
    try {
      const res = await axios.get(api.endpoints.files.list(), {
        headers: authHeaders(),
        params: search ? { search } : undefined,
      });
      dispatch(setMyFiles(res.data?.data?.files || []));
    } catch (err) {
      dispatch(addNotification({
        id: Date.now(), type: 'error', read: false, timestamp: new Date().toISOString(),
        message: err?.response?.data?.message || 'Failed to load your files.',
      }));
    } finally {
      dispatch(setLoadingList(false));
    }
  }, [authHeaders, dispatch]);

  // Re-fetches whenever the page (re)mounts — cheap, and catches anything
  // that changed elsewhere. The list itself stays visible from the Redux
  // slice the instant the page re-mounts, so this just refreshes it rather
  // than starting from a blank "no files" state.
  useEffect(() => {
    fetchFiles(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server-side search — filters by file name or folder path.
  // Skips its first run: the mount effect above already fetched with the
  // persisted search term, so firing again immediately would just repeat
  // the same request.
  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return undefined;
    }
    const handle = setTimeout(() => {
      dispatch(setSearchTerm(searchInput));
      fetchFiles(searchInput);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Drop any selected id that's no longer in the current list (deleted,
  // filtered out by a new search, etc.) instead of holding onto stale ids.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(myFiles.map((file) => String(file.id)));
      const next = new Set([...prev].filter((id) => visibleIds.has(String(id))));
      return next.size === prev.size ? prev : next;
    });
  }, [myFiles]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => (
      prev.size === myFiles.length ? new Set() : new Set(myFiles.map((file) => file.id))
    ));
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected file${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;

    try {
      const res = await axios.delete(api.endpoints.files.bulkDelete(), {
        headers: authHeaders(),
        data: { ids },
      });
      const deletedIds = res.data?.data?.deletedIds || ids;
      dispatch(removeMyFiles(deletedIds));
      setSelectedIds(new Set());
    } catch (err) {
      dispatch(addNotification({
        id: Date.now(), type: 'error', read: false, timestamp: new Date().toISOString(),
        message: err?.response?.data?.message || 'Bulk delete failed.',
      }));
    }
  };

  const onDrop = useCallback((accepted) => {
    enqueueFiles(accepted);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    // Deliberately no `accept` (any file type) and no `maxFiles` (as many
    // files/folders as the user hands over).
  });

  const handleFolderInputChange = (event) => {
    enqueueFiles(Array.from(event.target.files || []));
    // Reset so picking the same folder again still fires onChange.
    event.target.value = '';
  };

  const handleDownload = async (file) => {
    try {
      const res = await axios.get(api.endpoints.files.download(file.id), {
        headers: authHeaders(),
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: file.mimeType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.originalName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      dispatch(addNotification({
        id: Date.now(), type: 'error', read: false, timestamp: new Date().toISOString(),
        message: err?.response?.data?.message || 'Download failed.',
      }));
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(api.endpoints.files.delete(file.id), { headers: authHeaders() });
      dispatch(removeMyFile(file.id));
      setSelectedIds((prev) => {
        if (!prev.has(file.id)) return prev;
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
    } catch (err) {
      dispatch(addNotification({
        id: Date.now(), type: 'error', read: false, timestamp: new Date().toISOString(),
        message: err?.response?.data?.message || 'Delete failed.',
      }));
    }
  };

  const doneCount = queue.filter((item) => item.status === 'done').length;
  const totalCount = queue.length;

  return (
    <div className="plus-files-page">
      <div className="plus-files-header">
        <div>
          <h1>File Vault</h1>
          <p className="plus-files-subtitle">Upload any file type in bulk. Downloads come back exactly as you uploaded them.</p>
        </div>
        {totalCount > 0 && (
          <div className="plus-files-summary">
            {doneCount} of {totalCount} uploaded
          </div>
        )}
      </div>

      <div {...getRootProps({ className: `plus-dropzone ${isDragActive ? 'active' : ''}` })}>
        <input {...getInputProps()} />
        <UploadCloud size={28} />
        <p><strong>Drag & drop files or folders here</strong>, or click to browse</p>
        <span className="plus-dropzone-hint">
          Any file type · no limit on how many · up to {formatBytes(parseInt(import.meta.env.VITE_PLUS_MAX_FILE_SIZE, 10) || 524288000)} per file
        </span>
        <button
          type="button"
          className="plus-secondary-btn"
          onClick={(event) => { event.stopPropagation(); folderInputRef.current?.click(); }}
        >
          <FolderUp size={15} /> Select a folder
        </button>
      </div>
      <input
        ref={folderInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFolderInputChange}
      />

      {queue.length > 0 && (
        <div className="plus-queue">
          <div className="plus-queue-header">
            <h3>Uploads</h3>
            {doneCount > 0 && (
              <button type="button" className="plus-link-btn" onClick={() => dispatch(clearFinishedQueueItems())}>Clear completed</button>
            )}
          </div>
          <ul className="plus-queue-list">
            {queue.map((item) => (
              <li key={item.id} className={`plus-queue-item status-${item.status}`}>
                <div className="plus-queue-item-info">
                  <span className="plus-queue-item-name" title={item.relativePath}>{item.relativePath}</span>
                  <span className="plus-queue-item-size">{formatBytes(item.size)}</span>
                </div>
                <div className="plus-queue-item-progress">
                  <div className="plus-progress-track">
                    <div className="plus-progress-fill" style={{ width: `${item.status === 'done' ? 100 : item.progress}%` }} />
                  </div>
                </div>
                <div className="plus-queue-item-status">
                  {item.status === 'queued' && <span className="plus-status-badge queued">Queued</span>}
                  {item.status === 'uploading' && <span className="plus-status-badge uploading"><Loader2 size={14} className="spin" /> {item.progress}%</span>}
                  {item.status === 'done' && <span className="plus-status-badge done"><CheckCircle2 size={14} /> Done</span>}
                  {item.status === 'failed' && (
                    <span className="plus-status-badge failed" title={item.error}>
                      <AlertCircle size={14} /> Failed
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <button type="button" className="plus-icon-btn" onClick={() => retryItem(item.id)} title="Retry">
                      <RotateCcw size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="plus-documents">
        <div className="plus-queue-header">
          <h3>My Documents</h3>
        </div>
        <div className="plus-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search files and folders…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          {searchInput && (
            <button type="button" className="plus-search-clear" onClick={() => setSearchInput('')} title="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        {myFiles.length > 0 && (
          <div className="plus-bulk-bar">
            <label className="plus-select-all">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === myFiles.length}
                ref={(el) => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < myFiles.length; }}
                onChange={toggleSelectAll}
              />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </label>
            {selectedIds.size > 0 && (
              <button type="button" className="plus-bulk-delete-btn" onClick={handleBulkDelete}>
                <Trash2 size={14} /> Delete selected
              </button>
            )}
          </div>
        )}

        {loadingList ? (
          <p className="plus-empty">Loading…</p>
        ) : myFiles.length === 0 ? (
          <p className="plus-empty">{searchTerm ? 'No files match your search.' : 'No files uploaded yet.'}</p>
        ) : (
          <ul className="plus-documents-list">
            {myFiles.map((file) => (
              <li key={file.id} className={`plus-documents-item ${selectedIds.has(file.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  className="plus-item-checkbox"
                  checked={selectedIds.has(file.id)}
                  onChange={() => toggleSelect(file.id)}
                />
                <div className="plus-documents-item-info">
                  <span className="plus-documents-item-name" title={file.relativePath || file.originalName}>{file.relativePath || file.originalName}</span>
                  <span className="plus-documents-item-meta">
                    {formatBytes(file.size)} · {new Date(file.uploadedAt).toLocaleString()}
                  </span>
                </div>
                <div className="plus-documents-item-actions">
                  <button type="button" className="plus-icon-btn" onClick={() => handleDownload(file)} title="Download">
                    <Download size={16} />
                  </button>
                  <button type="button" className="plus-icon-btn danger" onClick={() => handleDelete(file)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlusFiles;
