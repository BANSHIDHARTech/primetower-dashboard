import { format, subMonths } from 'date-fns';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { HomeLiveStats } from '@/components/dashboard/HomeLiveStats';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { LeadPipeline } from '@/components/leads/LeadPipeline';
import { fetchWithCookie } from '@/lib/queries/server-api';
import type { Lead } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminDashboard() {
  const [leadsRes, dealersRes] = await Promise.all([
    fetchWithCookie('/leads'),
    fetchWithCookie('/users/dealers'),
  ]);

  const allLeads = (leadsRes || []) as Lead[];
  const dealers = dealersRes || [];

  // Compute aggregates
  const expectedRevenue = allLeads.reduce(
    (sum, l) => sum + (l.systemCost || 0),
    0,
  );
  const actualRevenue = allLeads.reduce(
    (sum, l) => sum + (l.netCost || 0),
    0,
  );
  const soldLeads = allLeads.filter((l) => l.status === 'sold').length;

  // Monthly revenue for chart (last 6 months)
  const now = new Date();
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
      expected: monthLeads.reduce((s, l) => s + (l.systemCost || 0), 0),
      actual: monthLeads.reduce((s, l) => s + (l.netCost || 0), 0),
    };
  });

  // Funnel
  const newCount = allLeads.filter((l) => l.status === 'new_lead' || l.status === 'new').length;
  const svCount = allLeads.filter((l) => l.status === 'site_visit_scheduled').length;
  const quotedCount = allLeads.filter((l) => l.status === 'quoted').length;
  const total = allLeads.length || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
          SuperAdmin Dashboard
        </h1>
        <p className="text-sm text-[#434652]">
          Overview of {allLeads.length} leads across {dealers.length} dealers
        </p>
      </div>

      {/* Live Meeting & Revenue Stats */}
      <HomeLiveStats />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Expected Revenue"
          value={expectedRevenue}
          subtitle={`${allLeads.length} total leads`}
          color="blue"
        />
        <StatsCard
          title="Actual Revenue"
          value={actualRevenue}
          subtitle={`${soldLeads} deals closed`}
          color="green"
        />
        <StatsCard
          title="Pipeline Value"
          value={expectedRevenue - actualRevenue}
          subtitle={`${quotedCount} quoted leads`}
          color="orange"
        />
      </div>

      {/* Chart + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={chartData} />
        <LeadPipeline leads={allLeads} />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 p-6">
        <h3 className="text-sm font-bold text-[#1E1C0D] mb-4 tracking-tight">
          Conversion Funnel
        </h3>
        <div className="space-y-3">
          {[
            { label: 'New', count: newCount, color: 'bg-blue-500' },
            { label: 'Site Visit', count: svCount, color: 'bg-purple-500' },
            { label: 'Quoted', count: quotedCount, color: 'bg-yellow-500' },
            { label: 'Sold', count: soldLeads, color: 'bg-green-500' },
          ].map((stage) => (
            <div key={stage.label}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-semibold text-[#434652]">
                  {stage.label}
                </span>
                <span className="text-xs font-bold text-[#1E1C0D]">
                  {stage.count} ({Math.round((stage.count / total) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-[#E9E2CB] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.color}`}
                  style={{ width: `${(stage.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
