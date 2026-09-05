'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Can, usePermission } from '@/packages/access/presentation';
import { STOCK_TAKE_STATUS_LABEL } from '@/packages/documents/domain/status';
import { enrichStockTakeLine } from '@/packages/documents/domain/stocktake.rules';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getUseCases } from '@/shared/config/di';
import { BackLink, Fieldset, InfoHint, NotificationBanner, StatusBadge } from '@/shared/ui/display';
import { formatCurrency, formatDate, formatDateTime, formatDecimal, formatPercent } from '@/shared/ui/format';
import { ConfirmDialog, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

const FINAL_SOH_HINT =
  'Final Stock On Hand dihitung otomatis berdasarkan SOH sistem pada saat dokumen adjustment terbentuk di ERP (scheduler pukul 12:00).';

export default function StockTakeDetailPage() {
  const { id } = useParams();
  const { now, isRestricted, profile } = usePermission();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [banner, setBanner] = useState(null);
  const [isConfirmingValidate, setIsConfirmingValidate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const restricted = isRestricted('stocktake.validate');

  const loadDocument = useCallback(async () => {
    const { data } = await getUseCases().documents.getStockTakeDetail({ id, restricted, now });
    return data ?? null;
  }, [id, restricted, now]);

  const { data: document, isLoading, reload } = useAsyncData(loadDocument);

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const lines = useMemo(() => {
    if (!document) return [];
    return document.lines.map((line) => {
      const draft = drafts[line.id];
      if (draft === undefined || draft === '') return line;
      const counted = Number(draft);
      if (Number.isNaN(counted)) return line;
      return enrichStockTakeLine({ ...line, counted });
    });
  }, [document, drafts]);

  const onSave = async () => {
    const counts = Object.entries(drafts)
      .filter(([, value]) => value !== '' && !Number.isNaN(Number(value)))
      .map(([lineId, value]) => ({ lineId, counted: Number(value) }));

    if (!counts.length) {
      setIsEditing(false);
      return;
    }

    setIsProcessing(true);
    const result = await getUseCases().documents.saveStockTakeCounts({ id, counts, restricted, now });
    setIsProcessing(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    setDrafts({});
    setIsEditing(false);
    reload();
    setBanner(result.message);
  };

  const onValidate = async () => {
    setIsProcessing(true);
    const result = await getUseCases().documents.validateStockTake({
      ids: [id],
      validatedBy: profile?.name,
      restricted,
      now,
    });
    setIsProcessing(false);
    setIsConfirmingValidate(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    reload();
    showToast(result.message);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-muted-foreground">Dokumen tidak ditemukan.</p>
      </Card>
    );
  }

  const showActions = document.isAllowValidate;

  return (
    <>
      <BackLink href="/stocktake">Kembali ke daftar Stock Take</BackLink>

      <PageHeader
        title={document.outletName}
        description={document.scheduleName}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge tone={document.status}>{STOCK_TAKE_STATUS_LABEL[document.status]}</StatusBadge>

            {showActions && isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setDrafts({}); setIsEditing(false); }}>
                  Batal
                </Button>
                <Button icon="check" onClick={onSave} disabled={isProcessing}>
                  Simpan
                </Button>
              </>
            ) : null}

            {showActions && !isEditing ? (
              <>
                <Can permission="stocktake.edit" respectTimeWindow>
                  <Button variant="outline" icon="edit" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                </Can>
                <Can permission="stocktake.validate" respectTimeWindow>
                  <Button icon="check" onClick={() => setIsConfirmingValidate(true)}>
                    Validasi Stock Take
                  </Button>
                </Can>
              </>
            ) : null}
          </div>
        }
      />

      {banner ? <NotificationBanner message={banner} onDismiss={() => setBanner(null)} /> : null}

      <Card className="mb-4">
        <Fieldset
          items={[
            { label: 'Nama Jadwal', value: document.scheduleName, wide: true },
            { label: 'Outlet', value: document.outletName },
            { label: 'Outlet Crew', value: document.crewName },
            { label: 'Tanggal', value: formatDate(document.date) },
            {
              label: 'Waktu Mulai — Selesai',
              value: `${formatDateTime(document.startTime)} — ${
                document.endTime ? formatDateTime(document.endTime) : 'belum selesai'
              }`,
            },
            { label: 'Divalidasi Oleh', value: document.validatedBy ?? 'Belum divalidasi' },
            { label: 'Divalidasi Pada', value: document.validatedAt ? formatDateTime(document.validatedAt) : '-' },
          ]}
        />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-strong">
            Item dokumen
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {document.itemCount} baris · {document.flaggedCount} perlu diperiksa
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">Total nilai: {formatCurrency(document.totalValue)}</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {['Brand', 'Produk', 'On Hand', 'Counted', 'Variance', 'Variance (%)', 'Cost', 'Value', 'UoM'].map(
                (header) => (
                  <TableHead
                    key={header}
                    className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap"
                  >
                    {header}
                  </TableHead>
                ),
              )}
              <TableHead className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                Final SOH
                <InfoHint text={FINAL_SOH_HINT} />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id} className={cn(line.outOfTolerance && 'bg-warn-soft/60')}>
                <TableCell className="whitespace-nowrap text-body">{line.brandName}</TableCell>
                <TableCell className="text-body">{line.productName}</TableCell>
                <TableCell className="text-right tabular-nums text-body">
                  {formatDecimal(line.stockOnHand)}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={drafts[line.id] ?? line.counted}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [line.id]: event.target.value }))
                      }
                      className="ml-auto w-24 text-right tabular-nums"
                    />
                  ) : (
                    <span className="tabular-nums text-body">{formatDecimal(line.counted)}</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    line.outOfTolerance ? 'font-semibold text-warn' : 'text-body',
                  )}
                >
                  {formatDecimal(line.variance)}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right tabular-nums',
                    line.outOfTolerance ? 'font-semibold text-warn' : 'text-body',
                  )}
                >
                  {formatPercent(line.variancePercent)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-body">
                  {formatCurrency(line.cost)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-body">
                  {formatCurrency(line.value)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-body">{line.uom}</TableCell>
                <TableCell className="text-right tabular-nums text-body">
                  {formatDecimal(line.finalSoh)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Baris berlatar kuning adalah selisih di luar toleransi ±5%, atau stok sistem nol tapi hasil
          hitungnya bukan nol. Penandaan ini tidak memblokir penyimpanan — hanya mengarahkan
          pemeriksaan.
        </p>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmingValidate}
        title="Validasi Stock Take?"
        description="Setelah divalidasi, data ini sudah tidak bisa diedit lagi dan statusnya otomatis terganti."
        confirmLabel="Validasi"
        isProcessing={isProcessing}
        onConfirm={onValidate}
        onCancel={() => setIsConfirmingValidate(false)}
      />
    </>
  );
}
