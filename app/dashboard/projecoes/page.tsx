'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/components/dashboard/DashboardProvider';
import { computeProjection, type PeriodKey } from '@/lib/dashboard-types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Printer, Calendar, Zap, DollarSign, Users, Award } from 'lucide-react';

const PERIODS = [
  { value: 7, label: '1 Semana (7 dias)' },
  { value: 30, label: '1 Mês (30 dias)' },
  { value: 90, label: '3 Meses (90 dias)' },
  { value: 180, label: '6 Meses (180 dias)' },
  { value: 365, label: '1 Ano (365 dias)' },
];

function getHistoricalDays(period: PeriodKey) {
  if (period === 'today' || period === 'yesterday') return 1;
  if (period === 'last_7d') return 7;
  return 30;
}

export default function ProjecoesPage() {
  const { dashboard, loading, period: histPeriod } = useDashboard();
  const [projDays, setProjDays] = useState<number>(30);
  const [investimentoDesejado, setInvestimentoDesejado] = useState<number>(10000);

  useEffect(() => {
    if (dashboard?.metrics?.spend?.raw) {
      const baseSpend = dashboard.metrics.spend.raw;
      const histDays = getHistoricalDays(histPeriod);
      const scaledSpend = (baseSpend / histDays) * projDays;
      // Sincroniza o campo editável quando o histórico real ou o horizonte muda.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvestimentoDesejado(Math.round(scaledSpend));
    }
  }, [dashboard, projDays, histPeriod]);

  if (loading && !dashboard) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 font-sans">
        Carregando projeções…
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 font-sans">
        Nenhum dado disponível para calcular projeções.
      </div>
    );
  }

  const baseSpend = dashboard.metrics.spend.raw ?? 0;
  if (baseSpend <= 0) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 font-sans max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-medium text-neutral-950">Sem dados históricos de investimento</h2>
        <p className="text-neutral-500">
          A API da Meta não retornou investimento no período selecionado. As projeções permanecem vazias até que existam dados reais.
        </p>
      </div>
    );
  }

  // Cálculo da Projeção Direta baseada no histórico atual
  const projecao = computeProjection(investimentoDesejado, dashboard);

  // Gerar pontos da curva de tendência (Investimento x Retorno)
  const chartData = [];
  const steps = 7;
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const currentDay = Math.round(projDays * fraction);
    chartData.push({
      label: projDays <= 7 ? `Dia ${currentDay}` : projDays <= 30 ? `D${currentDay}` : `Mês ${(currentDay / 30).toFixed(1)}`,
      investimento: Math.round(investimentoDesejado * fraction),
      retorno: Math.round(projecao.receitaEstimada * fraction),
    });
  }

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const fmtNumber = (v: number) =>
    new Intl.NumberFormat('pt-BR').format(v);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Projeção Meta Ads
          </h1>
          <p className="text-sm text-neutral-500">
            Estimativa direta baseada no desempenho histórico do período: <strong className="text-neutral-700">{dashboard.periodLabel}</strong>.
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

      {/* Seção de Parâmetros da Projeção */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" /> Período Desejado
          </label>
          <select
            value={projDays}
            onChange={(e) => setProjDays(Number(e.target.value))}
            className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 bg-neutral-50 focus:outline-none focus:border-neutral-900 font-medium transition-colors"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
              Investimento Planejado
            </label>
            <div className="relative flex items-center max-w-[180px] w-full border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 focus-within:border-neutral-900 transition-colors">
              <span className="pl-3 text-xs font-semibold text-neutral-400">R$</span>
              <input
                type="number"
                value={investimentoDesejado || ''}
                onChange={(e) => setInvestimentoDesejado(Number(e.target.value))}
                className="w-full pl-1 pr-3 py-1.5 text-sm font-semibold bg-transparent focus:outline-none border-none text-right tabular-nums"
                min={100}
                max={10000000}
              />
            </div>
          </div>
          <div className="pt-2">
            <input
              type="range"
              min={Math.round((baseSpend / getHistoricalDays(histPeriod)) * projDays * 0.2)}
              max={Math.round((baseSpend / getHistoricalDays(histPeriod)) * projDays * 4)}
              step={100}
              value={investimentoDesejado}
              onChange={(e) => setInvestimentoDesejado(Number(e.target.value))}
              className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Painel Único de Resultados Projetados */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-neutral-900 text-white">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Resultado Estimado
          </span>
          <span className="text-xs text-neutral-500 font-medium">
            ROAS Histórico: <strong className="text-neutral-900">{projecao.roasEsperado.toFixed(2).replace('.', ',')}x</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Receita Estimada
            </span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {fmtCurrency(projecao.receitaEstimada)}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Leads Estimados
            </span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {fmtNumber(projecao.leadsEstimados)}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-600" /> Conversões Estimadas
            </span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {fmtNumber(projecao.conversoesEstimadas)}
            </p>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" /> CPL Estimado
            </span>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {fmtCurrency(projecao.cplEstimado)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico Direto: Investimento vs Retorno Projetado */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-500" />
            Evolução da Projeção Acumulada
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Crescimento proporcional do valor investido versus receita projetada
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#475569" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
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
                    style: 'currency',
                    currency: 'BRL',
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
                formatter={(value, name) => [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                  name === 'investimento' ? 'Investimento Acumulado' : 'Retorno Projetado',
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: 16 }}
                formatter={(value) => (value === 'investimento' ? 'Investimento Planejado' : 'Retorno Projetado')}
              />
              <Area
                type="monotone"
                dataKey="investimento"
                stroke="#475569"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInvest)"
              />
              <Area
                type="monotone"
                dataKey="retorno"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReturn)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
