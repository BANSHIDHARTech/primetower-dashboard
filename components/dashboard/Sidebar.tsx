'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Clock,
  UserCheck,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

const superAdminLinks = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/dealers', label: 'Dealers', icon: Building2 },
  { href: '/superadmin/leads', label: 'All Leads', icon: Users },
  { href: '/superadmin/gig-workers', label: 'Gig Workers', icon: UserCheck },
];

const dealerLinks = [
  { href: '/dealer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dealer/leads', label: 'My Leads', icon: Users },
  { href: '/dealer/pending-sales', label: 'Pending Sales', icon: Clock },
  { href: '/dealer/gig-workers', label: 'Gig Workers', icon: UserCheck },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = role === 'superadmin' ? superAdminLinks : dealerLinks;

  return (
    <aside className="w-60 min-h-screen bg-[#003178] text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-extrabold text-sm tracking-tight">PrimeTower</p>
            <p className="text-[10px] text-white/50 tracking-widest uppercase">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-3">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/superadmin' &&
              link.href !== '/dealer' &&
              pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 tracking-wider uppercase text-center">
          Prime Tower Infrastructure
        </p>
      </div>
    </aside>
  );
}
