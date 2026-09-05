'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearRestored, goOffline, goOnline } from '@/shared/store/connection.slice';
import Icon from './icon';
import { ConfirmDialog } from './overlays';

export const RESTORE_DELAY_MS = 3000;

export const useConnectionWatcher = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const onOffline = () => dispatch(goOffline({ simulated: false }));
    const onOnline = () => dispatch(goOnline());

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [dispatch]);
};

export const useConnection = () => useSelector((state) => state.connection);

export const ConnectionBanner = ({ reloadOnRestore = false }) => {
  const dispatch = useDispatch();
  const { offline, restoredAt, simulated } = useConnection();

  useEffect(() => {
    if (!restoredAt) return undefined;

    const timer = setTimeout(() => {
      dispatch(clearRestored());
      if (reloadOnRestore) window.location.reload();
    }, RESTORE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [restoredAt, reloadOnRestore, dispatch]);

  if (offline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-danger px-4 py-2 text-center text-sm font-medium text-white">
        <Icon name="alert" className="size-4 shrink-0" strokeWidth={2} />
        Tidak ada koneksi internet
        {simulated ? <span className="text-xs opacity-80">(simulasi)</span> : null}
      </div>
    );
  }

  if (restoredAt) {
    return (
      <div className="flex items-center justify-center gap-2 bg-brand-soft px-4 py-2 text-center text-sm font-medium text-brand">
        <Icon name="check" className="size-4 shrink-0" strokeWidth={2} />
        {reloadOnRestore
          ? 'Koneksi stabil, halaman akan direload dalam 3 detik'
          : 'Koneksi kembali stabil'}
      </div>
    );
  }

  return null;
};

export const ConnectionDialog = () => {
  const { offline } = useConnection();

  return (
    <ConfirmDialog
      isOpen={offline}
      tone="danger"
      title="Tidak Ada Koneksi Internet"
      description="Cek jaringan internetmu lalu coba lagi."
      confirmLabel="Coba lagi"
      isSingleAction
      onConfirm={() => window.location.reload()}
      onCancel={() => {}}
    />
  );
};
