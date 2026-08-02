'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeSeriesPoint } from '@/lib/dashboard-types';

export function MetricsChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Evolução de Investimento</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gasto x Conversões nos últimos 7 dias</p>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-72 w-full flex items-center justify-center rounded-xl border border-dashed border-black/5 dark:border-white/10 px-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma métrica retornada para este período.</p>
        </div>
      ) : (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0071E3" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0071E3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(10px)',
              }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              name="Gasto (R$)"
              stroke="#0071E3"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#spendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
