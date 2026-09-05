'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/packages/access/presentation';
import {
  DO_STATUS_OPTIONS,
  DO_STATUS_TONE,
  isExportAllowed,
  resendableDrafts,
} from '@/packages/documents/domain/receiving.rules';
import { DELIVERY_ORDER_STATUS_LABEL } from '@/packages/documents/domain/status';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import { applyListFilter, optionsFromRows } from '@/shared/lib/list-filter';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import FilterPopover, { FilterColumn, FilterColumns } from '@/shared/ui/filter-popover';
import { formatDate, formatDateTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Label } from '@/components/ui/label';
import { CheckboxList, DateRangeField, SearchBox } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';
import { FilterScope } from '@/shared/store/filters.slice';
import { useListFilters } from '@/shared/ui/use-list-filters';

export default function ReceivingDeskPage() {
  const { showToast } = useToast();
  const filters = useListFilters(FilterScope.DELIVERY_ORDER);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadOrders = useCallback(async () => {
    const { data } = await getUseCases().documents.listDeliveryOrders();
    return data ?? [];
  }, []);

  const { data: orders = [], isLoading, reload } = useAsyncData(loadOrders);

  const rows = useMemo(
    () =>
      applyListFilter(orders, filters.applied, {
        dateOf: (row) => row.shippingDate,
        selectors: {
          destinationLocation: (row) => row.destinationLocation,
          status: (row) => row.status,
        },
        searchable: (row) => [row.doNumber, row.sourceLocation, row.destinationLocation, row.user],
      }),
    [orders, filters.applied],
  );

  const outletOptions = useMemo(
    () => optionsFromRows(orders, (row) => row.destinationLocation),
    [orders],
  );

  const drafts = useMemo(() => resendableDrafts(orders), [orders]);
  const canExport = isExportAllowed(filters.isFiltering, rows);

  const columns = useMemo(
    () => [
      {
        key: 'shippingDate',
        header: 'Tanggal Kirim',
        width: '9rem',
        render: (row) => formatDate(row.shippingDate),
      },
      { key: 'sourceLocation', header: 'Sumber', render: (row) => row.sourceLocation },
      { key: 'destinationLocation', header: 'Tujuan', render: (row) => row.destinationLocation },
      { key: 'doNumber', header: 'Nomor DO', render: (row) => row.doNumber },
      {
        key: 'user',
        header: 'Pengguna',
        render: (row) => row.user || <span className="text-muted-foreground">-</span>,
      },
      {
        key: 'dateValidate',
        header: 'Divalidasi Pada',
        render: (row) =>
          row.dateValidate ? (
            formatDateTime(row.dateValidate)
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '9rem',
        render: (row) => (
          <StatusBadge tone={DO_STATUS_TONE[row.status]}>
            {DELIVERY_ORDER_STATUS_LABEL[row.status]}
          </StatusBadge>
        ),
      },
      {
        key: 'action',
        header: 'Aksi',
        width: '7rem',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <Button asChild variant="outline" size="sm">
              <Link href={`/ops/receiving/desk/${row.id}`}>Details</Link>
            </Button>
            {row.needsAttention ? (
              <span
                className="size-2 shrink-0 rounded-full bg-destructive"
                aria-label="Butuh perhatian"
              />
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  const onRefresh = async () => {
    setIsProcessing(true);
    const result = await getUseCases().documents.syncDeliveryOrders();
    setIsProcessing(false);
    reload();
    showToast(result.message, result.error ? 'error' : 'success');
  };

  const onResend = async () => {
    setIsProcessing(true);
    const result = await getUseCases().documents.resendDraftOrders();
    setIsProcessing(false);
    setIsResendOpen(false);
    reload();
    showToast(result.message, result.error ? 'error' : 'success');
  };

  const onExport = () => {
    downloadCsv({
      filename: 'delivery_order_export.csv',
      headers: ['Nomor DO', 'Tanggal Kirim', 'Sumber', 'Tujuan', 'Pengguna', 'Divalidasi Pada', 'Status'],
      rows: rows.map((row) => [
        row.doNumber,
        formatDate(row.shippingDate),
        row.sourceLocation,
        row.destinationLocation,
        row.user ?? '-',
        row.dateValidate ? formatDateTime(row.dateValidate) : '-',
        DELIVERY_ORDER_STATUS_LABEL[row.status],
      ]),
    });
    showToast(`Berhasil Export ${rows.length} DO`);
  };

  return (
    <DeskShell>
      <PageHeader
        title="Daftar Delivery Order"
        description="Surat jalan menuju outlet beserta status penerimaannya. Tombol aksi menyesuaikan izin yang aktif."
        actions={
          <>
            <Can permission="receiving.sync">
              <Button variant="outline" icon="reset" onClick={onRefresh} disabled={isProcessing}>
                Refresh Data
              </Button>
            </Can>

            <Can permission="receiving.import">
              <Button variant="outline" icon="upload" onClick={() => setIsImportOpen(true)}>
                Impor DO
              </Button>
            </Can>

            <Can permission="receiving.export">
              <Button variant="outline" icon="download" onClick={onExport} disabled={!canExport}>
                Ekspor DO
              </Button>
            </Can>
          </>
        }
      />

      {drafts.length ? (
        <Can permission="receiving.sync">
          <Card className="mb-4 border-warn/40 bg-warn-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-warn">
                  Gagal Mengirim {drafts.length} Draf DO
                </p>
                <p className="mt-0.5 text-sm text-body">
                  Draf DO yang gagal terkirim dapat dikirim ulang ke Outlet Crew.
                </p>
              </div>
              <Button onClick={() => setIsResendOpen(true)}>Kirim Ulang</Button>
            </div>
          </Card>
        </Can>
      ) : null}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterPopover
            isFiltering={filters.isFiltering}
            onApply={filters.apply}
            onReset={filters.reset}
          >
            <FilterColumns>
              <FilterColumn title="Tanggal Pengiriman">
                <DateRangeField
                  from={filters.draft.dateFrom}
                  to={filters.draft.dateTo}
                  onChange={filters.setDraftDates}
                />
              </FilterColumn>
              <FilterColumn title="Tujuan">
                <CheckboxList
                  searchable
                  options={outletOptions}
                  selected={filters.draftSelection('destinationLocation')}
                  onToggle={(value) => filters.toggleDraftSelection('destinationLocation', value)}
                />
              </FilterColumn>
              <FilterColumn title="Status">
                <CheckboxList
                  options={DO_STATUS_OPTIONS}
                  selected={filters.draftSelection('status')}
                  onToggle={(value) => filters.toggleDraftSelection('status', value)}
                />
              </FilterColumn>
            </FilterColumns>
          </FilterPopover>

          <SearchBox
            value={filters.applied.query}
            onChange={filters.changeQuery}
            placeholder="Cari nomor DO, sumber, atau tujuan"
            className="w-full sm:w-80"
          />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          pageIndex={filters.applied.pageIndex}
          onPageChange={filters.changePage}
          isLoading={isLoading}
          emptyTitle="Tidak ada delivery order"
          emptyDescription="Ubah filter atau tarik ulang data dari ERP."
        />
      </Card>

      <ImportOrderModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      <ConfirmDialog
        isOpen={isResendOpen}
        title={`Gagal Mengirim ${drafts.length} Draf DO`}
        description="Draf DO yang gagal terkirim dapat dikirim ulang ke Outlet Crew. Mau kirim ulang DO tersebut?"
        confirmLabel="Kirim Ulang"
        isProcessing={isProcessing}
        onConfirm={onResend}
        onCancel={() => setIsResendOpen(false)}
      />
    </DeskShell>
  );
}

function ImportOrderModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const onPick = (event) => {
    const picked = event.target.files?.[0] ?? null;
    if (picked && !picked.name.toLowerCase().endsWith('.xlsx')) {
      setFile(null);
      setError('Gagal mengupload file. Pastikan file yang diupload menggunakan format (.xlsx).');
      return;
    }
    setError(null);
    setFile(picked);
  };

  const close = () => {
    setFile(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Impor Delivery Order"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Batal
          </Button>
          <Button disabled={!file}>Simpan</Button>
        </>
      }
    >
      <Label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center transition-colors hover:border-brand">
        <input type="file" accept=".xlsx" onChange={onPick} className="sr-only" />
        <Icon name="upload" className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium text-strong">
          {file ? file.name : 'Klik untuk memilih berkas'}
        </span>
        <span className="text-xs text-muted-foreground">
          Gunakan templat Delivery Order agar kolomnya cocok
        </span>
      </Label>

      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-danger-soft px-3 py-2.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <p className="mt-4 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Adapter in-memory pada demo ini belum membaca isi berkas — yang berjalan baru pemilihan
        berkas dan pemeriksaan formatnya.
      </p>
    </Modal>
  );
}
