import { WorkerDetailClient } from '@/components/gig-workers/WorkerDetailClient';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

export default function SuperAdminWorkerDetailPage({ params }: PageProps) {
  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/superadmin/gig-workers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#003178] hover:underline"
      >
        ← Back to Gig Workers
      </Link>

      <WorkerDetailClient workerId={params.id} />
    </div>
  );
}
