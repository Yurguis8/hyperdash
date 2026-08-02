'use client';

import React from 'react';
import { AlertCircle, ChevronDown, Download, FileText, RefreshCw } from 'lucide-react';
import { exportDashboardToExcel } from '@/lib/export';
import type { PeriodKey } from '@/lib/dashboard-types';
import { PERIOD_OPTIONS } from '@/lib/dashboard-types';
import { RoasDiagnosticCard } from '@/components/dashboard/RoasDiagnosticCard';
import { SpendRevenueChart } from '@/components/dashboard/SpendRevenueChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { TopAdsTable } from '@/components/dashboard/TopAdsTable';
import { useDashboard } from '@/components/dashboard/DashboardProvider';

function getRoasBadgeColor(roas: number) {
  if (roas >= 3.0) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (roas >= 1.0) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-red-50 text-red-700 border-red-200';
}

function getRoasStatusLabel(roas: number) {
  if (roas >= 3.0) return 'Bom';
  if (roas >= 1.0) return 'Atenção';
  return 'Crítico';
}

function DashboardContent() {
  const { period, setPeriod, dashboard, loading, loadError, isConnected, reload } = useDashboard();

  const handleExportExcel = async () => {
    if (!dashboard) return;
    const date = new Date().toISOString().slice(0, 10);
    let chartBase64: string | undefined = undefined;

    try {
      const container = document.getElementById('spend-revenue-chart-container');
      if (container) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(container, {
          backgroundColor: '#FFFFFF',
          scale: 2,
          logging: false,
        });
        chartBase64 = canvas.toDataURL('image/png').split(',')[1];
      }
    } catch (err) {
      console.error('Erro ao capturar gráfico para Excel:', err);
    }

    exportDashboardToExcel(dashboard, `hyperpanel-${dashboard.period}-${date}.xlsx`, chartBase64);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const metrics = dashboard?.metrics;
  const canExport = !!dashboard && isConnected;

  // Calcula Receita Atribuída baseada no spend e roas
  const spendRaw = metrics?.spend?.raw ?? 0;
  const roasRaw = metrics?.roas?.raw ?? 0;
  const revenueRaw = spendRaw * roasRaw;
  const revenueFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(revenueRaw);

  const revenueMetric = {
    value: revenueFormatted,
    raw: revenueRaw,
    changePercent: metrics?.spend?.changePercent ?? null,
    isPositive: metrics?.roas?.isPositive ?? true,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white print:bg-white pb-12">
      <main id="dashboard-report" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-8 print:space-y-10">
        
        {/* Cabeçalho da Impressão */}
        <div className="print-only hidden print:block mb-6 pb-4 border-b border-neutral-200">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">HyperPanel</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Relatório de Performance de Marketing</h1>
          {dashboard && (
            <p className="text-sm text-neutral-600 mt-2">
              {dashboard.periodLabel} · Gerado em{' '}
              {new Date(dashboard.generatedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {/* Título e Ações */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 dashboard-no-print">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Visão Geral</h1>
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
            <button
              type="button"
              onClick={reload}
              disabled={loading || !isConnected}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Exibir dados reais
            </button>

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

        {loadError && (
          <div className="dashboard-no-print p-4 rounded-lg bg-white border border-neutral-200 flex items-start gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <AlertCircle className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" />
            <div className="text-sm text-neutral-600">
              <p className="font-semibold text-neutral-900">Dados reais indisponíveis</p>
              <p className="mt-1">{loadError}</p>
            </div>
          </div>
        )}

        {loading && !dashboard ? (
          <div className="py-20 text-center text-sm text-neutral-500">Carregando painel…</div>
        ) : !isConnected ? (
          <div className="dashboard-no-print bg-white border border-neutral-200 rounded-xl px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-semibold text-neutral-900">Conecte sua conta da Meta</h2>
            <p className="mt-2 text-sm text-neutral-500 max-w-lg mx-auto">
              Vincule uma conta para carregar exclusivamente as métricas reais retornadas pela API da Meta.
            </p>
            <a
              href="/api/auth/meta/login"
              className="mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Conectar Meta
            </a>
          </div>
        ) : dashboard && metrics ? (
          <>
            {/* Bloco de Diagnóstico */}
            <RoasDiagnosticCard health={dashboard.roasHealth} roasDisplay={metrics.roas.value} />

            {/* Linha 1 de KPIs (Foco principal de conversão e receita) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Principais Métricas</h3>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <StatCard title="Investimento" metric={metrics.spend} />
                <StatCard title="Receita Atribuída" metric={revenueMetric} />
                <StatCard title="ROAS" metric={metrics.roas} />
                <StatCard title="Leads" metric={metrics.leads} />
              </div>
            </div>

            {/* Linha 2 de KPIs (Métricas secundárias e eficiência) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Eficiência & Custos</h3>
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <StatCard title="Conversões" metric={metrics.conversions} />
                <StatCard title="CTR" metric={metrics.ctr} />
                <StatCard title="CPC" metric={metrics.cpc} />
                <StatCard title="CPL" metric={metrics.cpl} />
                <StatCard title="Conversão em Leads" metric={metrics.leadConversionRate} />
              </div>
            </div>

            {/* Gráfico principal */}
            <SpendRevenueChart data={dashboard.timeSeries} periodLabel={dashboard.periodLabel} />

            {/* Tabelas de Detalhamento por Canal */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <div className="bg-white border border-neutral-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Resumo por Canal</h2>
                    <p className="text-sm text-neutral-500 mt-1">Desempenho distribuído por canais de tráfego</p>
                  </div>
                  {/* Legenda de Desempenho */}
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="font-medium text-neutral-400 uppercase tracking-wider text-[10px]">Legenda:</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">Bom</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700">Atenção</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 border border-red-100 text-red-700">Crítico</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-500 font-medium bg-neutral-50/50">
                        <th className="px-6 py-3 font-semibold">Canal</th>
                        <th className="px-6 py-3 font-semibold text-right">Investimento</th>
                        <th className="px-6 py-3 font-semibold text-right">Receita</th>
                        <th className="px-6 py-3 font-semibold text-center">ROAS</th>
                        <th className="px-6 py-3 font-semibold text-right">Leads</th>
                        <th className="px-6 py-3 font-semibold text-right">Conversões</th>
                        <th className="px-6 py-3 font-semibold text-right">CPC</th>
                        <th className="px-6 py-3 font-semibold text-right">CPL</th>
                        <th className="px-6 py-3 font-semibold text-right">CTR</th>
                        <th className="px-6 py-3 font-semibold text-right">Conv. Lead</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.channels.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-10 text-center text-neutral-500">
                            Nenhum canal registrado no período.
                          </td>
                        </tr>
                      ) : (
                        dashboard.channels.map((ch, index) => (
                          <tr
                            key={`${ch.name}-${index}`}
                            className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/40 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-neutral-900">{ch.name}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.spend}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.revenue}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoasBadgeColor(ch.roasRaw)}`}>
                                {ch.roas} ({getRoasStatusLabel(ch.roasRaw)})
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.leads}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.conversions}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.cpc}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.cpl}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.ctr}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{ch.leadConversionRate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Campanhas e Top Anúncios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Resultados por Campanha */}
              <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100">
                  <h2 className="text-base font-semibold text-neutral-900 tracking-tight">Resultados por Campanha</h2>
                  <p className="text-sm text-neutral-500 mt-1">Comparação detalhada de campanhas ativas</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 text-neutral-500 font-medium bg-neutral-50/50">
                        <th className="px-6 py-3 font-semibold">Campanha</th>
                        <th className="px-6 py-3 font-semibold text-right">Investimento</th>
                        <th className="px-6 py-3 font-semibold text-right">Receita</th>
                        <th className="px-6 py-3 font-semibold text-center">ROAS</th>
                        <th className="px-6 py-3 font-semibold text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.campaigns.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-neutral-500">
                            Nenhuma campanha no período.
                          </td>
                        </tr>
                      ) : (
                        dashboard.campaigns.map((c, index) => (
                          <tr
                            key={`${c.name}-${index}`}
                            className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/40 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-neutral-900 max-w-[200px] truncate">{c.name}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{c.spend}</td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{c.revenue}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoasBadgeColor(c.roasRaw)}`}>
                                {c.roas}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-neutral-700">{c.leads}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 3 Anúncios */}
              <div className="flex flex-col">
                <TopAdsTable ads={dashboard.topAds} />
              </div>

            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-sans text-sm text-neutral-500">
          Carregando painel…
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
