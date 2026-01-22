import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  documents: [],
  recentDocuments: [],
  selectedDocument: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  filters: {
    type: 'all',
    sortBy: 'date',
    searchQuery: '',
  },
  versions: [],
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    fetchDocumentsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchDocumentsSuccess: (state, action) => {
      state.isLoading = false;
      state.documents = action.payload;
      state.recentDocuments = action.payload.slice(0, 5);
    },
    fetchDocumentsFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    uploadDocumentStart: (state) => {
      state.isUploading = true;
      state.uploadProgress = 0;
      state.error = null;
    },
    uploadDocumentProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    uploadDocumentSuccess: (state, action) => {
      state.isUploading = false;
      state.uploadProgress = 100;
      state.documents = [action.payload, ...state.documents];
      state.recentDocuments = [action.payload, ...state.recentDocuments.slice(0, 4)];
    },
    uploadDocumentFailure: (state, action) => {
      state.isUploading = false;
      state.uploadProgress = 0;
      state.error = action.payload;
    },
    selectDocument: (state, action) => {
      state.selectedDocument = action.payload;
    },
    deleteDocument: (state, action) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      state.recentDocuments = state.recentDocuments.filter(doc => doc.id !== action.payload);
    },
    updateDocument: (state, action) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...action.payload };
      }
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setDocumentVersions: (state, action) => {
      state.versions = action.payload;
    },
    revertToVersion: (state, action) => {
      const { documentId, version } = action.payload;
      const docIndex = state.documents.findIndex(doc => doc.id === documentId);
      if (docIndex !== -1) {
        state.documents[docIndex] = { ...state.documents[docIndex], ...version };
      }
    },
  },
});

export const {
  fetchDocumentsStart,
  fetchDocumentsSuccess,
  fetchDocumentsFailure,
  uploadDocumentStart,
  uploadDocumentProgress,
  uploadDocumentSuccess,
  uploadDocumentFailure,
  selectDocument,
  deleteDocument,
  updateDocument,
  setFilter,
  clearFilters,
  setDocumentVersions,
  revertToVersion,
} = documentsSlice.actions;

export default documentsSlice.reducer;
