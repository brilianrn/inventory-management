'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  REMINDER_HOURS,
  SCHEDULE_STATUSES,
  WEEKEND_DAYS,
  WEEK_DAYS,
  isScheduleDraftDirty,
  isScheduleDraftValid,
  sortWeekDays,
} from '../domain/schedule.rules';
import { Checkbox } from '@/components/ui/checkbox';
import { usePermission } from '@/packages/access/presentation';
import { getUseCases } from '@/shared/config/di';
import { toDateInputValue } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckboxList, SelectField } from '@/shared/ui/inputs';
import { ConfirmDialog, useToast } from '@/shared/ui/overlays';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

const emptyDraft = {
  outletId: '',
  brandIds: [],
  startDate: '',
  scheduleDays: [],
  reminderHour: '',
  status: 'active',
  autoSubmit: false,
};

const FieldError = ({ message }) =>
  message ? <p className="mt-1.5 text-xs text-destructive">{message}</p> : null;

export default function ScheduleForm({ scheduleId = null }) {
  const router = useRouter();
  const { profile } = usePermission();
  const { showToast } = useToast();

  const isEditing = Boolean(scheduleId);

  const [draft, setDraft] = useState(emptyDraft);
  const [original, setOriginal] = useState(null);
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadForm = useCallback(async () => {
    const { catalog } = getUseCases();
    const [outletResult, brandResult, scheduleResult] = await Promise.all([
      catalog.listOutlets(),
      catalog.listBrands(),
      scheduleId ? catalog.getSchedule(scheduleId) : Promise.resolve({ data: null }),
    ]);

    return {
      outlets: outletResult.data ?? [],
      brands: brandResult.data ?? [],
      schedule: scheduleResult.data ?? null,
    };
  }, [scheduleId]);

  const { data, isLoading } = useAsyncData(loadForm);

  const outlets = useMemo(() => data?.outlets ?? [], [data]);
  const brands = useMemo(() => data?.brands ?? [], [data]);

  const loadedSchedule = data?.schedule ?? null;
  if (loadedSchedule && !original) {
    const initial = {
      outletId: loadedSchedule.outletId,
      brandIds: [...loadedSchedule.brandIds],
      startDate: toDateInputValue(loadedSchedule.startDate),
      scheduleDays: [...loadedSchedule.scheduleDays],
      reminderHour: loadedSchedule.reminderHour,
      status: loadedSchedule.active ? 'active' : 'inactive',
      autoSubmit: Boolean(loadedSchedule.autoSubmit),
    };
    setOriginal(initial);
    setDraft(initial);
  }

  const patch = (changes) => {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors({});
  };

  const toggleInList = (key, value) =>
    setDraft((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });

  const isValid = isScheduleDraftValid({ ...draft, isEditing });
  const isDirty = isScheduleDraftDirty(draft, original);
  const isWeekendStart = draft.startDate
    ? WEEKEND_DAYS.includes(WEEK_DAYS[(new Date(draft.startDate).getDay() + 6) % 7])
    : false;

  const onSave = async () => {
    setIsProcessing(true);
    setBannerError(null);
    setErrors({});

    const result = await getUseCases().catalog.saveSchedule({
      id: scheduleId,
      draft,
      actor: profile?.name,
    });

    setIsProcessing(false);
    setIsConfirming(false);

    if (result.error) {
      setErrors(result.errors ?? {});
      setBannerError(result.message);
      return;
    }

    router.replace('/ops/stocktake/control/success');
  };

  const leave = () => router.push('/ops/stocktake/control');

  const requestLeave = () => {
    if (isDirty) setIsLeaving(true);
    else leave();
  };

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={requestLeave}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-strong"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kembali ke daftar jadwal
      </button>

      <Card className="max-w-2xl">
        <h2 className="mb-5 text-base font-semibold text-strong">Informasi Jadwal</h2>

        {bannerError ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-danger-soft px-4 py-3 text-sm text-destructive">
            <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
            <span>{bannerError}</span>
          </div>
        ) : null}

        <div className="space-y-5">
          <div>
            <SelectField
              label="Nama Outlet"
              value={draft.outletId}
              placeholder="Pilih outlet"
              disabled={isEditing}
              onChange={(value) => patch({ outletId: value })}
              options={outlets.map((outlet) => ({ value: outlet.id, label: outlet.displayName }))}
            />
            {isEditing ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Outlet tidak bisa dipindah. Kalau salah, nonaktifkan jadwal ini lalu buat yang baru.
              </p>
            ) : null}
            <FieldError message={errors.outletId} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Nama Brand
              </span>
              <button
                type="button"
                onClick={() =>
                  patch({
                    brandIds:
                      draft.brandIds.length === brands.length ? [] : brands.map((brand) => brand.id),
                  })
                }
                className="text-xs font-medium text-brand transition-opacity hover:opacity-70"
              >
                {draft.brandIds.length === brands.length ? 'Kosongkan' : 'Pilih Semua'}
              </button>
            </div>
            <CheckboxList
              searchable
              height="h-40"
              options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
              selected={draft.brandIds}
              onToggle={(value) => toggleInList('brandIds', value)}
            />
            <FieldError message={errors.brandIds} />
          </div>

          <div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Tanggal Mulai
              </Label>
              <Input
                type="date"
                value={draft.startDate}
                min={toDateInputValue(new Date())}
                aria-invalid={Boolean(errors.startDate)}
                onChange={(event) => patch({ startDate: event.target.value })}
              />
            </div>
            {isWeekendStart ? (
              <p className="mt-1.5 text-xs text-warn">
                Tanggal yang dipilih jatuh pada akhir pekan.
              </p>
            ) : null}
            <FieldError message={errors.startDate} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Waktu penjadwalan
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-xs text-muted-foreground">Setiap Hari</span>
                <div className="rounded-lg border p-2.5">
                  {WEEK_DAYS.map((day) => (
                    <Label key={day} className="flex items-center gap-2.5 px-1 py-1 font-normal">
                      <Checkbox
                        checked={draft.scheduleDays.includes(day)}
                        onCheckedChange={() => toggleInList('scheduleDays', day)}
                      />
                      <span className="text-sm text-body">{day}</span>
                    </Label>
                  ))}
                </div>
                <FieldError message={errors.scheduleDays} />
              </div>

              <div>
                <SelectField
                  label="Pada Jam"
                  value={draft.reminderHour}
                  placeholder="Pilih jam"
                  onChange={(value) => patch({ reminderHour: value })}
                  options={REMINDER_HOURS.map((hour) => ({ value: hour, label: `${hour} WIB` }))}
                />
                <FieldError message={errors.reminderHour} />

                <Label className="mt-4 flex items-start gap-2.5 font-normal">
                  <Checkbox
                    checked={draft.autoSubmit}
                    onCheckedChange={(value) => patch({ autoSubmit: Boolean(value) })}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-body">Kirim otomatis saat waktu habis</span>
                    <span className="block text-xs text-muted-foreground">
                      Sesi crew yang kehabisan waktu langsung terkirim apa adanya.
                    </span>
                  </span>
                </Label>
              </div>
            </div>

            <FieldError message={errors.scheduleTiming} />
          </div>

          {isEditing ? (
            <div>
              <SelectField
                label="Status Scheduler"
                value={draft.status}
                onChange={(value) => patch({ status: value })}
                options={SCHEDULE_STATUSES.map((status) => ({
                  value: status.code,
                  label: status.label,
                }))}
              />
              <FieldError message={errors.status} />
            </div>
          ) : (
            <p className="rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
              Jadwal baru otomatis berstatus Aktif. Statusnya bisa diubah setelah tersimpan.
            </p>
          )}

          {draft.scheduleDays.length ? (
            <p className="text-xs text-muted-foreground">
              Ringkasan: setiap {sortWeekDays(draft.scheduleDays).join(', ')}
              {draft.reminderHour ? ` pukul ${draft.reminderHour} WIB` : ''}.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={requestLeave}>
            Batal
          </Button>
          <Button disabled={!isValid} onClick={() => setIsConfirming(true)}>
            Simpan Jadwal
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Simpan Penjadwalan"
        description="Penjadwalan stock take akan disimpan ke outlet yang dipilih. Yakin untuk menyimpan jadwal?"
        confirmLabel="Simpan"
        isProcessing={isProcessing}
        onConfirm={onSave}
        onCancel={() => setIsConfirming(false)}
      />

      <ConfirmDialog
        isOpen={isLeaving}
        title="Hapus Perubahan?"
        description="Apakah kamu yakin ingin menghapus perubahan yang telah dilakukan?"
        confirmLabel="Hapus Perubahan"
        cancelLabel="Tetap di Sini"
        onConfirm={leave}
        onCancel={() => setIsLeaving(false)}
      />
    </>
  );
}
