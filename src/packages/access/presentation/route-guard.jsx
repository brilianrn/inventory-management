'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FALLBACK_ROUTE, PANEL_ROUTE, resolveRoutePermission } from '../domain/navigation';
import { usePermission } from './use-permission';

export default function RouteGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canVisit, canAny } = usePermission();

  const requiredPermission = resolveRoutePermission(pathname);
  const allowed = canVisit(requiredPermission);
  const canReachDashboard = canAny([
    'stocktake.view',
    'stockwaste.view',
    'scheduler.view',
    'wasteapp.view',
    'returnwaste.view',
  ]);

  useEffect(() => {
    if (allowed) return;
    router.replace(canReachDashboard ? FALLBACK_ROUTE : PANEL_ROUTE);
  }, [allowed, canReachDashboard, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-sm rounded-2xl border border-line bg-panel p-6 text-center">
          <p className="text-sm font-semibold text-strong">Halaman ini tidak tersedia untukmu</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Izin <span className="font-mono text-xs text-strong">{requiredPermission}</span> belum
            diberikan. Kamu sedang dialihkan.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
