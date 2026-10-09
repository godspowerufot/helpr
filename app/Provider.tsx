'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@msflib/react-auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { initMsflib } from '@/lib/application.config';

export const qc = new QueryClient();
initMsflib();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <AuthProvider options={{ isWorkspaceScoped: false }}>
          {children}
        </AuthProvider>
        <ToastContainer position="top-right" newestOnTop role="status" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
