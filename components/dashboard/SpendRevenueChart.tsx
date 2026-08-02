'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimeSeriesPoint } from '@/lib/dashboard-types';

interface SpendRevenueChartProps {
  data: TimeSeriesPoint[];
  periodLabel: string;
}

export function SpendRevenueChart({ data, periodLabel }: SpendRevenueChartProps) {
  return (
    <div id="spend-revenue-chart-container" className="bg-white border border-neutral-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="mb-8">
        <h2 className="text-base font-medium text-neutral-900 tracking-tight">
          Investimento vs. receita
        </h2>
        <p className="text-sm text-neutral-500 mt-1">{periodLabel}</p>
      </div>
      {data.length === 0 ? (
        <div className="h-72 w-full print:h-52 flex items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50/50 px-6 text-center">
          <p className="text-sm text-neutral-500">Nenhum dado de investimento ou receita retornado para este período.</p>
        </div>
      ) : (
      <div className="h-72 w-full print:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F4F4F5" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#71717A' }}
              axisLine={false}
              tickLine={false}
              dy={8}
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
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E4E4E7',
                fontSize: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : Number(value ?? 0);
                return [
                  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num),
                  name === 'spend' ? 'Investimento' : 'Receita',
                ];
              }}
              labelStyle={{ color: '#71717A', marginBottom: 4 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="line"
              wrapperStyle={{ fontSize: 12, color: '#52525B', paddingBottom: 16 }}
              formatter={(value) => (value === 'spend' ? 'Investimento' : 'Receita')}
            />
            <Line
              type="monotone"
              dataKey="spend"
              name="spend"
              stroke="#18181B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#18181B' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="revenue"
              stroke="#16A34A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#16A34A' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
