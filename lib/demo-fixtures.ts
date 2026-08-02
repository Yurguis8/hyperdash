/**
 * Dados de teste exibidos quando a API Meta retorna vazio, zero ou erro.
 *
 * Como desativar: defina DEMO_FALLBACK_ENABLED = false (ou env NEXT_PUBLIC_DEMO_FALLBACK=false).
 * Como alterar valores: edite DEMO_FIXTURE abaixo — todos os painéis leem daqui.
 */
import type {
  CampaignRow,
  ChannelRow,
  DashboardPayload,
  FunnelStep,
  PeriodKey,
  TimeSeriesPoint,
  TopAdRow,
} from './dashboard-types';
import { getRoasHealth, PERIOD_OPTIONS } from './dashboard-types';

export const DEMO_FALLBACK_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_FALLBACK !== 'false';

/** Valores base — ajuste livremente para seus testes */
export const DEMO_FIXTURE = {
  accountName: 'Meta Ads — Conta demonstração',
  baseRoas: 2.35,
  /** Investimento referência para últimos 7 dias */
  spendLast7d: 12_840,
  leads: 486,
  conversions: 142,
  leadToConversionRate: 29.2,
  channels: [
    { name: 'Meta Ads', spendShare: 1.0, roas: 2.35 },
  ] as const,
  campaigns: [
    { name: 'Prospecção — Lookalike 1%', roas: 3.2, spendShare: 0.28 },
    { name: 'Remarketing — Carrinho 7d', roas: 4.1, spendShare: 0.24 },
    { name: 'Conversão — CBO Lançamento', roas: 1.6, spendShare: 0.2 },
    { name: 'Leads — Formulário Instantâneo', roas: 1.9, spendShare: 0.18 },
    { name: 'Teste Criativo — Vídeo UGC', roas: 0.9, spendShare: 0.1 },
  ] as const,
  topAds: [
    { name: 'Vídeo — Remarketing Carrinho', roasBoost: 0.65, spendShare: 0.34, cpc: 1.12 },
    { name: 'Estático — Prova Social', roasBoost: 0.25, spendShare: 0.28, cpc: 0.89 },
    { name: 'Carrossel — Lançamento', roasBoost: -0.25, spendShare: 0.22, cpc: 1.45 },
  ] as const,
};

function periodScale(period: PeriodKey): number {
  if (period === 'today') return 1 / 7;
  if (period === 'yesterday') return 1 / 7;
  if (period === 'last_7d') return 1;
  return 30 / 7;
}

function fmtCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function fmtNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}
function fmtPercent(value: number) {
  return `${value.toFixed(2).replace('.', ',')}%`;
}
function fmtRoas(value: number) {
  return `${value.toFixed(2).replace('.', ',')}x`;
}

function trendValue(current: number, previous: number) {
  let changePercent: number | null = null;
  if (previous > 0) changePercent = ((current - previous) / previous) * 100;
  else if (current > 0) changePercent = 100;
  return {
    changePercent,
    isPositive: changePercent !== null ? changePercent >= 0 : true,
  };
}

