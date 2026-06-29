import type { Lead, LeadStatus } from '@/lib/types';

const STAGES: LeadStatus[] = ['new', 'site_visit_scheduled', 'quoted', 'sold', 'live'];

function formatLabel(s: string) {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  site_visit_scheduled: 'bg-purple-500',
  quoted: 'bg-yellow-500',
  sold: 'bg-green-500',
  live: 'bg-emerald-500',
};

export function LeadPipeline({ leads }: { leads: Lead[] }) {
  const total = leads.length || 1;

  return (
    <div className="bg-white rounded-2xl border border-[#C3C6D4]/15 p-6">
      <h3 className="text-sm font-bold text-[#1E1C0D] mb-4 tracking-tight">
        Lead Pipeline
      </h3>
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const count = leads.filter((l) => l.status === stage).length;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#434652]">
                  {formatLabel(stage)}
                </span>
                <span className="text-xs font-bold text-[#1E1C0D]">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-[#E9E2CB] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${STAGE_COLORS[stage] || 'bg-gray-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
