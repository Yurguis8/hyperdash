import type { RoasHealth } from '@/lib/dashboard-types';

interface RoasDiagnosticCardProps {
  health: RoasHealth;
  roasDisplay: string;
}

const COPY: Record<
  RoasHealth,
  { label: string; description: string; dot: string; border: string; bg: string }
> = {
  profitable: {
    label: 'Lucrativo',
    description: 'ROAS acima de 2,0x — retorno saudável sobre o investimento.',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/40',
  },
  attention: {
    label: 'Atenção',
    description: 'ROAS entre 1,0x e 1,9x — otimize criativos ou segmentação.',
    dot: 'bg-amber-400',
    border: 'border-amber-200',
    bg: 'bg-amber-50/40',
  },
  loss: {
    label: 'Prejuízo',
    description: 'ROAS abaixo de 1,0x — a conta não está pagando o investimento.',
    dot: 'bg-red-500',
    border: 'border-red-200',
    bg: 'bg-red-50/40',
  },
};

export function RoasDiagnosticCard({ health, roasDisplay }: RoasDiagnosticCardProps) {
  const config = COPY[health];

  return (
    <div
      className={`rounded-lg border ${config.border} ${config.bg} px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${config.dot}`} aria-hidden />
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Diagnóstico ROAS</p>
          <p className="text-base font-semibold text-neutral-900 tracking-tight mt-0.5">{config.label}</p>
          <p className="text-sm text-neutral-600 mt-1 max-w-xl">{config.description}</p>
        </div>
      </div>
      <div className="sm:text-right pl-5 sm:pl-0 border-l sm:border-l-0 border-neutral-200/80 sm:border-none">
        <p className="text-xs text-neutral-500">ROAS do período</p>
        <p className="text-2xl font-semibold tabular-nums text-neutral-900 tracking-tight">{roasDisplay}</p>
      </div>
    </div>
  );
}
