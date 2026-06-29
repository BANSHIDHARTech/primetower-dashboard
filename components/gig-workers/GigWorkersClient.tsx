'use client';

import { useGigWorkersStats, useRecentConversions } from '@/lib/queries/api-hooks';
import Link from 'next/link';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  (Number(n) || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

function Delta({ today, yesterday }: { today: number; yesterday: number }) {
  const diff = today - yesterday;
  if (diff === 0)
    return <span className="text-xs text-slate-400 font-mono ml-1">= 0</span>;
  const up = diff > 0;
  return (
    <span
      className={`text-xs font-bold font-mono ml-1 ${up ? 'text-emerald-400' : 'text-rose-400'}`}
    >
      {up ? '▲' : '▼'} {Math.abs(diff)}
    </span>
  );
}

function RevDelta({ today, yesterday }: { today: number; yesterday: number }) {
  const diff = today - yesterday;
  if (diff === 0)
    return <span className="text-xs text-slate-400 font-mono ml-1">= ₹0</span>;
  const up = diff > 0;
  return (
    <span
      className={`text-xs font-bold font-mono ml-1 ${up ? 'text-emerald-400' : 'text-rose-400'}`}
    >
      {up ? '▲' : '▼'} {fmt(Math.abs(diff))}
    </span>
  );
}

// ─── stat mini card ──────────────────────────────────────────────────────────
function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)', border: `1px solid ${accent}33` }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
        {label}
      </p>
      <p className="text-3xl font-extrabold font-mono text-white leading-none">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
interface GigWorkersClientProps {
  basePath: string; // '/superadmin' or '/dealer'
}

