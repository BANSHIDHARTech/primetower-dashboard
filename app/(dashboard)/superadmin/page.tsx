import { format, subMonths } from 'date-fns';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { HomeLiveStats } from '@/components/dashboard/HomeLiveStats';
import { KeyMetricsTab } from '@/components/dashboard/KeyMetricsTab';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { LeadPipeline } from '@/components/leads/LeadPipeline';
import { fetchWithCookie } from '@/lib/queries/server-api';
import { getMetaAdSpend, getMetaLeadCounts } from '@/lib/server-meta';
import type { Lead } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const [leadsRes, dealersRes] = await Promise.all([
    fetchWithCookie('/leads'),
    fetchWithCookie('/users/dealers'),
  ]);

  const allLeads = (leadsRes || []) as Lead[];
  const dealers = dealersRes || [];

  // ── Meta Ad Spend (fetched from Meta Graph API via server helper)
  // Requires META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to be set in environment.
  let metaAdSpend = { today: 0, mtd: 0 };
  let metaLeads = { today: 0, mtd: 0 };
  try {
    const [adSpendRes, leadRes] = await Promise.all([getMetaAdSpend(), getMetaLeadCounts()]);
    metaAdSpend = adSpendRes || metaAdSpend;
    metaLeads = leadRes || metaLeads;
  } catch (e) {
    console.warn('Failed to fetch Meta metrics:', e);
  }

  const now = new Date();
  
  // ── Compute aggregates ────────────────────────────
  const currentMonthLeads = allLeads.filter((l) => {
    const d = new Date(l.createdAt || new Date());
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const invoiceValue = currentMonthLeads
    .filter((l) => l.status === 'sold')
    .reduce((sum, l) => sum + (Number(l.systemCost) || 0), 0);

  const actualValue = (invoiceValue * 100) / 108.9;
  const soldCurrentMonth = currentMonthLeads.filter((l) => l.status === 'sold').length;
  const soldLeads = allLeads.filter((l) => l.status === 'sold').length;

  // Monthly revenue for chart (last 6 months) — existing, unchanged
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(now, 5 - i);
    const monthKey = format(monthDate, 'MMM yy');
    const monthLeads = allLeads.filter((l) => {
      const d = new Date(l.createdAt || new Date());
      return (
        d.getMonth() === monthDate.getMonth() &&
        d.getFullYear() === monthDate.getFullYear()
      );
    });
    return {
      month: monthKey,
      expected: monthLeads.reduce((s, l) => s + (Number(l.systemCost) || 0), 0),
      actual: monthLeads.reduce((s, l) => {
        const invoiceVal = Number(l.systemCost) || 0;
        return s + (invoiceVal * 100) / 108.9;
      }, 0),
    };
  });

  const total = allLeads.length || 1;

  // ── Active tab ──────────────────────────────────────────────────────────
  const activeTab = searchParams.tab === 'key-metrics' ? 'key-metrics' : 'overview';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
            SuperAdmin Dashboard
          </h1>
          <p className="text-sm text-[#434652]">
            Overview of {allLeads.length} leads across {dealers.length} dealers
          </p>
        </div>

        {/* ── Tab switcher ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-[#F5EED6] rounded-xl p-1 self-start sm:self-auto">
          <a
            href="/superadmin"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#003178] text-white shadow-sm'
                : 'text-[#434652] hover:text-[#003178]'
            }`}
          >
            📊 Overview
          </a>
          <a
            href="/superadmin?tab=key-metrics"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'key-metrics'
                ? 'bg-[#003178] text-white shadow-sm'
                : 'text-[#434652] hover:text-[#003178]'
            }`}
          >
            🎯 Key Metrics
          </a>
        </div>
      </div>

      {/* ── Key Metrics Tab ─────────────────────────────────────────────── */}
      {activeTab === 'key-metrics' && (
        <KeyMetricsTab allLeads={allLeads} metaAdSpend={metaAdSpend} metaLeads={metaLeads} />
      )}

      {/* ── Overview Tab (all existing content — unchanged) ─────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Live Meeting & Revenue Stats */}
          <HomeLiveStats />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatsCard
              title="Invoice Value"
              value={invoiceValue}
              subtitle={`${soldCurrentMonth} deals closed this month`}
              color="blue"
            />
            <StatsCard
              title="Actual Revenue"
              value={actualValue}
              subtitle={`Net after GST`}
              color="green"
            />
          </div>

          {/* Chart + Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={chartData} />
            <LeadPipeline leads={allLeads} />
          </div>
        </>
      )}
    </div>
  );
}
