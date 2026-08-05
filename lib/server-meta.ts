/**
 * Server-side helper to fetch Meta (Facebook) Ads spend for the configured ad account.
 *
 * Expects these environment variables to be set on the server:
 * - META_ACCESS_TOKEN: a valid Meta Graph API access token with ads_read permission
 * - META_AD_ACCOUNT_ID: the ad account id (preferably in the form act_<ID>)
 *
 * Returns numbers (rounded) in the account currency. If env is missing or an
 * error occurs the function returns zeros.
 */
export async function getMetaAdSpend(): Promise<{ today: number; mtd: number }> {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccount = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccount) {
    console.warn('Meta ad spend not fetched: missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID');
    return { today: 0, mtd: 0 };
  }

  const GRAPH_BASE = 'https://graph.facebook.com/v17.0';

  async function fetchRange(since: string, until: string): Promise<number> {
    const range = `{'since':'${since}','until':'${until}'}`;
    const url = `${GRAPH_BASE}/${adAccount}/insights?fields=spend&time_range=${encodeURIComponent(range)}&access_token=${encodeURIComponent(token || '')}`;
    // Retry loop with timeout
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error(`Meta API error (attempt ${attempt})`, res.status, txt);
          if (attempt === maxAttempts) return 0;
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }
        const j = await res.json();
        const data = Array.isArray(j.data) ? j.data : [];
        const sum = data.reduce((s: number, it: any) => s + Number(it.spend || 0), 0);
        return sum;
      } catch (e: any) {
        console.error(`Meta fetch failed (attempt ${attempt})`, e?.message || e);
        if (attempt === maxAttempts) return 0;
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
    return 0;
  }

  // Dates in YYYY-MM-DD for IST
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const mtd = today.slice(0, 7) + '-01';

  const [todaySpend, mtdSpend] = await Promise.all([fetchRange(today, today), fetchRange(mtd, today)]);
  return { today: Math.round(todaySpend), mtd: Math.round(mtdSpend) };
}

/**
 * Fetch lead counts (leadgen actions) from Meta Insights for today and MTD.
 * Returns { today: number, mtd: number } — integer counts.
 */
export async function getMetaLeadCounts(): Promise<{ today: number; mtd: number }> {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccount = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccount) {
    return { today: 0, mtd: 0 };
  }

  const GRAPH_BASE = 'https://graph.facebook.com/v17.0';

  async function fetchRange(since: string, until: string): Promise<number> {
    const range = `{'since':'${since}','until':'${until}'}`;
    const url = `${GRAPH_BASE}/${adAccount}/insights?fields=actions&time_range=${encodeURIComponent(range)}&access_token=${encodeURIComponent(token || '')}`;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error(`Meta leads API error (attempt ${attempt})`, res.status, txt);
          if (attempt === maxAttempts) return 0;
          await new Promise((r) => setTimeout(r, attempt * 500));
          continue;
        }
        const j = await res.json();
        const data = Array.isArray(j.data) ? j.data : [];
        const sum = data.reduce((s: number, row: any) => {
          const actions = Array.isArray(row.actions) ? row.actions : [];
          const leadAction = actions.find((a: any) => a.action_type === 'lead' || a.action_type === 'leadgen');
          const val = leadAction ? Number(leadAction.value || 0) : 0;
          return s + val;
        }, 0);
        return sum;
      } catch (e: any) {
        console.error(`Meta leads fetch failed (attempt ${attempt})`, e?.message || e);
        if (attempt === maxAttempts) return 0;
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
    return 0;
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const mtd = today.slice(0, 7) + '-01';

  const [todayCount, mtdCount] = await Promise.all([fetchRange(today, today), fetchRange(mtd, today)]);
  return { today: Math.round(todayCount), mtd: Math.round(mtdCount) };
}
