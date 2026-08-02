'use client';

import React from 'react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { BarChart3, LineChart, Printer, TrendingUp, DollarSign } from 'lucide-react';

export default function GraficosPage() {
  const { dashboard, loading } = useDashboard();

  if (loading && !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 font-sans">
        Carregando gráficos…
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 font-sans">
        Nenhum dado carregado para exibição.
      </div>
    );
  }

  const timeSeries = dashboard.timeSeries.length > 0
    ? dashboard.timeSeries
    : [{ label: '—', spend: 0, revenue: 0, clicks: 0, leads: 0, date: '' }];

  // Calcular métricas diárias adicionais para evolução de custos (arredondado para 2 casas)
  const costTrendData = timeSeries.map((point) => {
    const clicksVal = point.clicks ?? 0;
    const leadsVal = point.leads ?? 0;
    return {
      ...point,
      cpc: clicksVal > 0 ? Math.round((point.spend / clicksVal) * 100) / 100 : 0,
      cpl: leadsVal > 0 ? Math.round((point.spend / leadsVal) * 100) / 100 : 0,
    };
  });

  const funnelData = (dashboard.funnel ?? []).map((f) => ({
    name: f.label,
    rate: f.rate,
    display: f.display,
  }));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Análise Visual
          </h1>
          <p className="text-sm text-neutral-500">
            Acompanhe a performance e eficiência das campanhas do Meta Ads graficamente.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="dashboard-no-print self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 text-neutral-500" />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Temporal (Investimento vs Receita) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <LineChart className="w-4 h-4 text-neutral-500" />
                Desempenho Diário
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Relação temporal entre o valor investido e o retorno obtido
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {dashboard.periodLabel}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F4F4F5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  formatter={(value) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                    '',
                  ]}
                  labelStyle={{ color: '#71717A', fontWeight: 500 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 16 }}
                  formatter={(value) => (value === 'spend' ? 'Investimento' : 'Receita')}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSpend)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Evolução de Conversão (Cliques vs Leads) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neutral-500" />
                Conversão de Leads
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Relação diária de cliques no anúncio vs. leads gerados
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F4F4F5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  formatter={(value) => [
                    new Intl.NumberFormat('pt-BR').format(Number(value)),
                    '',
                  ]}
                  labelStyle={{ color: '#71717A', fontWeight: 500 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 16 }}
                  formatter={(value) => (value === 'clicks' ? 'Cliques' : 'Leads')}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#0F172A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Evolução de Custos (CPC vs CPL) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-neutral-500" />
                Eficiência de Custos (CPC vs CPL)
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Evolução diária do Custo por Clique (CPC) e Custo por Lead (CPL)
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={costTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#F4F4F5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                  formatter={(value) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                    '',
                  ]}
                  labelStyle={{ color: '#71717A', fontWeight: 500 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 16 }}
                  formatter={(value) => (value === 'cpc' ? 'CPC' : 'CPL')}
                />
                <Line
                  type="monotone"
                  dataKey="cpc"
                  stroke="#64748B"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cpl"
                  stroke="#D97706"
                  strokeWidth={2}
                  dot={false}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 4: Eficiência do Funil */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-neutral-500" />
                Eficiência do Funil
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Taxa de avanço e conversão entre as etapas
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid stroke="#F4F4F5" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2).replace('.', ',')}%`, 'Taxa de Conversão']}
                />
                <Bar dataKey="rate" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
