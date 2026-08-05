'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useCustomers, fetcher } from '@/lib/queries/api-hooks';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_RING,
} from '@/lib/types';
import type { CustomerDetail, LeadStatus } from '@/lib/types';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtINR = (n: number) =>
  (Number(n) || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

function initials(name?: string) {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((w) => w?.[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Gradient backgrounds cycling for avatars
const AVATAR_GRADIENTS = [
  'from-[#003178] to-[#1a4fa0]',
  'from-[#7c3aed] to-[#a855f7]',
  'from-[#0891b2] to-[#06b6d4]',
  'from-[#059669] to-[#10b981]',
  'from-[#d97706] to-[#f59e0b]',
  'from-[#dc2626] to-[#ef4444]',
];

function avatarGrad(name?: string) {
  if (!name) return AVATAR_GRADIENTS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

// ─── Status filter tabs ──────────────────────────────────────────────────────
const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Site Visit', value: 'site_visit_scheduled' },
  { label: 'Sold', value: 'sold' },
  { label: 'Survey Done', value: 'survey_done' },
  { label: 'Installation', value: 'installation_scheduled' },
  { label: 'Live ⚡', value: 'live' },
  { label: 'Rejected', value: 'rejected' },
];

// ─── Customer Card ───────────────────────────────────────────────────────────
function CustomerCard({
  customer,
  basePath,
  idx,
}: {
  customer: CustomerDetail;
  basePath: string;
  idx: number;
}) {
  const grad = avatarGrad(customer.customerName);
  const ring = LEAD_STATUS_RING[customer.status] ?? 'ring-slate-300';
  
  const latestQuotation = customer.quotations?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  let revenue = latestQuotation?.systemCost != null ? Number(latestQuotation.systemCost) : (customer.systemCost || customer.netCost);

  // If there's no quotation and the DB has dummy default data, calculate the correct systemCost based on slabs
  if (!latestQuotation && (revenue === 490950 || revenue === 598950) && customer.recommendedKw) {
    const kw = customer.recommendedKw;
    let ratePerKW = 60000;
    if (kw === 2) ratePerKW = 63000;
    else if (kw === 3) ratePerKW = 60000;
    else if (kw === 4 || kw === 5) ratePerKW = 59500;
    else if (kw === 6) ratePerKW = 57500;
    else if (kw === 7) ratePerKW = 56900;
    else if (kw === 8) ratePerKW = 56000;
    else if (kw === 9) ratePerKW = 55500;
    else if (kw >= 10) ratePerKW = 55000;
    
    const baseCost = kw * ratePerKW;
    const gstAmount = Math.round(baseCost * 0.089 * 100) / 100;
    revenue = baseCost + gstAmount;
  }

  return (
    <Link
      href={`${basePath}/customers/${customer.id}`}
      className="group relative bg-white rounded-2xl border border-[#C3C6D4]/20 hover:border-[#003178]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
      id={`customer-card-${customer.id}`}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background:
            customer.status === 'live'
              ? 'linear-gradient(90deg,#10b981,#34d399)'
              : customer.status === 'sold'
              ? 'linear-gradient(90deg,#3b82f6,#6366f1)'
              : customer.status === 'rejected'
              ? 'linear-gradient(90deg,#ef4444,#f87171)'
              : 'linear-gradient(90deg,#003178,#1a4fa0)',
        }}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Avatar + name row */}
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} text-white flex items-center justify-center font-extrabold text-lg shrink-0 ring-2 ring-offset-2 ${ring} shadow-md`}
          >
            {initials(customer.customerName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-[#1E1C0D] leading-snug truncate group-hover:text-[#003178] transition-colors">
              {customer.customerName}
            </p>
            <p className="text-xs text-[#737783] font-mono mt-0.5">
              {customer.customerPhone}
            </p>
            {customer.customerEmail && (
              <p className="text-[10px] text-[#737783] truncate mt-0.5">
                {customer.customerEmail}
              </p>
            )}
          </div>
          {/* Status badge */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
              LEAD_STATUS_COLORS[customer.status] ?? 'bg-gray-100 text-gray-700'
            }`}
          >
            {LEAD_STATUS_LABELS[customer.status] ?? customer.status}
          </span>
        </div>

        {/* Address */}
        {customer.address && (
          <p className="text-xs text-[#434652] leading-relaxed line-clamp-2">
            📍 {customer.address}
            {customer.district ? `, ${customer.district}` : ''}
            {customer.state ? `, ${customer.state}` : ''}
            {customer.pincode ? ` — ${customer.pincode}` : ''}
          </p>
        )}

        {/* System info row */}
        <div className="grid grid-cols-2 gap-2">
          {customer.recommendedKw && (
            <div className="bg-[#F0F4FF] rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#003178]">System</p>
              <p className="text-sm font-extrabold text-[#003178]">
                {customer.recommendedKw} kW
              </p>
            </div>
          )}
          {customer.inverterBrand && (
            <div className="bg-[#FFF3E0] rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600">Inverter</p>
              <p className="text-xs font-bold text-orange-700 truncate">
                {customer.inverterBrand}
              </p>
            </div>
          )}
          {customer.monthlyElectricityBill && (
            <div className="bg-[#F0FFF4] rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Monthly Bill</p>
              <p className="text-xs font-bold text-emerald-700">
                {fmtINR(customer.monthlyElectricityBill)}
              </p>
            </div>
          )}
          {customer.sanctionedLoad && (
            <div className="bg-[#F5F3FF] rounded-xl px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-purple-600">Load</p>
              <p className="text-xs font-bold text-purple-700">
                {customer.sanctionedLoad} kW
              </p>
            </div>
          )}
        </div>

        {/* Gig worker + Revenue */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#C3C6D4]/15">
          <div>
            {customer.salesRep?.fullName ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#003178]/10 text-[#003178]">
                👤 {customer.salesRep.fullName}
              </span>
            ) : (
              <span className="text-[10px] text-[#737783]">No worker assigned</span>
            )}
          </div>
          {revenue ? (
            <p className="text-sm font-extrabold text-[#003178]">{fmtINR(revenue)}</p>
          ) : (
            <p className="text-xs text-[#737783]">No quote yet</p>
          )}
        </div>
      </div>

      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#003178] font-bold text-sm">
        →
      </div>
    </Link>
  );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#C3C6D4]/20 overflow-hidden animate-pulse">
      <div className="h-1 bg-slate-200 w-full" />
      <div className="p-5 space-y-4">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="h-2.5 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded w-full" />
        <div className="h-2 bg-slate-100 rounded w-4/5" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="flex justify-between pt-3 border-t border-slate-100">
          <div className="h-5 bg-slate-100 rounded-full w-24" />
          <div className="h-4 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface CustomersClientProps {
  basePath: string;
  initialCustomers?: CustomerDetail[];
}

