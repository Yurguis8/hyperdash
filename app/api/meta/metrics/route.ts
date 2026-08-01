import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PeriodKey } from '@/lib/dashboard-types';
import {
  fetchDashboardPayload,
  getDemoDashboardPayload,
  getEmptyDashboardPayload,
} from '@/lib/meta-insights';

const VALID_PERIODS: PeriodKey[] = ['today', 'yesterday', 'last_7d', 'last_30d'];

function parsePeriod(raw: string | null): PeriodKey {
  if (raw && VALID_PERIODS.includes(raw as PeriodKey)) return raw as PeriodKey;
  return 'last_7d';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get('period'));
  const useDemo = searchParams.get('demo') === '1';

  try {
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { isActive: true },
    });

    const accessToken = metaAccount?.accessToken || process.env.META_TEST_ACCESS_TOKEN;
    const adAccountId = metaAccount?.actAccountId || process.env.META_TEST_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      if (useDemo) {
        return NextResponse.json(getDemoDashboardPayload(period, false));
      }
      return NextResponse.json(getEmptyDashboardPayload(period));
    }

    try {
      const payload = await fetchDashboardPayload(
        adAccountId,
        accessToken,
        period,
        metaAccount?.accountName ?? undefined
      );
      return NextResponse.json(payload);
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : 'Erro na API Meta';
      console.error('Meta insights error:', message);
      const fallback = getDemoDashboardPayload(period, true);
      return NextResponse.json({ ...fallback, error: message });
    }
  } catch (error: unknown) {
    console.error('Erro na rota de métricas:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
