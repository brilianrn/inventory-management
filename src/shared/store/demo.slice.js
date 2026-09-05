import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_PERSONA_ID, getPersona } from '@/packages/access/domain/persona';

const buildStateFromPersona = (personaId) => {
  const persona = getPersona(personaId);
  return {
    personaId: persona.id,
    permissions: [...persona.permissions],
    attributes: JSON.parse(JSON.stringify(persona.attributes ?? {})),
    profile: { ...persona.profile },
  };
};

const initialState = {
  ...buildStateFromPersona(DEFAULT_PERSONA_ID),
  afterCutoff: false,
  wasteWindow: 'auto',
  panelOpen: false,
};

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    setPersona: (state, action) => {
      Object.assign(state, buildStateFromPersona(action.payload));
    },

    togglePermission: (state, action) => {
      const code = action.payload;
      const index = state.permissions.indexOf(code);

      if (index === -1) {
        state.permissions.push(code);
      } else {
        state.permissions.splice(index, 1);
      }

      if (index !== -1 && state.attributes[code]) delete state.attributes[code];
      state.personaId = 'custom';
    },

    setPermissionGroup: (state, action) => {
      const { codes, granted } = action.payload;
      const set = new Set(state.permissions);

      codes.forEach((code) => {
        if (granted) set.add(code);
        else {
          set.delete(code);
          delete state.attributes[code];
        }
      });

      state.permissions = [...set];
      state.personaId = 'custom';
    },

    setRestricted: (state, action) => {
      const { code, restricted } = action.payload;
      state.attributes[code] = { ...(state.attributes[code] ?? {}), restricted };
      state.personaId = 'custom';
    },

    setAfterCutoff: (state, action) => {
      state.afterCutoff = Boolean(action.payload);
    },

    setWasteWindow: (state, action) => {
      state.wasteWindow = action.payload;
    },

    setPanelOpen: (state, action) => {
      state.panelOpen = Boolean(action.payload);
    },

    resetDemo: () => ({ ...initialState }),
  },
});

export const {
  setPersona,
  togglePermission,
  setPermissionGroup,
  setRestricted,
  setAfterCutoff,
  setWasteWindow,
  setPanelOpen,
  resetDemo,
} = demoSlice.actions;

export default demoSlice.reducer;
