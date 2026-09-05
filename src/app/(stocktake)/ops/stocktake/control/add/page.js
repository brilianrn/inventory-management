'use client';

import ScheduleForm from '@/packages/catalog/presentation/schedule-form';
import { PageHeader } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';

export default function AddSchedulePage() {
  return (
    <DeskShell>
      <PageHeader
        title="Tambah Jadwal"
        description="Daftarkan jadwal stock take baru untuk satu outlet."
      />
      <ScheduleForm />
    </DeskShell>
  );
}
