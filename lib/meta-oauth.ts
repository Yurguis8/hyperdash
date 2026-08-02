const META_GRAPH_VERSION = 'v19.0';

export type MetaOAuthErrorReason =
  | 'access_denied'
  | 'app_unavailable'
  | 'configuration_error'
  | 'invalid_state'
  | 'no_code'
  | 'server_error'
  | 'token_failed';

function cleanEnvironmentValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '') || '';
}

export function getMetaOAuthConfig(requestUrl: string) {
  const appId = cleanEnvironmentValue(process.env.FACEBOOK_CLIENT_ID);
  const appSecret = cleanEnvironmentValue(process.env.FACEBOOK_CLIENT_SECRET);
  const configuredBaseUrl = cleanEnvironmentValue(process.env.NEXTAUTH_URL);

  let baseUrl = new URL(requestUrl).origin;

  if (configuredBaseUrl) {
    try {
      baseUrl = new URL(configuredBaseUrl).origin;
    } catch {
      return { appId, appSecret, baseUrl, redirectUri: '', isConfigured: false };
    }
  }

  return {
    appId,
    appSecret,
    baseUrl,
    redirectUri: `${baseUrl}/api/auth/meta/callback`,
    isConfigured: Boolean(appId && appSecret),
  };
}

export function getMetaErrorUrl(requestUrl: string, reason: MetaOAuthErrorReason) {
  const url = new URL('/api/auth/meta/error', requestUrl);
  url.searchParams.set('reason', reason);
  return url;
}

export async function validateMetaCredentials(appId: string, appSecret: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(appId)}?fields=id`,
      {
        headers: { Authorization: `Bearer ${appId}|${appSecret}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      }
    );

    if (response.ok) return true;

    const payload = await response.json().catch(() => null);
    console.error('A Meta recusou as credenciais configuradas.', {
      status: response.status,
      code: payload?.error?.code,
      type: payload?.error?.type,
    });
    return false;
  } catch (error) {
    // Uma indisponibilidade momentânea não deve impedir o fluxo que já existia.
    console.warn('Não foi possível validar previamente o aplicativo Meta.', error);
    return true;
  }
}

export const META_OAUTH_STATE_COOKIE = 'meta_oauth_state';
export const META_OAUTH_VERSION = META_GRAPH_VERSION;
