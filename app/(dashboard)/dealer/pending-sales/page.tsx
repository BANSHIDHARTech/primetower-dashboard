import { fetchWithCookie } from '@/lib/queries/server-api';
import { differenceInDays, format } from 'date-fns';
import type { Lead } from '@/lib/types';

export default async function PendingSalesPage() {
  const leads = await fetchWithCookie('/leads').catch(() => []);
  const pendingLeads = (leads || []).filter((l: Lead) => l.status === 'quoted') as Lead[];
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
          Pending Sales
        </h1>
        <p className="text-sm text-[#434652]">
          {pendingLeads.length} leads waiting for conversion
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EED6] text-left">
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Customer
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Phone
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Revenue
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Quoted On
              </th>
              <th className="py-3 px-4 text-xs font-bold text-[#434652] tracking-wider uppercase">
                Days Pending
              </th>
            </tr>
          </thead>
          <tbody>
            {pendingLeads.map((lead) => {
              const quotedDate = lead.quotation_sent_at
                ? new Date(lead.quotation_sent_at)
                : new Date(lead.created_at);
              const daysPending = differenceInDays(now, quotedDate);
              const isUrgent = daysPending > 7;

              return (
                <tr
                  key={lead.id}
                  className={`border-b border-[#C3C6D4]/10 transition-colors ${
                    isUrgent ? 'bg-[#FB6D00]/5' : 'hover:bg-[#FFF9E9]/50'
                  }`}
                >
                  <td className="py-3 px-4 text-sm font-semibold text-[#1E1C0D]">
                    {lead.customer_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#434652]">
                    {lead.customer_phone}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-[#003178]">
                    {(lead.expected_revenue || 0).toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#737783]">
                    {format(quotedDate, 'dd MMM yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isUrgent
                          ? 'bg-[#FB6D00]/15 text-[#FB6D00]'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {daysPending}d
                    </span>
                  </td>
                </tr>
              );
            })}
            {pendingLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-[#737783]">
                  No pending sales — great work! 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
