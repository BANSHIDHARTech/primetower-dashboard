import { StatsCard } from '@/components/dashboard/StatsCard';
import { HomeLiveStats } from '@/components/dashboard/HomeLiveStats';
import { LeadPipeline } from '@/components/leads/LeadPipeline';
import { LeadCard } from '@/components/leads/LeadCard';
import { fetchWithCookie } from '@/lib/queries/server-api';
import type { Lead, User } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DealerDashboard() {
  // Fetch dealer's leads & sales reps
  const [leadsRes, salesRepsRes] = await Promise.all([
    fetchWithCookie('/leads'),
    fetchWithCookie('/users/salesreps'),
  ]);

  const allLeads = (leadsRes || []) as Lead[];
  const reps = (salesRepsRes || []) as User[];

  const expectedRevenue = allLeads.reduce(
    (sum, l) => sum + (l.systemCost || 0),
    0,
  );
  const actualRevenue = allLeads.reduce(
    (sum, l) => sum + (l.netCost || 0),
    0,
  );

  // Per-rep stats
  const repStats = reps.map((rep) => {
    const repLeads = allLeads.filter((l) => l.salesRepId === rep.id);
    const total = repLeads.length;
    const quoted = repLeads.filter((l) => l.status === 'quoted').length;
    const sold = repLeads.filter((l) => l.status === 'sold').length;
    const revenue = repLeads.reduce((s, l) => s + (l.netCost || 0), 0);
    const convRate = total > 0 ? Math.round((sold / total) * 100) : 0;
    return { rep, total, quoted, sold, revenue, convRate };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
          Dealer Dashboard
        </h1>
        <p className="text-sm text-[#434652]">
          {allLeads.length} leads · {reps.length} sales reps
        </p>
      </div>

      {/* Live Meeting & Revenue Stats */}
      <HomeLiveStats />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Expected Earnings"
          value={expectedRevenue}
          subtitle={`${allLeads.length} total leads`}
          color="blue"
        />
        <StatsCard
          title="Actual Earnings"
          value={actualRevenue}
          subtitle={`${allLeads.filter((l) => l.status === 'sold').length} deals closed`}
          color="green"
        />
      </div>

      {/* Pipeline */}
      <LeadPipeline leads={allLeads} />

      {/* Sales Team Performance */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 overflow-hidden">
        <div className="p-4 border-b border-[#C3C6D4]/10">
          <h3 className="text-sm font-bold text-[#1E1C0D] tracking-tight">
            Sales Team Performance
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EED6] text-left">
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Sales Rep
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Leads
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Quoted
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Sold
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Revenue
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Conv %
              </th>
            </tr>
          </thead>
          <tbody>
            {repStats.map(({ rep, total, quoted, sold, revenue, convRate }) => (
              <tr
                key={rep.id}
                className="border-b border-[#C3C6D4]/10 hover:bg-[#FFF9E9]/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-semibold text-[#1E1C0D]">
                  {rep.fullName || rep.full_name}
                </td>
                <td className="py-3 px-4 text-sm text-[#434652]">{total}</td>
                <td className="py-3 px-4 text-sm text-[#434652]">{quoted}</td>
                <td className="py-3 px-4 text-sm font-semibold text-[#2E7D32]">
                  {sold}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-[#003178]">
                  {revenue.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      convRate >= 30
                        ? 'bg-green-100 text-green-800'
                        : convRate >= 15
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {convRate}%
                  </span>
                </td>
              </tr>
            ))}
            {repStats.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-[#737783]">
                  No sales reps found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 overflow-hidden">
        <div className="p-4 border-b border-[#C3C6D4]/10">
          <h3 className="text-sm font-bold text-[#1E1C0D] tracking-tight">
            Recent Leads
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EED6] text-left">
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">Customer</th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">Revenue</th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {allLeads.slice(0, 10).map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
