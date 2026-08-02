'use client';

import React, { Suspense } from 'react';
import { DashboardProvider } from '@/components/dashboard/DashboardProvider';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center text-sm text-neutral-500">
          Carregando…
        </div>
      }
    >
      <DashboardProvider>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProvider>
    </Suspense>
  );
}
