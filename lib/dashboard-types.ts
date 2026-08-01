export type PeriodKey = 'today' | 'yesterday' | 'last_7d' | 'last_30d';

export type RoasHealth = 'profitable' | 'attention' | 'loss';

export interface MetricTrend {
  value: string;
  changePercent: number | null;
  isPositive: boolean;
}

export interface DashboardMetrics {
  spend: MetricTrend;
  impressions: MetricTrend;
  clicks: MetricTrend;
  ctr: MetricTrend;
  cpc: MetricTrend;
  cpm: MetricTrend;
  reach: MetricTrend;
  roas: MetricTrend;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  spend: number;
  revenue: number;
}

export interface TopAdRow {
  name: string;
  spend: string;
  spendRaw: number;
  cpc: string;
  cpcRaw: number;
  roas: string;
  roasRaw: number;
}

export interface DashboardPayload {
  connected: boolean;
  period: PeriodKey;
  periodLabel: string;
  roasHealth: RoasHealth;
  roasNumeric: number;
  metrics: DashboardMetrics;
  timeSeries: TimeSeriesPoint[];
  topAds: TopAdRow[];
  generatedAt: string;
  accountName?: string;
  error?: string;
}

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
];

export function getRoasHealth(roas: number): RoasHealth {
  if (roas >= 2) return 'profitable';
  if (roas < 1) return 'loss';
  return 'attention';
}
