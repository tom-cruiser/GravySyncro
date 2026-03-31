import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sharedDocuments: [],
  sharedWithMe: [],
  pendingShares: [],
  isLoading: false,
  error: null,
};

const sharingSlice = createSlice({
  name: 'sharing',
  initialState,
  reducers: {
    shareDocumentStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    shareDocumentSuccess: (state, action) => {
      state.isLoading = false;
      state.sharedDocuments = [action.payload, ...state.sharedDocuments];
    },
    shareDocumentFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchSharedDocuments: (state, action) => {
      state.sharedDocuments = action.payload.sharedDocuments;
      state.sharedWithMe = action.payload.sharedWithMe;
    },
    updatePermissions: (state, action) => {
      const { documentId, userId, permissions } = action.payload;
      const doc = state.sharedDocuments.find(d => d.id === documentId);
      if (doc) {
        const userPermission = doc.permissions.find(p => p.userId === userId);
        if (userPermission) {
          userPermission.permissions = permissions;
        }
      }
    },
    revokeAccess: (state, action) => {
      const { documentId, userId } = action.payload;
      const doc = state.sharedDocuments.find(d => d.id === documentId);
      if (doc) {
        doc.permissions = doc.permissions.filter(p => p.userId !== userId);
      }
    },
  },
});

export const {
  shareDocumentStart,
  shareDocumentSuccess,
  shareDocumentFailure,
  fetchSharedDocuments,
  updatePermissions,
  revokeAccess,
} = sharingSlice.actions;

export default sharingSlice.reducer;
