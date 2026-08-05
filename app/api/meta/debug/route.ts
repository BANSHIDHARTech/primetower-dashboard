import { NextResponse } from 'next/server';
import { getMetaAdSpend, getMetaLeadCounts } from '@/lib/server-meta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchInsights(adAccount: string | undefined, token: string | undefined, fields: string, since: string, until: string) {
  if (!adAccount || !token) return { ok: false, error: 'missing env' };
  const GRAPH_BASE = 'https://graph.facebook.com/v17.0';
  const range = `{'since':'${since}','until':'${until}'}`;
  const url = `${GRAPH_BASE}/${adAccount}/insights?fields=${encodeURIComponent(fields)}&time_range=${encodeURIComponent(range)}&access_token=${encodeURIComponent(token)}&limit=500`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
    return { ok: res.ok, status: res.status, url, body: json };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccount = process.env.META_AD_ACCOUNT_ID;

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const mtd = today.slice(0, 7) + '-01';

  const [spendToday, spendMTD] = await Promise.all([
    fetchInsights(adAccount, token, 'spend', today, today),
    fetchInsights(adAccount, token, 'spend', mtd, today),
  ]);

  const [actionsToday, actionsMTD] = await Promise.all([
    fetchInsights(adAccount, token, 'actions', today, today),
    fetchInsights(adAccount, token, 'actions', mtd, today),
  ]);

  // Compute sums from returned bodies if possible
  function sumSpend(body: any) {
    if (!body || !Array.isArray(body.data)) return 0;
    return body.data.reduce((s: number, r: any) => s + Number(r.spend || 0), 0);
  }

  function sumLeads(body: any) {
    if (!body || !Array.isArray(body.data)) return 0;
    return body.data.reduce((s: number, r: any) => {
      const actions = Array.isArray(r.actions) ? r.actions : [];
      const leadAction = actions.find((a: any) => a.action_type === 'lead' || a.action_type === 'leadgen');
      return s + Number(leadAction?.value || 0);
    }, 0);
  }

  const computed = {
    spend: {
      today: Math.round(sumSpend(spendToday.body)),
      mtd: Math.round(sumSpend(spendMTD.body)),
    },
    leads: {
      today: Math.round(sumLeads(actionsToday.body)),
      mtd: Math.round(sumLeads(actionsMTD.body)),
    },
  };

  return NextResponse.json({
    ok: true,
    requested: { today, mtd },
    spendToday,
    spendMTD,
    actionsToday,
    actionsMTD,
    computed,
  });
}
