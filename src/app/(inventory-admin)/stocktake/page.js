'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { STOCK_TAKE_STATUS_LABEL } from '@/packages/documents/domain/status';
import { Can, usePermission } from '@/packages/access/presentation';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import { applyListFilter, optionsFromRows } from '@/shared/lib/list-filter';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import FilterPopover, { FilterColumn, FilterColumns } from '@/shared/ui/filter-popover';
import { formatDate, formatTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { CheckboxList, DateRangeField, SearchBox } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';
import { useListFilters } from '@/shared/ui/use-list-filters';
import { FilterScope } from '@/shared/store/filters.slice';

const STATUS_OPTIONS = Object.entries(STOCK_TAKE_STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const FILTER_CONFIG = {
  dateOf: (row) => row.date,
  selectors: {
    outletName: (row) => row.outletName,
    status: (row) => row.status,
  },
  searchable: (row) => [row.outletName, row.scheduleName, row.crewName, STOCK_TAKE_STATUS_LABEL[row.status]],
};

export default function StockTakeListPage() {
  const { now, isRestricted, profile } = usePermission();
  const { showToast } = useToast();
  const filters = useListFilters(FilterScope.STOCK_TAKE);

  const [showExportHint, setShowExportHint] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const restricted = isRestricted('stocktake.validate');

  const loadDocuments = useCallback(async () => {
    const { data } = await getUseCases().documents.listStockTakeDocuments({ restricted, now });
    return data ?? [];
  }, [restricted, now]);

  const { data: documents = [], isLoading, reload } = useAsyncData(loadDocuments);

  const rows = useMemo(
    () => applyListFilter(documents, filters.applied, FILTER_CONFIG),
    [documents, filters.applied],
  );

  const outletOptions = useMemo(() => optionsFromRows(documents, (row) => row.outletName), [documents]);

  const columns = useMemo(
    () => [
      { key: 'date', header: 'Tanggal', width: '7.5rem', render: (row) => formatDate(row.date) },
      { key: 'startTime', header: 'Waktu Mulai', width: '7rem', render: (row) => formatTime(row.startTime) },
      {
        key: 'endTime',
        header: 'Waktu Selesai',
        width: '7.5rem',
        render: (row) => (row.endTime ? formatTime(row.endTime) : '-'),
      },
      { key: 'outletName', header: 'Outlet', render: (row) => row.outletName },
      {
        key: 'status',
        header: 'Status',
        width: '9rem',
        render: (row) => (
          <StatusBadge tone={row.status}>{STOCK_TAKE_STATUS_LABEL[row.status]}</StatusBadge>
        ),
      },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/stocktake/${row.id}`}>Detail</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const onExport = () => {
    if (!filters.isFiltering) {
      setShowExportHint(true);
      return;
    }

    downloadCsv({
      filename: 'stocktake_export.csv',
      headers: ['Tanggal', 'Waktu Mulai', 'Waktu Selesai', 'Outlet', 'Status'],
      rows: rows.map((row) => [
        formatDate(row.date),
        formatTime(row.startTime),
        row.endTime ? formatTime(row.endTime) : '-',
        row.outletName,
        STOCK_TAKE_STATUS_LABEL[row.status],
      ]),
    });
    showToast('Berhasil Export Data');
  };

  return (
    <>
      <PageHeader
        title="Stock Take"
        description="Daftar dokumen adjustment seluruh outlet, beserta status validasinya."
        actions={
          <>
            <Can permission="stocktake.export">
              <Button variant="outline" icon="download" onClick={onExport}>
                Export
              </Button>
            </Can>
            <Can permission="stocktake.validate" respectTimeWindow>
              <Button icon="check" onClick={() => setIsBulkOpen(true)}>
                Multiple Validasi
              </Button>
            </Can>
          </>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterPopover isFiltering={filters.isFiltering} onApply={filters.apply} onReset={filters.reset}>
            <FilterColumns>
              <FilterColumn title="Tanggal">
                <DateRangeField
                  from={filters.draft.dateFrom}
                  to={filters.draft.dateTo}
                  onChange={filters.setDraftDates}
                />
              </FilterColumn>
              <FilterColumn title="Outlet">
                <CheckboxList
                  searchable
                  options={outletOptions}
                  selected={filters.draftSelection('outletName')}
                  onToggle={(value) => filters.toggleDraftSelection('outletName', value)}
                />
              </FilterColumn>
              <FilterColumn title="Status">
                <CheckboxList
                  options={STATUS_OPTIONS}
                  selected={filters.draftSelection('status')}
                  onToggle={(value) => filters.toggleDraftSelection('status', value)}
                />
              </FilterColumn>
            </FilterColumns>
          </FilterPopover>

          <SearchBox
            value={filters.applied.query}
            onChange={filters.changeQuery}
            className="w-full sm:w-64"
          />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          pageIndex={filters.applied.pageIndex}
          onPageChange={filters.changePage}
          isLoading={isLoading}
          emptyTitle="Tidak ada dokumen stock take"
        />
      </Card>

      <ConfirmDialog
        isOpen={showExportHint}
        tone="info"
        title="Filter dulu sebelum export"
        description="Export hanya melayani data yang sudah difilter. Buka panel Filter, tentukan rentang tanggal atau outlet, lalu coba lagi."
        confirmLabel="Mengerti"
        isSingleAction
        onConfirm={() => setShowExportHint(false)}
        onCancel={() => setShowExportHint(false)}
      />

      {isBulkOpen ? (
        <BulkValidateModal
          onClose={() => setIsBulkOpen(false)}
          onValidated={async () => {
            setIsBulkOpen(false);
            reload();
            showToast('Data Berhasil Divalidasi');
          }}
          restricted={restricted}
          now={now}
          validatedBy={profile?.name}
        />
      ) : null}
    </>
  );
}

function BulkValidateModal({ onClose, onValidated, restricted, now, validatedBy }) {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getUseCases()
      .documents.listBulkValidatable({ now, restricted })
      .then(({ data }) => setCandidates(data ?? []));
  }, [now, restricted]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return candidates;
    return candidates.filter((document) => document.outletName.toLowerCase().includes(keyword));
  }, [candidates, query]);

  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const onConfirm = async () => {
    setIsProcessing(true);
    const result = await getUseCases().documents.validateStockTake({
      ids: selected,
      validatedBy,
      restricted,
      now,
    });
    setIsProcessing(false);
    setIsConfirming(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }
    onValidated();
  };

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={`Validasi Dokumen Adjustment Hari Ini (${selected.length} / ${candidates.length})`}
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={() => setIsConfirming(true)}
              disabled={!selected.length}
              className={!selected.length ? 'opacity-50' : undefined}
            >
              Simpan
            </Button>
          </>
        }
      >
        <SearchBox value={query} onChange={setQuery} placeholder="Cari outlet" />

        <div className="mt-3 rounded-lg border">
          {visible.length ? (
            <ul className="divide-y">
              {visible.map((document) => (
                <li key={document.id}>
                  <Label className="flex items-start gap-3 px-3 py-2.5 font-normal transition-colors hover:bg-muted">
                    <Checkbox
                      checked={selected.includes(document.id)}
                      onCheckedChange={() => toggle(document.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-strong">{document.outletName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(document.date)} · {document.itemCount} item
                      </span>
                    </span>
                  </Label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              Tidak ada dokumen yang memenuhi syarat validasi massal hari ini.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Validasi Stock Take?"
        description="Setelah divalidasi, data ini sudah tidak bisa di edit lagi dan statusnya otomatis terganti."
        confirmLabel="Validasi"
        isProcessing={isProcessing}
        onConfirm={onConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
