'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, AlertCircle, LogOut, FileText, ChevronDown } from 'lucide-react';
import { exportDashboardToExcel } from '@/lib/export';
import type { DashboardPayload, PeriodKey } from '@/lib/dashboard-types';
import { PERIOD_OPTIONS } from '@/lib/dashboard-types';
import { RoasDiagnosticCard } from '@/components/dashboard/RoasDiagnosticCard';
import { SpendRevenueChart } from '@/components/dashboard/SpendRevenueChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { TopAdsTable } from '@/components/dashboard/TopAdsTable';
import { createClient } from '@/lib/supabase/client';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isConnected = searchParams.get('meta') === 'connected';

  const [period, setPeriod] = useState<PeriodKey>('last_7d');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const demo = !isConnected ? '&demo=1' : '';
      const res = await fetch(`/api/meta/metrics?period=${period}${demo}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardPayload = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, period]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleDisconnect = () => {
    router.push('/dashboard');
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleExportExcel = () => {
    if (!dashboard) return;
    const date = new Date().toISOString().slice(0, 10);
    exportDashboardToExcel(dashboard, `metadash-${dashboard.period}-${date}.xlsx`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const metrics = dashboard?.metrics;
  const canExport = !!dashboard && (isConnected || dashboard.timeSeries.length > 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white print:bg-white">
      <nav className="dashboard-no-print border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-medium text-sm tracking-tight text-neutral-900">HyperPanel</span>

          <div className="flex items-center gap-3 sm:gap-4">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Meta Ads conectado
                </div>
                <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <a
                href="/api/auth/meta/login"
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
              >
                Conectar conta
              </a>
            )}
            <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
            <button
              type="button"
              onClick={handleLogout}
              className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main id="dashboard-report" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        <div className="print-only hidden print:block mb-6 pb-4 border-b border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">MetaDash</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Relatório de performance</h1>
          {dashboard && (
            <p className="text-sm text-neutral-600 mt-2">
              {dashboard.periodLabel} · Gerado em{' '}
              {new Date(dashboard.generatedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Visão geral</h1>
            <p className="text-sm text-neutral-500">Métricas consolidadas da sua conta de anúncios.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodKey)}
                disabled={loading}
                className="appearance-none w-full sm:w-auto pl-3 pr-9 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-colors disabled:opacity-50"
                aria-label="Período"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!canExport || loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 text-neutral-400" />
                Excel
              </button>
              <button
                type="button"
                onClick={handlePrintPdf}
                disabled={!canExport || loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 text-neutral-400" />
                Gerar PDF
              </button>
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="dashboard-no-print p-4 rounded-lg bg-white border border-neutral-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Integração pendente</p>
              <p className="mt-1">
                Conecte a Meta para dados reais. Enquanto isso, exibimos uma prévia ilustrativa do painel.
              </p>
            </div>
          </div>
        )}

        {loading && !dashboard ? (
          <div className="py-20 text-center text-sm text-neutral-500">Carregando métricas…</div>
        ) : dashboard && metrics ? (
          <>
            <RoasDiagnosticCard health={dashboard.roasHealth} roasDisplay={metrics.roas.value} />

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <StatCard title="Investimento" metric={metrics.spend} />
              <StatCard title="Impressões" metric={metrics.impressions} />
              <StatCard title="Cliques" metric={metrics.clicks} />
              <StatCard title="CTR" metric={metrics.ctr} />
              <StatCard title="CPC" metric={metrics.cpc} />
              <StatCard title="CPM" metric={metrics.cpm} />
              <StatCard title="Alcance" metric={metrics.reach} />
              <StatCard title="ROAS" metric={metrics.roas} />
            </div>

            <SpendRevenueChart data={dashboard.timeSeries} periodLabel={dashboard.periodLabel} />

            <TopAdsTable ads={dashboard.topAds} />
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-sans text-sm text-neutral-500">
          Carregando painel…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
