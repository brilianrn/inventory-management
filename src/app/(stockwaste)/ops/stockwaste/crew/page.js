'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  buildWasteSubmission,
  categoryFilledCount,
  resolveWasteWindow,
  totalFilledCount,
  WASTE_WINDOW_CLOSE_HOUR,
  WASTE_WINDOW_OPEN_HOUR,
} from '@/packages/documents/domain/waste-input.rules';
import { getUseCases } from '@/shared/config/di';
import {
  clearWasteDraft,
  createWasteDraft,
  readFreshWasteDraft,
  writeWasteDraft,
} from '@/shared/lib/waste-draft.storage';
import { formatDate, formatTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { SelectField } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

export default function WasteCrewPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const windowMode = useSelector((state) => state.demo.wasteWindow);
  const isWindowOpen = resolveWasteWindow(windowMode);

  const [draft, setDraft] = useState(() => readFreshWasteDraft());
  const [outletId, setOutletId] = useState('');
  const [crewId, setCrewId] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadGate = useCallback(async () => {
    const { catalog } = getUseCases();
    const [outletResult, crewResult] = await Promise.all([
      catalog.listOutlets(),
      catalog.listCrewAccounts(),
    ]);
    return {
      outlets: outletResult.data ?? [],
      crews: (crewResult.data ?? []).filter((crew) => crew.active),
    };
  }, []);

  const { data, isLoading } = useAsyncData(loadGate);
  const outlets = useMemo(() => data?.outlets ?? [], [data]);
  const crews = useMemo(() => data?.crews ?? [], [data]);

  const sessionOutletId = draft?.outletId ?? null;

  const loadSheet = useCallback(async () => {
    if (!sessionOutletId) return null;
    const { data: sheet } = await getUseCases().catalog.getWasteInputSheet({
      outletId: sessionOutletId,
    });
    return sheet ?? null;
  }, [sessionOutletId]);

  const { data: sheet, isLoading: isSheetLoading } = useAsyncData(loadSheet);

  const crewsInOutlet = useMemo(
    () => crews.filter((crew) => crew.outletId === outletId),
    [crews, outletId],
  );

  const startSession = () => {
    const outlet = outlets.find((item) => item.id === outletId);
    const crew = crewsInOutlet.find((item) => item.id === crewId);
    if (!outlet || !crew) return;

    const next = createWasteDraft({
      outletId: outlet.id,
      outletName: outlet.displayName,
      crewId: crew.id,
      crewName: crew.name,
      startedAt: new Date().toISOString(),
    });

    writeWasteDraft(next);
    setDraft(next);
  };

  const endSession = () => {
    clearWasteDraft();
    setDraft(null);
  };

  const onSubmit = async () => {
    setIsProcessing(true);

    const result = await getUseCases().documents.submitWaste({
      outletId: draft.outletId,
      crewName: draft.crewName,
      categories: buildWasteSubmission(draft),
    });

    setIsProcessing(false);
    setIsConfirming(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    clearWasteDraft();
    router.replace(`/ops/stockwaste/crew/success?documents=${result.data.documentCount}`);
  };

  if (!isWindowOpen) {
    return (
      <MobileShell>
        <ClosedWindowNotice />
      </MobileShell>
    );
  }

  if (!draft) {
    return (
      <MobileShell>
        <div className="mb-5 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="trash" className="size-5" />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-strong">Form Waste</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih outlet dan namamu untuk mulai mencatat produk terbuang.
          </p>
        </div>

        <Card className="mb-4 border-dashed">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-strong">Catatan demo.</span> Di produksi halaman ini
            dibuka lewat tautan dalam dari aplikasi workplace. Tautan itu membawa identitas crew
            beserta daftar kategori yang boleh ia isi — hak akses di aplikasi ini berbentuk data,
            bukan peran. Demo tidak punya penyedia identitas, jadi kategorinya diambil dari
            konfigurasi Stock Waste App di Inventory Admin.
          </p>
        </Card>

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
                options={outlets.map((item) => ({ value: item.id, label: item.displayName }))}
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

              <Button
                className="w-full justify-center"
                disabled={!outletId || !crewId}
                onClick={startSession}
              >
                Mulai
              </Button>
            </div>
          )}
        </Card>
      </MobileShell>
    );
  }

  const categories = sheet?.categories ?? [];
  const filledTotal = totalFilledCount(draft);

  return (
    <MobileShell>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-strong">{draft.outletName}</p>
          <p className="text-xs text-muted-foreground">{draft.crewName}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsInfoOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Icon name="info" className="size-4" />
          Info Form
        </button>
      </div>

      <h2 className="mb-3 text-base font-semibold text-strong">Pilih Kategori</h2>

      {isSheetLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-panel" />
          ))}
        </div>
      ) : (
        <div className="mb-24 space-y-3">
          {categories.map((category) => {
            const filled = categoryFilledCount(draft, category.id);

            return (
              <Link
                key={category.id}
                href={`/ops/stockwaste/crew/${category.id}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3.5 transition-colors hover:border-brand"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-strong">{category.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {filled ? `${filled} produk terisi` : 'Belum ada produk'}
                    {category.requiresExpiryDate ? ' · butuh tanggal kadaluarsa' : ''}
                  </span>
                </span>
                {filled ? (
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white tabular-nums">
                    {filled}
                  </span>
                ) : null}
                <Icon name="chevronRight" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={endSession}
            className="w-full pt-1 text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Keluar dan ganti sesi
          </button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t bg-card px-4 py-3">
        <Button
          className="w-full justify-center"
          disabled={!filledTotal}
          onClick={() => setIsConfirming(true)}
        >
          {filledTotal ? `Submit (${filledTotal} produk)` : 'Belum ada produk yang diisi'}
        </Button>
      </div>

      <Modal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title="Info Form"
        width="max-w-sm"
      >
        <dl className="space-y-3">
          {[
            ['Outlet', draft.outletName],
            ['Outlet Crew', draft.crewName],
            ['Mulai', `${formatDate(draft.startedAt)} ${formatTime(draft.startedAt)}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm text-strong">{value}</dd>
            </div>
          ))}
        </dl>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Submit Form Waste?"
        description="Pastikan kamu sudah mengisi form waste dengan benar sebelum melakukan submit."
        confirmLabel="Submit"
        isProcessing={isProcessing}
        onConfirm={onSubmit}
        onCancel={() => setIsConfirming(false)}
      />
    </MobileShell>
  );
}

function ClosedWindowNotice() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-full bg-warn-soft text-warn">
        <Icon name="clock" className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-strong">Form belum tersedia</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Pengisian form hanya dapat dilakukan mulai dari pukul{' '}
        {String(WASTE_WINDOW_OPEN_HOUR).padStart(2, '0')}.00 -{' '}
        {String(WASTE_WINDOW_CLOSE_HOUR).padStart(2, '0')}.00
      </p>
      <p className="mt-6 max-w-xs rounded-lg bg-panel-soft px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-strong">Catatan demo.</span> Jendela waktu ini bisa
        dipaksa buka atau tutup lewat panel demo, supaya kedua keadaan bisa diperagakan kapan pun.
      </p>
    </div>
  );
}
