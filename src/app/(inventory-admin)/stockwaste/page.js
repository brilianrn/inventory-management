'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/packages/access/presentation';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import { applyListFilter, optionsFromRows } from '@/shared/lib/list-filter';
import DataTable from '@/shared/ui/data-table';
import { Tabs } from '@/shared/ui/display';
import FilterPopover, { FilterColumn, FilterColumns } from '@/shared/ui/filter-popover';
import { formatDate } from '@/shared/ui/format';
import { CheckboxList, DateRangeField, SearchBox } from '@/shared/ui/inputs';
import { ConfirmDialog, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';
import { useListFilters } from '@/shared/ui/use-list-filters';
import { FilterScope } from '@/shared/store/filters.slice';

const TABS = [
  { id: 'waste', label: 'WASTE DOC' },
  { id: 'return', label: 'RETURN DOC' },
];

const detailButton = (href) => (
  <Button asChild variant="outline" size="sm">
    <Link href={href}>Detail</Link>
  </Button>
);

export default function WastePage() {
  const [activeTab, setActiveTab] = useState('waste');

  return (
    <>
      <PageHeader
        title="Waste"
        description="Dokumen produk terbuang dan dokumen return waste, dipisah dalam dua tab dengan filter masing-masing."
      />
      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />
      {activeTab === 'waste' ? <WasteDocPanel /> : <ReturnDocPanel />}
    </>
  );
}

function WasteDocPanel() {
  const { showToast } = useToast();
  const filters = useListFilters(FilterScope.WASTE_DOC);
  const [showExportHint, setShowExportHint] = useState(false);

  const loadDocuments = useCallback(async () => {
    const { data } = await getUseCases().documents.listWasteDocuments();
    return data ?? [];
  }, []);

  const { data: documents = [], isLoading } = useAsyncData(loadDocuments);

  const rows = useMemo(
    () =>
      applyListFilter(documents, filters.applied, {
        dateOf: (row) => row.date,
        selectors: {
          outletName: (row) => row.outletName,
          category: (row) => row.displayCategoryName,
        },
        searchable: (row) => [row.outletName, row.displayCategoryName, row.crewName, row.reference],
      }),
    [documents, filters.applied],
  );

  const outletOptions = useMemo(() => optionsFromRows(documents, (row) => row.outletName), [documents]);
  const categoryOptions = useMemo(
    () => optionsFromRows(documents, (row) => row.displayCategoryName),
    [documents],
  );

  const columns = useMemo(
    () => [
      { key: 'date', header: 'Tanggal', width: '8rem', render: (row) => formatDate(row.date) },
      { key: 'outletName', header: 'Outlet', render: (row) => row.outletName },
      { key: 'category', header: 'Kategori', render: (row) => row.displayCategoryName },
      { key: 'crewName', header: 'Outlet Crew', render: (row) => row.crewName },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => detailButton(`/stockwaste/${row.id}`),
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
      filename: 'waste_document_export.csv',
      headers: ['Tanggal', 'Outlet', 'Kategori', 'Outlet Crew', 'Jumlah Item'],
      rows: rows.map((row) => [
        formatDate(row.date),
        row.outletName,
        row.displayCategoryName,
        row.crewName,
        row.itemCount,
      ]),
    });
    showToast('Berhasil Export Data');
  };

  return (
    <>
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
              <FilterColumn title="Kategori">
                <CheckboxList
                  options={categoryOptions}
                  selected={filters.draftSelection('category')}
                  onToggle={(value) => filters.toggleDraftSelection('category', value)}
                />
              </FilterColumn>
            </FilterColumns>
          </FilterPopover>

          <SearchBox
            value={filters.applied.query}
            onChange={filters.changeQuery}
            className="w-full sm:w-64"
          />

          <Can permission="stockwaste.export">
            <Button variant="outline" icon="download" onClick={onExport} className="sm:ml-auto">
              Export
            </Button>
          </Can>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          pageIndex={filters.applied.pageIndex}
          onPageChange={filters.changePage}
          isLoading={isLoading}
          emptyTitle="Tidak ada dokumen waste"
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
    </>
  );
}

function ReturnDocPanel() {
  const { showToast } = useToast();
  const filters = useListFilters(FilterScope.RETURN_DOC);
  const loadDocuments = useCallback(async () => {
    const { data } = await getUseCases().documents.listReturnWasteDocuments();
    return data ?? [];
  }, []);

  const { data: documents = [], isLoading } = useAsyncData(loadDocuments);

  const rows = useMemo(
    () =>
      applyListFilter(documents, filters.applied, {
        dateOf: (row) => row.date,
        selectors: {
          outletName: (row) => row.outletName,
          brandName: (row) => row.brandName,
        },
        searchable: (row) => [row.outletName, row.brandName, row.destination, row.crewName],
      }),
    [documents, filters.applied],
  );

  const outletOptions = useMemo(() => optionsFromRows(documents, (row) => row.outletName), [documents]);
  const brandOptions = useMemo(() => optionsFromRows(documents, (row) => row.brandName), [documents]);

  const columns = useMemo(
    () => [
      { key: 'date', header: 'Tanggal', width: '8rem', render: (row) => formatDate(row.date) },
      { key: 'outletName', header: 'Outlet', render: (row) => row.outletName },
      { key: 'brandName', header: 'Brand', render: (row) => row.brandName },
      { key: 'destination', header: 'Destination', render: (row) => row.destination },
      { key: 'crewName', header: 'Outlet Crew', render: (row) => row.crewName },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => detailButton(`/stockwaste/return/${row.id}`),
      },
    ],
    [],
  );

  const onExport = () => {
    downloadCsv({
      filename: 'return_waste_document_export.csv',
      headers: ['Tanggal', 'Outlet', 'Brand', 'Destination', 'Outlet Crew', 'Jumlah Item'],
      rows: rows.map((row) => [
        formatDate(row.date),
        row.outletName,
        row.brandName,
        row.destination,
        row.crewName,
        row.itemCount,
      ]),
    });
    showToast('Berhasil Export Data');
  };

  return (
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
            <FilterColumn title="Brand">
              <CheckboxList
                options={brandOptions}
                selected={filters.draftSelection('brandName')}
                onToggle={(value) => filters.toggleDraftSelection('brandName', value)}
              />
            </FilterColumn>
          </FilterColumns>
        </FilterPopover>

        <SearchBox
          value={filters.applied.query}
          onChange={filters.changeQuery}
          className="w-full sm:w-64"
        />

        <Button variant="outline" icon="download" onClick={onExport} className="sm:ml-auto">
          Export
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        pageIndex={filters.applied.pageIndex}
        onPageChange={filters.changePage}
        isLoading={isLoading}
        emptyTitle="Tidak ada dokumen return waste"
      />
    </Card>
  );
}
