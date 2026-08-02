'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DashboardPayload, PeriodKey } from '@/lib/dashboard-types';

interface DashboardContextValue {
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  dashboard: DashboardPayload | null;
  loading: boolean;
  isConnected: boolean;
  useDemo: boolean;
  setUseDemo: (u: boolean) => void;
  reload: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  
  const [period, setPeriod] = useState<PeriodKey>('last_7d');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  
  const [useDemo, setUseDemoState] = useState<boolean>(true);

  // Inicializa o useDemo do localStorage apenas no client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hyperpanel_use_demo');
      if (saved !== null) {
        setUseDemoState(saved === 'true');
      }
    }
  }, []);

  const setUseDemo = useCallback((val: boolean) => {
    setUseDemoState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hyperpanel_use_demo', String(val));
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meta/metrics?period=${period}&demo=${useDemo ? '1' : '0'}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardPayload = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, [period, useDemo]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const isConnected = useMemo(() => {
    return searchParams.get('meta') === 'connected' || !!dashboard?.connected;
  }, [searchParams, dashboard]);

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      dashboard,
      loading,
      isConnected,
      useDemo,
      setUseDemo,
      reload: loadMetrics,
    }),
    [period, dashboard, loading, isConnected, useDemo, setUseDemo, loadMetrics]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard deve ser usado dentro de DashboardProvider');
  return ctx;
}
