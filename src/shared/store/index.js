import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import connectionReducer from './connection.slice';
import demoReducer from './demo.slice';
import filtersReducer from './filters.slice';
import uiReducer from './ui.slice';

const createNoopStorage = () => ({
  getItem: () => Promise.resolve(null),
  setItem: (_key, value) => Promise.resolve(value),
  removeItem: () => Promise.resolve(),
});

const storage = typeof window === 'undefined' ? createNoopStorage() : createWebStorage('local');

const rootReducer = combineReducers({
  connection: connectionReducer,
  demo: demoReducer,
  filters: filtersReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(
  {
    key: 'amb',
    version: 1,
    storage,
    whitelist: ['demo', 'filters', 'ui'],
  },
  rootReducer,
);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });

  const persistor = persistStore(store);
  return { store, persistor };
};
