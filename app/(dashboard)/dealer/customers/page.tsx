import { fetchWithCookie } from '@/lib/queries/server-api';
import { CustomersClient } from '@/components/customers/CustomersClient';
import type { CustomerDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DealerCustomersPage() {
  const data = await fetchWithCookie('/leads').catch(() => []);
  const customers = (data || []) as CustomerDetail[];

  return <CustomersClient basePath="/dealer" initialCustomers={customers} />;
}
