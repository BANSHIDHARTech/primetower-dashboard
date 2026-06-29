import { format } from 'date-fns';
import type { Lead } from '@/lib/types';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/types';

export function LeadCard({ lead, salesRepName }: { lead: Lead; salesRepName?: string }) {
  const revenueAmount = lead.systemCost || lead.netCost || 0;
  const revenue = revenueAmount
    ? revenueAmount.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      })
    : '—';

  return (
    <tr className="border-b border-[#C3C6D4]/10 hover:bg-[#FFF9E9]/50 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-semibold text-[#1E1C0D]">{lead.customerName}</p>
        <p className="text-xs text-[#737783]">{lead.customerPhone}</p>
      </td>
      <td className="py-3 px-4">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEAD_STATUS_COLORS[lead.status]}`}
        >
          {LEAD_STATUS_LABELS[lead.status] || 'New'}
        </span>
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-[#003178]">{revenue}</td>
      {salesRepName !== undefined && (
        <td className="py-3 px-4 text-sm text-[#434652]">{salesRepName || '—'}</td>
      )}
      <td className="py-3 px-4 text-xs text-[#737783]">
        {lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM yyyy') : '—'}
      </td>
    </tr>
  );
}
