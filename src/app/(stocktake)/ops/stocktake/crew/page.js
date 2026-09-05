'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { createDraft } from '@/packages/documents/domain/draft.rules';
import { getUseCases } from '@/shared/config/di';
import { clearDraft, readFreshDraft, writeDraft } from '@/shared/lib/counting-draft.storage';
import { formatDate, formatTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { SelectField } from '@/shared/ui/inputs';
import { ConfirmDialog, useToast } from '@/shared/ui/overlays';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

export default function CrewGatePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [outletId, setOutletId] = useState('');
  const [crewId, setCrewId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadGate = useCallback(async () => {
    const { catalog } = getUseCases();
    const [scheduleResult, crewResult] = await Promise.all([
      catalog.listSchedules(),
      catalog.listCrewAccounts(),
    ]);

    const draft = readFreshDraft();

    return {
      schedules: (scheduleResult.data ?? []).filter((schedule) => schedule.active),
      crews: (crewResult.data ?? []).filter((crew) => crew.active),
      draft,
    };
  }, []);

  const { data, isLoading } = useAsyncData(loadGate);
  const schedules = useMemo(() => data?.schedules ?? [], [data]);
  const crews = useMemo(() => data?.crews ?? [], [data]);
  const existingDraft = data?.draft ?? null;

  const outletOptions = useMemo(() => {
    const byOutlet = new Map();
    schedules.forEach((item) => {
      if (!byOutlet.has(item.outletId)) byOutlet.set(item.outletId, item.outletName);
    });
    return [...byOutlet].map(([value, label]) => ({ value, label }));
  }, [schedules]);

  const schedule = schedules.find((item) => item.outletId === outletId) ?? null;
  const crewsInOutlet = useMemo(
    () => crews.filter((crew) => crew.outletId === outletId),
    [crews, outletId],
  );
  const crew = crewsInOutlet.find((item) => item.id === crewId) ?? null;

  const canStart = Boolean(schedule && crew);

  const onStart = async () => {
    if (!canStart) return;
    setIsProcessing(true);

    const startedAt = new Date().toISOString();
    const result = await getUseCases().documents.startCounting({
      scheduleId: schedule.id,
      crewId: crew.id,
      crewName: crew.name,
      startedAt,
    });

    setIsProcessing(false);
    setIsConfirming(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    writeDraft(
      createDraft({
        scheduleId: schedule.id,
        outletId: schedule.outletId,
        outletName: schedule.outletName,
        crewId: crew.id,
        crewName: crew.name,
        startedAt,
        autoSubmit: schedule.autoSubmit,
      }),
    );

    router.push('/ops/stocktake/crew/form');
  };

  const resumeDraft = () => router.push('/ops/stocktake/crew/form');

  const discardDraft = () => {
    clearDraft();
    window.location.reload();
  };

  return (
    <MobileShell>
      <div className="mb-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon name="phone" className="size-5" />
        </span>
        <h2 className="mt-3 text-lg font-semibold text-strong">Perhitungan Stok</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih outlet dan namamu untuk memulai sesi perhitungan hari ini.
        </p>
      </div>

      <Card className="mb-4 border-dashed">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-strong">Catatan demo.</span> Di produksi halaman ini
          dibuka lewat tautan dalam dari aplikasi workplace; tautan itu membawa identitas crew dan
          sistem menukarnya jadi sesi tanpa ada yang perlu dipilih. Demo ini tidak punya penyedia
          identitas, jadi penukaran tersebut diganti pemilih di bawah.
        </p>
      </Card>

      {existingDraft ? (
        <Card className="mb-4 border-warn/40 bg-warn-soft">
          <p className="text-sm font-semibold text-warn">Ada hitungan yang belum dikirim</p>
          <p className="mt-1 text-xs text-body">
            {existingDraft.outletName} · {existingDraft.crewName} · dimulai{' '}
            {formatTime(existingDraft.startedAt)}
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={resumeDraft}>Lanjutkan</Button>
            <Button variant="outline" onClick={discardDraft}>
              Buang draf
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-11 animate-pulse rounded-lg bg-panel-soft" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <SelectField
              label="Outlet"
              value={outletId}
              placeholder="Pilih outlet"
              onChange={(value) => {
                setOutletId(value);
                setCrewId('');
              }}
              options={outletOptions}
            />

            <SelectField
              label="Nama Crew"
              value={crewId}
              placeholder={outletId ? 'Pilih crew' : 'Pilih outlet dulu'}
              onChange={setCrewId}
              disabled={!outletId}
              options={crewsInOutlet.map((item) => ({ value: item.id, label: item.name }))}
            />

            {outletId && !crewsInOutlet.length ? (
              <p className="rounded-lg bg-warn-soft px-3 py-2.5 text-xs text-warn">
                Outlet ini belum punya akun crew aktif. Tambahkan lewat halaman Technical Support.
              </p>
            ) : null}

            {schedule ? (
              <div className="rounded-lg bg-panel-soft px-3 py-2.5 text-xs text-muted-foreground">
                <p>
                  Jadwal: {schedule.scheduleDays.join(', ')} · {schedule.reminderHour} WIB
                </p>
                <p className="mt-1">Berlaku sejak {formatDate(schedule.startDate)}</p>
                <p className="mt-1">
                  Kirim otomatis saat waktu habis:{' '}
                  <span className={schedule.autoSubmit ? 'font-semibold text-warn' : ''}>
                    {schedule.autoSubmit ? 'Ya' : 'Tidak'}
                  </span>
                </p>
              </div>
            ) : null}

            <Button
              className="w-full justify-center"
              disabled={!canStart}
              onClick={() => setIsConfirming(true)}
            >
              Mulai
            </Button>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Mulai Perhitungan Stok?"
        description="Apakah kamu yakin untuk memulai perhitungan stok produk? Sesi berlaku dua jam sejak sekarang."
        confirmLabel="Mulai"
        isProcessing={isProcessing}
        onConfirm={onStart}
        onCancel={() => setIsConfirming(false)}
      />
    </MobileShell>
  );
}
