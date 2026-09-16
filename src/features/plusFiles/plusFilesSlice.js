import { createSlice } from '@reduxjs/toolkit';

// Lives in the app-level Redux store (not component state) on purpose: the
// upload queue and "My Documents" list need to survive the user navigating
// to another tab/page and back — a plain useState in PlusFiles.jsx gets
// wiped the moment that route unmounts. The actual File blobs are kept out
// of here (see uploadManager.js) since they aren't serializable and Redux
// warns/chokes on that; this slice only ever holds plain display data.
const initialState = {
  queue: [], // { id, name, relativePath, size, status: queued|uploading|done|failed, progress, error }
  myFiles: [],
  loadingList: false,
  searchTerm: '',
};

const plusFilesSlice = createSlice({
  name: 'plusFiles',
  initialState,
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setLoadingList: (state, action) => {
      state.loadingList = action.payload;
    },
    setMyFiles: (state, action) => {
      state.myFiles = action.payload;
    },
    prependMyFile: (state, action) => {
      state.myFiles.unshift(action.payload);
    },
    removeMyFile: (state, action) => {
      state.myFiles = state.myFiles.filter((file) => file.id !== action.payload);
    },
    removeMyFiles: (state, action) => {
      const removedIds = new Set(action.payload.map(String));
      state.myFiles = state.myFiles.filter((file) => !removedIds.has(String(file.id)));
    },
    enqueueItems: (state, action) => {
      state.queue.push(...action.payload);
    },
    updateQueueItem: (state, action) => {
      const { id, patch } = action.payload;
      const item = state.queue.find((entry) => entry.id === id);
      if (item) Object.assign(item, patch);
    },
    clearFinishedQueueItems: (state) => {
      state.queue = state.queue.filter((item) => item.status !== 'done');
    },
  },
});

export const {
  setSearchTerm,
  setLoadingList,
  setMyFiles,
  prependMyFile,
  removeMyFile,
  removeMyFiles,
  enqueueItems,
  updateQueueItem,
  clearFinishedQueueItems,
} = plusFilesSlice.actions;

export default plusFilesSlice.reducer;