export function buildDemoDashboardPayload(
  period: PeriodKey,
  connected: boolean,
  reason: 'empty' | 'preview' | 'api_error' = 'preview'
): DashboardPayload {
  const scale = periodScale(period);
  const spend = DEMO_FIXTURE.spendLast7d * scale;
  const roas = DEMO_FIXTURE.baseRoas;
  const revenue = spend * roas;
  const leads = Math.round(DEMO_FIXTURE.leads * scale);
  const conversions = Math.round(DEMO_FIXTURE.conversions * scale);
  const impressions = Math.round(spend * 380);
  const clicks = Math.round(spend * 0.85);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const reach = Math.round(impressions * 0.72);
  const cpl = leads > 0 ? spend / leads : 0;
  const leadConv = DEMO_FIXTURE.leadToConversionRate;

  const prev = {
    spend: spend * 0.91,
    revenue: revenue * 0.89,
    roas: roas * 0.94,
    leads: leads * 0.88,
    conversions: conversions * 0.9,
    impressions: impressions * 0.9,
    clicks: clicks * 0.92,
    ctr: ctr * 0.97,
    cpc: cpc * 1.04,
    cpm: cpm * 1.02,
    reach: reach * 0.9,
    cpl: cpl * 1.05,
  };

  const mk = (cur: number, prevVal: number, format: (n: number) => string, invert = false) => {
    const t = trendValue(cur, prevVal);
    return {
      value: format(cur),
      raw: cur,
      changePercent: t.changePercent,
      isPositive: invert ? !t.isPositive : t.isPositive,
    };
  };

  const days = period === 'today' || period === 'yesterday' ? 1 : period === 'last_7d' ? 7 : 30;
  const timeSeries: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const daySpend = spend / days + (i % 4) * (spend * 0.008);
    const dayClicks = Math.max(1, Math.round((clicks / days) * (0.9 + (i % 3) * 0.05)));
    timeSeries.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      spend: Math.round(daySpend * 100) / 100,
      revenue: Math.round(daySpend * roas * 100) / 100,
      leads: Math.max(1, Math.round((leads / days) * (0.85 + (i % 3) * 0.1))),
      clicks: dayClicks,
    });
  }

  const monthlySeries: TimeSeriesPoint[] = [];
  for (let m = 11; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const mSpend = DEMO_FIXTURE.spendLast7d * 4.2 * (0.82 + (m % 5) * 0.06);
    monthlySeries.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
      spend: Math.round(mSpend),
      revenue: Math.round(mSpend * (roas + (m % 3) * 0.08 - 0.08)),
      leads: Math.round(mSpend / cpl),
    });
  }

  const channels: ChannelRow[] = DEMO_FIXTURE.channels.map((ch) => {
    const chSpend = spend * ch.spendShare;
    const chRev = chSpend * ch.roas;
    const chLeads = Math.round(leads * ch.spendShare);
    const chConv = Math.round(conversions * ch.spendShare);
    const chClicks = Math.round(clicks * ch.spendShare);
    return {
      name: ch.name,
      spend: fmtCurrency(chSpend),
      spendRaw: chSpend,
      revenue: fmtCurrency(chRev),
      revenueRaw: chRev,
      roas: fmtRoas(ch.roas),
      roasRaw: ch.roas,
      leads: fmtNumber(chLeads),
      leadsRaw: chLeads,
      conversions: fmtNumber(chConv),
      conversionsRaw: chConv,
      cpc: fmtCurrency(chClicks > 0 ? chSpend / chClicks : 0),
      cpl: fmtCurrency(chLeads > 0 ? chSpend / chLeads : 0),
      ctr: fmtPercent(ctr),
      leadConversionRate: fmtPercent(leadConv),
    };
  });

  const campaigns: CampaignRow[] = DEMO_FIXTURE.campaigns.map((c) => {
    const cSpend = spend * c.spendShare;
    const cRev = cSpend * c.roas;
    const cLeads = Math.round(leads * c.spendShare);
    return {
      name: c.name,
      spendRaw: cSpend,
      revenueRaw: cRev,
      roasRaw: c.roas,
      leadsRaw: cLeads,
      spend: fmtCurrency(cSpend),
      revenue: fmtCurrency(cRev),
      roas: fmtRoas(c.roas),
      leads: fmtNumber(cLeads),
    };
  });

  const topAds: TopAdRow[] = DEMO_FIXTURE.topAds
    .map((ad) => {
      const adSpend = spend * ad.spendShare;
      const adRoas = roas + ad.roasBoost;
      return {
        name: ad.name,
        spend: fmtCurrency(adSpend),
        spendRaw: adSpend,
        cpc: fmtCurrency(ad.cpc),
        cpcRaw: ad.cpc,
        roas: fmtRoas(adRoas),
        roasRaw: adRoas,
      };
    })
    .sort((a, b) => b.roasRaw - a.roasRaw);

  const funnel: FunnelStep[] = [
    { label: 'Impressões → Cliques', rate: ctr, display: fmtPercent(ctr) },
    { label: 'Cliques → Leads', rate: clicks > 0 ? (leads / clicks) * 100 : 0, display: fmtPercent(clicks > 0 ? (leads / clicks) * 100 : 0) },
    { label: 'Leads → Conversões', rate: leadConv, display: fmtPercent(leadConv) },
  ];

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;

  return {
    connected,
    isDemoData: true,
    demoReason: reason,
    period,
    periodLabel,
    roasHealth: getRoasHealth(roas),
    roasNumeric: roas,
    metrics: {
      spend: mk(spend, prev.spend, fmtCurrency),
      impressions: mk(impressions, prev.impressions, fmtNumber),
      clicks: mk(clicks, prev.clicks, fmtNumber),
      ctr: mk(ctr, prev.ctr, fmtPercent),
      cpc: mk(cpc, prev.cpc, fmtCurrency, true),
      cpm: mk(cpm, prev.cpm, fmtCurrency, true),
      reach: mk(reach, prev.reach, fmtNumber),
      roas: mk(roas, prev.roas, fmtRoas),
      leads: mk(leads, prev.leads, fmtNumber),
      conversions: mk(conversions, prev.conversions, fmtNumber),
      cpl: mk(cpl, prev.cpl, fmtCurrency, true),
      leadConversionRate: mk(leadConv, leadConv * 0.96, fmtPercent),
    },
    timeSeries,
    monthlySeries,
    topAds,
    channels,
    campaigns,
    funnel,
    generatedAt: new Date().toISOString(),
    accountName: DEMO_FIXTURE.accountName,
  };
}

export function isDashboardEmpty(payload: DashboardPayload): boolean {
  const spend = payload.metrics.spend.raw ?? 0;
  const hasSeries = payload.timeSeries.length > 0 && payload.timeSeries.some((p) => p.spend > 0);
  return spend <= 0 && !hasSeries;
}

export function withDemoFallback(
  payload: DashboardPayload,
  period: PeriodKey,
  connected: boolean
): DashboardPayload {
  if (!DEMO_FALLBACK_ENABLED) return payload;
  if (!isDashboardEmpty(payload)) return payload;
  return buildDemoDashboardPayload(period, connected, 'empty');
}
