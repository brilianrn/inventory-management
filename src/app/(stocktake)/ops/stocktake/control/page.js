'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/packages/access/presentation';
import { WEEK_DAYS } from '@/packages/catalog/domain/schedule.rules';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import { applyListFilter, optionsFromRows } from '@/shared/lib/list-filter';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import FilterPopover, { FilterColumn, FilterColumns } from '@/shared/ui/filter-popover';
import { formatDate } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckboxList, SearchBox } from '@/shared/ui/inputs';
import { Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';
import { FilterScope } from '@/shared/store/filters.slice';
import { useListFilters } from '@/shared/ui/use-list-filters';

const DAY_OPTIONS = WEEK_DAYS.map((day) => ({ value: day, label: day }));

const STATUS_CHOICES = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
];

export default function InventoryControlPage() {
  const { showToast } = useToast();
  const filters = useListFilters(FilterScope.SCHEDULER);

  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadSchedules = useCallback(async () => {
    const { data } = await getUseCases().catalog.listSchedules();
    return data ?? [];
  }, []);

  const { data: schedules = [], isLoading } = useAsyncData(loadSchedules);

  const rows = useMemo(() => {
    const base = applyListFilter(schedules, filters.applied, {
      selectors: { outletName: (row) => row.outletName },
      searchable: (row) => [row.outletName, row.scheduleDays.join(' '), row.reminderHour],
    });

    const chosenDays = filters.applied.selections.day ?? [];
    const chosenStatus = filters.applied.selections.status ?? [];

    return base
      .filter((row) => !chosenDays.length || row.scheduleDays.some((day) => chosenDays.includes(day)))
      .filter((row) => {
        const [status] = chosenStatus;
        if (!status || status === 'all') return true;
        return status === 'active' ? row.active : !row.active;
      });
  }, [schedules, filters.applied]);

  const outletOptions = useMemo(() => optionsFromRows(schedules, (row) => row.outletName), [schedules]);

  const columns = useMemo(
    () => [
      { key: 'outletName', header: 'Nama outlet', render: (row) => row.outletName },
      {
        key: 'startDate',
        header: 'Tanggal Mulai',
        width: '9rem',
        render: (row) => formatDate(row.startDate),
      },
      {
        key: 'reminder',
        header: 'Jadwal Reminder',
        render: (row) => `Setiap ${row.scheduleDays.join(', ')} / ${row.reminderHour} WIB`,
      },
      {
        key: 'status',
        header: 'Status',
        width: '7rem',
        render: (row) => (
          <StatusBadge tone={row.active ? 'active' : 'inactive'}>
            {row.active ? 'Aktif' : 'Nonaktif'}
          </StatusBadge>
        ),
      },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/ops/stocktake/control/${row.id}`}>Edit</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const onExport = () => {
    downloadCsv({
      filename: 'stocktake_scheduler_export.csv',
      headers: ['Nama Outlet', 'Tanggal Mulai', 'Hari', 'Jam Pengingat', 'Kirim Otomatis', 'Status'],
      rows: schedules.map((row) => [
        row.outletName,
        formatDate(row.startDate),
        row.scheduleDays.join(', '),
        `${row.reminderHour} WIB`,
        row.autoSubmit ? 'Ya' : 'Tidak',
        row.active ? 'Aktif' : 'Nonaktif',
      ]),
    });
    showToast('Berhasil Export Data');
  };

  const chooseStatus = (value) => {
    const current = filters.draftSelection('status')[0];
    if (current === value) return;
    if (current) filters.toggleDraftSelection('status', current);
    filters.toggleDraftSelection('status', value);
  };

  return (
    <DeskShell>
      <PageHeader
        title="Konfigurasi Brand dan Outlet"
        description="Wajah Inventory Control: mendaftarkan jadwal stock take per outlet beserta brand yang ikut dihitung."
        actions={
          <>
            <Button variant="outline" icon="download" onClick={onExport}>
              Ekspor Data
            </Button>
            <Can permission="scheduler.create">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button icon="plus">Tambahkan Jadwal</Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuItem
                    onSelect={() => setIsImportOpen(true)}
                    className="items-start gap-3 py-3"
                  >
                    <Icon name="upload" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="block text-sm font-medium text-strong">Import Excel</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Gunakan template format XLSX untuk mengupload data secara instan
                      </span>
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="items-start gap-3 py-3">
                    <Link href="/ops/stocktake/control/add">
                      <Icon name="edit" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>
                        <span className="block text-sm font-medium text-strong">
                          Tambahkan Manual
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Isi informasi jadwal menggunakan form yang tersedia
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Can>
          </>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterPopover isFiltering={filters.isFiltering} onApply={filters.apply} onReset={filters.reset}>
            <FilterColumns>
              <FilterColumn title="Nama Outlet">
                <CheckboxList
                  searchable
                  options={outletOptions}
                  selected={filters.draftSelection('outletName')}
                  onToggle={(value) => filters.toggleDraftSelection('outletName', value)}
                />
              </FilterColumn>
              <FilterColumn title="Hari">
                <CheckboxList
                  options={DAY_OPTIONS}
                  selected={filters.draftSelection('day')}
                  onToggle={(value) => filters.toggleDraftSelection('day', value)}
                />
              </FilterColumn>
              <FilterColumn title="Status">
                <RadioGroup
                  value={filters.draftSelection('status')[0] ?? 'all'}
                  onValueChange={chooseStatus}
                  className="gap-1.5 rounded-lg border p-3"
                >
                  {STATUS_CHOICES.map((choice) => (
                    <Label key={choice.value} className="flex items-center gap-2.5 font-normal">
                      <RadioGroupItem value={choice.value} />
                      <span className="text-sm text-body">{choice.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
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
          emptyTitle="Tidak ada jadwal"
        />
      </Card>

      <ImportScheduleModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </DeskShell>
  );
}

function ImportScheduleModal({ isOpen, onClose }) {
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
      title="Import File Excel"
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
          Gunakan template format XLSX untuk mengupload data secara instan
        </span>
      </Label>

      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-danger-soft px-3 py-2.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <p className="mt-4 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Adapter in-memory pada demo ini belum membaca isi berkas — yang berjalan baru pemilihan
        berkas dan pemeriksaan formatnya. Penguraian berkas menyusul bersama adapter REST.
      </p>
    </Modal>
  );
}
