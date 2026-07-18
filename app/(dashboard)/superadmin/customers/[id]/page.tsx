import { fetchWithCookie } from '@/lib/queries/server-api';
import { CustomerDetailView } from '@/components/customers/CustomerDetailView';
import type { CustomerDetail } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await fetchWithCookie(`/leads/${params.id}`).catch(() => null);
  const customer = (data as CustomerDetail) || undefined;

  return (
    <CustomerDetailView
      customerId={params.id}
      basePath="/superadmin"
      initialData={customer}
    />
  );
}
