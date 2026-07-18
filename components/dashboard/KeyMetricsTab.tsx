import type { Lead } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────
const INR = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const pct = (num: number, den: number) =>
  den === 0 ? '—' : `${((num / den) * 100).toFixed(1)}%`;

const avg = (arr: number[]) =>
  arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;

/** Return YYYY-MM-DD in IST */
function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/** Return YYYY-MM-DD of the 1st of current month in IST */
function mtdStartIST(): string {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return d.slice(0, 7) + '-01';
}

function dateStr(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  gradient,
}: {
  title: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div className="rounded-2xl px-6 py-4 mb-4" style={{ background: gradient }}>
      <h2 className="text-sm font-extrabold text-white tracking-widest uppercase">{title}</h2>
      <p className="text-[11px] text-white/70 mt-0.5">{subtitle}</p>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  todayValue: string | number;
  mtdValue: string | number;
  todaySub?: string;
  mtdSub?: string;
  formula?: string;
  accent: string;
}

function MetricCard({
  label,
  todayValue,
  mtdValue,
  todaySub,
  mtdSub,
  formula,
  accent,
}: MetricCardProps) {
  const display = (v: string | number) =>
    v === null || v === undefined || v === '' ? '—' : v;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
      style={{ border: `1px solid ${accent}30` }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 border-b"
        style={{ borderColor: `${accent}20`, background: `${accent}0d` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#1E1C0D]">{label}</p>
        {formula && (
          <p className="text-[10px] text-[#737783] mt-0.5 font-mono">{formula}</p>
        )}
      </div>

      {/* Today + MTD */}
      <div className="grid grid-cols-2">
        <div className="px-5 py-4 border-r" style={{ borderColor: `${accent}20` }}>
          <p className="text-[10px] font-bold text-[#737783] uppercase tracking-wider mb-1">
            Today
          </p>
          <p className="text-2xl font-extrabold font-mono leading-none" style={{ color: accent }}>
            {display(todayValue)}
          </p>
          {todaySub && <p className="text-[10px] text-[#737783] mt-1">{todaySub}</p>}
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold text-[#737783] uppercase tracking-wider mb-1">
            This Month (MTD)
          </p>
          <p className="text-2xl font-extrabold font-mono leading-none" style={{ color: accent }}>
            {display(mtdValue)}
          </p>
          {mtdSub && <p className="text-[10px] text-[#737783] mt-1">{mtdSub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export interface MetaAdSpend {
  today: number;
  mtd: number;
}

interface KeyMetricsTabProps {
  allLeads: Lead[];
  /** Meta ad spend — pass { today: 0, mtd: 0 } until backend/Meta API is wired. */
  metaAdSpend: MetaAdSpend;
}

export function KeyMetricsTab({ allLeads, metaAdSpend }: KeyMetricsTabProps) {
  const today    = todayIST();
  const mtdStart = mtdStartIST();

  const isToday = (iso: string | null | undefined) => dateStr(iso) === today;
  const isMTD   = (iso: string | null | undefined) => {
    const d = dateStr(iso);
    return d !== '' && d >= mtdStart && d <= today;
  };

  // ═══════════════════════════════════════════════
  // Section 1 — Marketing & Leads (Total Leads for now)
  // ═══════════════════════════════════════════════

  // Using all leads since 'source' field is not available yet
  const metaLeadsToday = allLeads.filter((l) => isToday(l.createdAt)).length;
  const metaLeadsMTD = allLeads.filter((l) => isMTD(l.createdAt)).length;

  const adSpendToday = metaAdSpend.today;
  const adSpendMTD   = metaAdSpend.mtd;
  const hasAdSpend   = adSpendToday > 0 || adSpendMTD > 0;

  const cplToday = metaLeadsToday > 0 && hasAdSpend ? adSpendToday / metaLeadsToday : null;
  const cplMTD   = metaLeadsMTD   > 0 && hasAdSpend ? adSpendMTD   / metaLeadsMTD   : null;

  // ═══════════════════════════════════════════════
  // Section 2 — Site Visits (Gig Worker)
  // ═══════════════════════════════════════════════

  const svConfToday = allLeads.filter(
    (l) => l.status === 'site_visit_scheduled' && isToday(l.createdAt),
  ).length;
  const svConfMTD = allLeads.filter(
    (l) => l.status === 'site_visit_scheduled' && isMTD(l.createdAt),
  ).length;

  const doneStatuses = ['survey_done', 'quoted', 'sold', 'installation_scheduled', 'live'];
  const svDoneLeadsToday = allLeads.filter(
    (l) => doneStatuses.includes(l.status) && isToday(l.createdAt),
  );
  const svDoneLeadsMTD = allLeads.filter(
    (l) => doneStatuses.includes(l.status) && isMTD(l.createdAt),
  );

  const svCompToday = pct(svDoneLeadsToday.length, svConfToday > 0 ? svConfToday : svDoneLeadsToday.length);
  const svCompMTD   = pct(svDoneLeadsMTD.length,   svConfMTD > 0 ? svConfMTD : svDoneLeadsMTD.length);

  // Using distanceTravelled from backend if available
  const distToday = avg(
    svDoneLeadsToday.map((l: any) => l.distanceTravelled ?? 0).filter((d) => d > 0),
  );
  const distMTD = avg(
    svDoneLeadsMTD.map((l: any) => l.distanceTravelled ?? 0).filter((d) => d > 0),
  );

  // Using meetingDurationSecs from backend if available
  const timeMin = (l: any) => (l.meetingDurationSecs ? l.meetingDurationSecs / 60 : null);
  const avgTimeToday = avg(svDoneLeadsToday.map(timeMin).filter((v): v is number => v !== null));
  const avgTimeMTD   = avg(svDoneLeadsMTD.map(timeMin).filter((v): v is number => v !== null));

  // ═══════════════════════════════════════════════
  // Section 3 — Quotations & Sales Funnel
  // ═══════════════════════════════════════════════

  const quotedLeads = allLeads.filter((l) => l.status === 'quoted' || l.status === 'sold' || l.status === 'installation_scheduled' || l.status === 'live');
  const quoteSentToday = quotedLeads.filter((l) => isToday(l.quotationSentAt || l.createdAt)).length;
  const quoteSentMTD   = quotedLeads.filter((l) => isMTD(l.quotationSentAt || l.createdAt)).length;

  const isAccepted = (l: Lead) => l.status === 'sold' || l.status === 'installation_scheduled' || l.status === 'live';
  const soldRef = (l: Lead) => l.soldAt || l.quotationSentAt || l.createdAt;

  const quoteAcceptedToday = allLeads.filter((l) => isAccepted(l) && isToday(soldRef(l))).length;
  const quoteAcceptedMTD   = allLeads.filter((l) => isAccepted(l) && isMTD(soldRef(l))).length;

  const quoteFAToday = allLeads.filter(
    (l) => l.status === 'quoted' && isToday(l.createdAt), // Mock FA using quoted leads still active
  ).length;
  const quoteFAMTD = allLeads.filter(
    (l) => l.status === 'quoted' && isMTD(l.createdAt),
  ).length;

  const quoteDeniedToday = allLeads.filter(
    (l) => l.status === 'rejected' && isToday(l.createdAt),
  ).length;
  const quoteDeniedMTD = allLeads.filter(
    (l) => l.status === 'rejected' && isMTD(l.createdAt),
  ).length;

  const acceptRateToday = pct(quoteAcceptedToday, quoteSentToday);
  const acceptRateMTD   = pct(quoteAcceptedMTD,   quoteSentMTD);

  // ═══════════════════════════════════════════════
  // Section 4 — CAC & Revenue
  // ═══════════════════════════════════════════════

  const saleVal = (l: Lead) => Number((l as any).saleValue || l.systemCost || l.netCost || 0);

  const acceptedLeadsToday = allLeads.filter((l) => isAccepted(l) && isToday(soldRef(l)));
  const acceptedLeadsMTD   = allLeads.filter((l) => isAccepted(l) && isMTD(soldRef(l)));

  const grossSaleToday = acceptedLeadsToday.reduce((s, l) => s + saleVal(l), 0);
  const grossSaleMTD   = acceptedLeadsMTD.reduce((s, l) => s + saleVal(l), 0);

  const avgSaleToday = quoteAcceptedToday > 0 ? grossSaleToday / quoteAcceptedToday : null;
  const avgSaleMTD   = quoteAcceptedMTD   > 0 ? grossSaleMTD   / quoteAcceptedMTD   : null;

  const cacToday = quoteAcceptedToday > 0 && hasAdSpend ? adSpendToday / quoteAcceptedToday : null;
  const cacMTD   = quoteAcceptedMTD   > 0 && hasAdSpend ? adSpendMTD   / quoteAcceptedMTD   : null;

  const netRevToday = (grossSaleToday * 100) / 108.9;
  const netRevMTD   = (grossSaleMTD   * 100) / 108.9;

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Section 1: Marketing & Leads ─────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Marketing & Leads"
          subtitle="Meta ad performance and lead generation metrics"
          gradient="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="1. Number of Leads (Meta)"
            todayValue={metaLeadsToday}
            mtdValue={metaLeadsMTD}
            todaySub="All Sources, Date = Today"
            mtdSub="All Sources, Month to date"
            accent="#7c3aed"
          />
          <MetricCard
            label="2. Meta Ad Spend"
            todayValue={hasAdSpend ? INR(adSpendToday) : '—'}
            mtdValue={hasAdSpend ? INR(adSpendMTD) : '—'}
            todaySub={hasAdSpend ? 'From Meta API' : 'Pending Meta API integration'}
            mtdSub={hasAdSpend ? 'Month to date' : 'Pending Meta API integration'}
            accent="#9333ea"
          />
          <MetricCard
            label="3. Cost per Lead (CPL)"
            todayValue={cplToday !== null ? INR(cplToday) : '—'}
            mtdValue={cplMTD !== null ? INR(cplMTD) : '—'}
            formula="Total Ad Spend ÷ Total Leads"
            todaySub={!hasAdSpend ? 'Requires Ad Spend data' : undefined}
            accent="#a855f7"
          />
        </div>
      </div>

      {/* ── Section 2: Site Visits ─────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Site Visits (Gig Worker)"
          subtitle="Field visit confirmation, completion and efficiency metrics"
          gradient="linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="4. Site Visits Confirmed / Assigned"
            todayValue={svConfToday}
            mtdValue={svConfMTD}
            todaySub="Status = Site Visit Scheduled"
            accent="#0369a1"
          />
          <MetricCard
            label="5. Site Visits Done"
            todayValue={svDoneLeadsToday.length}
            mtdValue={svDoneLeadsMTD.length}
            todaySub="Status = Survey Done or Higher"
            accent="#0284c7"
          />
          <MetricCard
            label="6. Site Visit Completion Rate"
            todayValue={svConfToday > 0 ? svCompToday : '—'}
            mtdValue={svConfMTD > 0 ? svCompMTD : '—'}
            formula="(Done ÷ Confirmed) × 100"
            accent="#0ea5e9"
          />
          <MetricCard
            label="7. Avg Travel Distance (km)"
            todayValue={distToday !== null ? `${distToday.toFixed(1)} km` : '—'}
            mtdValue={distMTD !== null ? `${distMTD.toFixed(1)} km` : '—'}
            formula="Avg of travelDistanceKm per completed visit"
            todaySub={distToday === null ? 'Requires travelDistanceKm field' : undefined}
            accent="#38bdf8"
          />
          <MetricCard
            label="8. Avg Time at Customer Site (min)"
            todayValue={avgTimeToday !== null ? `${Math.round(avgTimeToday)} min` : '—'}
            mtdValue={avgTimeMTD !== null ? `${Math.round(avgTimeMTD)} min` : '—'}
            formula="Avg meeting duration in mins"
            todaySub={avgTimeToday === null ? 'Requires meeting duration field' : undefined}
            accent="#7dd3fc"
          />
        </div>
      </div>

      {/* ── Section 3: Quotations & Sales Funnel ─────────────────────────── */}
      <div>
        <SectionHeader
          title="Quotations & Sales Funnel"
          subtitle="Pipeline conversion from quotation to accepted sale"
          gradient="linear-gradient(135deg, #b45309 0%, #f59e0b 100%)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="9. Quotations Sent"
            todayValue={quoteSentToday}
            mtdValue={quoteSentMTD}
            todaySub="Quoted or higher, Date = Today"
            accent="#b45309"
          />
          <MetricCard
            label="10. Quotations Accepted (Sales)"
            todayValue={quoteAcceptedToday}
            mtdValue={quoteAcceptedMTD}
            todaySub="Status = Sold or higher"
            accent="#d97706"
          />
          <MetricCard
            label="11. Further Assistance Requested"
            todayValue={quoteFAToday}
            mtdValue={quoteFAMTD}
            todaySub="Status = Quoted"
            accent="#f59e0b"
          />
          <MetricCard
            label="12. Quotations Denied"
            todayValue={quoteDeniedToday}
            mtdValue={quoteDeniedMTD}
            todaySub="Status = Rejected"
            accent="#fbbf24"
          />
          <MetricCard
            label="13. Quote Acceptance Rate"
            todayValue={quoteSentToday > 0 ? acceptRateToday : '—'}
            mtdValue={quoteSentMTD > 0 ? acceptRateMTD : '—'}
            formula="(Accepted ÷ Sent) × 100"
            accent="#fcd34d"
          />
        </div>
      </div>

      {/* ── Section 4: CAC & Revenue ──────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Customer Acquisition Cost & Revenue"
          subtitle="Sales economics — cost, average value and net revenue"
          gradient="linear-gradient(135deg, #065f46 0%, #10b981 100%)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="14. Total Acquisition Cost (Meta)"
            todayValue={hasAdSpend ? INR(adSpendToday) : '—'}
            mtdValue={hasAdSpend ? INR(adSpendMTD) : '—'}
            todaySub={!hasAdSpend ? 'Requires Meta Ad Spend data' : '= Meta Ad Spend'}
            accent="#065f46"
          />
          <MetricCard
            label="15. Cost of Customer Acquisition (CAC)"
            todayValue={cacToday !== null ? INR(cacToday) : '—'}
            mtdValue={cacMTD !== null ? INR(cacMTD) : '—'}
            formula="Total Acq. Cost ÷ Accepted Quotations"
            todaySub={!hasAdSpend ? 'Requires Meta Ad Spend data' : undefined}
            accent="#059669"
          />
          <MetricCard
            label="16. Average Sale Value"
            todayValue={avgSaleToday !== null ? INR(avgSaleToday) : '—'}
            mtdValue={avgSaleMTD !== null ? INR(avgSaleMTD) : '—'}
            formula="Gross Sale Value ÷ Accepted Quotations"
            accent="#10b981"
          />
          <MetricCard
            label="17. Total Gross Sale Value"
            todayValue={grossSaleToday > 0 ? INR(grossSaleToday) : '—'}
            mtdValue={grossSaleMTD > 0 ? INR(grossSaleMTD) : '—'}
            todaySub="Sum of saleValue where Accepted"
            accent="#34d399"
          />
          <MetricCard
            label="18. Net Revenue (after GST deduction)"
            todayValue={grossSaleToday > 0 ? INR(netRevToday) : '—'}
            mtdValue={grossSaleMTD > 0 ? INR(netRevMTD) : '—'}
            formula="Gross Sale Value × 100 / 108.9"
            todaySub="Excludes GST component"
            accent="#6ee7b7"
          />
        </div>
      </div>

      {/* ── Data source footnote removed as metrics now use live data ────────────────────── */}
    </div>
  );
}
