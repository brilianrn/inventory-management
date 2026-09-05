'use client';

import { RouteGuard } from '@/packages/access/presentation';
import { ConnectionBanner, ConnectionDialog } from './connection';
import Sidebar from './sidebar';
import TopBar from './top-bar';

export const DeskShell = ({ children, withSidebar = true }) => (
  <div className="flex min-h-screen bg-surface">
    {withSidebar ? <Sidebar /> : null}
    <div className="flex min-w-0 flex-1 flex-col">
      <TopBar />
      <main className="flex-1 px-5 py-6 lg:px-8">
        <RouteGuard>{children}</RouteGuard>
      </main>
    </div>
    <ConnectionDialog />
  </div>
);

export const MobileShell = ({ children, reloadOnRestore = false }) => (
  <div className="min-h-screen bg-surface">
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-line bg-panel-soft">
      <TopBar />
      <ConnectionBanner reloadOnRestore={reloadOnRestore} />
      <main className="flex-1 px-4 py-5">
        <RouteGuard>{children}</RouteGuard>
      </main>
    </div>
  </div>
);

export const PanelShell = ({ children }) => (
  <div className="min-h-screen bg-surface">
    <TopBar />
    <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:px-8">{children}</main>
  </div>
);