export function CustomersClient({ basePath, initialCustomers = [] }: CustomersClientProps) {
  const { data: liveData, isLoading } = useCustomers();
  const customers: CustomerDetail[] = liveData ?? initialCustomers;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [panelFilter, setPanelFilter] = useState('');
  const [inverterFilter, setInverterFilter] = useState('');
  const [systemTypeFilter, setSystemTypeFilter] = useState('');

  const uniquePanels = useMemo(() => Array.from(new Set(customers.map(c => c.solarPanelBrand || c.panelBrand).filter(Boolean))), [customers]);
  const uniqueInverters = useMemo(() => Array.from(new Set(customers.map(c => c.inverterBrand).filter(Boolean))), [customers]);
  const uniqueSystemTypes = useMemo(() => Array.from(new Set(customers.map(c => c.systemType).filter(Boolean))), [customers]);

  // Filtered customers
  const filtered = useMemo(() => {
    let list = customers;
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (startDate) {
      list = list.filter(c => new Date(c.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(c => new Date(c.createdAt) <= end);
    }
    if (panelFilter) {
      list = list.filter(c => (c.solarPanelBrand || c.panelBrand) === panelFilter);
    }
    if (inverterFilter) {
      list = list.filter(c => c.inverterBrand === inverterFilter);
    }
    if (systemTypeFilter) {
      list = list.filter(c => c.systemType === systemTypeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerPhone.includes(q) ||
          (c.customerEmail ?? '').toLowerCase().includes(q) ||
          (c.address ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, search, statusFilter, startDate, endDate, panelFilter, inverterFilter, systemTypeFilter]);

  // Stats for mini header
  const liveCount = customers.filter((c) => c.status === 'live').length;
  const soldCount = customers.filter((c) => c.status === 'sold').length;
  const totalRevenue = customers.reduce((s, c) => {
    const lq = c.quotations?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    let rev = lq?.systemCost != null ? Number(lq.systemCost) : (c.netCost || c.systemCost || 0);
    
    if (!lq && (rev === 490950 || rev === 598950) && c.recommendedKw) {
      rev = c.recommendedKw * 65340;
    }
    
    return s + rev;
  }, 0);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const headers = [
        'SNO', 'CREATED DATE', 'CREATED TIME', 'QUOTATION DATE', 'QUOTATION TIME', 'GIG WORKER NAME', 'GIG WORKER PHONE',
        'REPORTING MANAGER', 'CUST NAME', 'CUST PHONE', 'CUST CITY', 'CITY', 'GEO LOCATION',
        'ELECTRICITY BILL', 'FUEL BILL', 'QUOTED PRICE', 'CUST REFERRAL', 'SPECIAL DISCOUNT %',
        'SPECIAL DISCOUNT', 'INVOICE AMOUNT', 'ACTUAL REVENUE', 'SUBSIDY', 'SYSTEM TYPE',
        'PANELS', 'INVERTER', 'STRUCTURE HEIGHT', 'INSTALLATION FLOOR', 'ROOFTOP PICTURE',
        'ELECTRICITY BILL DOC', 'AADHAR FRONT', 'AADHAR BACK', 'PAN CARD', 'DOWNPAYMENT',
        'DOWNPAYMENT MODE', 'PIC', 'NOTES'
      ];
      
      const fullCustomers: any[] = [];
      const CHUNK_SIZE = 5;
      
      for (let i = 0; i < filtered.length; i += CHUNK_SIZE) {
        const chunk = filtered.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map(async (c) => {
            try {
              const detail = await fetcher(`/leads/${c.id}`);
              return { ...c, ...detail };
            } catch (e) {
              return c;
            }
          })
        );
        fullCustomers.push(...chunkResults);
        
        // Let the main thread and network queue breathe
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const makeLinkCell = (url: string | null | undefined) => {
        if (!url) return 'No';
        return { t: 's', v: 'Yes', l: { Target: url, Tooltip: 'Click to view document' } };
      };
      
      const rows = fullCustomers.map((c, index) => {
      const latestQuotation = c.quotations?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      let expectedRevenue = latestQuotation?.systemCost != null ? Number(latestQuotation.systemCost) : (c.systemCost || 0);
      if (!latestQuotation && (expectedRevenue === 490950 || expectedRevenue === 598950) && c.recommendedKw) {
        expectedRevenue = c.recommendedKw * 65340;
      }
      
      const createdAtDate = c.createdAt ? new Date(c.createdAt) : null;
      const createdDateStr = createdAtDate ? createdAtDate.toLocaleDateString() : '';
      const createdTimeStr = createdAtDate ? createdAtDate.toLocaleTimeString() : '';

      const quotationDateObj = latestQuotation?.createdAt ? new Date(latestQuotation.createdAt) : null;
      const quotationDateStr = quotationDateObj ? quotationDateObj.toLocaleDateString() : '';
      const quotationTimeStr = quotationDateObj ? quotationDateObj.toLocaleTimeString() : '';

      let displayDistrict = c.district;
      let displayState = c.state;
      if (c.address && (!displayDistrict || !displayState)) {
        const parts = c.address.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (parts.length >= 3) {
          if (!displayState) displayState = parts[parts.length - 1];
          if (!displayDistrict) displayDistrict = parts[parts.length - 2];
        } else if (parts.length === 2) {
          if (!displayState) displayState = parts[1];
          if (!displayDistrict) displayDistrict = parts[0];
        }
      }

      const specialDiscountPct = c.specialDiscountPercent || 0;
      const specialDiscountVal = specialDiscountPct && expectedRevenue ? (expectedRevenue * specialDiscountPct) / 100 : '';
      
      const referralDiscountVal = c.hasReferral ? 3000 : 0;
      const invoiceAmount = expectedRevenue ? (expectedRevenue - Number(specialDiscountVal || 0) - referralDiscountVal) : '';
      // Actual Revenue = (Invoice Amount * 100) / 108.9 (Removing 8.9% tax effectively)
      const actualRevenue = invoiceAmount !== '' ? (Number(invoiceAmount) * 100) / 108.9 : '';
      
      let displaySystemType = c.systemType || '';
      if (displaySystemType.toLowerCase() === 'hybrid') {
        displaySystemType = c.isBatteryRequired ? 'Hybrid with battery' : 'Hybrid without battery';
      }
      
      return [
        index + 1,
        createdDateStr,
        createdTimeStr,
        quotationDateStr,
        quotationTimeStr,
        c.salesRep?.fullName || '',
        c.salesRep?.phone || '',
        '', // REPORTING MANAGER
        c.customerName || '',
        c.customerPhone || '',
        c.district || c.address || '',
        displayDistrict || '', // CITY
        c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : '',
        c.monthlyElectricityBill || '',
        c.monthlyFuelExpense || '',
        expectedRevenue || '',
        c.hasReferral ? 'Yes' : 'No',
        c.specialDiscountPercent || '',
        specialDiscountVal,
        invoiceAmount, // INVOICE AMOUNT
        actualRevenue, // ACTUAL REVENUE
        (c as any).subsidy || latestQuotation?.subsidy || '', // SUBSIDY
        displaySystemType,
        c.solarPanelBrand || c.panelBrand || '',
        c.inverterBrand || '',
        c.structureHeight || '',
        c.installationFloor || '',
        makeLinkCell(c.roofPhotos?.[0]?.photoUrl),
        makeLinkCell(c.electricityBillUrl || c.documents?.find(d => d.documentType === 'electricity_bill')?.storageUrl),
        makeLinkCell(c.aadhaarFrontUrl || c.documents?.find(d => d.documentType === 'aadhaar_front')?.storageUrl),
        makeLinkCell(c.aadhaarBackUrl || c.documents?.find(d => d.documentType === 'aadhaar_back')?.storageUrl),
        makeLinkCell(c.panImageUrl || c.documents?.find(d => d.documentType === 'pan_card')?.storageUrl),
        c.downPayment || '',
        c.paymentMode || '',
        makeLinkCell(c.documents?.find(d => d.documentType === 'down_payment' || d.documentType === 'payment_proof')?.storageUrl),
        '' // NOTES
      ];
    });
    
    // Create Worksheet
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Auto-adjust column widths based on content length
    const colWidths = headers.map((header, colIndex) => {
      let maxLen = header.length;
      rows.forEach(row => {
        const val = row[colIndex];
        let valLen = 0;
        if (val && typeof val === 'object' && 'v' in val) {
          valLen = String(val.v).length;
        } else if (val) {
          valLen = String(val).length;
        }
        if (valLen > maxLen) {
          maxLen = valLen;
        }
      });
      // Cap width at 50 chars so massive URLs don't make columns gigantic
      return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet['!cols'] = colWidths;
    
    // Force phone number columns (GIG WORKER PHONE, CUST PHONE) to be read as text 
    // Phone numbers are at index 4 and 7. But string elements in aoa_to_sheet automatically get t: 's'.
    // XLSX library handles this fine if they are passed as strings.
    
    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Write and Download
    XLSX.writeFile(workbook, 'customers_export.xlsx');
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#003178] tracking-tight">
            Customers
          </h1>
          <p className="text-sm text-[#434652] mt-0.5">
            {customers.length} total ·{' '}
            <span className="text-emerald-600 font-semibold">{liveCount} live</span> ·{' '}
            <span className="text-[#003178] font-semibold">{soldCount} sold</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Revenue summary */}
          <div className="bg-white rounded-xl px-4 py-2 border border-[#C3C6D4]/20 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#737783]">Total Revenue</p>
            <p className="text-sm font-extrabold text-[#003178]">{fmtINR(totalRevenue)}</p>
          </div>
          {/* Live badge */}
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            LIVE
          </span>
          <button onClick={handleExport} disabled={isExporting} className="bg-[#003178] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#003178]/90 transition shadow-sm flex items-center gap-2 disabled:opacity-50">
            {isExporting ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* ── Search + Filter ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737783]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              id="customer-search"
              type="text"
              placeholder="Search by name, phone, email or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#C3C6D4]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#003178]/20 focus:border-[#003178]/40 transition-all placeholder:text-[#C3C6D4]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737783] hover:text-[#1E1C0D]"
              >
                ×
              </button>
            )}
          </div>
        </div>
        {/* Additional Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-[#C3C6D4]/30 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-[#737783]">Date:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs bg-transparent focus:outline-none text-[#1E1C0D]" />
            <span className="text-xs text-[#C3C6D4]">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs bg-transparent focus:outline-none text-[#1E1C0D]" />
          </div>
          
          <select value={panelFilter} onChange={(e) => setPanelFilter(e.target.value)} className="text-xs border border-[#C3C6D4]/30 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#003178] shadow-sm text-[#1E1C0D] max-w-[150px]">
            <option value="">All Panels</option>
            {uniquePanels.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
          </select>

          <select value={inverterFilter} onChange={(e) => setInverterFilter(e.target.value)} className="text-xs border border-[#C3C6D4]/30 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#003178] shadow-sm text-[#1E1C0D] max-w-[150px]">
            <option value="">All Inverters</option>
            {uniqueInverters.map(i => <option key={i as string} value={i as string}>{i as string}</option>)}
          </select>

          <select value={systemTypeFilter} onChange={(e) => setSystemTypeFilter(e.target.value)} className="text-xs border border-[#C3C6D4]/30 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#003178] shadow-sm text-[#1E1C0D] max-w-[150px]">
            <option value="">All Systems</option>
            {uniqueSystemTypes.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
          </select>
          
          {(startDate || endDate || panelFilter || inverterFilter || systemTypeFilter) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); setPanelFilter(''); setInverterFilter(''); setSystemTypeFilter(''); }} className="text-xs text-[#ef4444] font-bold hover:underline px-2 py-1">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Status Tabs ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === 'all'
              ? customers.length
              : customers.filter((c) => c.status === tab.value).length;
          return (
            <button
              key={tab.value}
              id={`filter-tab-${tab.value}`}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? 'bg-[#003178] text-white shadow-md'
                  : 'bg-white text-[#434652] border border-[#C3C6D4]/25 hover:bg-[#F5EED6]'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  statusFilter === tab.value
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E9E2CB] text-[#434652]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Customer Cards Grid ──────────────────────────────────── */}
      {isLoading && initialCustomers.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#C3C6D4]/20">
          <div className="w-16 h-16 rounded-2xl bg-[#F5EED6] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#003178]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#1E1C0D]">No customers found</p>
          <p className="text-xs text-[#737783] mt-1">
            {search ? `No match for "${search}"` : 'No customers in this status yet'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs font-semibold text-[#003178] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((customer, idx) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              basePath={basePath}
              idx={idx}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-xs text-[#737783] text-center">
          Showing {filtered.length} of {customers.length} customers
          {search ? ` matching "${search}"` : ''}
        </p>
      )}
    </div>
  );
}
