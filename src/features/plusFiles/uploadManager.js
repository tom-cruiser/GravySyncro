import axios from 'axios';
import api from '../../config/api';
import store from '../../store';
import { enqueueItems, updateQueueItem, prependMyFile } from './plusFilesSlice';

// Deliberately NOT a React hook or component state: a useState/useRef-based
// queue dies the moment PlusFiles.jsx unmounts (e.g. the user clicks over
// to Documents), which used to silently drop in-flight uploads from view.
// This module lives for as long as the tab does, independent of which
// route is currently mounted, so uploads keep running and reporting
// progress into the plusFiles Redux slice (which itself persists across
// navigation) no matter where the user is in the app.
const CONCURRENCY = 3;
// Transport-level failures (no HTTP response at all — the browser dropped
// the request before the server got a chance to answer) get retried a few
// times with backoff before being marked failed. In practice these show up
// under very large batches (thousands of files queued at once) as sporadic
// ERR_BLOB_OUT_OF_MEMORY on the larger files specifically — Chromium's
// internal blob storage getting squeezed by the sheer number of File/Blob
// references alive at once, independent of file content or byte content
// (reproduced with genuinely distinct per-file buffers, so it isn't a
// quirk of shared memory). The pressure is transient: it clears as earlier
// uploads finish and release their blobs, so a short retry usually
// succeeds without the user needing to notice and click retry themselves.
const MAX_AUTO_RETRIES = 4;
const AUTO_RETRY_BASE_DELAY_MS = 1200;
let activeCount = 0;
// File blobs aren't serializable, so they can't live in Redux — kept here,
// keyed by the same id used in the slice's queue entries.
const fileBlobs = new Map();

// file-selector (react-dropzone's file-reading engine) sets `file.path` on
// every File it hands back — "./name.ext" for a plain file, or the
// folder-relative path when the file came from a dropped directory. A
// native `<input webkitdirectory>` selection instead sets the standard
// `file.webkitRelativePath`. Normalize both to a clean "folder/sub/name.ext"
// with no leading dot/slash, falling back to the bare filename.
export const getRelativePath = (file) => {
  const raw = file.path || file.webkitRelativePath || file.name;
  return String(raw).replace(/^\.?\/+/, '');
};

const authHeaders = () => ({ Authorization: `Bearer ${store.getState().auth.token}` });

const uploadOne = async (item, attempt = 1) => {
  const file = fileBlobs.get(item.id);
  const formData = new FormData();
  formData.append('files', file, file.name);
  formData.append('relativePath', item.relativePath);

  try {
    // No explicit Content-Type here: axios detects a FormData body and
    // sets multipart/form-data with the correct boundary itself — setting
    // it manually (as this used to) supplies no boundary and gets
    // overridden anyway, so it was dead weight.
    const res = await axios.post(api.endpoints.files.upload(), formData, {
      headers: authHeaders(),
      onUploadProgress: (evt) => {
        const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
        store.dispatch(updateQueueItem({ id: item.id, patch: { progress: pct } }));
      },
    });

    store.dispatch(updateQueueItem({ id: item.id, patch: { status: 'done', progress: 100 } }));
    const uploaded = res.data?.data?.files?.[0];
    if (uploaded) {
      store.dispatch(prependMyFile(uploaded));
    }
    fileBlobs.delete(item.id);
    activeCount -= 1;
    kickQueue();
  } catch (err) {
    // No response at all (browser dropped the request — see the blob
    // pressure note above) is one retryable case; a 429 (rate limited) or
    // 5xx (transient server/proxy error) is another — both are the server
    // or network being temporarily overwhelmed by a big batch rather than
    // anything wrong with this particular file, so they deserve the same
    // backoff-and-retry treatment instead of being surfaced as a permanent
    // failure on whichever files happened to land during the squeeze.
    const status = err.response?.status;
    const isRetryable = !err.response || status === 429 || (status >= 500 && status < 600);
    if (isRetryable && attempt < MAX_AUTO_RETRIES) {
      store.dispatch(updateQueueItem({ id: item.id, patch: { progress: 0, error: null } }));
      // Held slot, not released: staying at the same activeCount during
      // the backoff means the retry itself doesn't add to whatever
      // pressure caused the failure, and it gives already-queued uploads
      // a moment to finish and free their blobs first.
      const retryAfterMs = status === 429 ? Number(err.response.headers?.['retry-after']) * 1000 : NaN;
      const delay = Number.isFinite(retryAfterMs) && retryAfterMs > 0
        ? retryAfterMs
        : AUTO_RETRY_BASE_DELAY_MS * attempt;
      setTimeout(() => uploadOne(item, attempt + 1), delay);
      return;
    }

    const message = err?.response?.data?.message || err?.message || 'Upload failed.';
    store.dispatch(updateQueueItem({ id: item.id, patch: { status: 'failed', error: message } }));
    activeCount -= 1;
    kickQueue();
  }
};

// Pulls up to CONCURRENCY queued items and starts them, reading the
// authoritative queue straight from the store each time so it always sees
// items added after the last kick (e.g. a retry, or a second folder drop).
function kickQueue() {
  while (activeCount < CONCURRENCY) {
    const queue = store.getState().plusFiles.queue;
    const next = queue.find((item) => item.status === 'queued' && fileBlobs.has(item.id));
    if (!next) break;

    activeCount += 1;
    store.dispatch(updateQueueItem({ id: next.id, patch: { status: 'uploading', progress: 0, error: null } }));
    uploadOne(next);
  }
}

export const enqueueFiles = (files) => {
  if (!files?.length) return;

  const items = files.map((file) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    fileBlobs.set(id, file);
    return {
      id,
      name: file.name,
      relativePath: getRelativePath(file),
      size: file.size,
      status: 'queued',
      progress: 0,
      error: null,
    };
  });

  store.dispatch(enqueueItems(items));
  kickQueue();
};

// Retrying a file whose blob has since been garbage-collected (e.g. the
// browser tab was reloaded — the queue entry can survive that via a
// persisted store, this app's doesn't, but a future one might) can't be
// resubmitted since the actual bytes are gone; surface that instead of
// silently doing nothing.
export const retryItem = (id) => {
  if (!fileBlobs.has(id)) {
    store.dispatch(updateQueueItem({ id, patch: { status: 'failed', error: 'File no longer available — remove and re-select it.' } }));
    return;
  }
  store.dispatch(updateQueueItem({ id, patch: { status: 'queued', error: null, progress: 0 } }));
  kickQueue();
};
