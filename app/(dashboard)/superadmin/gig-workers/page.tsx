import { GigWorkersClient } from '@/components/gig-workers/GigWorkersClient';

export default function SuperAdminGigWorkersPage() {
  return (
    <GigWorkersClient
      basePath="/superadmin"
    />
  );
}
