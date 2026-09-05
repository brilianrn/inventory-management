'use client';

import { useParams } from 'next/navigation';
import ScheduleForm from '@/packages/catalog/presentation/schedule-form';
import { PageHeader } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';

export default function EditSchedulePage() {
  const { id } = useParams();

  return (
    <DeskShell>
      <PageHeader
        title="Edit Jadwal"
        description="Ubah brand, waktu, dan status jadwal. Outlet terkunci karena jadwal menempel padanya."
      />
      <ScheduleForm scheduleId={id} />
    </DeskShell>
  );
}
