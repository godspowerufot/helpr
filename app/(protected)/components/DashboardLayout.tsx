'use client';

import { useState } from 'react';
import { Header } from './Header';
import { RequireAuth } from './RequireAuth';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh">
      <a
        href="#main"
        className="b2-m sr-only z-[60] rounded-standard bg-surface px-4 py-2 text-text focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto w-full max-w-[1040px]">
            <RequireAuth>{children}</RequireAuth>
          </div>
        </main>
      </div>
    </div>
  );
}
