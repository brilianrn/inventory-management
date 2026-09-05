import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    lastModuleId: 'stock-management',
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = Boolean(action.payload);
    },
    setLastModuleId: (state, action) => {
      state.lastModuleId = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setLastModuleId } = uiSlice.actions;

export default uiSlice.reducer;
