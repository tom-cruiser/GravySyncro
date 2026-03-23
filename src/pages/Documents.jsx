import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import axios from 'axios';
import {
  fetchDocumentsStart,
  fetchDocumentsSuccess,
  fetchDocumentsFailure,
  uploadDocumentStart,
  uploadDocumentSuccess,
  uploadDocumentFailure,
  deleteDocument,
} from '../features/documents/documentsSlice';
import { addNotification } from '../features/notifications/notificationsSlice';
import DocumentList from '../components/DocumentList';
import FolderBrowser from '../components/FolderBrowser';
import SearchBar from '../components/SearchBar';
import ShareDocument from '../components/ShareDocument';
import './Documents.css';

const Documents = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const { documents, isUploading, uploadProgress, isLoading, filters } = useSelector(state => state.documents);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetDocument, setShareTargetDocument] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const folderInputRef = useRef(null);
  const [contentView, setContentView] = useState('folders');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [pageSize] = useState(20);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    type: 'General',
  });

  const MAX_FILES = 100;
  const MAX_FILE_SIZE = 157286400; // 150MB

  const documentTypes = ['General', 'Contract', 'Legal', 'Academic', 'Financial', 'Personal'];
  const acceptedMimeTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchQuery, filters.type, filters.sortBy]);

  useEffect(() => {
    if (!token) return;
    fetchDocuments(currentPage);
  }, [token, currentPage, filters.searchQuery, filters.type, filters.sortBy]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const mapDocument = (doc) => {
    const typeSource = doc.mimeType || doc.type || 'application/octet-stream';
    const normalizedType = String(typeSource).includes('/')
      ? String(typeSource).split('/')[1].toUpperCase()
      : String(typeSource).toUpperCase();

    return {
      ...doc,
      id: doc._id || doc.id,
      title: doc.name || doc.title || doc.originalName || 'Untitled',
      type: normalizedType,
      size: formatFileSize(doc.size || doc.fileSize || 0),
      date: new Date(doc.createdAt || Date.now()).toLocaleDateString(),
      encrypted: doc.encrypted !== false,
      folderPath: doc.folderPath || (doc.path || '').replace(/^\/+|\/+$/g, ''),
      relativePath: doc.relativePath || doc.originalName || doc.name || doc.title,
    };
  };

  const fetchDocuments = async (page = currentPage) => {
    dispatch(fetchDocumentsStart());

    const sortByMap = {
      date: '-createdAt',
      'date-asc': 'createdAt',
      name: 'name',
      'name-desc': '-name',
      size: '-fileSize',
      'size-asc': 'fileSize',
    };

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page,
            limit: pageSize,
            sortBy: sortByMap[filters.sortBy] || '-createdAt',
            ...(filters.searchQuery?.trim() ? { search: filters.searchQuery.trim() } : {}),
            ...(filters.type && filters.type !== 'all' ? { category: filters.type } : {}),
          },
        }
      );

      const docs = (response.data?.data?.documents || []).map(mapDocument);
      dispatch(fetchDocumentsSuccess(docs));
      setTotalPages(Math.max(1, Number(response.data?.pages) || 1));
      setTotalDocuments(Number(response.data?.total) || docs.length);
    } catch (error) {
      console.error('Error fetching documents:', error);
      dispatch(fetchDocumentsFailure('Failed to load documents'));
    }
  };

  const acceptedExtensions = Object.values(acceptedMimeTypes).flat();

  const isSupportedFile = (file) => {
    if (file?.type && acceptedMimeTypes[file.type]) {
      return true;
    }

    const extension = file?.name?.includes('.')
      ? `.${file.name.split('.').pop().toLowerCase()}`
      : '';
    return acceptedExtensions.includes(extension);
  };

  const applyFileSelection = useCallback((files) => {
    const incomingFiles = Array.from(files || []);
    if (incomingFiles.length === 0) return;

    const rejectedByType = incomingFiles.filter((file) => !isSupportedFile(file));
    const supportedFiles = incomingFiles.filter((file) => isSupportedFile(file));

    const rejectedBySize = supportedFiles.filter((file) => file.size > MAX_FILE_SIZE);
    let validFiles = supportedFiles.filter((file) => file.size <= MAX_FILE_SIZE);

    if (validFiles.length > MAX_FILES) {
      dispatch(addNotification({
        id: Date.now(),
        type: 'error',
        message: `Folder/file selection contains ${validFiles.length} files. Maximum allowed is ${MAX_FILES}.`,
        read: false,
        timestamp: new Date().toISOString(),
      }));
      validFiles = validFiles.slice(0, MAX_FILES);
    }

    if (rejectedByType.length > 0) {
      dispatch(addNotification({
        id: Date.now() + 1,
        type: 'error',
        message: `${rejectedByType.length} file(s) skipped: unsupported format.`,
        read: false,
        timestamp: new Date().toISOString(),
      }));
    }

    if (rejectedBySize.length > 0) {
      dispatch(addNotification({
        id: Date.now() + 2,
        type: 'error',
        message: `${rejectedBySize.length} file(s) skipped: file size exceeds 150MB.`,
        read: false,
        timestamp: new Date().toISOString(),
      }));
    }

    setUploadFiles(validFiles);
    if (validFiles.length === 1 && !metadata.title) {
      setMetadata(prev => ({ ...prev, title: validFiles[0].name }));
    }

    if (validFiles.length > 1 && metadata.title) {
      setMetadata(prev => ({ ...prev, title: '' }));
    }
  }, [dispatch, metadata.title]);

  const onDrop = useCallback((acceptedFiles) => {
    applyFileSelection(acceptedFiles);
  }, [applyFileSelection]);

  const onDropRejected = useCallback((fileRejections) => {
    const firstRejection = fileRejections?.[0];
    const firstError = firstRejection?.errors?.[0];
    const message = firstError?.message || 'File rejected. Please use a supported format and size.';

    dispatch(addNotification({
      id: Date.now(),
      type: 'error',
      message,
      read: false,
      timestamp: new Date().toISOString(),
    }));
  }, [dispatch]);

  const handleFolderPick = () => {
    folderInputRef.current?.click();
  };

  const handleFolderSelection = (event) => {
    const files = event.target.files;
    applyFileSelection(files);
    event.target.value = '';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: true,
    accept: acceptedMimeTypes,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
  });

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    dispatch(uploadDocumentStart());

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const relativePath = file.webkitRelativePath || file.name;
        const relativeSegments = relativePath.split('/').filter(Boolean);
        const derivedFolderPath = relativeSegments.length > 1
          ? relativeSegments.slice(0, -1).join('/')
          : '';
        const resolvedTitle = uploadFiles.length > 1 ? file.name : (metadata.title || file.name);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', resolvedTitle);
        formData.append('description', metadata.description || '');
        formData.append('type', metadata.type || 'General');
        formData.append('category', metadata.type || 'General');
        formData.append('folderPath', derivedFolderPath);
        formData.append('relativePath', relativePath);

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/documents`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        const createdDoc = mapDocument(response.data?.data?.document || {});
        dispatch(uploadDocumentSuccess(createdDoc));
        dispatch(addNotification({
          id: Date.now() + i,
          type: 'success',
          message: `${file.name} uploaded successfully`,
          read: false,
          timestamp: new Date().toISOString(),
        }));
      }

      setShowUploadModal(false);
      setUploadFiles([]);
      setMetadata({ title: '', description: '', type: 'General' });
      setCurrentPage(1);
      fetchDocuments(1);
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Upload failed. Please try again.';

      dispatch(uploadDocumentFailure(errorMessage));
      dispatch(addNotification({
        id: Date.now(),
        type: 'error',
        message: `Upload failed: ${errorMessage}`,
        read: false,
        timestamp: new Date().toISOString(),
      }));
    }
  };

  const fetchDocumentBlob = async (doc, disposition = 'attachment') => {
    if (!doc?.id) {
      throw new Error('Document identifier is missing. Refresh and try again.');
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { disposition, proxy: true },
          responseType: 'blob',
        }
      );

      const contentType = response.headers['content-type'] || doc.mimeType || 'application/octet-stream';
      return new Blob([response.data], { type: contentType });
    } catch (error) {
      if (error?.response?.data instanceof Blob) {
        const errorText = await error.response.data.text();
        try {
          const parsed = JSON.parse(errorText);
          throw new Error(parsed?.message || 'Failed to load document content.');
        } catch {
          const extractedMessage = errorText.match(/"message"\s*:\s*"([^"]+)"/)?.[1];
          throw new Error(extractedMessage || errorText || 'Failed to load document content.');
        }
      }

      throw error;
    }
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await fetchDocumentBlob(doc, 'attachment');
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = downloadUrl;
      link.download = doc?.title || doc?.name || 'document';
      globalThis.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(error.response?.data?.message || error.message || 'Failed to download document');
    }
  };

  const handleView = async (doc) => {
    try {
      const blob = await fetchDocumentBlob(doc, 'inline');
      const viewUrl = window.URL.createObjectURL(blob);
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(viewUrl), 60000);
    } catch (error) {
      console.error('Error viewing document:', error);
      const message = error.response?.data?.message || error.message || 'Failed to view document';

      // If preview is blocked for corrupted PDFs, automatically fallback to download.
      if (message.toLowerCase().includes('cannot be previewed') || message.toLowerCase().includes('corrupted')) {
        const shouldDownload = window.confirm(`${message}\n\nWould you like to download this file instead?`);
        if (shouldDownload) {
          await handleDownload(doc);
          return;
        }
      }

      alert(message);
    }
  };

  const handleShare = async (doc) => {
    setShareTargetDocument(doc);
    setShowShareModal(true);
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/documents/${doc.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      dispatch(deleteDocument(doc.id));
      const nextTotal = Math.max(0, totalDocuments - 1);
      const nextPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      setTotalDocuments(nextTotal);
      setTotalPages(nextPages);

      if (currentPage > nextPages) {
        setCurrentPage(nextPages);
      } else {
        fetchDocuments(currentPage);
      }

      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: 'Document deleted successfully',
        read: false,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1>My Documents</h1>
          <p className="subtitle">Manage and organize your files</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={20} />
          Upload Documents
        </button>
      </div>

      <SearchBar />
      <div className="documents-view-toggle" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
        <button
          className={`btn-secondary ${contentView === 'folders' ? 'active' : ''}`}
          onClick={() => setContentView('folders')}
          type="button"
        >
          Folder View
        </button>
        <button
          className={`btn-secondary ${contentView === 'flat' ? 'active' : ''}`}
          onClick={() => setContentView('flat')}
          type="button"
          style={{ marginLeft: '0.5rem' }}
        >
          Flat View
        </button>
      </div>

      {contentView === 'folders' ? (
        <FolderBrowser
          documents={documents}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          onView={handleView}
        />
      ) : (
        <DocumentList
          documents={documents}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}

      <div className="documents-pagination">
        <button
          type="button"
          className="btn-secondary"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages} • {totalDocuments} total files
        </span>
        <button
          type="button"
          className="btn-secondary"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        >
          Next
        </button>
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Documents</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <Upload size={48} />
                <p className="dropzone-text">
                  {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
                </p>
                <p className="dropzone-hint">Supports folders/files: max 100 files, max 150MB per file</p>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <button type="button" className="btn-secondary" onClick={handleFolderPick}>
                  Select Folder
                </button>
                <input
                  ref={folderInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFolderSelection}
                  multiple
                  webkitdirectory=""
                  directory=""
                />
              </div>

              {uploadFiles.length > 0 && (
                <div className="selected-files">
                  <h3>Selected Files ({uploadFiles.length})</h3>
                  <ul>
                    {uploadFiles.map((file, index) => (
                      <li key={index}>
                        {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="metadata-form">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                    placeholder="Document title"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={metadata.description}
                    onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Brief description (optional)"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Document Type</label>
                  <select
                    value={metadata.type}
                    onChange={(e) => setMetadata({ ...metadata, type: e.target.value })}
                  >
                    {documentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p>Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && shareTargetDocument && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ShareDocument
              document={shareTargetDocument}
              onClose={() => setShowShareModal(false)}
              onShared={() => fetchDocuments(currentPage)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
