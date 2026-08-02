export type PeriodKey = 'today' | 'yesterday' | 'last_7d' | 'last_30d';

export type RoasHealth = 'profitable' | 'attention' | 'loss';

export interface MetricTrend {
  value: string;
  raw?: number;
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
  leads: MetricTrend;
  conversions: MetricTrend;
  cpl: MetricTrend;
  leadConversionRate: MetricTrend;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  spend: number;
  revenue: number;
  leads?: number;
  clicks?: number;
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

export interface ChannelRow {
  name: string;
  spend: string;
  spendRaw: number;
  revenue: string;
  revenueRaw: number;
  roas: string;
  roasRaw: number;
  leads: string;
  leadsRaw: number;
  conversions: string;
  conversionsRaw: number;
  cpc: string;
  cpl: string;
  ctr: string;
  leadConversionRate: string;
}

export interface CampaignRow {
  name: string;
  spend: string;
  spendRaw: number;
  revenue: string;
  revenueRaw: number;
  roas: string;
  roasRaw: number;
  leads: string;
  leadsRaw: number;
}

export interface FunnelStep {
  label: string;
  rate: number;
  display: string;
}

export interface DashboardPayload {
  connected: boolean;
  isDemoData?: boolean;
  demoReason?: 'empty' | 'preview' | 'api_error';
  period: PeriodKey;
  periodLabel: string;
  roasHealth: RoasHealth;
  roasNumeric: number;
  metrics: DashboardMetrics;
  timeSeries: TimeSeriesPoint[];
  monthlySeries: TimeSeriesPoint[];
  topAds: TopAdRow[];
  channels: ChannelRow[];
  campaigns: CampaignRow[];
  funnel: FunnelStep[];
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

export interface ProjectionResult {
  investimento: number;
  receitaEstimada: number;
  roasEsperado: number;
  leadsEstimados: number;
  conversoesEstimadas: number;
  cplEstimado: number;
}

export function computeProjection(
  investimento: number,
  payload: DashboardPayload
): ProjectionResult {
  const baseSpend = payload.metrics.spend.raw ?? 1;
  const roas = payload.roasNumeric || payload.metrics.roas.raw || 1;
  const leads = payload.metrics.leads.raw ?? 0;
  const conversions = payload.metrics.conversions.raw ?? 0;
  const factor = investimento / baseSpend;

  const leadsEstimados = Math.round(leads * factor);
  const conversoesEstimadas = Math.round(conversions * factor);
  const receitaEstimada = investimento * roas;

  return {
    investimento,
    receitaEstimada: receitaEstimada,
    roasEsperado: roas,
    leadsEstimados,
    conversoesEstimadas,
    cplEstimado: leadsEstimados > 0 ? investimento / leadsEstimados : 0,
  };
}
