'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCustomerDetail } from '@/lib/queries/api-hooks';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/types';
import type { CustomerDetail } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtINR = (n?: number | null) =>
  n != null
    ? Number(n).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      })
    : '—';

const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

function maskAadhar(num?: string) {
  if (!num) return '—';
  const clean = num.replace(/\D/g, '');
  if (clean.length < 4) return num;
  return 'XXXX-XXXX-' + clean.slice(-4);
}

function initials(name?: string) {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((w) => w?.[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
  accent = '#003178',
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#C3C6D4]/20 shadow-sm overflow-hidden">
      <div
        className="px-5 py-3.5 flex items-center gap-3 border-b border-[#C3C6D4]/15"
        style={{ background: `${accent}08` }}
      >
        <span style={{ color: accent }}>{icon}</span>
        <h2 className="text-sm font-bold tracking-tight" style={{ color: accent }}>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Info row ────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#C3C6D4]/10 last:border-0">
      <span className="text-xs text-[#737783] font-medium shrink-0 w-40">{label}</span>
      <span
        className={`text-xs text-right flex-1 ${
          highlight
            ? 'font-extrabold text-[#003178]'
            : mono
            ? 'font-mono text-[#1E1C0D]'
            : 'font-semibold text-[#1E1C0D]'
        }`}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── Timeline pill ───────────────────────────────────────────────────────────
const TIMELINE_STEPS: { key: string; label: string; color: string }[] = [
  { key: 'new', label: 'Lead Created', color: '#3b82f6' },
  { key: 'site_visit_scheduled', label: 'Site Visit', color: '#7c3aed' },
  { key: 'quoted', label: 'Quoted', color: '#d97706' },
  { key: 'survey_done', label: 'Survey Done', color: '#0891b2' },
  { key: 'sold', label: 'Sold', color: '#2563eb' },
  { key: 'installation_scheduled', label: 'Installation Scheduled', color: '#4f46e5' },
  { key: 'live', label: 'Live ⚡', color: '#10b981' },
];

function StatusTimeline({ status }: { status: string }) {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  active
                    ? 'border-transparent scale-125 shadow-lg'
                    : done
                    ? 'border-transparent'
                    : 'border-[#C3C6D4] bg-white'
                }`}
                style={
                  done || active
                    ? { background: step.color, borderColor: step.color }
                    : {}
                }
              />
              <span
                className={`text-[9px] text-center leading-tight font-semibold ${
                  active ? 'text-[#1E1C0D]' : done ? 'text-[#737783]' : 'text-[#C3C6D4]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mb-4 rounded-full transition-all ${
                  i < idx ? 'bg-[#003178]' : 'bg-[#E9E2CB]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-36 bg-white rounded-2xl border border-[#C3C6D4]/20" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-white rounded-2xl border border-[#C3C6D4]/20" />
        ))}
      </div>
    </div>
  );
}

