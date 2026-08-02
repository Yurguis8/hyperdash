import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
  }

  try {
    const appId = process.env.FACEBOOK_CLIENT_ID;
    const appSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/meta/callback`;

    // 1. Troca o código pelo Token de Acesso de Curta Duração
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Erro no Token da Meta:', tokenData.error);
      return NextResponse.redirect(new URL('/dashboard?error=token_failed', request.url));
    }

    const shortToken = tokenData.access_token;

    // 2. Troca o Token de Curta Duração por um Token de Longa Duração (60 dias)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json();
    const longToken = longTokenData.access_token || shortToken;

    // 3. Busca os dados do Usuário do Facebook (para pegar o ID do Facebook)
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${longToken}`);
    const meData = await meRes.json();
    const facebookUserId = meData.id || 'unknown_fb_user';

    // 4. Busca a Conta de Anúncios (Ad Account) associada
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name&access_token=${longToken}`
    );
    const accountsData = await accountsRes.json();

    const adAccount = accountsData.data?.[0];
    const adAccountId = adAccount?.id || process.env.META_TEST_AD_ACCOUNT_ID || '';
    const accountName = adAccount?.name || 'Conta de Anúncios';

    // 5. Garante que exista pelo menos um usuário no banco para vincular (Modo Dev / Teste)
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'usuario.demo@hyperpanel.com',
          name: 'Usuário Demo',
        },
      });
    }

    // 6. Cria ou Atualiza a conexão na tabela MetaAccount
    await prisma.metaAccount.upsert({
      where: {
        userId_actAccountId: {
          userId: user.id,
          actAccountId: adAccountId,
        },
      },
      update: {
        accessToken: longToken,
        accountName: accountName,
        facebookUserId: facebookUserId,
        isActive: true,
      },
      create: {
        userId: user.id,
        actAccountId: adAccountId,
        accessToken: longToken,
        accountName: accountName,
        facebookUserId: facebookUserId,
        isActive: true,
      },
    });

    return NextResponse.redirect(new URL('/dashboard?meta=connected', request.url));
  } catch (error: any) {
    console.error('Erro no Callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=server_error', request.url));
  }
}