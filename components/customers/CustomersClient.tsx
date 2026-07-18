'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCustomers } from '@/lib/queries/api-hooks';
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
  const revenue = customer.netCost || customer.systemCost;

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

  // Filtered customers
  const filtered = useMemo(() => {
    let list = customers;
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
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
  }, [customers, search, statusFilter]);

  // Stats for mini header
  const liveCount = customers.filter((c) => c.status === 'live').length;
  const soldCount = customers.filter((c) => c.status === 'sold').length;
  const totalRevenue = customers.reduce((s, c) => s + (c.netCost || c.systemCost || 0), 0);

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
        </div>
      </div>

      {/* ── Search + Filter ──────────────────────────────────────── */}
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
