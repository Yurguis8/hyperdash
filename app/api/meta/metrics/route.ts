import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Busca a primeira conta Meta ativa cadastrada no banco
    const metaAccount = await prisma.metaAccount.findFirst({
      where: { isActive: true },
    });

    // Usa os dados do banco ou cai no fallback das variáveis de ambiente
    const accessToken = metaAccount?.accessToken || process.env.META_TEST_ACCESS_TOKEN;
    const adAccountId = metaAccount?.actAccountId || process.env.META_TEST_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        connected: false,
        metrics: {
          spend: 'R$ 0,00',
          impressions: '0',
          clicks: '0',
          ctr: '0,00%',
          cpc: 'R$ 0,00',
          cpm: 'R$ 0,00',
          reach: '0',
          roas: '0.0x',
        },
      });
    }

    const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm,reach&date_preset=maximum&access_token=${accessToken}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.error) {
      return NextResponse.json({
        connected: true,
        error: result.error.message,
        metrics: {
          spend: 'R$ 0,00',
          impressions: '0',
          clicks: '0',
          ctr: '0,00%',
          cpc: 'R$ 0,00',
          cpm: 'R$ 0,00',
          reach: '0',
          roas: '0.0x',
        },
      });
    }

    const data = result.data && result.data.length > 0 ? result.data[0] : {};

    return NextResponse.json({
      connected: true,
      metrics: {
        spend: data.spend ? `R$ ${parseFloat(data.spend).toFixed(2)}` : 'R$ 0,00',
        impressions: data.impressions || '0',
        clicks: data.clicks || '0',
        ctr: data.ctr ? `${parseFloat(data.ctr).toFixed(2)}%` : '0,00%',
        cpc: data.cpc ? `R$ ${parseFloat(data.cpc).toFixed(2)}` : 'R$ 0,00',
        cpm: data.cpm ? `R$ ${parseFloat(data.cpm).toFixed(2)}` : 'R$ 0,00',
        reach: data.reach || '0',
        roas: '0.0x',
      },
    });
  } catch (error: any) {
    console.error('Erro na rota de métricas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}