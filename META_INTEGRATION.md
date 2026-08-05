Meta Ads Integration
=====================

This project can fetch Meta (Facebook) Ads spend for the dashboard's Key Metrics.

Required environment variables (set on the server / deployment platform):

- `META_ACCESS_TOKEN` — an access token with `ads_read` permission for the ad account.
- `META_AD_ACCOUNT_ID` — the ad account id, e.g. `act_1234567890`.

Local example (.env.local):

META_ACCESS_TOKEN=EAA...your_token_here...
META_AD_ACCOUNT_ID=act_1234567890

How it works
- The server helper `lib/server-meta.ts` calls the Meta Graph API `/insights` endpoint
  for the configured ad account and returns spend for today and MTD.
- The SuperAdmin page calls this helper server-side and passes the values to
  `KeyMetricsTab` so metrics are rendered dynamically.

Testing
- Start the app and visit the SuperAdmin dashboard (`/superadmin?tab=key-metrics`).
- Alternatively, call the API route directly: `GET /api/meta/ads`.

Notes and next steps
- For production deploys (Vercel, Railway, etc.) add the env vars in the project settings.
- You may want to implement caching or rate-limiting if the Graph API quota is a concern.
- To enable client-side auto-refresh, the provided `useMetaAdSpend` hook fetches `/api/meta/ads`.
