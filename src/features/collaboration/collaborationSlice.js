import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  comments: {},
  isLoading: false,
  error: null,
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    fetchCommentsSuccess: (state, action) => {
      const { documentId, comments } = action.payload;
      state.comments[documentId] = comments;
    },
    addComment: (state, action) => {
      const { documentId, comment } = action.payload;
      if (!state.comments[documentId]) {
        state.comments[documentId] = [];
      }
      state.comments[documentId] = [comment, ...state.comments[documentId]];
    },
    editComment: (state, action) => {
      const { documentId, commentId, text } = action.payload;
      if (state.comments[documentId]) {
        const comment = state.comments[documentId].find(c => c.id === commentId);
        if (comment) {
          comment.text = text;
          comment.edited = true;
          comment.editedAt = new Date().toISOString();
        }
      }
    },
    deleteComment: (state, action) => {
      const { documentId, commentId } = action.payload;
      if (state.comments[documentId]) {
        state.comments[documentId] = state.comments[documentId].filter(c => c.id !== commentId);
      }
    },
  },
});

export const {
  fetchCommentsSuccess,
  addComment,
  editComment,
  deleteComment,
} = collaborationSlice.actions;

export default collaborationSlice.reducer;
