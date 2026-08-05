'use client';

import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/types';
import { logoutAction } from '@/app/actions/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Super Admin',
  dealer: 'Dealer',
  salesrep: 'Sales Rep',
  team_leader: 'Team Leader',
};

const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm',
  dealer: 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm',
  salesrep: 'bg-orange-100 text-orange-700 border border-orange-200 shadow-sm',
  team_leader: 'bg-purple-100 text-purple-700 border border-purple-200 shadow-sm',
};

export function Header({
  fullName,
  role,
}: {
  fullName: string;
  role: UserRole;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-[#003178]/5 px-6 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${ROLE_COLORS[role]}`}
        >
          {ROLE_LABELS[role]}
        </span>
        <span className="text-sm font-semibold text-[#1E1C0D]">{fullName}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-[#737783] hover:text-[#BA1A1A] transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
