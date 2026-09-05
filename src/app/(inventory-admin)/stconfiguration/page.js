'use client';

import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/packages/access/presentation';
import { getUseCases } from '@/shared/config/di';
import { applyListFilter, optionsFromRows } from '@/shared/lib/list-filter';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import FilterPopover, { FilterColumn, FilterColumns } from '@/shared/ui/filter-popover';
import { formatDate } from '@/shared/ui/format';
import { CheckboxList, SearchBox } from '@/shared/ui/inputs';
import { Modal } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';
import { useListFilters } from '@/shared/ui/use-list-filters';
import { FilterScope } from '@/shared/store/filters.slice';

const WORK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const DAY_OPTIONS = WORK_DAYS.map((day) => ({ value: day, label: day }));

export default function SchedulerPage() {
  const filters = useListFilters(FilterScope.SCHEDULER);
  const [detail, setDetail] = useState(null);

  const loadPage = useCallback(async () => {
    const { catalog } = getUseCases();
    const [scheduleResult, brandResult] = await Promise.all([
      catalog.listSchedules(),
      catalog.listBrands(),
    ]);
    return { schedules: scheduleResult.data ?? [], brands: brandResult.data ?? [] };
  }, []);

  const { data, isLoading } = useAsyncData(loadPage);
  const schedules = useMemo(() => data?.schedules ?? [], [data]);
  const brands = useMemo(() => data?.brands ?? [], [data]);

  const brandNameById = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand.name])),
    [brands],
  );

  const rows = useMemo(
    () =>
      applyListFilter(schedules, filters.applied, {
        selectors: { outletName: (row) => row.outletName },
        searchable: (row) => [row.outletName, row.scheduleDays.join(' '), row.reminderHour],
      }).filter((row) => {
        const chosenDays = filters.applied.selections.day ?? [];
        if (!chosenDays.length) return true;
        return row.scheduleDays.some((day) => chosenDays.includes(day));
      }),
    [schedules, filters.applied],
  );

  const outletOptions = useMemo(() => optionsFromRows(schedules, (row) => row.outletName), [schedules]);

  const columns = useMemo(
    () => [
      { key: 'outletName', header: 'Nama Outlet', render: (row) => row.outletName },
      {
        key: 'scheduleDays',
        header: 'Jadwal',
        render: (row) => row.scheduleDays.join(', '),
      },
      {
        key: 'reminderHour',
        header: 'Pengingat',
        width: '8rem',
        render: (row) => `${row.reminderHour} WIB`,
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
          <Button variant="outline" size="sm" onClick={() => setDetail(row)}>
            Detail
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Stock Take Scheduler"
        description="Jadwal perhitungan stok per outlet: hari, jam pengingat, dan brand yang ikut dihitung."
        actions={
          <Can permission="scheduler.create">
            <Button icon="plus">Tambah Jadwal</Button>
          </Can>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterPopover isFiltering={filters.isFiltering} onApply={filters.apply} onReset={filters.reset}>
            <FilterColumns>
              <FilterColumn title="Outlet">
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

      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.outletName ?? ''}
        width="max-w-lg"
      >
        {detail ? (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {[
              ['Tanggal Mulai', formatDate(detail.startDate)],
              ['Hari Jadwal', detail.scheduleDays.join(', ')],
              ['Jam Pengingat', `${detail.reminderHour} WIB`],
              ['Kirim Otomatis', detail.autoSubmit ? 'Ya' : 'Tidak'],
              ['Status', detail.active ? 'Aktif' : 'Nonaktif'],
              [
                'Brand yang Dihitung',
                detail.brandIds.map((brandId) => brandNameById.get(brandId) ?? brandId).join(', '),
              ],
            ].map(([label, value]) => (
              <div key={label} className={label === 'Brand yang Dihitung' ? 'sm:col-span-2' : undefined}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-sm text-strong">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="mt-5 rounded-lg bg-panel-soft px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Pembuatan dan penyuntingan jadwal dikerjakan di modul Stock Take Ops sisi Inventory
          Control. Halaman ini hanya memantau.
        </p>
      </Modal>
    </>
  );
}
