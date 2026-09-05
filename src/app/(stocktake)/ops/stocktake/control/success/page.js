'use client';

import { useRouter } from 'next/navigation';
import Icon from '@/shared/ui/icon';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';

export default function ScheduleSuccessPage() {
  const router = useRouter();

  return (
    <DeskShell>
      <Card className="mx-auto max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="check" className="size-6" strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-strong">Berhasil Menyimpan Jadwal</h2>
        <p className="mt-2 text-sm text-muted-foreground">Kamu berhasil menyimpan jadwal outlet!</p>
        <div className="mt-6">
          <Button className="w-full justify-center" onClick={() => router.replace('/ops/stocktake/control')}>
            Oke, Mengerti
          </Button>
        </div>
      </Card>
    </DeskShell>
  );
}
