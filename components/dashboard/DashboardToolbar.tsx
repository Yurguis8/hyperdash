'use client';

import { ChevronDown, Download, FileText } from 'lucide-react';
import { PERIOD_OPTIONS, type PeriodKey } from '@/lib/dashboard-types';
import { exportDashboardToExcel } from '@/lib/export';
import { useDashboard } from './DashboardProvider';

export function DashboardToolbar({ title, subtitle }: { title: string; subtitle: string }) {
  const { period, setPeriod, dashboard, loading } = useDashboard();

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

  const canExport = !!dashboard && dashboard.connected;

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            disabled={loading}
            className="appearance-none w-full sm:w-auto pl-3 pr-9 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-50"
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
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!canExport || loading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-neutral-400" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
}
