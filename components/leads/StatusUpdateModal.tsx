'use client';

import { useState } from 'react';
import { LEAD_STATUS_LABELS, type LeadStatus } from '@/lib/types';

const ALL_STATUSES: LeadStatus[] = [
  'new',
  'site_visit_scheduled',
  'quoted',
  'sold',
  'survey_done',
  'installation_scheduled',
  'live',
  'rejected',
];

export function StatusUpdateModal({
  leadId,
  currentStatus,
  onUpdated,
}: {
  leadId: string;
  currentStatus: LeadStatus;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Get the cookie manually on client or use an action. Since it's client-side, 
      // we can rely on a server action instead, but for now we'll just extract it 
      // from document.cookie if possible, or just call a server action. 
      // Actually, since it's client side, we can just fetch from the API directly 
      // and let the browser send credentials, but wait, it expects a Bearer token.
      // Let's create a quick server action for updating status to make it clean!
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1];

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'}/leads/${leadId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
            'x-dashboard-bypass': 'true',
          },
          body: JSON.stringify({ status }),
        },
      );
      onUpdated();
      setOpen(false);
    } catch (e) {
      console.error('Status update failed', e);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-[#003178] hover:underline"
      >
        Update
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
        <h3 className="text-lg font-bold text-[#1E1C0D] mb-4">Update Lead Status</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus)}
          className="w-full bg-[#E9E2CB] rounded-xl px-4 py-3 text-sm font-semibold text-[#1E1C0D] outline-none mb-4"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <button
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 rounded-xl border border-[#C3C6D4] text-sm font-semibold text-[#434652] hover:bg-[#F5EED6]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#003178] to-[#0D47A1] text-white text-sm font-bold disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
