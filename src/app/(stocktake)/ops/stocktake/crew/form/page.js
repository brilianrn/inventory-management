'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  countProgress,
  filterSheetProducts,
  isCountInputAccepted,
  normalizeCount,
  remainingMs,
  resolveBrandStatus,
  sheetProgress,
} from '@/packages/documents/domain/counting.rules';
import { withCount } from '@/packages/documents/domain/draft.rules';
import { getUseCases } from '@/shared/config/di';
import { clearDraft, readFreshDraft, writeDraft } from '@/shared/lib/counting-draft.storage';
import { formatDate, formatTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Button as UiButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { SearchBox } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

const pad = (value) => String(value).padStart(2, '0');

function Countdown({ startedAt, onExpire }) {
  const [remaining, setRemaining] = useState(() => remainingMs(startedAt));
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = remainingMs(startedAt);
      setRemaining(left);

      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining > 0 && remaining < 10 * 60 * 1000;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
        remaining === 0
          ? 'bg-danger-soft text-danger'
          : isUrgent
            ? 'bg-warn-soft text-warn'
            : 'bg-brand-soft text-brand'
      }`}
    >
      <Icon name="clock" className="size-3.5" />
      {remaining === 0 ? 'Waktu habis' : `${pad(minutes)}:${pad(seconds)}`}
    </span>
  );
}

function BrandChip({ brand, counts, isSelected, onSelect }) {
  const { status, filled, total } = resolveBrandStatus(brand, counts);
  const isComplete = status === 'complete';

  const tone = isSelected
    ? isComplete
      ? 'border-brand bg-brand text-white hover:bg-brand hover:text-white'
      : 'border-warn bg-warn text-white hover:bg-warn hover:text-white'
    : isComplete
      ? 'border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand'
      : 'border-warn/30 bg-warn-soft text-warn hover:bg-warn-soft hover:text-warn';

  return (
    <UiButton
      variant="outline"
      size="lg"
      onClick={onSelect}
      className={cn('shrink-0 gap-1.5', tone)}
    >
      {brand.brandName}
      <Icon name={isComplete ? 'check' : 'alert'} className="size-3.5" strokeWidth={2} />
      <span className="text-xs opacity-80 tabular-nums">
        {filled}/{total}
      </span>
    </UiButton>
  );
}

export default function CrewCountingFormPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [draft, setDraft] = useState(() => readFreshDraft());
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const [showProductCode, setShowProductCode] = useState(false);
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [showHint, setShowHint] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const counts = useMemo(() => draft?.counts ?? {}, [draft]);
  const scheduleId = draft?.scheduleId ?? null;

  const loadSheet = useCallback(async () => {
    if (!scheduleId) return null;
    const { data } = await getUseCases().documents.getCountingSheet(scheduleId);
    return data ?? null;
  }, [scheduleId]);

  const { data: sheet, isLoading } = useAsyncData(loadSheet);

  useEffect(() => {
    if (!draft) router.replace('/ops/stocktake/crew');
  }, [draft, router]);

  const brands = useMemo(() => sheet?.brands ?? [], [sheet]);
  const activeBrand = brands.find((brand) => brand.brandId === selectedBrandId) ?? brands[0] ?? null;

  const effectiveOpenCategoryId = openCategoryId ?? activeBrand?.categories[0]?.categoryId ?? null;

  const visibleCategories = useMemo(() => {
    if (!activeBrand) return [];
    return filterSheetProducts(activeBrand.categories, { counts, onlyEmpty, query });
  }, [activeBrand, counts, onlyEmpty, query]);

  const progress = useMemo(() => sheetProgress(brands, counts), [brands, counts]);

  const persist = useCallback((next) => {
    setDraft(next);
    writeDraft(next);
  }, []);

  const onChangeCount = (productId, raw) => {
    if (!isCountInputAccepted(raw)) return;
    persist(withCount(draft, productId, raw));
  };

  const onCommitCount = (productId) => {
    getUseCases().documents.saveProductCount({
      sessionId: draft.sessionId ?? null,
      productId,
      counted: normalizeCount(counts[productId]) ?? 0,
    });
  };

  const submit = useCallback(
    async (autoSubmitted = false) => {
      if (!sheet || !draft) return;
      setIsProcessing(true);

      const result = await getUseCases().documents.submitCounting({
        sheet,
        counts: draft.counts,
        crewName: draft.crewName,
        startedAt: draft.startedAt,
        autoSubmitted,
      });

      setIsProcessing(false);
      setIsConfirming(false);

      if (result.error) {
        showToast(result.message, 'error');
        return;
      }

      clearDraft();
      router.replace(`/ops/stocktake/crew/success?auto=${autoSubmitted ? '1' : '0'}`);
    },
    [sheet, draft, router, showToast],
  );

  const onExpire = useCallback(() => {
    if (draft?.autoSubmit) submit(true);
    else showToast('Waktu sesi habis. Hitunganmu masih tersimpan sebagai draf.', 'error');
  }, [draft?.autoSubmit, submit, showToast]);

  if (!draft) return null;

  if (isLoading || !sheet) {
    return (
      <MobileShell reloadOnRestore>
        <Card>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </MobileShell>
    );
  }

  return (
    <MobileShell reloadOnRestore>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsInfoOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Icon name="info" className="size-4" />
          Info Form
        </button>
        <Countdown startedAt={draft.startedAt} onExpire={onExpire} />
      </div>

      <div className="-mx-4 mb-3 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2">
          {brands.map((brand) => (
            <BrandChip
              key={brand.brandId}
              brand={brand}
              counts={counts}
              isSelected={brand.brandId === activeBrand?.brandId}
              onSelect={() => {
                setSelectedBrandId(brand.brandId);
                setOpenCategoryId(null);
              }}
            />
          ))}
        </div>
      </div>

      {showHint ? (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-strong px-3 py-2.5 text-xs text-white">
          <span className="flex-1">
            Kamu harus menginputkan semua hasil hitung produk di bawah ini minimal 0
          </span>
          <button type="button" onClick={() => setShowHint(false)} aria-label="Tutup pesan">
            <Icon name="close" className="size-3.5" />
          </button>
        </div>
      ) : null}

      <Card className="mb-24">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Label className="flex items-center gap-2 text-xs font-normal text-body">
              <Switch
                checked={showProductCode}
                onCheckedChange={setShowProductCode}
                className="scale-90"
              />
              Tampilkan kode produk
            </Label>
            <Label className="flex items-center gap-2 text-xs font-normal text-body">
              <Switch checked={onlyEmpty} onCheckedChange={setOnlyEmpty} className="scale-90" />
              Tampilkan produk kosong
            </Label>
          </div>

          <UiButton
            size="icon"
            onClick={() => {
              setIsSearching((value) => !value);
              setQuery('');
            }}
            aria-label="Cari produk"
          >
            <Icon name={isSearching ? 'close' : 'search'} className="size-4" />
          </UiButton>
        </div>

        {isSearching ? (
          <div className="mb-3">
            <SearchBox value={query} onChange={setQuery} placeholder="Cari nama produk" />
          </div>
        ) : null}

        {visibleCategories.length ? (
          <div className="divide-y overflow-hidden rounded-xl border">
            {visibleCategories.map((category) => {
              const categoryProgress = countProgress(category.products, counts);
              const isOpen = query.trim() ? true : category.categoryId === effectiveOpenCategoryId;

              return (
                <div key={category.categoryId}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCategoryId(isOpen && !query.trim() ? 'none' : category.categoryId)
                    }
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <Icon
                      name="chevronRight"
                      className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    />
                    <span className="flex-1 text-sm font-medium text-strong">
                      {category.categoryName} ({categoryProgress.filled}/{categoryProgress.total})
                    </span>
                    {categoryProgress.isComplete ? (
                      <span className="grid size-5 place-items-center rounded-full bg-brand text-white">
                        <Icon name="check" className="size-3" strokeWidth={2.5} />
                      </span>
                    ) : null}
                  </button>

                  {isOpen ? (
                    <div className="border-t">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            {showProductCode ? (
                              <TableHead className="h-8 text-xs font-semibold tracking-wide uppercase">
                                Kode
                              </TableHead>
                            ) : null}
                            <TableHead className="h-8 text-xs font-semibold tracking-wide uppercase">
                              Nama Produk
                            </TableHead>
                            <TableHead className="h-8 text-xs font-semibold tracking-wide uppercase">
                              UoM
                            </TableHead>
                            <TableHead className="h-8 text-right text-xs font-semibold tracking-wide uppercase">
                              Hasil Hitung
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {category.products.map((product) => (
                            <TableRow key={product.id}>
                              {showProductCode ? (
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {product.code}
                                </TableCell>
                              ) : null}
                              <TableCell className="text-body">{product.name}</TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {product.uom}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={counts[product.id] ?? ''}
                                  placeholder="0"
                                  onChange={(event) => onChangeCount(product.id, event.target.value)}
                                  onBlur={() => onCommitCount(product.id)}
                                  className="ml-auto w-20 text-right tabular-nums"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {onlyEmpty
              ? 'Semua produk pada brand ini sudah terisi.'
              : 'Tidak ada produk yang cocok dengan pencarian.'}
          </p>
        )}
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t bg-card px-4 py-3">
        <Button
          className="w-full justify-center"
          disabled={!progress.isComplete}
          onClick={() => setIsConfirming(true)}
        >
          {progress.isComplete
            ? 'Submit'
            : `${progress.filled} dari ${progress.total} produk telah di hitung`}
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
            ['Jadwal', `${sheet.scheduleDays.join(', ')} · ${sheet.reminderHour} WIB`],
            ['Mulai', `${formatDate(draft.startedAt)} ${formatTime(draft.startedAt)}`],
            ['Kirim otomatis', draft.autoSubmit ? 'Ya, saat waktu habis' : 'Tidak'],
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
        title="Simpan Perhitungan Stok?"
        description="Apakah kamu yakin telah melakukan perhitungan dengan benar?"
        confirmLabel="Simpan"
        isProcessing={isProcessing}
        onConfirm={() => submit(false)}
        onCancel={() => setIsConfirming(false)}
      />
    </MobileShell>
  );
}
