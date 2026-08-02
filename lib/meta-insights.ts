import type {
  CampaignRow,
  ChannelRow,
  DashboardMetrics,
  DashboardPayload,
  MetricTrend,
  PeriodKey,
  TimeSeriesPoint,
  TopAdRow,
} from './dashboard-types';
import { getRoasHealth, PERIOD_OPTIONS } from './dashboard-types';
import {
  buildDemoDashboardPayload,
  withDemoFallback,
} from './demo-fixtures';

const PRESET: Record<PeriodKey, string> = {
  today: 'today',
  yesterday: 'yesterday',
  last_7d: 'last_7d',
  last_30d: 'last_30d',
};

function parseRoas(row: Record<string, unknown>): number {
  const purchaseRoas = row.purchase_roas as { value?: string }[] | undefined;
  if (purchaseRoas?.[0]?.value) return parseFloat(purchaseRoas[0].value);
  return 0;
}

function parseActionCount(row: Record<string, unknown>, types: string[]): number {
  const actions = row.actions as { action_type?: string; value?: string }[] | undefined;
  if (!actions) return 0;
  const match = actions.find((a) => a.action_type && types.includes(a.action_type));
  return match?.value ? parseInt(match.value, 10) : 0;
}

function parseRevenue(row: Record<string, unknown>): number {
  const actionValues = row.action_values as { action_type?: string; value?: string }[] | undefined;
  const purchase =
    actionValues?.find(
      (a) =>
        a.action_type === 'omni_purchase' ||
        a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
        a.action_type === 'purchase'
    ) ?? actionValues?.[0];
  return purchase?.value ? parseFloat(purchase.value) : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

function formatRoas(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}x`;
}

function trend(current: number, previous: number, invert = false): Omit<MetricTrend, 'value'> & { raw: number } {
  let changePercent: number | null = null;
  if (previous > 0) changePercent = ((current - previous) / previous) * 100;
  else if (current > 0) changePercent = 100;
  const isPositive = invert
    ? changePercent !== null && changePercent <= 0
    : changePercent !== null && changePercent >= 0;
  return { raw: current, changePercent, isPositive };
}

function buildMetrics(
  current: Record<string, number>,
  previous: Record<string, number>
): DashboardMetrics {
  const spendT = trend(current.spend, previous.spend);
  const impT = trend(current.impressions, previous.impressions);
  const clicksT = trend(current.clicks, previous.clicks);
  const ctrT = trend(current.ctr, previous.ctr);
  const cpcT = trend(current.cpc, previous.cpc, true);
  const cpmT = trend(current.cpm, previous.cpm, true);
  const reachT = trend(current.reach, previous.reach);
  const roasT = trend(current.roas, previous.roas);
  const leadsT = trend(current.leads, previous.leads);
  const convT = trend(current.conversions, previous.conversions);
  const cplT = trend(current.cpl, previous.cpl, true);
  const leadConvT = trend(current.leadConversionRate, previous.leadConversionRate);

  return {
    spend: { ...spendT, value: formatCurrency(current.spend) },
    impressions: { ...impT, value: formatNumber(current.impressions) },
    clicks: { ...clicksT, value: formatNumber(current.clicks) },
    ctr: { ...ctrT, value: formatPercent(current.ctr) },
    cpc: { ...cpcT, value: formatCurrency(current.cpc) },
    cpm: { ...cpmT, value: formatCurrency(current.cpm) },
    reach: { ...reachT, value: formatNumber(current.reach) },
    roas: { ...roasT, value: formatRoas(current.roas) },
    leads: { ...leadsT, value: formatNumber(current.leads) },
    conversions: { ...convT, value: formatNumber(current.conversions) },
    cpl: { ...cplT, value: formatCurrency(current.cpl) },
    leadConversionRate: { ...leadConvT, value: formatPercent(current.leadConversionRate) },
  };
}

function rowToNumbers(row: Record<string, unknown>) {
  const spend = parseFloat(String(row.spend ?? 0));
  const clicks = parseInt(String(row.clicks ?? 0), 10);
  const leads = parseActionCount(row, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead']);
  const conversions = parseActionCount(row, [
    'offsite_conversion.fb_pixel_purchase',
    'purchase',
    'omni_purchase',
  ]);
  const roas = parseRoas(row);
  const leadConversionRate = leads > 0 ? (conversions / leads) * 100 : 0;

  return {
    spend,
    impressions: parseInt(String(row.impressions ?? 0), 10),
    clicks,
    ctr: parseFloat(String(row.ctr ?? 0)),
    cpc: parseFloat(String(row.cpc ?? 0)),
    cpm: parseFloat(String(row.cpm ?? 0)),
    reach: parseInt(String(row.reach ?? 0), 10),
    roas,
    leads,
    conversions,
    cpl: leads > 0 ? spend / leads : 0,
    leadConversionRate,
  };
}

async function graphFetch(url: string) {
  const response = await fetch(url);
  return response.json();
}

function getPreviousTimeRange(period: PeriodKey): { since: string; until: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  if (period === 'today') {
    const prev = new Date(today);
    prev.setDate(prev.getDate() - 1);
    return { since: fmt(prev), until: fmt(prev) };
  }
  if (period === 'yesterday') {
    const end = new Date(today);
    end.setDate(end.getDate() - 2);
    return { since: fmt(end), until: fmt(end) };
  }
  if (period === 'last_7d') {
    const until = new Date(today);
    until.setDate(until.getDate() - 7);
    const since = new Date(until);
    since.setDate(since.getDate() - 6);
    return { since: fmt(since), until: fmt(until) };
  }
  if (period === 'last_30d') {
    const until = new Date(today);
    until.setDate(until.getDate() - 30);
    const since = new Date(until);
    since.setDate(since.getDate() - 29);
    return { since: fmt(since), until: fmt(until) };
  }
  return null;
}

function buildFunnelFromNumbers(n: ReturnType<typeof rowToNumbers>) {
  const clickToLead = n.clicks > 0 ? (n.leads / n.clicks) * 100 : 0;
  return [
    { label: 'Impressões → Cliques', rate: n.ctr, display: formatPercent(n.ctr) },
    { label: 'Cliques → Leads', rate: clickToLead, display: formatPercent(clickToLead) },
    { label: 'Leads → Conversões', rate: n.leadConversionRate, display: formatPercent(n.leadConversionRate) },
  ];
}

function defaultChannelFromTotals(n: ReturnType<typeof rowToNumbers>): ChannelRow[] {
  const revenue = n.spend * n.roas;
  return [
    {
      name: 'Meta Ads',
      spend: formatCurrency(n.spend),
      spendRaw: n.spend,
      revenue: formatCurrency(revenue),
      revenueRaw: revenue,
      roas: formatRoas(n.roas),
      roasRaw: n.roas,
      leads: formatNumber(n.leads),
      leadsRaw: n.leads,
      conversions: formatNumber(n.conversions),
      conversionsRaw: n.conversions,
      cpc: formatCurrency(n.cpc),
      cpl: formatCurrency(n.cpl),
      ctr: formatPercent(n.ctr),
      leadConversionRate: formatPercent(n.leadConversionRate),
    },
  ];
}

function campaignRowsFromAds(ads: TopAdRow[]): CampaignRow[] {
  return ads.map((ad) => ({
    name: ad.name,
    spend: ad.spend,
    spendRaw: ad.spendRaw,
    revenue: formatCurrency(ad.spendRaw * ad.roasRaw),
    revenueRaw: ad.spendRaw * ad.roasRaw,
    roas: ad.roas,
    roasRaw: ad.roasRaw,
    leads: '—',
    leadsRaw: 0,
  }));
}

export async function fetchDashboardPayload(
  adAccountId: string,
  accessToken: string,
  period: PeriodKey,
  accountName?: string
): Promise<DashboardPayload> {
  const preset = PRESET[period];
  const fields =
    'spend,impressions,clicks,ctr,cpc,cpm,reach,purchase_roas,action_values,actions';
  const base = `https://graph.facebook.com/v19.0/${adAccountId}/insights`;

  const currentUrl = `${base}?fields=${fields}&date_preset=${preset}&access_token=${accessToken}`;
  const currentResult = await graphFetch(currentUrl);
  if (currentResult.error) throw new Error(currentResult.error.message);

  const currentRow = (currentResult.data?.[0] ?? {}) as Record<string, unknown>;
  const current = rowToNumbers(currentRow);

  let previous = { ...current, spend: 0, impressions: 0, clicks: 0, reach: 0, roas: 0, leads: 0, conversions: 0 };
  const prevRange = getPreviousTimeRange(period);
  if (prevRange) {
    const prevUrl = `${base}?fields=${fields}&time_range=${encodeURIComponent(JSON.stringify(prevRange))}&access_token=${accessToken}`;
    const prevResult = await graphFetch(prevUrl);
    if (prevResult.data?.[0]) previous = rowToNumbers(prevResult.data[0] as Record<string, unknown>);
  }

  const seriesPreset = period === 'today' || period === 'yesterday' ? 'last_7d' : preset;
  const seriesUrl = `${base}?fields=spend,clicks,action_values,actions&date_preset=${seriesPreset}&time_increment=1&access_token=${accessToken}`;
  const seriesResult = await graphFetch(seriesUrl);
  let timeSeries: TimeSeriesPoint[] = (seriesResult.data ?? []).map((row: Record<string, unknown>) => {
    const dateStr = String(row.date_start ?? '');
    const d = new Date(`${dateStr}T12:00:00`);
    return {
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      spend: parseFloat(String(row.spend ?? 0)),
      revenue: parseRevenue(row),
      leads: parseActionCount(row, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead']),
      clicks: parseInt(String(row.clicks ?? 0), 10),
    };
  });

  if (period === 'today' || period === 'yesterday') {
    timeSeries = timeSeries.slice(period === 'today' ? -1 : -2);
  } else if (period === 'last_7d') {
    timeSeries = timeSeries.slice(-7);
  } else {
    timeSeries = timeSeries.slice(-30);
  }

  const monthlyUrl = `${base}?fields=spend,action_values&date_preset=last_90d&time_increment=monthly&access_token=${accessToken}`;
  const monthlyResult = await graphFetch(monthlyUrl);
  const monthlySeries: TimeSeriesPoint[] = (monthlyResult.data ?? []).map((row: Record<string, unknown>) => {
    const dateStr = String(row.date_start ?? '');
    const d = new Date(`${dateStr}T12:00:00`);
    return {
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
      spend: parseFloat(String(row.spend ?? 0)),
      revenue: parseRevenue(row),
    };
  });

  const topAdsUrl = `${base}?level=ad&fields=ad_name,spend,cpc,purchase_roas&sort=purchase_roas_descending&limit=50&date_preset=${preset}&access_token=${accessToken}`;
  const topResult = await graphFetch(topAdsUrl);
  const topAds: TopAdRow[] = (topResult.data ?? [])
    .map((row: Record<string, unknown>) => {
      const roasRaw = parseRoas(row);
      const spendRaw = parseFloat(String(row.spend ?? 0));
      const cpcRaw = parseFloat(String(row.cpc ?? 0));
      return {
        name: String(row.ad_name ?? 'Anúncio sem nome'),
        spend: formatCurrency(spendRaw),
        spendRaw,
        cpc: formatCurrency(cpcRaw),
        cpcRaw,
        roas: formatRoas(roasRaw),
        roasRaw,
      };
    })
    .filter((ad: TopAdRow) => ad.spendRaw > 0)
    .sort((a: TopAdRow, b: TopAdRow) => b.roasRaw - a.roasRaw)
    .slice(0, 3);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;

  const payload: DashboardPayload = {
    connected: true,
    isDemoData: false,
    period,
    periodLabel,
    roasHealth: getRoasHealth(current.roas),
    roasNumeric: current.roas,
    metrics: buildMetrics(current, previous),
    timeSeries,
    monthlySeries,
    topAds,
    channels: defaultChannelFromTotals(current),
    campaigns: campaignRowsFromAds(topAds),
    funnel: buildFunnelFromNumbers(current),
    generatedAt: new Date().toISOString(),
    accountName,
  };

  return withDemoFallback(payload, period, true);
}

export function getDemoDashboardPayload(period: PeriodKey, connected: boolean): DashboardPayload {
  return buildDemoDashboardPayload(period, connected, connected ? 'api_error' : 'preview');
}

export function getEmptyDashboardPayload(period: PeriodKey): DashboardPayload {
  const empty: DashboardPayload = {
    connected: false,
    isDemoData: false,
    period,
    periodLabel: PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period,
    roasHealth: 'loss',
    roasNumeric: 0,
    metrics: buildMetrics(
      {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        roas: 0,
        leads: 0,
        conversions: 0,
        cpl: 0,
        leadConversionRate: 0,
      },
      {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        reach: 0,
        roas: 0,
        leads: 0,
        conversions: 0,
        cpl: 0,
        leadConversionRate: 0,
      }
    ),
    timeSeries: [],
    monthlySeries: [],
    topAds: [],
    channels: [],
    campaigns: [],
    funnel: [],
    generatedAt: new Date().toISOString(),
  };
  return withDemoFallback(empty, period, false);
}
