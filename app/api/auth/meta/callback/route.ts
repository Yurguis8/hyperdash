import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getMetaErrorUrl,
  getMetaOAuthConfig,
  META_OAUTH_STATE_COOKIE,
  META_OAUTH_VERSION,
  type MetaOAuthErrorReason,
} from '@/lib/meta-oauth';

function clearOAuthState(response: NextResponse, secure: boolean) {
  response.cookies.set(META_OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  });
  return response;
}

function errorResponse(request: NextRequest, reason: MetaOAuthErrorReason) {
  return clearOAuthState(
    NextResponse.redirect(getMetaErrorUrl(request.url, reason)),
    request.nextUrl.protocol === 'https:'
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const expectedState = request.cookies.get(META_OAUTH_STATE_COOKIE)?.value;
  const metaError = searchParams.get('error');

  if (metaError) {
    console.warn('A Meta não autorizou a conexão.', {
      error: metaError,
      reason: searchParams.get('error_reason'),
      code: searchParams.get('error_code'),
    });
    return errorResponse(request, metaError === 'access_denied' ? 'access_denied' : 'app_unavailable');
  }

  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return errorResponse(request, 'invalid_state');
  }

  if (!code) {
    return errorResponse(request, 'no_code');
  }

  try {
    const { appId, appSecret, redirectUri, isConfigured } = getMetaOAuthConfig(request.url);

    if (!isConfigured || !redirectUri) {
      return errorResponse(request, 'configuration_error');
    }

    // 1. Troca o código pelo Token de Acesso de Curta Duração.
    const tokenUrl = new URL(`https://graph.facebook.com/${META_OAUTH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);
    const tokenRes = await fetch(tokenUrl, { cache: 'no-store' });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
      console.error('Erro no Token da Meta:', {
        status: tokenRes.status,
        code: tokenData.error?.code,
        type: tokenData.error?.type,
      });
      return errorResponse(request, 'token_failed');
    }

    const shortToken = tokenData.access_token;

    // 2. Troca o Token de Curta Duração por um Token de Longa Duração (60 dias).
    const longTokenUrl = new URL(`https://graph.facebook.com/${META_OAUTH_VERSION}/oauth/access_token`);
    longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longTokenUrl.searchParams.set('client_id', appId);
    longTokenUrl.searchParams.set('client_secret', appSecret);
    longTokenUrl.searchParams.set('fb_exchange_token', shortToken);
    const longTokenRes = await fetch(longTokenUrl, { cache: 'no-store' });
    const longTokenData = await longTokenRes.json();
    const longToken = longTokenData.access_token || shortToken;

    // 3. Busca os dados do usuário do Facebook.
    const meRes = await fetch(`https://graph.facebook.com/${META_OAUTH_VERSION}/me`, {
      headers: { Authorization: `Bearer ${longToken}` },
      cache: 'no-store',
    });
    const meData = await meRes.json();

    if (!meRes.ok || meData.error || !meData.id) {
      console.error('Erro ao consultar o usuário da Meta.', {
        status: meRes.status,
        code: meData.error?.code,
        type: meData.error?.type,
      });
      return errorResponse(request, 'token_failed');
    }

    const facebookUserId = meData.id || 'unknown_fb_user';

    // 4. Busca a Conta de Anúncios associada.
    const accountsRes = await fetch(
      `https://graph.facebook.com/${META_OAUTH_VERSION}/me/adaccounts?fields=id,name`,
      {
        headers: { Authorization: `Bearer ${longToken}` },
        cache: 'no-store',
      }
    );
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok || accountsData.error) {
      console.error('Erro ao consultar as contas de anúncios da Meta.', {
        status: accountsRes.status,
        code: accountsData.error?.code,
        type: accountsData.error?.type,
      });
      return errorResponse(request, 'token_failed');
    }

    const adAccount = accountsData.data?.[0];
    const adAccountId = adAccount?.id || process.env.META_TEST_AD_ACCOUNT_ID || '';
    const accountName = adAccount?.name || 'Conta de Anúncios';

    // 5. Garante que exista pelo menos um usuário no banco para vincular (Modo Dev / Teste).
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'usuario.demo@hyperpanel.com',
          name: 'Usuário Demo',
        },
      });
    }

    // 6. Cria ou atualiza a conexão na tabela MetaAccount.
    await prisma.metaAccount.upsert({
      where: {
        userId_actAccountId: {
          userId: user.id,
          actAccountId: adAccountId,
        },
      },
      update: {
        accessToken: longToken,
        accountName,
        facebookUserId,
        isActive: true,
      },
      create: {
        userId: user.id,
        actAccountId: adAccountId,
        accessToken: longToken,
        accountName,
        facebookUserId,
        isActive: true,
      },
    });

    return clearOAuthState(
      NextResponse.redirect(new URL('/dashboard?meta=connected', request.url)),
      request.nextUrl.protocol === 'https:'
    );
  } catch (error: unknown) {
    console.error('Erro no Callback:', error);
    return errorResponse(request, 'server_error');
  }
}
