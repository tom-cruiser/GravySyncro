import { createSlice } from '@reduxjs/toolkit';

const parseStoredWorkspace = () => {
  try {
    const storedWorkspace = localStorage.getItem('currentWorkspace');
    return storedWorkspace ? JSON.parse(storedWorkspace) : null;
  } catch {
    return null;
  }
};

const initialState = {
  currentWorkspace: parseStoredWorkspace(),
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload || null;
      if (action.payload) {
        localStorage.setItem('currentWorkspace', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('currentWorkspace');
      }
    },
    clearCurrentWorkspace: (state) => {
      state.currentWorkspace = null;
      localStorage.removeItem('currentWorkspace');
    },
  },
});

export const { setCurrentWorkspace, clearCurrentWorkspace } = workspaceSlice.actions;

export default workspaceSlice.reducer;