export function GigWorkersClient({ basePath }: GigWorkersClientProps) {
  const { data: workers = [], isLoading: loadingWorkers } = useGigWorkersStats();
  const { data: conversions = [], isLoading: loadingConversions } = useRecentConversions();
  
  if (loadingWorkers || loadingConversions) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Real-Time Data...</div>;
  }

  // Computed totals
  const totalToday = workers.reduce((s: any, w: any) => s + w.today.leads_assigned, 0);
  const totalYesterday = workers.reduce((s: any, w: any) => s + w.yesterday.leads_assigned, 0);
  const totalTodaySold = workers.reduce((s: any, w: any) => s + w.today.deals_closed, 0);
  const totalYesterdaySold = workers.reduce((s: any, w: any) => s + w.yesterday.deals_closed, 0);
  const totalTodayRev = workers.reduce((s: any, w: any) => s + w.today.revenue, 0);
  const totalYesterdayRev = workers.reduce((s: any, w: any) => s + w.yesterday.revenue, 0);
  const activeCount = workers.length;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
            Gig Workers
          </h1>
          <p className="text-sm text-[#434652] mt-0.5">
            {workers.length} active workers ·{' '}
            <span className="text-xs text-[#737783]">Live — updated just now</span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          LIVE
        </span>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat
          label="Active Workers"
          value={activeCount}
          sub={`${workers.length} registered total`}
          accent="#60a5fa"
        />
        <MiniStat
          label="Leads Today"
          value={totalToday}
          sub={`Yesterday: ${totalYesterday}`}
          accent="#a78bfa"
        />
        <MiniStat
          label="Closed Today"
          value={totalTodaySold}
          sub={`Yesterday: ${totalYesterdaySold}`}
          accent="#34d399"
        />
        <MiniStat
          label="Revenue Today"
          value={fmt(totalTodayRev)}
          sub={`Yesterday: ${fmt(totalYesterdayRev)}`}
          accent="#fb923c"
        />
      </div>

      {/* Today vs Yesterday table */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/20 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#C3C6D4]/15 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1E1C0D] tracking-tight">
            Today vs Yesterday — Per Worker
          </h2>
          <span className="text-[10px] text-[#737783] uppercase tracking-widest">
            IST calendar day
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#F5EED6]">
                {[
                  'Gig Worker',
                  'Status',
                  'Leads Today',
                  'Leads Yesterday',
                  'Sold Today',
                  'Sold Yesterday',
                  'Revenue Today',
                  'Revenue Yesterday',
                  'All-time Conv%',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-left text-[10px] font-bold text-[#434652] tracking-widest uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-[#737783]">
                    No gig workers found
                  </td>
                </tr>
              )}
              {workers.map((w: any) => (
                <tr
                  key={w.id}
                  className="border-b border-[#C3C6D4]/10 hover:bg-[#FFF9E9]/70 transition-colors"
                >
                  {/* Worker name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#003178] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                        {w.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E1C0D]">{w.name}</p>
                      </div>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700`}
                    >
                      Active
                    </span>
                  </td>
                  {/* Leads Today */}
                  <td className="py-3 px-4">
                    <span className="text-xl font-extrabold font-mono text-[#003178]">
                      {w.today.leads_assigned}
                    </span>
                    <Delta today={w.today.leads_assigned} yesterday={w.yesterday.leads_assigned} />
                  </td>
                  {/* Leads Yesterday */}
                  <td className="py-3 px-4 text-sm font-mono text-[#434652]">
                    {w.yesterday.leads_assigned}
                  </td>
                  {/* Sold Today */}
                  <td className="py-3 px-4">
                    <span className="text-xl font-extrabold font-mono text-emerald-600">
                      {w.today.deals_closed}
                    </span>
                    <Delta today={w.today.deals_closed} yesterday={w.yesterday.deals_closed} />
                  </td>
                  {/* Sold Yesterday */}
                  <td className="py-3 px-4 text-sm font-mono text-[#434652]">
                    {w.yesterday.deals_closed}
                  </td>
                  {/* Revenue Today */}
                  <td className="py-3 px-4">
                    <span className="text-sm font-bold font-mono text-[#003178]">
                      {fmt(w.today.revenue)}
                    </span>
                    <RevDelta today={w.today.revenue} yesterday={w.yesterday.revenue} />
                  </td>
                  {/* Revenue Yesterday */}
                  <td className="py-3 px-4 text-sm font-mono text-[#434652]">
                    {fmt(w.yesterday.revenue)}
                  </td>
                  {/* Conv% */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        w.conversion_rate >= 30
                          ? 'bg-green-100 text-green-800'
                          : w.conversion_rate >= 15
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {w.conversion_rate}%
                    </span>
                  </td>
                  {/* View */}
                  <td className="py-3 px-4">
                    <Link
                      href={`${basePath}/gig-workers/${w.id}`}
                      className="text-xs font-semibold text-[#003178] hover:underline whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversions panel */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/20 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#C3C6D4]/15">
          <h2 className="text-sm font-bold text-[#1E1C0D] tracking-tight">
            Recent Conversions — Meetings Closed
          </h2>
          <p className="text-[11px] text-[#737783] mt-0.5">
            Leads that moved to <span className="font-bold text-emerald-600">Sold</span> status
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-[#F5EED6]">
                {['Customer', 'Phone', 'Address', 'Gig Worker', 'Revenue', 'Sold At'].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-left text-[10px] font-bold text-[#434652] tracking-widest uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {conversions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#737783]">
                    No conversions yet
                  </td>
                </tr>
              )}
              {conversions.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b border-[#C3C6D4]/10 hover:bg-[#FFF9E9]/70 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-semibold text-[#1E1C0D]">
                    {c.customer_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#434652] font-mono">{c.customer_phone}</td>
                  <td className="py-3 px-4 text-sm text-[#434652] max-w-[200px] truncate">
                    {c.address}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#003178]/10 text-[#003178]">
                      {c.sales_rep_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-bold font-mono text-emerald-700">
                    {c.actual_revenue
                      ? fmt(c.actual_revenue)
                      : c.expected_revenue
                      ? `~${fmt(c.expected_revenue)}`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#737783]">
                    {c.sold_at
                      ? new Date(c.sold_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
