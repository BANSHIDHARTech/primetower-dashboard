import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import type { UserRole } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: UserRole = 'superadmin';
  let fullName = 'Admin User';

  return (
    <div className="min-h-screen bg-[#FFF9E9]">
      <div className="flex">
        <Sidebar role={role} />
        <div className="flex-1 min-h-screen">
          <Header fullName={fullName} role={role} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
