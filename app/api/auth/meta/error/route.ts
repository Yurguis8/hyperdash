import { NextResponse } from 'next/server';
import type { MetaOAuthErrorReason } from '@/lib/meta-oauth';

const messages: Record<MetaOAuthErrorReason, { title: string; description: string }> = {
  access_denied: {
    title: 'Conexão não autorizada',
    description: 'A Meta não autorizou a conexão. Você pode voltar ao painel e tentar novamente.',
  },
  app_unavailable: {
    title: 'Aplicativo Meta indisponível',
    description:
      'O aplicativo precisa estar ativo no painel da Meta. Se ele estiver em desenvolvimento, a conta conectada deve ter uma função no aplicativo.',
  },
  configuration_error: {
    title: 'Configuração da Meta incompleta',
    description: 'As credenciais ou a URL de retorno do aplicativo Meta precisam ser revisadas.',
  },
  invalid_state: {
    title: 'Tentativa de conexão expirada',
    description: 'Por segurança, inicie novamente a conexão com a Meta pelo painel.',
  },
  no_code: {
    title: 'A Meta não concluiu a conexão',
    description: 'Nenhum código de autorização foi recebido. Volte ao painel e tente novamente.',
  },
  server_error: {
    title: 'Não foi possível concluir a conexão',
    description: 'Ocorreu um erro ao salvar a conta. Nenhuma conexão incompleta foi mantida.',
  },
  token_failed: {
    title: 'Autorização recusada pela Meta',
    description: 'A Meta não conseguiu validar a autorização. Volte ao painel e tente novamente.',
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedReason = requestUrl.searchParams.get('reason') as MetaOAuthErrorReason | null;
  const reason = requestedReason && requestedReason in messages ? requestedReason : 'server_error';
  const message = messages[reason];
  const dashboardUrl = new URL('/dashboard', requestUrl.origin).toString();

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="12;url=${escapeHtml(dashboardUrl)}" />
    <title>${escapeHtml(message.title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f8fafc; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      main { width: min(100%, 520px); padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 16px 40px rgba(15, 23, 42, .08); }
      h1 { margin: 0 0 12px; font-size: 24px; line-height: 1.25; }
      p { margin: 0 0 24px; color: #475569; line-height: 1.6; }
      a { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: 0 18px; border-radius: 10px; background: #2563eb; color: #fff; font-weight: 700; text-decoration: none; }
      small { display: block; margin-top: 18px; color: #64748b; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(message.title)}</h1>
      <p>${escapeHtml(message.description)}</p>
      <a href="${escapeHtml(dashboardUrl)}">Voltar ao painel</a>
      <small>O retorno automático acontecerá em alguns segundos.</small>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 400,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
