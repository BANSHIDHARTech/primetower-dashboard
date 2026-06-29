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
  const tokenCookie = cookies().get('access_token');
  const token = tokenCookie?.value;

  if (!token) redirect('/login');

  let role: UserRole = 'dealer';
  let fullName = 'User';

  try {
    const decoded: any = jwtDecode(token);
    role = decoded.role as UserRole;
    fullName = decoded.phone || 'User';
  } catch (error) {
    redirect('/login');
  }

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
