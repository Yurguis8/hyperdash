'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Download, 
  RefreshCw, 
  AlertCircle,
  LogOut,
  Settings2
} from 'lucide-react';
import { exportToExcel } from '@/lib/export';

interface Metrics {
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  reach: string;
  roas: string;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isConnected = searchParams.get('meta') === 'connected';

  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    spend: 'R$ 0,00',
    impressions: '0',
    clicks: '0',
    ctr: '0,00%',
    cpc: 'R$ 0,00',
    cpm: 'R$ 0,00',
    reach: '0',
    roas: '0.0x',
  });

  useEffect(() => {
    if (isConnected) {
      setLoading(true);
      fetch('/api/meta/metrics')
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data.metrics) setMetrics(data.metrics);
        })
        .catch((err) => console.error('Erro ao carregar métricas:', err))
        .finally(() => setLoading(false));
    }
  }, [isConnected]);

  const handleDisconnect = async () => {
    setLoading(true);
    router.push('/dashboard');
    setLoading(false);
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const handleExport = () => {
    const metricsData = [
      { Metrica: 'Gasto Total', Valor: metrics.spend },
      { Metrica: 'Impressões', Valor: metrics.impressions },
      { Metrica: 'Cliques', Valor: metrics.clicks },
      { Metrica: 'CTR', Valor: metrics.ctr },
      { Metrica: 'CPC Médio', Valor: metrics.cpc },
      { Metrica: 'CPM Médio', Valor: metrics.cpm },
      { Metrica: 'Alcance', Valor: metrics.reach },
      { Metrica: 'ROAS', Valor: metrics.roas },
    ];
    exportToExcel(metricsData, 'metadash-relatorio.xlsx');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Top Navbar Minimalista */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm tracking-tight text-neutral-900">
              HyperPanel
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Meta Ads Conectado
                </div>
                <div className="h-4 w-px bg-neutral-200"></div>
                <button
                  onClick={handleDisconnect}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <a
                href="/api/auth/meta/login"
                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-all active:scale-[0.98]"
              >
                Conectar Conta
              </a>
            )}
            
            <div className="h-4 w-px bg-neutral-200 hidden sm:block"></div>
            
            <button
              onClick={handleLogout}
              className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Visão Geral
            </h1>
            <p className="text-sm text-neutral-500">
              Métricas consolidadas da sua conta de anúncios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={!isConnected}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              Exportar
            </button>
          </div>
        </div>

        {/* Alerta Discreto */}
        {!isConnected && (
          <div className="p-4 rounded-lg bg-white border border-neutral-200 flex items-start gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <AlertCircle className="w-5 h-5 text-neutral-400 mt-0.5 shrink-0" />
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Integração pendente</p>
              <p className="mt-1">
                Para visualizar seus dados, você precisa autorizar a conexão com a Meta no topo da página.
              </p>
            </div>
          </div>
        )}

        {/* Grid de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Investimento" value={metrics.spend} />
          <StatCard title="Impressões" value={metrics.impressions} />
          <StatCard title="Cliques" value={metrics.clicks} />
          <StatCard title="CTR" value={metrics.ctr} />
          <StatCard title="CPC" value={metrics.cpc} />
          <StatCard title="CPM" value={metrics.cpm} />
          <StatCard title="Alcance" value={metrics.reach} />
          <StatCard title="ROAS" value={metrics.roas} />
        </div>

        {/* Tabela Clean */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-base font-medium text-neutral-900 tracking-tight">
              Performance Consolidada
            </h2>
            <Settings2 className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-neutral-100 text-neutral-500">
                  <th className="px-6 py-3 font-medium">Métrica</th>
                  <th className="px-6 py-3 font-medium text-right">Valor Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                <tr className="hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">Gasto Total</td>
                  <td className="px-6 py-4 text-right font-mono text-neutral-600">{metrics.spend}</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">Volume de Impressões</td>
                  <td className="px-6 py-4 text-right font-mono text-neutral-600">{metrics.impressions}</td>
                </tr>
                <tr className="hover:bg-[#FAFAFA]/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-900">Conversões e Cliques</td>
                  <td className="px-6 py-4 text-right font-mono text-neutral-600">{metrics.clicks}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 flex flex-col justify-between space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-colors">
      <span className="text-sm font-medium text-neutral-500 tracking-tight">{title}</span>
      <div className="text-2xl font-semibold tracking-tight text-neutral-900 font-mono">
        {value}
      </div>
    </div>
  );
}