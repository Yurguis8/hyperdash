import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import {
  getMetaErrorUrl,
  getMetaOAuthConfig,
  META_OAUTH_STATE_COOKIE,
  META_OAUTH_VERSION,
  validateMetaCredentials,
} from '@/lib/meta-oauth';

export async function GET(request: Request) {
  const { appId, appSecret, redirectUri, isConfigured } = getMetaOAuthConfig(request.url);

  if (!isConfigured || !redirectUri) {
    return NextResponse.redirect(getMetaErrorUrl(request.url, 'configuration_error'));
  }

  const credentialsAreValid = await validateMetaCredentials(appId, appSecret);

  if (!credentialsAreValid) {
    return NextResponse.redirect(getMetaErrorUrl(request.url, 'app_unavailable'));
  }

  // A permissão ads_read inclui a leitura de anúncios, insights e métricas.
  const scope = 'ads_read';
  const state = randomBytes(32).toString('hex');
  const metaAuthUrl = new URL(`https://www.facebook.com/${META_OAUTH_VERSION}/dialog/oauth`);

  metaAuthUrl.searchParams.set('client_id', appId);
  metaAuthUrl.searchParams.set('redirect_uri', redirectUri);
  metaAuthUrl.searchParams.set('scope', scope);
  metaAuthUrl.searchParams.set('response_type', 'code');
  metaAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(metaAuthUrl);
  response.cookies.set(META_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: redirectUri.startsWith('https://'),
    path: '/',
    maxAge: 10 * 60,
  });

  return response;
}
