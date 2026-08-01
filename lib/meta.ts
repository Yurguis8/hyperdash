export interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  conversions: number;
  roas: number;
}

export async function fetchMetaMetrics(actAccountId: string, accessToken: string, datePreset: string = 'last_30d'): Promise<MetaInsights> {
  const fields = 'spend,impressions,clicks,ctr,cpc,cpm,reach,actions,purchase_roas';
  const url = `https://graph.facebook.com/v19.0/${actAccountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      reach: 0,
      conversions: 0,
      roas: 0,
    };
  }

  const row = data.data[0];

  // Filtra conversões da lista de actions (compras, leads, etc.)
  const conversionsAction = row.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'lead');
  const conversions = conversionsAction ? parseInt(conversionsAction.value) : 0;

  // Filtra ROAS
  const roasValue = row.purchase_roas ? parseFloat(row.purchase_roas[0]?.value || 0) : 0;

  return {
    spend: parseFloat(row.spend || 0),
    impressions: parseInt(row.impressions || 0),
    clicks: parseInt(row.clicks || 0),
    ctr: parseFloat(row.ctr || 0),
    cpc: parseFloat(row.cpc || 0),
    cpm: parseFloat(row.cpm || 0),
    reach: parseInt(row.reach || 0),
    conversions,
    roas: roasValue,
  };
}