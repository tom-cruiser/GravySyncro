import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Download, FileWarning, Loader2, X } from 'lucide-react';
import api from '../config/api';
import './DocumentLightbox.css';

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov']);

const getExtension = (name = '') => {
  const clean = String(name).split('?')[0].toLowerCase();
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop() : '';
};

const getPreviewType = (document) => {
  const mime = String(document?.mimeType || '').toLowerCase();
  const fileName = String(
    document?.originalName || document?.relativePath || document?.title || document?.name || '',
  );
  const ext = getExtension(fileName);

  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mime === 'video/mp4' || mime === 'video/quicktime' || VIDEO_EXTENSIONS.has(ext)) return 'video';
  return null;
};

const emitPreviewTelemetry = (eventName, payload = {}) => {
  const detail = {
    eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  try {
    globalThis.dispatchEvent(new CustomEvent('preview:telemetry', { detail }));
  } catch (_) {
    // No-op if CustomEvent is unavailable.
  }

  try {
    if (typeof globalThis.gtag === 'function') {
      globalThis.gtag('event', eventName, detail);
    }
  } catch (_) {
    // No-op if analytics is not configured.
  }

  const telemetryUrl = import.meta.env.VITE_PREVIEW_TELEMETRY_URL;
  if (telemetryUrl && navigator?.sendBeacon) {
    try {
      const body = JSON.stringify(detail);
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(telemetryUrl, blob);
    } catch (_) {
      // Avoid surfacing telemetry failures to users.
    }
  }
};

const DocumentLightbox = ({
  isOpen,
  token,
  mediaItems = [],
  activeDocumentId,
  onClose,
  onAuthError,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewSource, setPreviewSource] = useState('');
  const closeBtnRef = useRef(null);

  const items = useMemo(
    () => (Array.isArray(mediaItems) ? mediaItems.filter((item) => !!getPreviewType(item)) : []),
    [mediaItems],
  );

  const activeIndex = useMemo(
    () => items.findIndex((item) => String(item.id || item._id) === String(activeDocumentId)),
    [items, activeDocumentId],
  );

  const activeDocument = useMemo(
    () => (activeIndex >= 0 ? items[activeIndex] : null),
    [items, activeIndex],
  );

  const previewType = useMemo(() => getPreviewType(activeDocument), [activeDocument]);

  const canNavigatePrev = activeIndex > 0;
  const canNavigateNext = activeIndex >= 0 && activeIndex < items.length - 1;

  const navigateToIndex = (index) => {
    const target = items[index];
    if (!target || !onNavigate) return;
    onNavigate(String(target.id || target._id));
  };

  const handlePrev = () => {
    if (!canNavigatePrev) return;
    navigateToIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (!canNavigateNext) return;
    navigateToIndex(activeIndex + 1);
  };

  useEffect(() => {
    if (!isOpen || !activeDocument) return undefined;

    const openedAt = Date.now();
    const docId = String(activeDocument.id || activeDocument._id || '');
    const extension = getExtension(activeDocument.originalName || activeDocument.relativePath || activeDocument.title);

    emitPreviewTelemetry('preview_open', {
      documentId: docId,
      mimeType: activeDocument.mimeType || null,
      extension,
      previewType,
    });

    return () => {
      emitPreviewTelemetry('preview_close', {
        documentId: docId,
        previewType,
        durationMs: Date.now() - openedAt,
      });
    };
  }, [isOpen, activeDocument, previewType]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
    };

    globalThis.document.body.classList.add('lightbox-open');
    globalThis.document.addEventListener('keydown', onKeyDown);
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      globalThis.document.body.classList.remove('lightbox-open');
      globalThis.document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, canNavigatePrev, canNavigateNext, activeIndex, items]);

  useEffect(() => {
    const docId = activeDocument?.id || activeDocument?._id;
    if (!isOpen || !docId || !token || !previewType) return undefined;

    let canceled = false;
    let objectUrl = '';

    const loadPreview = async () => {
      setLoading(true);
      setError('');
      setPreviewUrl('');
      setPreviewSource('');

      try {
        if (previewType === 'video') {
          // Use signed URLs for MOV/MP4 so large files stream progressively.
          const response = await axios.get(
            `${api.API_URL}/documents/${docId}/download`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { disposition: 'inline' },
            },
          );

          if (canceled) return;

          const signedUrl = response?.data?.data?.url;
          if (!signedUrl) throw new Error('Missing preview URL for media stream.');
          setPreviewSource('signed');
          setPreviewUrl(signedUrl);
          return;
        }

        const response = await axios.get(
          `${api.API_URL}/documents/${docId}/download`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { disposition: 'inline', proxy: true },
            responseType: 'blob',
          },
        );

        if (canceled) return;

        objectUrl = globalThis.URL.createObjectURL(response.data);
        setPreviewSource('blob');
        setPreviewUrl(objectUrl);
      } catch (requestError) {
        if (requestError?.response?.status === 401) {
          onAuthError?.();
          return;
        }

        const message = requestError?.response?.data?.message
          || requestError?.message
          || 'Failed to load preview.';
        setError(message);
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      canceled = true;
      if (objectUrl) globalThis.URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, activeDocument?.id, activeDocument?._id, token, previewType, onAuthError]);

  if (!isOpen) return null;

  const title = activeDocument?.title || activeDocument?.name || 'Preview';

  return (
    <div className="lightbox-overlay" role="presentation" onClick={onClose}>
      <div
        className="lightbox-shell"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lightbox-header">
          <div>
            <p className="lightbox-eyebrow">High-Fidelity Preview</p>
            <h3>{title}</h3>
            {items.length > 1 && (
              <p className="lightbox-counter">{activeIndex + 1} / {items.length}</p>
            )}
          </div>
          <div className="lightbox-actions">
            {previewUrl && previewSource === 'blob' && (
              <a
                href={previewUrl}
                download={title}
                className="lightbox-action-btn"
              >
                <Download size={16} />
                Download
              </a>
            )}
            <button ref={closeBtnRef} type="button" className="lightbox-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="lightbox-content">
          {items.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-left"
                onClick={handlePrev}
                disabled={!canNavigatePrev}
                aria-label="Previous media"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-right"
                onClick={handleNext}
                disabled={!canNavigateNext}
                aria-label="Next media"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {loading && (
            <div className="lightbox-state">
              <Loader2 className="spin" size={22} />
              <span>Rendering preview...</span>
            </div>
          )}

          {!loading && error && (
            <div className="lightbox-state lightbox-state-error">
              <FileWarning size={20} />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && !previewType && (
            <div className="lightbox-state lightbox-state-error">
              <FileWarning size={20} />
              <span>This file type is not supported in Lightbox preview.</span>
            </div>
          )}

          {!loading && !error && previewType === 'video' && previewUrl && (
            <video
              className="lightbox-video"
              controls
              controlsList="nodownload noplaybackrate"
              preload="metadata"
              playsInline
              src={previewUrl}
            />
          )}

          {!loading && !error && previewType === 'pdf' && previewUrl && (
            <iframe
              className="lightbox-pdf"
              title={title}
              src={previewUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const canPreviewInLightbox = (document) => !!getPreviewType(document);

export default DocumentLightbox;
