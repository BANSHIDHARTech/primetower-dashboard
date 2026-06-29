'use client';

import { useGigWorkerDetail } from '@/lib/queries/api-hooks';

const fmt = (n: number) =>
  n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

export function WorkerDetailClient({ workerId }: { workerId: string }) {
  const { data, isLoading } = useGigWorkerDetail(workerId);

  if (isLoading || !data) {
    return <div className="p-8 text-center text-slate-500">Loading worker profile...</div>;
  }

  if (!data.worker) {
    return <div className="p-8 text-center text-red-500">Worker not found</div>;
  }

  const { worker, today, yesterday, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Worker Header Card */}
      <div className="bg-gradient-to-r from-[#003178] to-[#0D47A1] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center font-extrabold text-3xl shadow-inner backdrop-blur-sm border border-white/20">
            {worker.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{worker.name}</h1>
            <p className="text-white/70 mt-1 font-medium text-sm">
              Joined {new Date(worker.joined_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="ml-auto bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm text-center min-w-[120px]">
            <p className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">Conv Rate</p>
            <p className="text-3xl font-extrabold font-mono">{worker.conversion_rate_all_time}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Stats */}
        <div className="space-y-6 md:col-span-1">
          {/* Today vs Yesterday Panel */}
          <div className="bg-white rounded-2xl border border-[#C3C6D4]/30 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#C3C6D4]/15 bg-[#F9FAFB]">
              <h2 className="text-sm font-bold text-[#1E1C0D] tracking-tight">Today vs Yesterday</h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-[#737783] font-semibold uppercase tracking-wider mb-1">Leads Assigned</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-[#003178]">{today.leads}</span>
                  <span className="text-sm font-mono text-[#737783]">yest: {yesterday.leads}</span>
                </div>
              </div>
              <div className="h-px bg-[#C3C6D4]/20"></div>
              <div>
                <p className="text-xs text-[#737783] font-semibold uppercase tracking-wider mb-1">Deals Closed</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold font-mono text-emerald-600">{today.closed}</span>
                  <span className="text-sm font-mono text-[#737783]">yest: {yesterday.closed}</span>
                </div>
              </div>
              <div className="h-px bg-[#C3C6D4]/20"></div>
              <div>
                <p className="text-xs text-[#737783] font-semibold uppercase tracking-wider mb-1">Revenue Generated</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold font-mono text-[#1E1C0D]">{fmt(today.revenue)}</span>
                  <span className="text-sm font-mono text-[#737783]">yest: {fmt(yesterday.revenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All Time Stats */}
          <div className="bg-white rounded-2xl border border-[#C3C6D4]/30 shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#1E1C0D] tracking-tight mb-4">All-Time Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#434652]">Total Leads</span>
                <span className="font-bold font-mono">{worker.total_leads_all_time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#434652]">Total Closed</span>
                <span className="font-bold font-mono text-emerald-600">{worker.deals_closed_all_time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#434652]">Total Revenue</span>
                <span className="font-bold font-mono text-[#003178]">{fmt(worker.revenue_all_time)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-[#C3C6D4]/30 shadow-sm overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-[#C3C6D4]/15 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <h2 className="text-base font-bold text-[#1E1C0D] tracking-tight">Recent Activity Feed</h2>
              <span className="text-xs font-semibold text-[#003178] bg-[#003178]/10 px-2 py-1 rounded-full">
                {recentActivity.length} leads
              </span>
            </div>
            
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-[#737783] text-sm">No activity recorded yet.</div>
              ) : (
                <div className="relative border-l-2 border-[#C3C6D4]/30 ml-3 space-y-8 pb-4">
                  {recentActivity.map((activity: any, i: number) => {
                    const isSold = activity.status === 'sold';
                    const isRejected = activity.status === 'rejected';
                    
                    return (
                      <div key={activity.id} className="relative pl-6">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
                          ${isSold ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-[#003178]'}`} 
                        />
                        
                        <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#C3C6D4]/20 hover:border-[#003178]/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm font-bold text-[#1E1C0D]">{activity.customer_name}</p>
                              <p className="text-[10px] text-[#737783] uppercase tracking-widest mt-0.5 font-semibold">
                                {new Date(activity.created_at).toLocaleString('en-IN', {
                                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                              ${isSold ? 'bg-emerald-100 text-emerald-700' : 
                                isRejected ? 'bg-rose-100 text-rose-700' : 
                                'bg-[#003178]/10 text-[#003178]'}`}
                            >
                              {activity.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex gap-4 mt-3 pt-3 border-t border-[#C3C6D4]/15">
                            <div>
                              <p className="text-[10px] text-[#737783] uppercase">Stage</p>
                              <p className="text-xs font-semibold text-[#1E1C0D]">{activity.pipeline_stage || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#737783] uppercase">{isSold ? 'Actual Revenue' : 'Expected Revenue'}</p>
                              <p className={`text-xs font-bold font-mono ${isSold ? 'text-emerald-600' : 'text-[#003178]'}`}>
                                {isSold 
                                  ? fmt(activity.actual_revenue || 0) 
                                  : fmt(activity.expected_revenue || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
