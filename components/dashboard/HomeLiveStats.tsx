'use client';

import { useDashboardStats } from '@/lib/queries/api-hooks';

const fmt = (n: number) =>
  n.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

function StatCard({ title, value, subtitle, accent }: { title: string, value: string | number, subtitle?: string, accent: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1 relative overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        border: `1px solid ${accent}40`,
        boxShadow: `0 4px 20px -2px ${accent}15`
      }}
    >
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"
        style={{ background: accent }}
      />
      
      <p className="text-[11px] font-bold uppercase tracking-widest z-10" style={{ color: accent }}>
        {title}
      </p>
      <p className="text-3xl font-extrabold font-mono text-white leading-none tracking-tight z-10 my-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-slate-400 font-medium z-10">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function HomeLiveStats({ dealerId }: { dealerId?: string }) {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return <div className="p-4 text-center text-sm text-slate-500">Loading Live Stats...</div>;
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight text-[#1E1C0D] uppercase">
          Live Performance Overview
        </h2>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          REALTIME
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Row 1: Meetings & Closures */}
        <StatCard
          title="Meetings Today"
          value={stats.meetingsToday}
          subtitle={`Yesterday: ${stats.meetingsYesterday}`}
          accent="#60a5fa" 
        />
        <StatCard
          title="Closed Today"
          value={stats.closedToday}
          subtitle={`Yesterday: ${stats.closedYesterday}`}
          accent="#34d399" 
        />
        <StatCard
          title="Total Meetings"
          value={stats.totalMeetings}
          subtitle={`${stats.totalConverted} total converted`}
          accent="#a78bfa" 
        />
        <StatCard
          title="Pending Meetings"
          value={stats.pendingMeetings}
          subtitle="Awaiting closure"
          accent="#fb923c" 
        />

        {/* Row 2: Revenue */}
        <StatCard
          title="Revenue Today"
          value={fmt(stats.revenueToday)}
          subtitle={`Yesterday: ${fmt(stats.revenueYesterday)}`}
          accent="#f43f5e" 
        />
        <StatCard
          title="Expected Revenue"
          value={fmt(stats.expectedRevenue)}
          subtitle="Pipeline potential"
          accent="#facc15" 
        />
        <StatCard
          title="Actual Revenue"
          value={fmt(stats.actualRevenue)}
          subtitle="Total closed"
          accent="#2dd4bf" 
        />
        <div className="rounded-2xl p-5 flex flex-col justify-center items-center bg-[#0d1117] border border-slate-800">
          <p className="text-xs text-slate-500 font-medium text-center">
            Stats auto-update based on Gig Worker activity
          </p>
        </div>
      </div>
    </div>
  );
}
