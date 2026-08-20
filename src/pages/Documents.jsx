import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, X, Film, FileText, RotateCcw, CheckCircle2, AlertCircle, MessageCircle, BarChart3, Filter } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import api from '../config/api';
import {
  fetchDocumentsStart,
  fetchDocumentsSuccess,
  fetchDocumentsFailure,
  uploadDocumentStart,
  uploadDocumentProgress,
  uploadDocumentSuccess,
  uploadDocumentFailure,
  deleteDocument,
  updateDocument,
} from '../features/documents/documentsSlice';
import { addNotification } from '../features/notifications/notificationsSlice';
import { logout } from '../features/auth/authSlice';
import { setCurrentWorkspace } from '../features/workspace/workspaceSlice';
import DocumentList from '../components/DocumentList';
import FolderBrowser from '../components/FolderBrowser';
import Comments from '../components/Comments';
import DocumentLightbox, { canPreviewInLightbox } from '../components/DocumentLightbox';
import VersionHistory from '../components/VersionHistory';
import SearchBar from '../components/SearchBar';
import ShareDocument from '../components/ShareDocument';
import './Documents.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_DOC_FILES = 100;
const MAX_DOC_SIZE = 157286400; // 150 MB

const MAX_VIDEO_SIZE = 1.5 * 1024 * 1024 * 1024; // 1.5 GB
const MAX_CONCURRENT_VIDEO_UPLOADS = 3;
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB parts

const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'video/x-matroska', 'video/webm', 'video/3gpp',
  'video/3gpp2', 'video/mpeg',
]);
const ALLOWED_VIDEO_EXT = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', '3g2', 'mpeg', 'mpg']);

const DOC_MIME_TYPES = {
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

const VIDEO_ACCEPT_MIME = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-matroska': ['.mkv'],
  'video/webm': ['.webm'],
  'video/3gpp': ['.3gp'],
  'video/3gpp2': ['.3g2'],
  'video/mpeg': ['.mpeg', '.mpg'],
};

