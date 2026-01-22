import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { uploadDocumentStart, uploadDocumentSuccess, uploadDocumentFailure } from '../features/documents/documentsSlice';
import { addNotification } from '../features/notifications/notificationsSlice';
import DocumentList from '../components/DocumentList';
import SearchBar from '../components/SearchBar';
import './Documents.css';

const Documents = () => {
  const dispatch = useDispatch();
  const { documents, isUploading, uploadProgress } = useSelector(state => state.documents);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    type: 'General',
  });

  const documentTypes = ['General', 'Contract', 'Legal', 'Academic', 'Financial', 'Personal'];

  const onDrop = useCallback((acceptedFiles) => {
    setUploadFiles(acceptedFiles);
    if (acceptedFiles.length > 0 && !metadata.title) {
      setMetadata(prev => ({ ...prev, title: acceptedFiles[0].name }));
    }
  }, [metadata.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    dispatch(uploadDocumentStart());

    try {
      // Mock upload - replace with actual API call
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));

        // Simulate upload progress
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newDocument = {
          id: Date.now() + i,
          title: metadata.title || file.name,
          description: metadata.description,
          type: file.type.split('/')[1].toUpperCase() || 'FILE',
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          date: new Date().toISOString().split('T')[0],
          category: metadata.type,
          encrypted: true,
        };

        dispatch(uploadDocumentSuccess(newDocument));
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
    } catch (err) {
      dispatch(uploadDocumentFailure('Upload failed. Please try again.'));
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
      <DocumentList documents={documents} />

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
                <p className="dropzone-hint">Supports PDF, DOCX, XLSX, PPTX, and images</p>
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
    </div>
  );
};

export default Documents;
