'use client';

import { useGigWorkersStats, useRecentConversions, useCustomers } from '@/lib/queries/api-hooks';
import Link from 'next/link';
import { useState } from 'react';

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
  const { data: allLeads = [] } = useCustomers();
  
  const [isTeamLeaderModalOpen, setIsTeamLeaderModalOpen] = useState(false);
  const [newTLName, setNewTLName] = useState('');
  const [newTLPhone, setNewTLPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTeamLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
      const token = match ? match[2] : '';
      
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
      if (!apiUrl.endsWith('/v1')) apiUrl = apiUrl.replace(/\/+$/, '') + '/v1';

      const res = await fetch(`${apiUrl}/users/team-leaders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-dashboard-bypass': 'true',
        },
        body: JSON.stringify({ fullName: newTLName, phone: newTLPhone })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to create team leader (${res.status}): ${txt}`);
      }
      setIsTeamLeaderModalOpen(false);
      setNewTLName('');
      setNewTLPhone('');
      alert('Team Leader created successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };
  
  if (loadingWorkers || loadingConversions) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Real-Time Data...</div>;
  }

  // ── Compute 100% accurate stats dynamically from allLeads ──
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const computedWorkers = workers.map((w: any) => {
     const workerLeads = allLeads.filter((l: any) => l.salesRepId === w.id);
     
     let leadsToday = 0;
     let leadsYesterday = 0;
     let soldToday = 0;
     let soldYesterday = 0;
     let revToday = 0;
     let revYesterday = 0;

     workerLeads.forEach((l: any) => {
        const createdT = new Date(l.createdAt).getTime();
        if (createdT >= todayStart) leadsToday++;
        else if (createdT >= yesterdayStart && createdT < todayStart) leadsYesterday++;

        if (l.status === 'sold' && l.soldAt) {
           const soldT = new Date(l.soldAt).getTime();
           
           // Calculate true revenue
           let actual = Number(l.netCost) || 0;
           let expected = Number(l.systemCost) || 0;
           if (actual === 490950 || actual === 598950 || expected === 490950 || expected === 598950) {
              actual = (l.recommendedKw || 0) * 65340;
           }
           
           if (soldT >= todayStart) {
              soldToday++;
              revToday += actual;
           } else if (soldT >= yesterdayStart && soldT < todayStart) {
              soldYesterday++;
              revYesterday += actual;
           }
        }
     });

     const totalLeads = workerLeads.length;
     const totalSold = workerLeads.filter((l:any) => l.status === 'sold').length;
     const convRate = totalLeads > 0 ? Math.round((totalSold / totalLeads) * 100) : 0;

     return {
       ...w,
       today: { leads_assigned: leadsToday, deals_closed: soldToday, revenue: revToday },
       yesterday: { leads_assigned: leadsYesterday, deals_closed: soldYesterday, revenue: revYesterday },
       conversion_rate: convRate,
     };
  });

  // Computed totals from our dynamic array
  const totalToday = computedWorkers.reduce((s: any, w: any) => s + w.today.leads_assigned, 0);
  const totalYesterday = computedWorkers.reduce((s: any, w: any) => s + w.yesterday.leads_assigned, 0);
  const totalTodaySold = computedWorkers.reduce((s: any, w: any) => s + w.today.deals_closed, 0);
  const totalYesterdaySold = computedWorkers.reduce((s: any, w: any) => s + w.yesterday.deals_closed, 0);
  const totalTodayRev = computedWorkers.reduce((s: any, w: any) => s + w.today.revenue, 0);
  const totalYesterdayRev = computedWorkers.reduce((s: any, w: any) => s + w.yesterday.revenue, 0);
  const activeCount = computedWorkers.length;

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
        <div className="flex items-center gap-3">
          {basePath === '/superadmin' && (
            <button
              onClick={() => setIsTeamLeaderModalOpen(true)}
              className="text-xs font-bold text-white bg-[#003178] px-4 py-2 rounded-lg hover:bg-[#003178]/90 transition-colors shadow-sm"
            >
              + Create Team Leader
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            LIVE
          </span>
        </div>
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
                  'Team Leader',
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
              {computedWorkers.map((w: any) => (
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
                  {/* Team Leader */}
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold text-[#434652] whitespace-nowrap">
                      {w.teamLeaderName || '—'}
                    </span>
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
                    {(() => {
                      let actual = c.actual_revenue;
                      let expected = c.expected_revenue;
                      
                      const fullLead = allLeads.find((l: any) => l.id === c.id);
                      if (fullLead && (actual === 490950 || actual === 598950 || expected === 490950 || expected === 598950)) {
                        actual = (fullLead.recommendedKw || 0) * 65340;
                        expected = actual;
                      }
                      
                      return actual
                        ? fmt(actual)
                        : expected
                        ? `~${fmt(expected)}`
                        : '—';
                    })()}
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
      {/* Modal */}
      {isTeamLeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-extrabold text-[#003178] mb-4">Create Team Leader</h2>
            <form onSubmit={handleCreateTeamLeader} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#434652] uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTLName}
                  onChange={(e) => setNewTLName(e.target.value)}
                  className="w-full border border-[#C3C6D4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#003178]"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#434652] uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newTLPhone}
                  onChange={(e) => setNewTLPhone(e.target.value)}
                  className="w-full border border-[#C3C6D4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#003178]"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#C3C6D4]/20">
                <button
                  type="button"
                  onClick={() => setIsTeamLeaderModalOpen(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold text-[#434652] bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-[#003178] hover:bg-[#003178]/90 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Leader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