// ─── Document Link Component ──────────────────────────────────────────────────
function DocumentLink({ doc, label }: { doc: any; label: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const url = doc.storageUrl;
      if (!url) {
        alert('Document URL not found.');
        return;
      }
      
      let key = url;
      try {
        const parsed = new URL(url);
        // Extracts the path without the leading slash (e.g. bucket URL to S3 key)
        key = parsed.pathname.substring(1);
      } catch (e) {
        // Fallback to original url
      }

      let token = '';
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
        if (match) token = match[2];
      }

      let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
      if (!API_URL.endsWith('/v1')) {
        API_URL = API_URL.replace(/\/+$/, '') + '/v1';
      }

      const res = await fetch(`${API_URL}/upload/download-url?key=${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-dashboard-bypass': 'true',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to get secure link');
      }

      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Could not generate secure link');
      }
    } catch (e) {
      console.error('Error fetching document URL:', e);
      alert('Error opening document. Ensure you have the right permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 text-xs font-bold text-[#7c3aed] bg-purple-50 px-3 py-2 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200 disabled:opacity-50"
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface CustomerDetailViewProps {
  customerId: string;
  basePath: string;
  initialData?: CustomerDetail;
}

const DocumentPreview = ({ title, url, subtitle }: { title: string, url?: string | null, subtitle?: string | null }) => {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-[#C3C6D4] bg-[#F8F9FA] text-[#737783] h-full">
        <svg className="w-6 h-6 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-semibold text-center">{title}</span>
        <span className="text-[10px] text-center mt-1">Not uploaded</span>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="group block relative overflow-hidden rounded-xl border border-[#C3C6D4]/30 hover:border-[#0891b2] hover:shadow-sm transition-all bg-white flex flex-col h-full">
      <div className="aspect-[4/3] bg-gray-50 relative border-b border-[#C3C6D4]/10">
        <img 
          src={url} 
          alt={title} 
          className="w-full h-full object-cover" 
          onError={(e) => { 
            // Fallback for non-image URLs like PDFs
            const target = e.currentTarget;
            target.style.display = 'none'; 
            if (target.nextElementSibling) {
              (target.nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }} 
        />
        {/* Document Icon Fallback (shown if img fails) */}
        <div className="absolute inset-0 hidden items-center justify-center text-[#737783] opacity-50">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-sm text-[#0891b2]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-3 bg-white mt-auto">
        <p className="text-xs font-bold text-[#1E1C0D] truncate">{title}</p>
        {subtitle && <p className="text-[10px] font-semibold text-[#0891b2] mt-1">{subtitle}</p>}
      </div>
    </a>
  );
};

export function CustomerDetailView({
  customerId,
  basePath,
  initialData,
}: CustomerDetailViewProps) {
  const { data: liveData, isLoading } = useCustomerDetail(customerId);
  const customer: CustomerDetail | undefined = liveData ?? initialData;

  if (isLoading && !customer) return <DetailSkeleton />;
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-sm font-semibold text-[#737783]">Customer not found</p>
        <Link href={`${basePath}/customers`} className="mt-3 text-xs text-[#003178] hover:underline">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  // Address parsing logic for District and State
  let displayAddress = customer.address;
  let displayDistrict = customer.district;
  let displayState = customer.state;

  if (displayAddress && (!displayDistrict || !displayState)) {
    const parts = displayAddress.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      if (!displayState) displayState = parts[parts.length - 1];
      if (!displayDistrict) displayDistrict = parts[parts.length - 2];
    } else if (parts.length === 2) {
      if (!displayState) displayState = parts[1];
      if (!displayDistrict) displayDistrict = parts[0];
    }
  }

  // System type formatting
  let displaySystemType = customer.systemType;
  if (displaySystemType?.toLowerCase() === 'hybrid') {
    displaySystemType = customer.isBatteryRequired ? 'Hybrid with battery' : 'Hybrid without battery';
  }

  // Use latest quotation for accurate financial data if available
  const latestQuotationForFinance = customer.quotations?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const displaySystemCost = latestQuotationForFinance?.systemCost != null ? Number(latestQuotationForFinance.systemCost) : customer.systemCost;
  const displayNetCost = latestQuotationForFinance?.netCost != null ? Number(latestQuotationForFinance.netCost) : customer.netCost;

  const invoiceAmount = displaySystemCost 
    ? displaySystemCost - ((displaySystemCost * (customer.specialDiscountPercent || 0)) / 100) - (customer.hasReferral ? 3000 : 0)
    : 0;
  const actualRevenue = invoiceAmount ? (invoiceAmount * 100) / 108.9 : 0;

  return (
    <div className="space-y-6">
      {/* ── Back + breadcrumb ────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-[#737783]">
        <Link href={`${basePath}/customers`} className="hover:text-[#003178] transition-colors">
          Customers
        </Link>
        <span>/</span>
        <span className="text-[#1E1C0D] font-semibold">{customer.customerName}</span>
      </div>

      {/* ── Hero Card ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#C3C6D4]/20 shadow-sm overflow-hidden">
        {/* Blue top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#003178] via-[#1a4fa0] to-[#4f46e5]" />
        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#003178] to-[#1a4fa0] text-white flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-lg ring-4 ring-[#003178]/10">
            {initials(customer.customerName)}
          </div>

          {/* Name + contact */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-xl font-extrabold text-[#1E1C0D] tracking-tight">
                {customer.salutation ? `${customer.salutation} ` : ''}
                {customer.customerName}
              </h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  LEAD_STATUS_COLORS[customer.status] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {LEAD_STATUS_LABELS[customer.status] ?? customer.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#434652]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#003178]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-mono font-semibold">{customer.customerPhone}</span>
              </span>
              {customer.customerEmail && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#003178]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {customer.customerEmail}
                </span>
              )}
            </div>
            {displayAddress && (
              <p className="text-xs text-[#737783] mt-2">
                📍 {displayAddress}
                {displayDistrict && !displayAddress.includes(displayDistrict) ? `, ${displayDistrict}` : ''}
                {displayState && !displayAddress.includes(displayState) ? `, ${displayState}` : ''}
                {customer.pincode ? ` — ${customer.pincode}` : ''}
              </p>
            )}
          </div>

          {/* Revenue pill */}
          <div className="bg-[#F0F4FF] rounded-2xl px-6 py-4 text-center shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#003178]">Actual Revenue</p>
            <p className="text-xl font-extrabold text-[#003178] mt-1">
              {fmtINR(actualRevenue)}
            </p>
            {invoiceAmount > 0 && (
              <p className="text-[10px] text-[#737783] mt-0.5">
                Invoice: {fmtINR(invoiceAmount)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Timeline ──────────────────────────────────── */}
      {customer.status !== 'rejected' && (
        <div className="bg-white rounded-2xl border border-[#C3C6D4]/20 shadow-sm p-5">
          <h2 className="text-xs font-bold text-[#737783] uppercase tracking-widest mb-5">
            Lead Journey
          </h2>
          <StatusTimeline status={customer.status} />
        </div>
      )}

      {/* ── Detail Sections Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Section 1 — Identity & Address */}
        <Section
          title="Customer Identity"
          accent="#003178"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <InfoRow label="Full Name" value={`${customer.salutation ?? ''} ${customer.customerName}`.trim()} />
          <InfoRow label="Phone" value={customer.customerPhone} mono />
          <InfoRow label="Email" value={customer.customerEmail} />
          <InfoRow label="Address" value={displayAddress} />
          <InfoRow label="Pincode" value={customer.pincode} mono />
          <InfoRow label="District" value={displayDistrict} />
          <InfoRow label="State" value={displayState} />
          <InfoRow label="Installation Floor" value={customer.installationFloor} />
          {customer.latitude && customer.longitude && (
            <InfoRow
              label="GPS Location"
              value={`${customer.latitude.toFixed(5)}, ${customer.longitude.toFixed(5)}`}
              mono
            />
          )}
        </Section>

        {/* Section 2 — KYC Documents */}
        <Section
          title="KYC Documents"
          accent="#7c3aed"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          <InfoRow label="Property Type" value="Independent villa/RCC Roof" />
          {customer.kycConsentAt && (
            <div className="py-2 border-b border-[#C3C6D4]/10">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#7c3aed] mb-1">
                KYC Consent Given
              </span>
              <span className="text-xs text-[#434652]">
                On {fmtDate(customer.kycConsentAt)} {customer.kycConsentIp ? `(IP: ${customer.kycConsentIp})` : ''}
              </span>
            </div>
          )}
          <InfoRow
            label="Bill in Customer's Name"
            value={
              customer.isBillOnName === undefined
                ? undefined
                : customer.isBillOnName
                ? 'Yes ✓'
                : 'No'
            }
          />
          {!customer.isBillOnName && (
            <>
              <InfoRow label="Bill Holder Name" value={customer.billHolderName} />
              <InfoRow label="Relationship" value={customer.billHolderRelationship} />
            </>
          )}
          
          {/* Document buttons — use flat URLs from enriched API response */}
          {(customer.electricityBillUrl || customer.aadhaarFrontUrl || customer.aadhaarBackUrl || customer.panImageUrl ||
            (Array.isArray(customer.documents) && customer.documents.length > 0)) && (
            <div className="pt-3 mt-1 border-t border-[#C3C6D4]/10 flex flex-wrap gap-2">
              {customer.electricityBillUrl && (
                <DocumentLink 
                  doc={{ storageUrl: customer.electricityBillUrl }}
                  label="Electricity Bill"
                />
              )}
              {customer.aadhaarFrontUrl && (
                <DocumentLink 
                  doc={{ storageUrl: customer.aadhaarFrontUrl }}
                  label="Aadhaar Front"
                />
              )}
              {customer.aadhaarBackUrl && (
                <DocumentLink 
                  doc={{ storageUrl: customer.aadhaarBackUrl }}
                  label="Aadhaar Back"
                />
              )}
              {customer.panImageUrl && (
                <DocumentLink 
                  doc={{ storageUrl: customer.panImageUrl }}
                  label="PAN Card"
                />
              )}
              {/* Fallback: any documents not matched above */}
              {Array.isArray(customer.documents) && customer.documents
                .filter((d: any) => !['aadhaar_front','aadhaar_back','pan_card','electricity_bill'].includes(d?.documentType))
                .map((d: any) => (
                  <DocumentLink
                    key={d.id}
                    doc={{ storageUrl: d.storageUrl }}
                    label={d.documentType ?? 'Document'}
                  />
                ))
              }
            </div>
          )}

          {/* Misc uploads: photos taken in the app that aren't categorized */}
          {Array.isArray(customer.roofPhotos) && customer.roofPhotos.length > 0 && (
            <div className="pt-3 mt-3 border-t border-[#C3C6D4]/10 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">App Uploaded Photos (Misc)</span>
              <div className="flex flex-wrap gap-2">
                {customer.roofPhotos.map((photo: any, index: number) => (
                  <DocumentLink 
                    key={photo.id || index}
                    doc={{ storageUrl: photo.photoUrl }}
                    label={`Uploaded Photo ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Section 3 — Electrical Details */}
        <Section
          title="Electrical Details"
          accent="#d97706"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        >
          <InfoRow
            label="Monthly Bill"
            value={customer.monthlyElectricityBill != null ? fmtINR(customer.monthlyElectricityBill) : undefined}
            highlight
          />
          <InfoRow
            label="Sanctioned Load"
            value={customer.sanctionedLoad ? `${customer.sanctionedLoad} kW` : undefined}
          />
          <InfoRow
            label="Monthly Fuel Expense"
            value={customer.monthlyFuelExpense != null ? fmtINR(customer.monthlyFuelExpense) : undefined}
          />
        </Section>

        {/* Section 4 — Solar System */}
        <Section
          title="Solar System Selected"
          accent="#059669"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          }
        >
          <InfoRow
            label="System Size"
            value={customer.recommendedKw ? `${customer.recommendedKw} kW` : undefined}
            highlight
          />
          <InfoRow
            label="Sanctioned Load"
            value={customer.sanctionedLoad ? `${customer.sanctionedLoad} kW` : undefined}
          />
          <InfoRow label="System Type" value={displaySystemType} />
          <InfoRow label="Inverter Brand" value={customer.inverterBrand} />
          <InfoRow label="Panel Brand" value={customer.solarPanelBrand ?? customer.panelBrand} />
          <InfoRow
            label="Panel Count"
            value={undefined}
          />
          <InfoRow label="Structure Height" value={customer.structureHeight} />
        </Section>

        {/* Section 5 — Financial */}
        <Section
          title="Financial Summary"
          accent="#0891b2"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <InfoRow 
            label="Invoice Amount" 
            value={fmtINR(invoiceAmount)} 
            highlight 
          />
          <InfoRow 
            label="Actual Revenue" 
            value={fmtINR(actualRevenue)} 
          />
          <InfoRow label="Net Cost (Subsidy)" value={fmtINR(displayNetCost)} />
          <InfoRow label="Referral Given" value={customer.hasReferral ? 'Yes' : 'No'} />
          <InfoRow label="Applied Discount" value={customer.specialDiscountPercent ? `${customer.specialDiscountPercent}%` : 'None'} />
          <InfoRow label="Downpayment" value={customer.downPayment != null ? fmtINR(customer.downPayment) : '—'} />
          <InfoRow label="Payment Mode" value={customer.paymentMode} />
          
          <div className="flex items-center justify-between py-2 border-b border-[#C3C6D4]/10 last:border-0">
            <span className="text-xs text-[#737783] font-medium shrink-0 w-40">Quotation Sent</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#1E1C0D] text-right">
                {fmtDate(customer.quotationSentAt || customer.createdAt)}
              </span>
              <button
              onClick={async () => {
                  // Primary: check quotations array (pdfUrl from /calculations endpoint)
                  const latestQuotation = customer.quotations
                    ?.filter(q => q.pdfUrl)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

                  // Fallback: check documents array for legacy quotation_pdf type
                  const legacyPdfDoc = customer.documents?.find(d => d.documentType === 'quotation_pdf');

                  const url = latestQuotation?.pdfUrl || legacyPdfDoc?.storageUrl;

                  if (!url) {
                    alert('No quotation PDF found yet. Ask the gig worker to generate and send the quotation from the app.');
                    return;
                  }
                  try {
                    let key = url;
                    try {
                      const parsed = new URL(url);
                      key = parsed.pathname.substring(1);
                    } catch (e) {}

                    let token = '';
                    if (typeof document !== 'undefined') {
                      const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
                      if (match) token = match[2];
                    }

                    let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
                    if (!API_URL.endsWith('/v1')) API_URL = API_URL.replace(/\/+$/, '') + '/v1';

                    const res = await fetch(`${API_URL}/upload/download-url?key=${encodeURIComponent(key)}`, {
                      headers: { Authorization: `Bearer ${token}`, 'x-dashboard-bypass': 'true' },
                    });

                    if (!res.ok) throw new Error('Failed to get secure link');
                    const data = await res.json();
                    if (data.url) window.open(data.url, '_blank');
                    else alert('Could not generate secure link');
                  } catch (e) {
                    console.error(e);
                    alert('Error opening document.');
                  }
                }}
                title="View Quotation PDF"
                className="text-[#0891b2] hover:text-[#06b6d4] transition-colors bg-[#0891b2]/10 p-1.5 rounded-lg flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
          <InfoRow label="Sold Date" value={fmtDate(customer.soldAt)} />
          <InfoRow label="Lead Created" value={fmtDate(customer.createdAt)} />
        </Section>

        {/* Section 6 — Documents & Photos */}
        <Section
          title="Documents & Photos"
          accent="#f59e0b"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 p-2">
            <DocumentPreview 
              title="Aadhaar Card" 
              url={customer.aadhaarFrontUrl || customer.documents?.find(d => d.documentType === 'aadhaar_front')?.storageUrl} 
            />
            <DocumentPreview 
              title="PAN Card" 
              url={customer.panImageUrl || customer.documents?.find(d => d.documentType === 'pan_card')?.storageUrl} 
            />
            <DocumentPreview 
              title="Electricity Bill" 
              url={customer.electricityBillUrl || customer.billDetails?.billPhotoUrl || customer.documents?.find(d => d.documentType === 'electricity_bill')?.storageUrl} 
            />
            <DocumentPreview 
              title="Rooftop Photo" 
              url={customer.roofPhotos?.[0]?.photoUrl} 
              subtitle={customer.roofPhotos?.[0]?.direction}
            />
            <DocumentPreview 
              title="Payment Proof" 
              url={customer.documents?.find(d => ['cheque', 'upi', 'payment_proof', 'payment'].includes(d.documentType.toLowerCase()))?.storageUrl} 
              subtitle={customer.documents?.find(d => ['cheque', 'upi', 'payment_proof', 'payment'].includes(d.documentType.toLowerCase()))?.documentType?.replace('_', ' ')}
            />
          </div>
        </Section>

        {/* Section 7 — Assigned Gig Worker */}
        <Section
          title="Assigned Gig Worker"
          accent="#4f46e5"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        >
          {customer.salesRep?.fullName ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-center font-extrabold text-base shrink-0">
                {initials(customer.salesRep.fullName)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1E1C0D]">
                  {customer.salesRep.fullName}
                </p>
                {customer.salesRep.id && (
                  <Link
                    href={`${basePath}/gig-workers/${customer.salesRep.id}`}
                    className="text-xs font-semibold text-[#4f46e5] hover:underline mt-0.5 inline-block"
                  >
                    View worker profile →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 flex items-center gap-3 text-[#737783]">
              <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              <div>
                <p className="text-sm font-semibold">No gig worker assigned yet</p>
                <p className="text-xs mt-0.5">Assign a worker from the Gig Workers tab</p>
              </div>
            </div>
          )}

          {/* Sales rep info */}
          {customer.salesRepId && (
            <div className="mt-4 pt-4 border-t border-[#C3C6D4]/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#737783] mb-1">
                Sales Rep ID
              </p>
              <p className="text-xs font-mono text-[#434652]">{customer.salesRepId}</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
