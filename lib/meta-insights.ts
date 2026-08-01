import type {
  DashboardMetrics,
  DashboardPayload,
  MetricTrend,
  PeriodKey,
  TimeSeriesPoint,
  TopAdRow,
} from './dashboard-types';
import { getRoasHealth, PERIOD_OPTIONS } from './dashboard-types';

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
  return `${value.toFixed(1).replace('.', ',')}x`;
}

function trend(current: number, previous: number, invert = false): MetricTrend {
  let changePercent: number | null = null;
  if (previous > 0) {
    changePercent = ((current - previous) / previous) * 100;
  } else if (current > 0) {
    changePercent = 100;
  }
  const isPositive = invert
    ? changePercent !== null && changePercent <= 0
    : changePercent !== null && changePercent >= 0;

  return {
    value: '',
    changePercent,
    isPositive,
  };
}

function buildMetrics(
  current: Record<string, number>,
  previous: Record<string, number>
): DashboardMetrics {
  const spendT = trend(current.spend, previous.spend);
  spendT.value = formatCurrency(current.spend);
  const impT = trend(current.impressions, previous.impressions);
  impT.value = formatNumber(current.impressions);
  const clicksT = trend(current.clicks, previous.clicks);
  clicksT.value = formatNumber(current.clicks);
  const ctrT = trend(current.ctr, previous.ctr);
  ctrT.value = formatPercent(current.ctr);
  const cpcT = trend(current.cpc, previous.cpc, true);
  cpcT.value = formatCurrency(current.cpc);
  const cpmT = trend(current.cpm, previous.cpm, true);
  cpmT.value = formatCurrency(current.cpm);
  const reachT = trend(current.reach, previous.reach);
  reachT.value = formatNumber(current.reach);
  const roasT = trend(current.roas, previous.roas);
  roasT.value = formatRoas(current.roas);

  return {
    spend: spendT,
    impressions: impT,
    clicks: clicksT,
    ctr: ctrT,
    cpc: cpcT,
    cpm: cpmT,
    reach: reachT,
    roas: roasT,
  };
}

function emptyMetrics(): DashboardMetrics {
  const zero = (v: string): MetricTrend => ({ value: v, changePercent: null, isPositive: true });
  return {
    spend: zero('R$ 0,00'),
    impressions: zero('0'),
    clicks: zero('0'),
    ctr: zero('0,00%'),
    cpc: zero('R$ 0,00'),
    cpm: zero('R$ 0,00'),
    reach: zero('0'),
    roas: zero('0,0x'),
  };
}

function rowToNumbers(row: Record<string, unknown>) {
  return {
    spend: parseFloat(String(row.spend ?? 0)),
    impressions: parseInt(String(row.impressions ?? 0), 10),
    clicks: parseInt(String(row.clicks ?? 0), 10),
    ctr: parseFloat(String(row.ctr ?? 0)),
    cpc: parseFloat(String(row.cpc ?? 0)),
    cpm: parseFloat(String(row.cpm ?? 0)),
    reach: parseInt(String(row.reach ?? 0), 10),
    roas: parseRoas(row),
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
    const start = new Date(end);
    return { since: fmt(start), until: fmt(end) };
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

function demoPayload(period: PeriodKey, connected: boolean): DashboardPayload {
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;
  const baseRoas = period === 'today' ? 2.4 : period === 'yesterday' ? 1.5 : period === 'last_7d' ? 1.8 : 2.1;
  const spend = period === 'today' ? 420 : period === 'yesterday' ? 380 : period === 'last_7d' ? 2840 : 11200;
  const revenue = spend * baseRoas;

  const days = period === 'today' || period === 'yesterday' ? 1 : period === 'last_7d' ? 7 : 30;
  const timeSeries: TimeSeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const daySpend = spend / days + (i % 3) * 12;
    timeSeries.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      spend: Math.round(daySpend * 100) / 100,
      revenue: Math.round(daySpend * baseRoas * 100) / 100,
    });
  }

  const metrics = buildMetrics(
    {
      spend,
      impressions: spend * 42,
      clicks: spend * 0.9,
      ctr: 2.14,
      cpc: spend / (spend * 0.9),
      cpm: 18.4,
      reach: spend * 28,
      roas: baseRoas,
    },
    {
      spend: spend * 0.88,
      impressions: spend * 42 * 0.91,
      clicks: spend * 0.9 * 0.93,
      ctr: 2.01,
      cpc: (spend * 0.88) / (spend * 0.9 * 0.93),
      cpm: 19.1,
      reach: spend * 28 * 0.9,
      roas: baseRoas * 0.92,
    }
  );

  const topAds: TopAdRow[] = [
    {
      name: 'Vídeo — Remarketing Carrinho',
      spend: formatCurrency(spend * 0.34),
      spendRaw: spend * 0.34,
      cpc: formatCurrency(1.12),
      cpcRaw: 1.12,
      roas: formatRoas(baseRoas + 0.6),
      roasRaw: baseRoas + 0.6,
    },
    {
      name: 'Estático — Prova Social',
      spend: formatCurrency(spend * 0.28),
      spendRaw: spend * 0.28,
      cpc: formatCurrency(0.89),
      cpcRaw: 0.89,
      roas: formatRoas(baseRoas + 0.2),
      roasRaw: baseRoas + 0.2,
    },
    {
      name: 'Carrossel — Lançamento',
      spend: formatCurrency(spend * 0.22),
      spendRaw: spend * 0.22,
      cpc: formatCurrency(1.45),
      cpcRaw: 1.45,
      roas: formatRoas(baseRoas - 0.3),
      roasRaw: baseRoas - 0.3,
    },
  ].sort((a, b) => b.roasRaw - a.roasRaw);

  return {
    connected,
    period,
    periodLabel,
    roasHealth: getRoasHealth(baseRoas),
    roasNumeric: baseRoas,
    metrics,
    timeSeries,
    topAds,
    generatedAt: new Date().toISOString(),
    accountName: connected ? 'Conta Meta Ads' : undefined,
  };
}

