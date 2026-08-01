import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/meta/callback`;
  
  // A permissão ads_read já inclui a leitura de anúncios, insights e métricas
  const scope = 'ads_read';

  const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&response_type=code`;

  return NextResponse.redirect(metaAuthUrl);
}