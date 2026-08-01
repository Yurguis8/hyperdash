import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
}

export function MetricCard({ title, value, change, isPositive }: MetricCardProps) {
  return (
    <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <div className="mt-2 flex items-baseline justify-between">
        <h3 className="text-2xl font-semibold tracking-tight">
          {value}
        </h3>
        {change && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}