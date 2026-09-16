import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, Download, Trash2, RotateCcw, CheckCircle2, AlertCircle, Loader2, Sparkles, Lock } from 'lucide-react';
import api from '../config/api';
import { addNotification } from '../features/notifications/notificationsSlice';
import './PlusFiles.css';

const CONCURRENCY = 3;

// Mirrors the backend's isEnterpriseAdmin (utils/workspaceAccess.js ROLE_ALIASES):
// 'Admin' and 'Enterprise Admin' both normalize to Enterprise Admin there.
// requirePlus (middleware/planAccess.js) lets these roles through regardless
// of isPlus, same as every other paywall/ownership gate in the app — this
// UI gate has to agree, or an admin who the backend lets in still gets
// stuck on the upgrade CTA.
const hasFileVaultAccess = (user) => Boolean(user?.isPlus) || ['Admin', 'Enterprise Admin'].includes(user?.role);

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const UpgradeCTA = () => {
  const navigate = useNavigate();
  return (
    <div className="plus-files-page">
      <div className="plus-upgrade-card">
        <div className="plus-upgrade-icon"><Lock size={22} /></div>
        <h2>Plus feature</h2>
        <p>The file vault lets you upload any file type in bulk and download it back byte-for-byte identical. Upgrade to Plus to unlock it.</p>
        <button type="button" className="plus-upgrade-btn" onClick={() => navigate('/billing')}>
          <Sparkles size={16} /> View plans
        </button>
      </div>
    </div>
  );
};

const PlusFiles = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const [queue, setQueue] = useState([]);
  const [myFiles, setMyFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const queueRef = useRef([]);
  const activeCountRef = useRef(0);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchFiles = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await axios.get(api.endpoints.files.list(), { headers: authHeaders() });
      setMyFiles(res.data?.data?.files || []);
    } catch (err) {
      dispatch(addNotification({
        id: Date.now(), type: 'error', read: false, timestamp: new Date().toISOString(),
        message: err?.response?.data?.message || 'Failed to load your files.',
      }));
    } finally {
      setLoadingList(false);
    }
  }, [authHeaders, dispatch]);

  useEffect(() => {
    if (hasFileVaultAccess(user)) fetchFiles();
  }, [user, fetchFiles]);

  const updateItem = (id, patch) => {
    setQueue((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
      queueRef.current = next;
      return next;
    });
  };

  const uploadItem = async (item) => {
    const formData = new FormData();
    formData.append('files', item.file, item.file.name);

    try {
      const res = await axios.post(api.endpoints.files.upload(), formData, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
          updateItem(item.id, { progress: pct });
        },
      });

      updateItem(item.id, { status: 'done', progress: 100 });
      const uploaded = res.data?.data?.files?.[0];
      if (uploaded) {
        setMyFiles((prev) => [uploaded, ...prev]);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Upload failed.';
      updateItem(item.id, { status: 'failed', error: message });
    } finally {
      activeCountRef.current -= 1;
      kickQueue();
    }
  };

  // Pulls up to CONCURRENCY queued items and starts them. Mutates queueRef
  // synchronously inside the loop so a batch of N dropped files immediately
  // claims 3 slots instead of racing the next render to see updated status.
  const kickQueue = () => {
    while (activeCountRef.current < CONCURRENCY) {
      const next = queueRef.current.find((item) => item.status === 'queued');
      if (!next) break;

      activeCountRef.current += 1;
      queueRef.current = queueRef.current.map((item) => (
        item.id === next.id ? { ...item, status: 'uploading', progress: 0, error: null } : item
      ));
      setQueue(queueRef.current);
      uploadItem(next);
    }
  };

  const onDrop = useCallback((accepted) => {
    if (!accepted?.length) return;
    const items = accepted.map((file) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      file,
      status: 'queued',
      progress: 0,
      error: null,
    }));

    queueRef.current = [...queueRef.current, ...items];
    setQueue(queueRef.current);
    kickQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    // Deliberately no `accept` — the Plus vault stores any file type.
  });

  const retryItem = (id) => {
    queueRef.current = queueRef.current.map((item) => (
      item.id === id ? { ...item, status: 'queued', error: null, progress: 0 } : item
    ));
    setQueue(queueRef.current);
    kickQueue();
  };

  const clearFinished = () => {
    queueRef.current = queueRef.current.filter((item) => item.status !== 'done');
    setQueue(queueRef.current);
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
      setMyFiles((prev) => prev.filter((item) => item.id !== file.id));
    } catch (err) {
      dispatch(addNotification({
        id: Date.now(), type: 'error', read: false, timestamp: new Date().toISOString(),
        message: err?.response?.data?.message || 'Delete failed.',
      }));
    }
  };

  if (!hasFileVaultAccess(user)) {
    return <UpgradeCTA />;
  }

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
        <p><strong>Drag & drop files here</strong>, or click to browse</p>
        <span className="plus-dropzone-hint">Any file type · up to {formatBytes(parseInt(import.meta.env.VITE_PLUS_MAX_FILE_SIZE, 10) || 104857600)} per file</span>
      </div>

      {queue.length > 0 && (
        <div className="plus-queue">
          <div className="plus-queue-header">
            <h3>Uploads</h3>
            {doneCount > 0 && (
              <button type="button" className="plus-link-btn" onClick={clearFinished}>Clear completed</button>
            )}
          </div>
          <ul className="plus-queue-list">
            {queue.map((item) => (
              <li key={item.id} className={`plus-queue-item status-${item.status}`}>
                <div className="plus-queue-item-info">
                  <span className="plus-queue-item-name" title={item.file.name}>{item.file.name}</span>
                  <span className="plus-queue-item-size">{formatBytes(item.file.size)}</span>
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
        {loadingList ? (
          <p className="plus-empty">Loading…</p>
        ) : myFiles.length === 0 ? (
          <p className="plus-empty">No files uploaded yet.</p>
        ) : (
          <ul className="plus-documents-list">
            {myFiles.map((file) => (
              <li key={file.id} className="plus-documents-item">
                <div className="plus-documents-item-info">
                  <span className="plus-documents-item-name" title={file.originalName}>{file.originalName}</span>
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
