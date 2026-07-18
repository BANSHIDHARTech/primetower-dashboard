import { fetchWithCookie } from '@/lib/queries/server-api';
import type { Lead, User } from '@/lib/types';

export default async function DealersPage() {
  const [dealers, leads] = await Promise.all([
    fetchWithCookie('/users/dealers').catch(() => []),
    fetchWithCookie('/leads').catch(() => []),
  ]);

  const dealerList = (dealers || []) as User[];

  const dealerStats = dealerList.map((dealer) => {
    // The /leads list endpoint returns camelCase; use 'any' to access
    const dealerLeads = (leads as any[]).filter((l: any) => l.dealerId === dealer.id || l.dealer_id === dealer.id);
    const revenue = dealerLeads.reduce(
      (sum: number, l: any) => sum + (l.netCost || l.net_cost || l.actualRevenue || l.actual_revenue || 0),
      0,
    );
    return { dealer, leadCount: dealerLeads.length, revenue };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
          Dealers
        </h1>
        <p className="text-sm text-[#434652]">
          {dealerList.length} registered dealers
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EED6] text-left">
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Name
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Phone
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Total Leads
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Revenue
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {dealerStats.map(({ dealer, leadCount, revenue }) => (
              <tr
                key={dealer.id}
                className="border-b border-[#C3C6D4]/10 hover:bg-[#FFF9E9]/50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-semibold text-[#1E1C0D]">
                  {(dealer as any).fullName ?? (dealer as any).full_name}
                </td>
                <td className="py-3 px-4 text-sm text-[#434652]">
                  {dealer.phone}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-[#003178]">
                  {leadCount}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-[#2E7D32]">
                  {revenue.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      dealer.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {dealer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {dealerStats.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-[#737783]">
                  No dealers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
