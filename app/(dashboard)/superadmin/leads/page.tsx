import { fetchWithCookie } from '@/lib/queries/server-api';
import { LeadCard } from '@/components/leads/LeadCard';
import type { Lead, LeadStatus } from '@/lib/types';
import { LEAD_STATUS_LABELS } from '@/lib/types';

export default async function SuperAdminLeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const leads = await fetchWithCookie('/leads').catch(() => []);
  let allLeads = (leads || []) as Lead[];

  if (searchParams.status && searchParams.status !== 'all') {
    allLeads = allLeads.filter((l) => l.status === searchParams.status);
  }

  const tabs: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Quoted', value: 'quoted' },
    { label: 'Sold', value: 'sold' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const activeTab = searchParams.status || 'all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
          All Leads
        </h1>
        <p className="text-sm text-[#434652]">
          {allLeads.length} leads across all dealers
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.value}
            href={`/superadmin/leads?status=${tab.value}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.value
                ? 'bg-[#003178] text-white'
                : 'bg-[#E9E2CB] text-[#434652] hover:bg-[#D9E2FF]'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EED6] text-left">
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Customer
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Status
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Revenue
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {allLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
            {allLeads.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-[#737783]">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