export async function fetchDashboardPayload(
  adAccountId: string,
  accessToken: string,
  period: PeriodKey,
  accountName?: string
): Promise<DashboardPayload> {
  const preset = PRESET[period];
  const fields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,purchase_roas,action_values';
  const base = `https://graph.facebook.com/v19.0/${adAccountId}/insights`;

  const currentUrl = `${base}?fields=${fields}&date_preset=${preset}&access_token=${accessToken}`;
  const currentResult = await graphFetch(currentUrl);

  if (currentResult.error) {
    throw new Error(currentResult.error.message);
  }

  const currentRow = (currentResult.data?.[0] ?? {}) as Record<string, unknown>;
  const current = rowToNumbers(currentRow);

  let previous = { ...current, spend: 0, impressions: 0, clicks: 0, reach: 0, roas: 0 };
  const prevRange = getPreviousTimeRange(period);
  if (prevRange) {
    const prevUrl = `${base}?fields=${fields}&time_range=${encodeURIComponent(JSON.stringify(prevRange))}&access_token=${accessToken}`;
    const prevResult = await graphFetch(prevUrl);
    if (prevResult.data?.[0]) {
      previous = rowToNumbers(prevResult.data[0] as Record<string, unknown>);
    }
  }

  const seriesPreset = period === 'today' || period === 'yesterday' ? 'last_7d' : preset;
  const seriesUrl = `${base}?fields=spend,action_values&date_preset=${seriesPreset}&time_increment=1&access_token=${accessToken}`;
  const seriesResult = await graphFetch(seriesUrl);
  let timeSeries: TimeSeriesPoint[] = (seriesResult.data ?? []).map((row: Record<string, unknown>) => {
    const dateStr = String(row.date_start ?? '');
    const d = new Date(dateStr + 'T12:00:00');
    return {
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      spend: parseFloat(String(row.spend ?? 0)),
      revenue: parseRevenue(row),
    };
  });

  if (period === 'today' || period === 'yesterday') {
    const slice = period === 'today' ? -1 : -2;
    timeSeries = timeSeries.slice(slice);
  } else if (period === 'last_7d') {
    timeSeries = timeSeries.slice(-7);
  } else {
    timeSeries = timeSeries.slice(-30);
  }

  const topAdsUrl = `${base}?level=ad&fields=ad_name,spend,cpc,purchase_roas&sort=purchase_roas_descending&limit=50&date_preset=${preset}&access_token=${accessToken}`;
  const topResult = await graphFetch(topAdsUrl);
  let topAds: TopAdRow[] = (topResult.data ?? [])
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

  if (topAds.length === 0) {
    topAds = demoPayload(period, true).topAds;
  }

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;

  return {
    connected: true,
    period,
    periodLabel,
    roasHealth: getRoasHealth(current.roas),
    roasNumeric: current.roas,
    metrics: buildMetrics(current, previous),
    timeSeries,
    topAds,
    generatedAt: new Date().toISOString(),
    accountName,
  };
}

export function getDemoDashboardPayload(period: PeriodKey, connected: boolean): DashboardPayload {
  return demoPayload(period, connected);
}

export function getEmptyDashboardPayload(period: PeriodKey): DashboardPayload {
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;
  return {
    connected: false,
    period,
    periodLabel,
    roasHealth: 'loss',
    roasNumeric: 0,
    metrics: emptyMetrics(),
    timeSeries: [],
    topAds: [],
    generatedAt: new Date().toISOString(),
  };
}