const DOCUMENT_TYPES = ['General', 'Contract', 'Legal', 'Academic', 'Financial', 'Personal'];
const LIFECYCLE_STATES = ['STARTED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'REJECTED', 'FINISHED', 'ARCHIVED'];
const MANAGERIAL_ROLES = new Set(['Admin', 'Manager', 'Enterprise Admin', 'Workspace Manager']);

// ─── SHA-256 helper (browser SubtleCrypto) ────────────────────────────────────
const computeSHA256 = async (file) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const formatLifecycleState = (value) => String(value || 'STARTED').replaceAll('_', ' ');

const getLifecycleTone = (value) => {
  const state = String(value || 'STARTED');
  if (state === 'FINISHED') return 'success';
  if (state === 'ARCHIVED') return 'muted';
  if (state === 'REJECTED') return 'danger';
  if (state === 'NEEDS_REVIEW') return 'warning';
  if (state === 'IN_PROGRESS') return 'active';
  return 'default';
};

// ─── Upload-state helpers ─────────────────────────────────────────────────────
const UPLOAD_STATUS = {
  QUEUED: 'queued',
  HASHING: 'hashing',
  INITIATING: 'initiating',
  UPLOADING: 'uploading',
  COMPLETING: 'completing',
  DONE: 'done',
  ERROR: 'error',
  ABORTED: 'aborted',
};

const mkVideoUploadState = (file) => ({
  id: `${file.name}-${file.size}-${Date.now()}`,
  file,
  status: UPLOAD_STATUS.QUEUED,
  progress: 0,          // 0-100
  error: null,
  videoId: null,        // server Video._id (for resume)
  uploadId: null,       // S3 UploadId
  storageKey: null,
  totalParts: 0,
  uploadedParts: [],    // [{ PartNumber, ETag }]
  abortController: null,
});

// ─── Component ────────────────────────────────────────────────────────────────
const Documents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user } = useSelector(state => state.auth);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { documents, isUploading, uploadProgress, isLoading, filters } = useSelector(state => state.documents);

  // Tab: 'files' | 'videos'
  const [activeTab, setActiveTab] = useState('files');

  // Document upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetDocument, setShareTargetDocument] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [sidebarDocument, setSidebarDocument] = useState(null);
  const [sidebarVideo, setSidebarVideo] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState(null);
  const folderInputRef = useRef(null);
  const [contentView, setContentView] = useState('folders');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [pageSize] = useState(20);
  const [metadata, setMetadata] = useState({ title: '', description: '', type: 'General' });

  // Video upload state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUploads, setVideoUploads] = useState([]); // array of mkVideoUploadState
  const [videoMetadata, setVideoMetadata] = useState({ title: '', description: '', category: 'General', workspaceId: '' });
  const [videos, setVideos] = useState([]);
  const [videoPage, setVideoPage] = useState(1);
  const [videoTotalPages, setVideoTotalPages] = useState(1);
  const [videoTotal, setVideoTotal] = useState(0);
  const [filePageInput, setFilePageInput] = useState('1');
  const [videoPageInput, setVideoPageInput] = useState('1');
  const [reportDownloading, setReportDownloading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportState, setReportState] = useState('all');
  const [reportFormat, setReportFormat] = useState('xlsx');
  const videoUploadQueue = useRef([]); // tracks in-flight uploads to cap concurrency
  const routeWorkspaceId = searchParams.get('workspaceId') || '';
  const activeWorkspaceId = selectedWorkspaceId || routeWorkspaceId;
  const canUseAssetReports = MANAGERIAL_ROLES.has(user?.role);

  useEffect(() => {
    if (!showVideoModal) return;
    setVideoMetadata((prev) => {
      if (prev.workspaceId) return prev;
      return { ...prev, workspaceId: activeWorkspaceId || '' };
    });
  }, [showVideoModal, activeWorkspaceId]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getVisiblePages = (page, pages, radius = 2) => {
    if (pages <= 1) return [1];
    const start = Math.max(1, page - radius);
    const end = Math.min(pages, page + radius);
    const list = [];
    for (let index = start; index <= end; index += 1) {
      list.push(index);
    }
    return list;
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
      lifecycleState: doc.lifecycleState || 'STARTED',
      lifecycleLocked: Boolean(doc.lifecycleLocked),
      folderPath: doc.folderPath || (doc.path || '').replace(/^\/+|\/+$/g, ''),
      relativePath: doc.relativePath || doc.originalName || doc.name || doc.title,
    };
  };

  const mapVideo = (video) => ({
    ...video,
    id: video._id || video.id,
    title: video.title || video.fileName || 'Video',
    size: formatFileSize(video.fileSize || 0),
    date: new Date(video.createdAt || Date.now()).toLocaleDateString(),
    lifecycleState: video.lifecycleState || 'STARTED',
    lifecycleLocked: Boolean(video.lifecycleLocked),
  });

  // ── Document fetch ────────────────────────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [filters.searchQuery, filters.type, filters.sortBy]);

  useEffect(() => {
    if (!token || activeTab !== 'files') return;
    fetchDocuments(currentPage);
  }, [token, currentPage, filters.searchQuery, filters.type, filters.sortBy, activeTab, activeWorkspaceId]);

  useEffect(() => {
    setFilePageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    setVideoPageInput(String(videoPage));
  }, [videoPage]);

  useEffect(() => {
    if (!token) return undefined;

    const socketBaseUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
    const socket = io(socketBaseUrl || window.location.origin, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('authenticate', { token });
    });

    socket.on('document:deleted', ({ documentId, workspaceId }) => {
      if (documentId && sidebarDocument && String(documentId) === String(sidebarDocument.id || sidebarDocument._id)) {
        closeSidebar();
      }

      if (currentWorkspace?._id && workspaceId && String(currentWorkspace._id) !== String(workspaceId)) {
        return;
      }

      if (activeTab === 'files') {
        fetchDocuments(currentPage);
      }
    });

    socket.on('workspace:deleted', ({ workspaceId }) => {
      if (!workspaceId || !currentWorkspace?._id) return;
      if (String(workspaceId) !== String(currentWorkspace._id)) return;

      dispatch(setCurrentWorkspace(null));
      navigate('/workspaces');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeTab, currentPage, currentWorkspace?._id, sidebarDocument, dispatch, navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/workspaces`, {
          headers: authHeaders(),
        });
        setWorkspaces(response.data?.data?.workspaces || []);
      } catch (error) {
        if (error?.response?.status === 401) {
          dispatch(logout());
          navigate('/login');
          return;
        }
        setWorkspaces([]);
      }
    };

    fetchWorkspaces();
  }, [token]);

  useEffect(() => {
    const workspaceId = searchParams.get('workspaceId');
    if (!workspaceId) return;

    const workspace = workspaces.find((item) => String(item._id) === String(workspaceId)) || null;
    if (workspace) {
      dispatch(setCurrentWorkspace(workspace));
      setSelectedWorkspaceId(String(workspace._id));
      return;
    }

    if (currentWorkspace?._id !== workspaceId) {
      dispatch(setCurrentWorkspace({ _id: workspaceId, name: 'Workspace' }));
      setSelectedWorkspaceId(workspaceId);
    }
  }, [searchParams, workspaces, currentWorkspace, dispatch]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      setSelectedWorkspaceId(String(currentWorkspace._id));
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeWorkspaceId]);

  useEffect(() => {
    const workspaceId = searchParams.get('workspaceId');
    if (workspaceId) {
      const workspace = workspaces.find((item) => String(item._id) === String(workspaceId)) || null;
      if (workspace) {
        dispatch(setCurrentWorkspace(workspace));
        setSelectedWorkspaceId(workspace._id);
      } else if (currentWorkspace?._id !== workspaceId) {
        const fallbackWorkspace = { _id: workspaceId, name: 'Workspace' };
        dispatch(setCurrentWorkspace(fallbackWorkspace));
        setSelectedWorkspaceId(workspaceId);
      }
    }
  }, [searchParams, workspaces, currentWorkspace, dispatch]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      setSelectedWorkspaceId(String(currentWorkspace._id));
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (!viewId || !token) {
      setSidebarDocument(null);
      return;
    }

    const existingDocument = documents.find((doc) => String(doc.id || doc._id) === viewId);
    if (existingDocument) {
      setSidebarDocument(existingDocument);
      setSidebarLoading(false);
      return;
    }

    const fetchSelectedDocument = async () => {
      setSidebarLoading(true);
      try {
        const response = await axios.get(api.endpoints.documents.byId(viewId), {
          headers: authHeaders(),
        });
        setSidebarDocument(mapDocument(response.data?.data?.document || {}));
      } catch (error) {
        if (error?.response?.status === 401) {
          dispatch(logout());
          navigate('/login');
          return;
        }
        setSidebarDocument(null);
      } finally {
        setSidebarLoading(false);
      }
    };

    fetchSelectedDocument();
  }, [searchParams, token, documents]);

  useEffect(() => {
    const videoViewId = searchParams.get('videoView');
    if (!videoViewId || !token) {
      setSidebarVideo(null);
      return;
    }

    const existingVideo = videos.find((video) => String(video._id || video.id) === String(videoViewId));
    if (existingVideo) {
      setSidebarVideo(existingVideo);
      return;
    }

    const fetchVideo = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/videos/${videoViewId}`, {
          headers: authHeaders(),
        });
            setSidebarVideo(mapVideo(response.data?.data?.video || {}));
      } catch (error) {
        if (error?.response?.status === 401) {
          dispatch(logout());
          navigate('/login');
          return;
        }
        setSidebarVideo(null);
      }
    };

    fetchVideo();
  }, [searchParams, token, videos]);

  const fetchDocuments = async (page = currentPage) => {
    dispatch(fetchDocumentsStart());
    const sortByMap = {
      date: '-createdAt', 'date-asc': 'createdAt',
      name: 'name', 'name-desc': '-name',
      size: '-fileSize', 'size-asc': 'fileSize',
    };
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/documents`, {
        headers: authHeaders(),
        params: {
          page, limit: pageSize,
          sortBy: sortByMap[filters.sortBy] || '-createdAt',
          ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
          ...(filters.searchQuery?.trim() ? { search: filters.searchQuery.trim() } : {}),
          ...(filters.type && filters.type !== 'all' ? { category: filters.type } : {}),
        },
      });
      const docs = (response.data?.data?.documents || []).map(mapDocument);
      dispatch(fetchDocumentsSuccess(docs));
      setTotalPages(Math.max(1, Number(response.data?.pages) || 1));
      setTotalDocuments(Number(response.data?.total) || docs.length);
    } catch (error) {
      if (error?.response?.status === 401) {
        dispatch(logout());
        navigate('/login');
        return;
      }
      dispatch(fetchDocumentsFailure('Failed to load documents'));
    }
  };

  // ── Video fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || activeTab !== 'videos') return;
    fetchVideos(videoPage);
  }, [token, videoPage, activeTab, activeWorkspaceId]);

  const fetchVideos = async (page = videoPage) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/videos`, {
        headers: authHeaders(),
        params: {
          page,
          limit: 20,
          ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
        },
      });
      setVideos((res.data?.data?.videos || []).map(mapVideo));
          setVideos((res.data?.data?.videos || []).map(mapVideo));
      setVideoTotal(res.data?.total || 0);
    } catch (_) {}
  };

  const handleDownloadWorkspaceReport = async () => {
    const isPdf = reportFormat === 'pdf';
    const defaultMimeType = isPdf
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    // Scope the report to whichever tab is actually open on this page, so it
    // reflects what's on screen instead of always blending files + videos
    // tenant-wide (that broader view is what the admin dashboard's report is for).
    const assetType = activeTab === 'videos' ? 'video' : 'document';

    try {
      setReportDownloading(true);
      const response = await axios.get(api.endpoints.assets.reportExport(), {
        headers: authHeaders(),
        params: {
          ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
          period: reportPeriod,
          format: reportFormat,
          assetType,
          ...(reportState !== 'all' ? { state: reportState } : {}),
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] || defaultMimeType });
      const url = window.URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement('a');
      anchor.href = url;
      const reportSuffix = `${reportPeriod}${reportState !== 'all' ? `-${reportState.toLowerCase()}` : ''}`;
      anchor.download = `${assetType}-report-${activeWorkspaceId || 'tenant'}-${reportSuffix}-${new Date().toISOString().slice(0, 10)}.${isPdf ? 'pdf' : 'xlsx'}`;
      globalThis.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to export report.';
      dispatch(addNotification({ id: Date.now(), type: 'error', message, read: false, timestamp: new Date().toISOString() }));
    } finally {
      setReportDownloading(false);
    }
  };
  // ── Document file selection ───────────────────────────────────────────────
  const docExtensions = Object.values(DOC_MIME_TYPES).flat();

  const isSupportedDocFile = (file) => {
    if (file?.type && DOC_MIME_TYPES[file.type]) return true;
    const ext = file?.name?.includes('.') ? `.${file.name.split('.').pop().toLowerCase()}` : '';
    return docExtensions.includes(ext);
  };

  const applyDocFileSelection = useCallback((files) => {
    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    const rejected = incoming.filter(f => !isSupportedDocFile(f));
    let valid = incoming.filter(f => isSupportedDocFile(f));
    const tooLarge = valid.filter(f => f.size > MAX_DOC_SIZE);
    valid = valid.filter(f => f.size <= MAX_DOC_SIZE);

    if (valid.length > MAX_DOC_FILES) {
      dispatch(addNotification({ id: Date.now(), type: 'error', message: `Max ${MAX_DOC_FILES} files allowed.`, read: false, timestamp: new Date().toISOString() }));
      valid = valid.slice(0, MAX_DOC_FILES);
    }
    if (rejected.length) dispatch(addNotification({ id: Date.now() + 1, type: 'error', message: `${rejected.length} file(s) skipped: unsupported format.`, read: false, timestamp: new Date().toISOString() }));
    if (tooLarge.length) dispatch(addNotification({ id: Date.now() + 2, type: 'error', message: `${tooLarge.length} file(s) skipped: exceeds 150 MB.`, read: false, timestamp: new Date().toISOString() }));

    setUploadFiles(valid);
    if (valid.length === 1 && !metadata.title) setMetadata(prev => ({ ...prev, title: valid[0].name }));
    if (valid.length > 1) setMetadata(prev => ({ ...prev, title: '' }));
  }, [dispatch, metadata.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: applyDocFileSelection,
    onDropRejected: (rej) => {
      const msg = rej?.[0]?.errors?.[0]?.message || 'File rejected.';
      dispatch(addNotification({ id: Date.now(), type: 'error', message: msg, read: false, timestamp: new Date().toISOString() }));
    },
    multiple: true,
    accept: DOC_MIME_TYPES,
    maxSize: MAX_DOC_SIZE,
    maxFiles: MAX_DOC_FILES,
  });

  // ── Video file selection ──────────────────────────────────────────────────
  const isValidVideoFile = (file) => {
    if (ALLOWED_VIDEO_MIME.has(file.type)) return true;
    const ext = file?.name?.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    return ALLOWED_VIDEO_EXT.has(ext);
  };

  const applyVideoFileSelection = useCallback((files) => {
    const incoming = Array.from(files || []);
    if (!incoming.length) return;

    const rejected = incoming.filter(f => !isValidVideoFile(f));
    const tooLarge = incoming.filter(f => isValidVideoFile(f) && f.size > MAX_VIDEO_SIZE);
    const valid = incoming.filter(f => isValidVideoFile(f) && f.size <= MAX_VIDEO_SIZE);

    if (rejected.length) dispatch(addNotification({ id: Date.now(), type: 'error', message: `${rejected.length} file(s) rejected: unsupported video format. Accepted: MP4, MOV, AVI, MKV, WebM, 3GP, MPEG.`, read: false, timestamp: new Date().toISOString() }));
    if (tooLarge.length) dispatch(addNotification({ id: Date.now() + 1, type: 'error', message: `${tooLarge.length} file(s) rejected: exceeds 1.5 GB limit.`, read: false, timestamp: new Date().toISOString() }));

    const newUploads = valid.map(mkVideoUploadState);
    setVideoUploads(prev => [...prev, ...newUploads]);

    if (valid.length === 1 && !videoMetadata.title) setVideoMetadata(prev => ({ ...prev, title: valid[0].name.replace(/\.[^.]+$/, '') }));
  }, [dispatch, videoMetadata.title]);

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: applyVideoFileSelection,
    multiple: true,
    accept: VIDEO_ACCEPT_MIME,
    maxSize: MAX_VIDEO_SIZE,
  });

  // ── Document upload ───────────────────────────────────────────────────────
  const handleDocUpload = async () => {
    if (!uploadFiles.length) return;
    dispatch(uploadDocumentStart());
    try {
      const totalBytes = uploadFiles.reduce((sum, file) => sum + (file.size || 0), 0);
      let uploadedBytesBaseline = 0;

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const relativePath = file.webkitRelativePath || file.name;
        const segs = relativePath.split('/').filter(Boolean);
        const derivedFolderPath = segs.length > 1 ? segs.slice(0, -1).join('/') : '';
        const resolvedTitle = uploadFiles.length > 1 ? file.name : (metadata.title || file.name);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', resolvedTitle);
        formData.append('description', metadata.description || '');
        formData.append('type', metadata.type || 'General');
        formData.append('category', metadata.type || 'General');
        formData.append('folderPath', derivedFolderPath);
        formData.append('relativePath', relativePath);
        if (selectedWorkspaceId) formData.append('workspaceId', selectedWorkspaceId);

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/documents`, formData, {
          headers: authHeaders(),
          onUploadProgress: (event) => {
            const fileProgress = event.total ? (event.loaded / event.total) : 0;
            const aggregateBytes = uploadedBytesBaseline + (file.size * fileProgress);
            const percent = totalBytes > 0 ? Math.min(99, Math.round((aggregateBytes / totalBytes) * 100)) : 0;
            dispatch(uploadDocumentProgress(percent));
          },
        });

        uploadedBytesBaseline += file.size;
        const afterFilePercent = totalBytes > 0
          ? Math.min(99, Math.round((uploadedBytesBaseline / totalBytes) * 100))
          : 0;
        dispatch(uploadDocumentProgress(afterFilePercent));

        dispatch(uploadDocumentSuccess(mapDocument(response.data?.data?.document || {})));
        dispatch(addNotification({ id: Date.now() + i, type: 'success', message: `${relativePath} uploaded successfully`, read: false, timestamp: new Date().toISOString() }));
      }

      dispatch(uploadDocumentProgress(100));
      setShowUploadModal(false);
      setUploadFiles([]);
      setMetadata({ title: '', description: '', type: 'General' });
      setSelectedWorkspaceId('');
      setCurrentPage(1);
      fetchDocuments(1);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed.';
      dispatch(uploadDocumentFailure(msg));
      dispatch(addNotification({ id: Date.now(), type: 'error', message: `Upload failed: ${msg}`, read: false, timestamp: new Date().toISOString() }));
    }
  };

  // ── Video multipart upload ────────────────────────────────────────────────
  const updateUploadState = (id, patch) => {
    setVideoUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  };

  /**
   * Upload a single video file with chunked S3 multipart, supporting resume.
   * uploadEntry: one item from videoUploads array
   * meta: { title, description, category }
   */
  const uploadOneVideo = async (uploadEntry, meta) => {
    const { id, file } = uploadEntry;
    const abort = new AbortController();
    updateUploadState(id, { abortController: abort, status: UPLOAD_STATUS.HASHING });

    // 1. Compute SHA-256
    let checksum;
    try {
      checksum = await computeSHA256(file);
    } catch {
      checksum = null;
    }

    // 2. Check if this is a resume (videoId already assigned)
    let videoId = uploadEntry.videoId;
    let s3UploadId = uploadEntry.uploadId;
    let storageKey = uploadEntry.storageKey;
    let totalParts = uploadEntry.totalParts || Math.ceil(file.size / CHUNK_SIZE);
    let completedParts = [...(uploadEntry.uploadedParts || [])];

    updateUploadState(id, { status: UPLOAD_STATUS.INITIATING });

    try {
      if (!videoId) {
        // Initiate new upload
        const initRes = await axios.post(
          `${import.meta.env.VITE_API_URL}/videos/initiate`,
          {
            fileName: file.name,
            mimeType: file.type || 'video/mp4',
            fileSize: file.size,
            title: meta.title || file.name.replace(/\.[^.]+$/, ''),
            description: meta.description || '',
            category: meta.category || 'General',
            ...(meta.workspaceId ? { workspaceId: meta.workspaceId } : {}),
          },
          { headers: authHeaders(), signal: abort.signal },
        );
        const d = initRes.data.data;
        videoId = d.videoId;
        s3UploadId = d.uploadId;
        storageKey = d.storageKey;
        totalParts = d.totalParts;
        completedParts = [];
        updateUploadState(id, { videoId, uploadId: s3UploadId, storageKey, totalParts, uploadedParts: [] });
      } else {
        // Resume: fetch already-uploaded parts
        const partsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/videos/${videoId}/parts`,
          { headers: authHeaders(), signal: abort.signal },
        );
        completedParts = partsRes.data.data.parts || completedParts;
        updateUploadState(id, { uploadedParts: completedParts });
      }

      updateUploadState(id, { status: UPLOAD_STATUS.UPLOADING });

      const completedPartNumbers = new Set(completedParts.map(p => p.PartNumber));

      // 3. Upload each missing part
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        if (abort.signal.aborted) throw new Error('aborted');
        if (completedPartNumbers.has(partNumber)) {
          // Already uploaded — update progress
          updateUploadState(id, { progress: Math.round((partNumber / totalParts) * 95) });
          continue;
        }

        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Get signed URL for this part
        const urlRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/videos/${videoId}/part-url`,
          { headers: authHeaders(), params: { partNumber }, signal: abort.signal },
        );
        const presignedUrl = urlRes.data.data.url;

        // PUT directly to S3
        const putRes = await axios.put(presignedUrl, chunk, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          signal: abort.signal,
          onUploadProgress: (evt) => {
            const partProgress = evt.loaded / evt.total;
            const overall = ((partNumber - 1 + partProgress) / totalParts) * 95;
            updateUploadState(id, { progress: Math.round(overall) });
          },
        });

        const etag = putRes.headers['etag'] || putRes.headers['ETag'];
        completedParts.push({ PartNumber: partNumber, ETag: etag });
        updateUploadState(id, { uploadedParts: [...completedParts] });
      }

      // 4. Complete
      updateUploadState(id, { status: UPLOAD_STATUS.COMPLETING, progress: 97 });

      await axios.post(
        `${import.meta.env.VITE_API_URL}/videos/${videoId}/complete`,
        { parts: completedParts, checksum },
        { headers: authHeaders(), signal: abort.signal },
      );

      updateUploadState(id, { status: UPLOAD_STATUS.DONE, progress: 100 });
      dispatch(addNotification({ id: Date.now(), type: 'success', message: `${file.name} uploaded successfully`, read: false, timestamp: new Date().toISOString() }));

    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'aborted') {
        updateUploadState(id, { status: UPLOAD_STATUS.ABORTED, progress: 0 });
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Upload failed';
        updateUploadState(id, { status: UPLOAD_STATUS.ERROR, error: msg });
        dispatch(addNotification({ id: Date.now(), type: 'error', message: `Video upload failed: ${msg}`, read: false, timestamp: new Date().toISOString() }));
      }
    } finally {
      videoUploadQueue.current = videoUploadQueue.current.filter(i => i !== id);
    }
  };

  const handleVideoUpload = async () => {
    const queued = videoUploads.filter(u => u.status === UPLOAD_STATUS.QUEUED);
    if (!queued.length) return;

    const currentActive = videoUploads.filter(u => [UPLOAD_STATUS.UPLOADING, UPLOAD_STATUS.INITIATING, UPLOAD_STATUS.HASHING].includes(u.status)).length;
    const slots = MAX_CONCURRENT_VIDEO_UPLOADS - currentActive;
    if (slots <= 0) {
      dispatch(addNotification({ id: Date.now(), type: 'error', message: `Max ${MAX_CONCURRENT_VIDEO_UPLOADS} concurrent uploads. Wait for one to finish.`, read: false, timestamp: new Date().toISOString() }));
      return;
    }

    const batch = queued.slice(0, slots);
    const meta = { ...videoMetadata, workspaceId: videoMetadata.workspaceId || activeWorkspaceId || '' };

    batch.forEach(entry => {
      videoUploadQueue.current.push(entry.id);
      uploadOneVideo(entry, meta).then(() => {
        fetchVideos(videoPage);
      });
    });
  };

  const handleResumeVideo = (entry) => {
    if (![UPLOAD_STATUS.ERROR, UPLOAD_STATUS.ABORTED].includes(entry.status)) return;
    updateUploadState(entry.id, { status: UPLOAD_STATUS.QUEUED, error: null, progress: 0 });
    const meta = { ...videoMetadata, workspaceId: videoMetadata.workspaceId || activeWorkspaceId || '' };
    videoUploadQueue.current.push(entry.id);
    uploadOneVideo({ ...entry, status: UPLOAD_STATUS.QUEUED, error: null }, meta).then(() => fetchVideos(videoPage));
  };

  const handleAbortVideo = async (entry) => {
    if (entry.abortController) entry.abortController.abort();
    if (entry.videoId) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/videos/${entry.videoId}/abort`, {}, { headers: authHeaders() });
      } catch (_) {}
    }
    updateUploadState(entry.id, { status: UPLOAD_STATUS.ABORTED, progress: 0 });
  };

  const removeVideoUploadEntry = (id) => {
    setVideoUploads(prev => prev.filter(u => u.id !== id));
  };

  // ── Document actions ──────────────────────────────────────────────────────
  const fetchDocumentBlob = async (doc, disposition = 'attachment') => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/documents/${doc.id}/download`,
      { headers: authHeaders(), params: { disposition, proxy: true }, responseType: 'blob' },
    );
    const ct = response.headers['content-type'] || doc.mimeType || 'application/octet-stream';
    return new Blob([response.data], { type: ct });
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await fetchDocumentBlob(doc, 'attachment');
      const url = window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url; a.download = doc?.title || 'document';
      globalThis.document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert(e.response?.data?.message || e.message || 'Download failed'); }
  };

  const updateLifecycleState = async (assetType, asset, nextState) => {
    const assetId = String(asset?.id || asset?._id || '');
    if (!assetId) return;

    try {
      const response = await axios.patch(
        api.endpoints.assets.updateState(assetType, assetId),
        { lifecycleState: nextState },
        { headers: authHeaders() },
      );

      const updatedAsset = response.data?.data?.asset || {};
      if (assetType === 'document') {
        const mappedDocument = mapDocument(updatedAsset);
        dispatch(updateDocument(mappedDocument));
        setSidebarDocument((prev) => (String(prev?.id || prev?._id) === assetId ? mappedDocument : prev));
      } else {
        const mappedVideo = mapVideo(updatedAsset);
        setVideos((prev) => prev.map((item) => (String(item.id || item._id) === assetId ? mappedVideo : item)));
        setSidebarVideo((prev) => (String(prev?.id || prev?._id) === assetId ? mappedVideo : prev));
      }

      dispatch(addNotification({
        id: Date.now(),
        type: 'success',
        message: `${assetType === 'document' ? 'Document' : 'Video'} moved to ${formatLifecycleState(nextState)}`,
        read: false,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to update lifecycle state.';
      dispatch(addNotification({
        id: Date.now(),
        type: 'error',
        message,
        read: false,
        timestamp: new Date().toISOString(),
      }));
    }
  };

  const resolveDocumentActionPayload = (documentOrId, fallbackDocument = null) => {
    if (documentOrId && typeof documentOrId === 'object') {
      const id = String(documentOrId?.id || documentOrId?._id || '');
      return {
        id,
        doc: id ? documentOrId : null,
      };
    }

    const id = String(documentOrId || '');
    if (!id) {
      return { id: '', doc: null };
    }

    const matched = fallbackDocument
      || documents.find((item) => String(item?.id || item?._id) === id)
      || null;

    return {
      id,
      doc: matched,
    };
  };

  const openDocumentConversation = (documentOrId, fallbackDocument = null) => {
    const { id, doc } = resolveDocumentActionPayload(documentOrId, fallbackDocument);
    if (!id) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', id);
    if (selectedWorkspaceId) {
      nextParams.set('workspaceId', selectedWorkspaceId);
    }
    setSearchParams(nextParams, { replace: false });
    setSidebarDocument(doc);
    setSidebarLoading(!doc);
  };

  const handleView = async (documentOrId, fallbackDocument = null) => {
    const { id, doc } = resolveDocumentActionPayload(documentOrId, fallbackDocument);
    if (!id) return;

    let targetDoc = doc;
    if (!targetDoc) {
      try {
        const response = await axios.get(api.endpoints.documents.byId(id), {
          headers: authHeaders(),
        });
        targetDoc = mapDocument(response.data?.data?.document || {});
      } catch (error) {
        alert(error?.response?.data?.message || 'Unable to open document');
        return;
      }
    }

    if (targetDoc && canPreviewInLightbox(targetDoc)) {
      setActivePreviewId(id);
      setLightboxOpen(true);
      return;
    }

    try {
      const blob = await fetchDocumentBlob(targetDoc, 'inline');
      const objectUrl = window.URL.createObjectURL(blob);
      const previewWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');

      if (!previewWindow) {
        const link = globalThis.document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 60000);
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || 'Unable to open document');
    }
  };

  const handleShare = (doc) => { setShareTargetDocument(doc); setShowShareModal(true); };

  const closeSidebar = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('view');
    nextParams.delete('videoView');
    setSearchParams(nextParams, { replace: true });
    setLightboxOpen(false);
    setActivePreviewId(null);
    setSidebarDocument(null);
    setSidebarVideo(null);
    setSidebarLoading(false);
  };

  const handleLightboxAuthError = () => {
    dispatch(logout());
    navigate('/login');
  };

  const refreshSidebarDocument = async () => {
    if (!sidebarDocument?.id && !sidebarDocument?._id) return;
    const id = sidebarDocument.id || sidebarDocument._id;
    try {
      const response = await axios.get(api.endpoints.documents.byId(id), {
        headers: authHeaders(),
      });
      setSidebarDocument(mapDocument(response.data?.data?.document || {}));
      fetchDocuments(currentPage);
    } catch (_) {
      // No-op in sidebar refresh
    }
  };

  const mediaPreviewItems = React.useMemo(() => {
    const merged = [...documents];
    if (sidebarDocument && !merged.some((doc) => String(doc.id || doc._id) === String(sidebarDocument.id || sidebarDocument._id))) {
      merged.push(sidebarDocument);
    }
    return merged.filter((doc) => canPreviewInLightbox(doc));
  }, [documents, sidebarDocument]);

  const handleDelete = async (doc) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/documents/${doc.id}`, { headers: authHeaders() });
      dispatch(deleteDocument(doc.id));
      const next = Math.max(0, totalDocuments - 1);
      const pages = Math.max(1, Math.ceil(next / pageSize));
      setTotalDocuments(next); setTotalPages(pages);
      if (currentPage > pages) setCurrentPage(pages);
      else fetchDocuments(currentPage);
      dispatch(addNotification({ id: Date.now(), type: 'success', message: 'Document deleted', read: false, timestamp: new Date().toISOString() }));
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  const handleDeleteFolder = async (folderPath) => {
    const normalizedFolderPath = String(folderPath || '').replace(/^\/+|\/+$/g, '');
    if (!normalizedFolderPath) return;

    const docsInFolder = documents.filter((doc) => {
      const docPath = String(doc.folderPath || '').replace(/^\/+|\/+$/g, '');
      return docPath === normalizedFolderPath || docPath.startsWith(`${normalizedFolderPath}/`);
    });

    if (!docsInFolder.length) {
      alert('No files found in this folder.');
      return;
    }

    const confirmed = window.confirm(`Delete folder "${normalizedFolderPath}" and ${docsInFolder.length} file(s)?`);
    if (!confirmed) return;

    try {
      const deleteResults = await Promise.allSettled(
        docsInFolder.map((doc) => {
          const id = doc.id || doc._id;
          return axios.delete(`${import.meta.env.VITE_API_URL}/documents/${id}`, { headers: authHeaders() });
        }),
      );

      const deletedCount = deleteResults.filter((result) => result.status === 'fulfilled').length;
      const failedCount = deleteResults.length - deletedCount;

      if (deletedCount > 0) {
        dispatch(addNotification({
          id: Date.now(),
          type: 'success',
          message: `Deleted ${deletedCount} file(s) from ${normalizedFolderPath}`,
          read: false,
          timestamp: new Date().toISOString(),
        }));
        fetchDocuments(currentPage);
      }

      if (failedCount > 0) {
        alert(`Deleted ${deletedCount} file(s), but ${failedCount} failed.`);
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Folder delete failed');
    }
  };

  // ── Video actions ─────────────────────────────────────────────────────────
  const handleVideoDownload = async (video) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/videos/${video._id}/download`, { headers: authHeaders() });
      window.open(res.data.data.url, '_blank', 'noopener,noreferrer');
    } catch (e) { alert(e.response?.data?.message || 'Download failed'); }
  };

  const openVideoConversation = (video) => {
    const id = String(video?._id || video?.id || '');
    if (!id) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('videoView', id);
    if (selectedWorkspaceId) {
      nextParams.set('workspaceId', selectedWorkspaceId);
    }
    setSearchParams(nextParams, { replace: false });
    setSidebarVideo(video);
  };

  const handleVideoDelete = async (video) => {
    if (!window.confirm(`Delete "${video.title}"?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/videos/${video._id}`, { headers: authHeaders() });
      dispatch(addNotification({ id: Date.now(), type: 'success', message: 'Video deleted', read: false, timestamp: new Date().toISOString() }));
      fetchVideos(videoPage);
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  // ── Upload status badge helpers ───────────────────────────────────────────
  const statusLabel = (s) => ({
    [UPLOAD_STATUS.QUEUED]:     'Queued',
    [UPLOAD_STATUS.HASHING]:    'Verifying…',
    [UPLOAD_STATUS.INITIATING]: 'Initiating…',
    [UPLOAD_STATUS.UPLOADING]:  'Uploading',
    [UPLOAD_STATUS.COMPLETING]: 'Completing…',
    [UPLOAD_STATUS.DONE]:       'Done',
    [UPLOAD_STATUS.ERROR]:      'Error',
    [UPLOAD_STATUS.ABORTED]:    'Aborted',
  }[s] || s);

  const statusColor = (s) => ({
    [UPLOAD_STATUS.DONE]:    '#22c55e',
    [UPLOAD_STATUS.ERROR]:   '#ef4444',
    [UPLOAD_STATUS.ABORTED]: '#f59e0b',
  }[s] || 'var(--primary)');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="documents-page">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1>My Documents</h1>
          <p className="subtitle">Manage and organise your files &amp; videos</p>
        </div>
        <div className="page-header-actions">
          {canUseAssetReports && (
            <div className="report-controls">
              <div className="report-filter-group">
                <Filter size={16} />
                <select
                  className="report-filter-select"
                  value={reportPeriod}
                  onChange={(event) => setReportPeriod(event.target.value)}
                >
                  <option value="day">Daily</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
                <select
                  className="report-filter-select"
                  value={reportState}
                  onChange={(event) => setReportState(event.target.value)}
                >
                  <option value="all">All states</option>
                  {LIFECYCLE_STATES.map((state) => (
                    <option key={state} value={state}>{formatLifecycleState(state)}</option>
                  ))}
                </select>
                <select
                  className="report-filter-select"
                  value={reportFormat}
                  onChange={(event) => setReportFormat(event.target.value)}
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>
              <button
                className="btn-secondary"
                onClick={handleDownloadWorkspaceReport}
                disabled={reportDownloading}
                type="button"
              >
                <BarChart3 size={18} />
                {reportDownloading
                  ? 'Exporting…'
                  : `Export ${activeTab === 'videos' ? 'Video' : 'Document'} Report (${reportFormat === 'pdf' ? 'PDF' : 'Excel'})`}
              </button>
            </div>
          )}
          <button
            className="btn-primary"
            onClick={() => activeTab === 'files' ? setShowUploadModal(true) : setShowVideoModal(true)}
            type="button"
          >
            <Upload size={20} />
            {activeTab === 'files' ? 'Upload Documents' : 'Upload Videos'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="docs-tab-bar">
        <button
          className={`docs-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FileText size={16} /> Files
        </button>
        <button
          className={`docs-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <Film size={16} /> Videos
        </button>
      </div>

      {/* ══════════════════════════════ FILES TAB ══════════════════════════ */}
      {activeTab === 'files' && (
        <>
          <SearchBar />
          <div className="documents-view-toggle" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            <button className={`btn-secondary ${contentView === 'folders' ? 'active' : ''}`} onClick={() => setContentView('folders')} type="button">
              Folder View
            </button>
            <button className={`btn-secondary ${contentView === 'flat' ? 'active' : ''}`} onClick={() => setContentView('flat')} type="button" style={{ marginLeft: '0.5rem' }}>
              Flat View
            </button>
          </div>

          {contentView === 'folders' ? (
            <FolderBrowser
              documents={documents}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
              onDeleteFolder={handleDeleteFolder}
              onView={handleView}
              onConversation={openDocumentConversation}
              rootLabel={currentWorkspace?.name || 'Workspace'}
            />
          ) : (
            <DocumentList
              documents={documents}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
              onView={handleView}
              onConversation={openDocumentConversation}
            />
          )}

          <div className="documents-pagination">
            <div className="pagination-left">
              <button type="button" className="btn-secondary" disabled={currentPage <= 1 || isLoading} onClick={() => setCurrentPage(1)}>First</button>
              <button type="button" className="btn-secondary" disabled={currentPage <= 1 || isLoading} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
            </div>
            <div className="pagination-center">
              <div className="pagination-pages" role="group" aria-label="File pages">
                {getVisiblePages(currentPage, totalPages).map((pageNumber) => (
                  <button
                    key={`file-page-${pageNumber}`}
                    type="button"
                    className={`btn-secondary pagination-page-btn ${pageNumber === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNumber)}
                    disabled={isLoading}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <span className="pagination-info">Page {currentPage} of {totalPages} • {totalDocuments} total files</span>
            </div>
            <div className="pagination-right">
              <div className="pagination-jump">
                <label htmlFor="file-page-jump">Go to</label>
                <input
                  id="file-page-jump"
                  type="number"
                  min="1"
                  max={totalPages}
                  value={filePageInput}
                  onChange={(event) => setFilePageInput(event.target.value)}
                  disabled={isLoading || totalPages <= 1}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={isLoading || totalPages <= 1}
                  onClick={() => {
                    const parsed = Number(filePageInput);
                    if (!Number.isFinite(parsed)) return;
                    const safePage = Math.min(totalPages, Math.max(1, Math.trunc(parsed)));
                    setCurrentPage(safePage);
                  }}
                >
                  Go
                </button>
              </div>
              <button type="button" className="btn-secondary" disabled={currentPage >= totalPages || isLoading} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
              <button type="button" className="btn-secondary" disabled={currentPage >= totalPages || isLoading} onClick={() => setCurrentPage(totalPages)}>Last</button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════ VIDEOS TAB ═════════════════════════ */}
      {activeTab === 'videos' && (
        <>
          {videos.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
              <Film size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p>No videos yet. Click <strong>Upload Videos</strong> to get started.</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map(v => (
                <div key={v._id} className="video-card">
                  <div className="video-card-icon"><Film size={32} /></div>
                  <div className="video-card-body">
                    <p className="video-card-title" title={v.title}>{v.title}</p>
                    <p className="video-card-meta">{v.fileSizeFormatted || formatFileSize(v.fileSize)} · {v.fileExtension?.toUpperCase()}</p>
                    <div className="video-card-state-row">
                      <span className={`document-state-badge tone-${getLifecycleTone(v.lifecycleState)}`}>
                        {formatLifecycleState(v.lifecycleState)}
                      </span>
                      {v.lifecycleLocked && <span className="document-state-lock">Locked</span>}
                    </div>
                    {v.checksum && <p className="video-card-hash" title={`SHA-256: ${v.checksum}`}>SHA-256: {v.checksum.slice(0, 12)}…</p>}
                  </div>
                  <div className="video-card-actions">
                    <button className="btn-secondary btn-sm" onClick={() => openVideoConversation(v)}>
                      <MessageCircle size={14} /> Conversation
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => handleVideoDownload(v)}>Download</button>
                    <button className="btn-danger btn-sm" onClick={() => handleVideoDelete(v)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="documents-pagination">
            <div className="pagination-left">
              <button type="button" className="btn-secondary" disabled={videoPage <= 1} onClick={() => setVideoPage(1)}>First</button>
              <button type="button" className="btn-secondary" disabled={videoPage <= 1} onClick={() => setVideoPage(p => Math.max(1, p - 1))}>Previous</button>
            </div>
            <div className="pagination-center">
              <div className="pagination-pages" role="group" aria-label="Video pages">
                {getVisiblePages(videoPage, videoTotalPages).map((pageNumber) => (
                  <button
                    key={`video-page-${pageNumber}`}
                    type="button"
                    className={`btn-secondary pagination-page-btn ${pageNumber === videoPage ? 'active' : ''}`}
                    onClick={() => setVideoPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <span className="pagination-info">Page {videoPage} of {videoTotalPages} • {videoTotal} total videos</span>
            </div>
            <div className="pagination-right">
              <div className="pagination-jump">
                <label htmlFor="video-page-jump">Go to</label>
                <input
                  id="video-page-jump"
                  type="number"
                  min="1"
                  max={videoTotalPages}
                  value={videoPageInput}
                  onChange={(event) => setVideoPageInput(event.target.value)}
                  disabled={videoTotalPages <= 1}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={videoTotalPages <= 1}
                  onClick={() => {
                    const parsed = Number(videoPageInput);
                    if (!Number.isFinite(parsed)) return;
                    const safePage = Math.min(videoTotalPages, Math.max(1, Math.trunc(parsed)));
                    setVideoPage(safePage);
                  }}
                >
                  Go
                </button>
              </div>
              <button type="button" className="btn-secondary" disabled={videoPage >= videoTotalPages} onClick={() => setVideoPage(p => Math.min(videoTotalPages, p + 1))}>Next</button>
              <button type="button" className="btn-secondary" disabled={videoPage >= videoTotalPages} onClick={() => setVideoPage(videoTotalPages)}>Last</button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════ DOC UPLOAD MODAL ═══════════════════ */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Documents</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <Upload size={48} />
                <p className="dropzone-text">{isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to select'}</p>
                <p className="dropzone-hint">PDF, Word, Excel, Images, ZIP — max 100 files, 150 MB each</p>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <button type="button" className="btn-secondary" onClick={() => folderInputRef.current?.click()}>Select Folder</button>
                <input ref={folderInputRef} type="file" style={{ display: 'none' }} onChange={e => { applyDocFileSelection(e.target.files); e.target.value = ''; }} multiple webkitdirectory="" directory="" />
              </div>

              {uploadFiles.length > 0 && (
                <div className="selected-files">
                  <h3>Selected ({uploadFiles.length})</h3>
                  <ul>
                    {uploadFiles.map((f, i) => {
                      const relativePath = f.webkitRelativePath || f.name;
                      return <li key={i}>{relativePath} — {(f.size / 1024 / 1024).toFixed(2)} MB</li>;
                    })}
                  </ul>
                </div>
              )}

              <div className="metadata-form">
                <div className="form-group">
                  <label>Workspace</label>
                  <select
                    value={selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  >
                    <option value="">No workspace</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace._id} value={workspace._id}>
                        {workspace.name} {workspace.status === 'archived' ? '(Archived)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={metadata.title} onChange={e => setMetadata({ ...metadata, title: e.target.value })} placeholder="Document title" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={metadata.description} onChange={e => setMetadata({ ...metadata, description: e.target.value })} placeholder="Optional description" rows="3" />
                </div>
                <div className="form-group">
                  <label>Document Type</label>
                  <select value={metadata.type} onChange={e => setMetadata({ ...metadata, type: e.target.value })}>
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
                  <p>Uploading… {uploadProgress}%</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleDocUpload} disabled={!uploadFiles.length || isUploading}>
                {isUploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ VIDEO UPLOAD MODAL ═════════════════ */}
      {showVideoModal && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="modal-content modal-content--wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Videos</h2>
              <button className="close-btn" onClick={() => setShowVideoModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">

              {/* Concurrent cap notice */}
              <p className="upload-notice">
                Max <strong>{MAX_CONCURRENT_VIDEO_UPLOADS} concurrent uploads</strong> per user · Max <strong>1.5 GB</strong> per file ·
                Accepted: MP4, MOV, AVI, MKV, WebM, 3GP, MPEG
              </p>

              {/* Dropzone */}
              <div {...getVideoRootProps()} className={`dropzone ${isVideoDragActive ? 'active' : ''}`}>
                <input {...getVideoInputProps()} />
                <Film size={48} />
                <p className="dropzone-text">{isVideoDragActive ? 'Drop videos here…' : 'Drag & drop video files, or click to select'}</p>
                <p className="dropzone-hint">Resumable chunked upload — safe to close and resume later</p>
              </div>

              {/* Metadata */}
              <div className="metadata-form" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Workspace</label>
                  <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)}>
                    <option value="">No workspace</option>
                    {workspaces.map((workspace) => (
                      <option key={workspace._id} value={workspace._id}>
                        {workspace.name} {workspace.status === 'archived' ? '(Archived)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={videoMetadata.title} onChange={e => setVideoMetadata(p => ({ ...p, title: e.target.value }))} placeholder="Video title (optional)" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={videoMetadata.description} onChange={e => setVideoMetadata(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" rows="2" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={videoMetadata.category} onChange={e => setVideoMetadata(p => ({ ...p, category: e.target.value }))}>
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Per-file upload list */}
              {videoUploads.length > 0 && (
                <div className="video-upload-list">
                  {videoUploads.map(u => (
                    <div key={u.id} className="video-upload-item">
                      <div className="vui-header">
                        <span className="vui-name" title={u.file.name}>{u.file.name}</span>
                        <span className="vui-size">{formatFileSize(u.file.size)}</span>
                        <span className="vui-status" style={{ color: statusColor(u.status) }}>{statusLabel(u.status)}</span>
                        <div className="vui-actions">
                          {[UPLOAD_STATUS.ERROR, UPLOAD_STATUS.ABORTED].includes(u.status) && (
                            <button type="button" className="btn-icon" title="Resume" onClick={() => handleResumeVideo(u)}><RotateCcw size={15} /></button>
                          )}
                          {[UPLOAD_STATUS.UPLOADING, UPLOAD_STATUS.INITIATING, UPLOAD_STATUS.HASHING].includes(u.status) && (
                            <button type="button" className="btn-icon btn-icon--danger" title="Abort" onClick={() => handleAbortVideo(u)}><X size={15} /></button>
                          )}
                          {[UPLOAD_STATUS.DONE, UPLOAD_STATUS.ERROR, UPLOAD_STATUS.ABORTED, UPLOAD_STATUS.QUEUED].includes(u.status) && (
                            <button type="button" className="btn-icon" title="Remove" onClick={() => removeVideoUploadEntry(u.id)}><X size={15} /></button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {u.status !== UPLOAD_STATUS.QUEUED && u.status !== UPLOAD_STATUS.DONE && (
                        <div className="progress-bar" style={{ marginTop: '0.4rem' }}>
                          <div className="progress-fill" style={{ width: `${u.progress}%`, background: statusColor(u.status) }} />
                        </div>
                      )}
                      {u.status === UPLOAD_STATUS.DONE && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', color: '#22c55e', fontSize: '0.8rem' }}>
                          <CheckCircle2 size={14} /> Complete
                        </div>
                      )}
                      {u.status === UPLOAD_STATUS.ERROR && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', color: '#ef4444', fontSize: '0.8rem' }}>
                          <AlertCircle size={14} /> {u.error}
                        </div>
                      )}
                      {u.status === UPLOAD_STATUS.UPLOADING && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                          {u.progress}% · Part {u.uploadedParts.length} of {u.totalParts}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowVideoModal(false)}>Close</button>
              <button
                className="btn-primary"
                onClick={handleVideoUpload}
                disabled={!videoUploads.some(u => u.status === UPLOAD_STATUS.QUEUED)}
              >
                Start Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ SHARE MODAL ════════════════════════ */}
      {showShareModal && shareTargetDocument && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ShareDocument document={shareTargetDocument} onClose={() => setShowShareModal(false)} onShared={() => fetchDocuments(currentPage)} />
          </div>
        </div>
      )}

      {sidebarDocument && (
        <div className="document-sidebar-overlay" onClick={closeSidebar}>
          <aside className="document-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="document-sidebar-header">
              <div>
                <p className="document-sidebar-eyebrow">File Conversation</p>
                <h2>{sidebarDocument.title}</h2>
                <p className="document-sidebar-meta">{sidebarDocument.relativePath || sidebarDocument.folderPath || 'Root'}</p>
              </div>
              <button className="close-btn" onClick={closeSidebar}>
                <X size={24} />
              </button>
            </div>

            {sidebarLoading ? (
              <div className="document-sidebar-loading">Loading document...</div>
            ) : (
              <div className="document-sidebar-body">
                <div className="document-sidebar-card">
                  <strong>{sidebarDocument.title}</strong>
                  <p>{sidebarDocument.description || 'No description provided.'}</p>
                  <small>{sidebarDocument.size} • {sidebarDocument.type}</small>
                </div>
                <div className="document-sidebar-card document-sidebar-card--compact">
                  <div className="sidebar-state-header">
                    <strong>Lifecycle State</strong>
                    <span className={`document-state-badge tone-${getLifecycleTone(sidebarDocument.lifecycleState)}`}>
                      {formatLifecycleState(sidebarDocument.lifecycleState)}
                    </span>
                  </div>
                  <div className="sidebar-state-controls">
                    <select
                      value={sidebarDocument.lifecycleState || 'STARTED'}
                      onChange={(event) => setSidebarDocument((prev) => ({ ...prev, lifecycleState: event.target.value }))}
                    >
                      {LIFECYCLE_STATES.map((state) => (
                        <option key={state} value={state}>{formatLifecycleState(state)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => updateLifecycleState('document', sidebarDocument, sidebarDocument.lifecycleState || 'STARTED')}
                    >
                      Save State
                    </button>
                  </div>
                  <p className="sidebar-state-note">Finished and archived assets lock future edits unless the actor is an admin or manager.</p>
                </div>
                <Comments
                  documentId={sidebarDocument.id || sidebarDocument._id}
                  onClose={closeSidebar}
                  canPreview={canPreviewInLightbox(sidebarDocument)}
                  onOpenPreview={() => {
                    setActivePreviewId(String(sidebarDocument.id || sidebarDocument._id));
                    setLightboxOpen(true);
                  }}
                />
                <VersionHistory
                  documentId={sidebarDocument.id || sidebarDocument._id}
                  token={token}
                  onRevert={refreshSidebarDocument}
                />
              </div>
            )}
          </aside>
        </div>
      )}

      {sidebarVideo && (
        <div className="document-sidebar-overlay" onClick={closeSidebar}>
          <aside className="document-sidebar" onClick={(event) => event.stopPropagation()}>
            <div className="document-sidebar-header">
              <div>
                <p className="document-sidebar-eyebrow">Video Conversation</p>
                <h2>{sidebarVideo.title || sidebarVideo.fileName || 'Video'}</h2>
                <p className="document-sidebar-meta">
                  {(sidebarVideo.fileExtension || 'VIDEO').toString().toUpperCase()} • {formatFileSize(sidebarVideo.fileSize || 0)}
                </p>
              </div>
              <button className="close-btn" onClick={closeSidebar}>
                <X size={24} />
              </button>
            </div>
            <div className="document-sidebar-body">
              <div className="document-sidebar-card">
                <strong>{sidebarVideo.title || sidebarVideo.fileName || 'Video'}</strong>
                <p>{sidebarVideo.description || 'No description provided.'}</p>
                <small>Use this panel to discuss updates and decisions for this video.</small>
              </div>
              <div className="document-sidebar-card document-sidebar-card--compact">
                <div className="sidebar-state-header">
                  <strong>Lifecycle State</strong>
                  <span className={`document-state-badge tone-${getLifecycleTone(sidebarVideo.lifecycleState)}`}>
                    {formatLifecycleState(sidebarVideo.lifecycleState)}
                  </span>
                </div>
                <div className="sidebar-state-controls">
                  <select
                    value={sidebarVideo.lifecycleState || 'STARTED'}
                    onChange={(event) => setSidebarVideo((prev) => ({ ...prev, lifecycleState: event.target.value }))}
                  >
                    {LIFECYCLE_STATES.map((state) => (
                      <option key={state} value={state}>{formatLifecycleState(state)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => updateLifecycleState('video', sidebarVideo, sidebarVideo.lifecycleState || 'STARTED')}
                  >
                    Save State
                  </button>
                </div>
                <p className="sidebar-state-note">Lifecycle changes are logged automatically for reporting and audit trails.</p>
              </div>
              <Comments
                resourceType="video"
                resourceId={sidebarVideo._id || sidebarVideo.id}
                onClose={closeSidebar}
              />
            </div>
          </aside>
        </div>
      )}

      <DocumentLightbox
        isOpen={lightboxOpen && !!activePreviewId}
        token={token}
        mediaItems={mediaPreviewItems}
        activeDocumentId={activePreviewId}
        onNavigate={(nextDocId) => setActivePreviewId(nextDocId)}
        onClose={() => setLightboxOpen(false)}
        onAuthError={handleLightboxAuthError}
      />
    </div>
  );
};

export default Documents;