'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getRoasHealth,
  PERIOD_OPTIONS,
  type DashboardMetrics,
  type DashboardPayload,
  type MetricTrend,
  type PeriodKey,
} from '@/lib/dashboard-types';

interface DashboardContextValue {
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  dashboard: DashboardPayload | null;
  loading: boolean;
  loadError: string | null;
  isConnected: boolean;
  reload: () => void;
  disconnectMeta: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const META_DISCONNECTED_KEY = 'hyperpanel_meta_disconnected';
const META_LOCAL_KEYS = [
  'hyperpanel_use_demo',
  'hyperpanel_meta_connected',
  'hyperpanel_meta_account',
  'hyperpanel_meta_dashboard',
];

const ZERO_DISPLAY: Record<keyof DashboardMetrics, string> = {
  spend: 'R$ 0,00',
  impressions: '0',
  clicks: '0',
  ctr: '0,00%',
  cpc: 'R$ 0,00',
  cpm: 'R$ 0,00',
  reach: '0',
  roas: '0,00x',
  leads: '0',
  conversions: '0',
  cpl: 'R$ 0,00',
  leadConversionRate: '0,00%',
};

function formatMetricValue(key: keyof DashboardMetrics, raw: number): string {
  if (key === 'spend' || key === 'cpc' || key === 'cpm' || key === 'cpl') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(raw);
  }
  if (key === 'ctr' || key === 'leadConversionRate') {
    return `${raw.toFixed(2).replace('.', ',')}%`;
  }
  if (key === 'roas') {
    return `${raw.toFixed(2).replace('.', ',')}x`;
  }
  return new Intl.NumberFormat('pt-BR').format(Math.round(raw));
}

function normalizeMetric(
  key: keyof DashboardMetrics,
  metric?: Partial<MetricTrend> | null
): MetricTrend {
  const raw = typeof metric?.raw === 'number' && Number.isFinite(metric.raw) ? metric.raw : 0;
  const changePercent =
    typeof metric?.changePercent === 'number' && Number.isFinite(metric.changePercent)
      ? metric.changePercent
      : null;

  return {
    raw,
    value:
      typeof metric?.value === 'string' && metric.value.trim().length > 0
        ? metric.value
        : raw === 0
          ? ZERO_DISPLAY[key]
          : formatMetricValue(key, raw),
    changePercent,
    isPositive: metric?.isPositive === true,
  };
}

function createEmptyDashboard(
  period: PeriodKey,
  connected: boolean,
  error?: string
): DashboardPayload {
  const metrics = Object.fromEntries(
    (Object.keys(ZERO_DISPLAY) as Array<keyof DashboardMetrics>).map((key) => [
      key,
      normalizeMetric(key),
    ])
  ) as unknown as DashboardMetrics;

  return {
    connected,
    isDemoData: false,
    period,
    periodLabel: PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? period,
    roasHealth: 'loss',
    roasNumeric: 0,
    metrics,
    timeSeries: [],
    monthlySeries: [],
    topAds: [],
    channels: [],
    campaigns: [],
    funnel: [],
    generatedAt: new Date().toISOString(),
    error,
  };
}

function normalizeRealPayload(data: DashboardPayload, period: PeriodKey): DashboardPayload {
  if (data.isDemoData) {
    return createEmptyDashboard(
      period,
      data.connected === true,
      'A API não retornou dados reais. Nenhum dado de demonstração foi exibido.'
    );
  }

  const empty = createEmptyDashboard(period, data.connected === true);
  const sourceMetrics = data.metrics ?? empty.metrics;
  const metrics = Object.fromEntries(
    (Object.keys(ZERO_DISPLAY) as Array<keyof DashboardMetrics>).map((key) => [
      key,
      normalizeMetric(key, sourceMetrics[key]),
    ])
  ) as unknown as DashboardMetrics;
  const roasNumeric =
    typeof data.roasNumeric === 'number' && Number.isFinite(data.roasNumeric)
      ? data.roasNumeric
      : metrics.roas.raw ?? 0;

  return {
    ...empty,
    connected: data.connected === true,
    period,
    periodLabel:
      typeof data.periodLabel === 'string' && data.periodLabel.trim().length > 0
        ? data.periodLabel
        : empty.periodLabel,
    roasHealth: getRoasHealth(roasNumeric),
    roasNumeric,
    metrics,
    timeSeries: Array.isArray(data.timeSeries) ? data.timeSeries : [],
    monthlySeries: Array.isArray(data.monthlySeries) ? data.monthlySeries : [],
    topAds: Array.isArray(data.topAds) ? data.topAds : [],
    channels: Array.isArray(data.channels) ? data.channels : [],
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : [],
    funnel: Array.isArray(data.funnel) ? data.funnel : [],
    generatedAt:
      typeof data.generatedAt === 'string' && data.generatedAt.length > 0
        ? data.generatedAt
        : empty.generatedAt,
    accountName:
      typeof data.accountName === 'string' && data.accountName.trim().length > 0
        ? data.accountName
        : undefined,
    error: typeof data.error === 'string' ? data.error : undefined,
    isDemoData: false,
    demoReason: undefined,
  };
}

function clearMetaClientState() {
  for (const key of META_LOCAL_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdRef = useRef(0);

  const [period, setPeriod] = useState<PeriodKey>('last_7d');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const [disconnectedLocally, setDisconnectedLocally] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      clearMetaClientState();

      if (searchParams.get('meta') === 'connected') {
        localStorage.removeItem(META_DISCONNECTED_KEY);
        setDisconnectedLocally(false);

        const url = new URL(window.location.href);
        url.searchParams.delete('meta');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      } else {
        setDisconnectedLocally(localStorage.getItem(META_DISCONNECTED_KEY) === 'true');
      }

      setClientReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const loadMetrics = useCallback(async () => {
    if (!clientReady || disconnectedLocally) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/meta/metrics?period=${period}&demo=0`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as DashboardPayload;
      if (requestId !== requestIdRef.current) return;

      const normalized = normalizeRealPayload(data, period);
      setDashboard(normalized);
      setLoadError(normalized.error ?? null);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error('Erro ao carregar métricas reais:', error);
      const message = 'Não foi possível carregar os dados reais da API da Meta.';
      setDashboard(createEmptyDashboard(period, false, message));
      setLoadError(message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [clientReady, disconnectedLocally, period]);

  useEffect(() => {
    if (disconnectedLocally) return;
    const timer = window.setTimeout(() => void loadMetrics(), 0);
    return () => window.clearTimeout(timer);
  }, [disconnectedLocally, loadMetrics]);

  const disconnectMeta = useCallback(() => {
    requestIdRef.current += 1;
    clearMetaClientState();
    localStorage.setItem(META_DISCONNECTED_KEY, 'true');
    setDisconnectedLocally(true);
    setDashboard(null);
    setLoadError(null);
    setLoading(false);
    router.replace('/dashboard');
  }, [router]);

  const isConnected = !disconnectedLocally && dashboard?.connected === true;

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      dashboard,
      loading,
      loadError,
      isConnected,
      reload: loadMetrics,
      disconnectMeta,
    }),
    [period, dashboard, loading, loadError, isConnected, loadMetrics, disconnectMeta]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard deve ser usado dentro de DashboardProvider');
  return ctx;
}
