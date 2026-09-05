'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from './index';

const Booting = () => (
  <div className="flex min-h-screen items-center justify-center bg-surface">
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      Menyiapkan amb…
    </div>
  </div>
);

export default function StoreProvider({ children }) {
  const [{ store, persistor }] = useState(makeStore);

  return (
    <Provider store={store}>
      <PersistGate loading={<Booting />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
