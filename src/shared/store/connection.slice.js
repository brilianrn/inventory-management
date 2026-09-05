import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  offline: false,
  restoredAt: null,
  simulated: false,
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    goOffline: (state, action) => {
      state.offline = true;
      state.restoredAt = null;
      state.simulated = Boolean(action.payload?.simulated);
    },

    goOnline: (state) => {
      if (!state.offline) return;
      state.offline = false;
      state.restoredAt = Date.now();
      state.simulated = false;
    },

    clearRestored: (state) => {
      state.restoredAt = null;
    },
  },
});

export const { goOffline, goOnline, clearRestored } = connectionSlice.actions;

export default connectionSlice.reducer;
