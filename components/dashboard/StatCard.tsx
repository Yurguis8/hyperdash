import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { MetricTrend } from '@/lib/dashboard-types';

interface StatCardProps {
  title: string;
  metric: MetricTrend;
}

export function StatCard({ title, metric }: StatCardProps) {
  const { value, changePercent, isPositive } = metric;

  let trendNode = (
    <span className="inline-flex items-center gap-0.5 text-xs text-neutral-400">
      <Minus className="w-3 h-3" />
      <span>Sem base anterior</span>
    </span>
  );

  if (changePercent !== null) {
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const color = isPositive ? 'text-emerald-600' : 'text-red-600';
    trendNode = (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {Math.abs(changePercent).toFixed(1).replace('.', ',')}%
        <span className="text-neutral-400 font-normal ml-0.5">vs período anterior</span>
      </span>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-col gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-colors">
      <span className="text-sm font-medium text-neutral-500">{title}</span>
      <div className="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">{value}</div>
      {trendNode}
    </div>
  );
}
