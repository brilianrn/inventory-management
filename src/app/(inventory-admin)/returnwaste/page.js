'use client';

import { useCallback, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Can, usePermission } from '@/packages/access/presentation';
import {
  RETURN_CONFIGURATIONS,
  RETURN_STATUSES,
  isReturnConfigChanged,
  resolveLastEdited,
} from '@/packages/catalog/domain/configuration.rules';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import { applyListFilter } from '@/shared/lib/list-filter';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import FilterPopover, { FilterColumn, FilterColumns } from '@/shared/ui/filter-popover';
import { formatDateTime } from '@/shared/ui/format';
import { CheckboxList, SearchBox, SelectField } from '@/shared/ui/inputs';
import { Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, MoreMenu, MoreMenuItem, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';
import { useListFilters } from '@/shared/ui/use-list-filters';
import { FilterScope } from '@/shared/store/filters.slice';

const CONFIG_OPTIONS = RETURN_CONFIGURATIONS.map((value) => ({ value, label: value }));
const STATUS_OPTIONS = RETURN_STATUSES.map((status) => ({ value: status.code, label: status.label }));

export default function ReturnWasteConfigPage() {
  const { profile } = usePermission();
  const { showToast } = useToast();
  const filters = useListFilters(FilterScope.RETURN_WASTE_CONFIG);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadConfigs = useCallback(async () => {
    const { data } = await getUseCases().catalog.listReturnWasteConfig();
    return { configs: data?.configs ?? [], availableBrands: data?.availableBrands ?? [] };
  }, []);

  const { data, isLoading, reload } = useAsyncData(loadConfigs);
  const configs = useMemo(() => data?.configs ?? [], [data]);
  const availableBrands = useMemo(() => data?.availableBrands ?? [], [data]);

  const rows = useMemo(
    () =>
      applyListFilter(configs, filters.applied, {
        selectors: {
          brandName: (row) => row.brandName,
          configuration: (row) => row.configuration,
          status: (row) => row.status,
        },
        searchable: (row) => [row.brandName, row.configuration, row.updatedBy, row.createdBy],
      }),
    [configs, filters.applied],
  );

  const brandOptions = useMemo(
    () => configs.map((config) => ({ value: config.brandName, label: config.brandName })),
    [configs],
  );

  const columns = useMemo(
    () => [
      { key: 'brandName', header: 'Brand', render: (row) => row.brandName },
      { key: 'configuration', header: 'Konfigurasi', render: (row) => row.configuration },
      {
        key: 'status',
        header: 'Status',
        width: '7rem',
        render: (row) => (
          <StatusBadge tone={row.status}>{row.status === 'active' ? 'Aktif' : 'Nonaktif'}</StatusBadge>
        ),
      },
      {
        key: 'lastEdited',
        header: 'Terakhir Diedit',
        render: (row) => {
          const { by, at } = resolveLastEdited(row);
          return `${by} - ${formatDateTime(at)}`;
        },
      },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Can permission="returnwaste.configure" fallback={<span className="text-xs text-muted-foreground">—</span>}>
            <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
            Edit
          </Button>
          </Can>
        ),
      },
    ],
    [],
  );

  const onExport = () => {
    downloadCsv({
      filename: 'return_waste_config_export.csv',
      headers: ['Brand', 'Konfigurasi', 'Status', 'Terakhir Diedit Oleh', 'Terakhir Diedit Pada'],
      rows: rows.map((row) => {
        const { by, at } = resolveLastEdited(row);
        return [row.brandName, row.configuration, row.status === 'active' ? 'Aktif' : 'Nonaktif', by, formatDateTime(at)];
      }),
    });
    showToast('Berhasil Export Data');
  };

  const isEmpty = !isLoading && !configs.length;

  return (
    <>
      <PageHeader
        title="Return Waste Products"
        description="Tujuan pengembalian per brand. Satu brand hanya boleh punya satu konfigurasi."
        actions={
          <>
            <Can permission="returnwaste.configure">
              <Button icon="plus" onClick={() => setIsAddOpen(true)}>
                Tambah Konfigurasi
              </Button>
            </Can>
            <MoreMenu>
              <Can permission="returnwaste.configure" key="import">
                <MoreMenuItem onClick={() => setIsImportOpen(true)}>Import</MoreMenuItem>
              </Can>
              <MoreMenuItem key="export" onClick={onExport}>
                Export
              </MoreMenuItem>
            </MoreMenu>
          </>
        }
      />

      <Card>
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-line bg-panel-soft px-6 py-14 text-center">
            <p className="text-sm font-semibold text-strong">Belum Ada Konfigurasi</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              Belum ada konfigurasi apapun di jadwal ini, kamu bisa tambahkan secara manual atau
              import file langsung.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <FilterPopover
                isFiltering={filters.isFiltering}
                onApply={filters.apply}
                onReset={filters.reset}
              >
                <FilterColumns>
                  <FilterColumn title="Brand">
                    <CheckboxList
                      searchable
                      options={brandOptions}
                      selected={filters.draftSelection('brandName')}
                      onToggle={(value) => filters.toggleDraftSelection('brandName', value)}
                    />
                  </FilterColumn>
                  <FilterColumn title="Konfigurasi">
                    <CheckboxList
                      options={CONFIG_OPTIONS}
                      selected={filters.draftSelection('configuration')}
                      onToggle={(value) => filters.toggleDraftSelection('configuration', value)}
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
              emptyTitle="Tidak ada konfigurasi yang cocok"
            />
          </>
        )}
      </Card>

      {isAddOpen ? (
        <AddConfigModal
          availableBrands={availableBrands}
          onClose={() => setIsAddOpen(false)}
          onSaved={async (message) => {
            setIsAddOpen(false);
            reload();
            showToast(message);
          }}
          actor={profile?.name}
        />
      ) : null}

      {editing ? (
        <EditConfigModal
          config={editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            reload();
            showToast(message);
          }}
          actor={profile?.name}
        />
      ) : null}

      <ImportConfigModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </>
  );
}

function AddConfigModal({ availableBrands, onClose, onSaved, actor }) {
  const { showToast } = useToast();
  const [brandId, setBrandId] = useState('');
  const [configuration, setConfiguration] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canSave = Boolean(brandId && configuration);

  const onSubmit = async () => {
    setIsProcessing(true);
    const result = await getUseCases().catalog.createReturnWasteConfig({ brandId, configuration, actor });
    setIsProcessing(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }
    onSaved(result.message);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Tambah Konfigurasi"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={!canSave || isProcessing}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Brand"
          value={brandId}
          onChange={setBrandId}
          placeholder="Pilih Brand"
          options={availableBrands.map((brand) => ({ value: brand.id, label: brand.name }))}
        />
        <SelectField
          label="Configuration"
          value={configuration}
          onChange={setConfiguration}
          placeholder="Pilih Konfigurasi"
          options={CONFIG_OPTIONS}
        />
        <p className="rounded-lg bg-panel-soft px-3 py-2.5 text-xs text-muted-foreground">
          Konfigurasi baru otomatis berstatus Aktif. Brand yang sudah terdaftar tidak muncul di
          daftar pilihan.
        </p>
        {availableBrands.length === 0 ? (
          <p className="text-xs text-warn">Semua brand sudah punya konfigurasi.</p>
        ) : null}
      </div>
    </Modal>
  );
}

function EditConfigModal({ config, onClose, onSaved, actor }) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    configuration: config.configuration,
    status: config.status,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const canSave = isReturnConfigChanged(config, draft);

  const onSubmit = async () => {
    setIsProcessing(true);
    const result = await getUseCases().catalog.updateReturnWasteConfig({
      id: config.id,
      ...draft,
      actor,
    });
    setIsProcessing(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }
    onSaved(result.message);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Konfigurasi"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={!canSave || isProcessing}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField
          label="Brand"
          value={config.brandId}
          onChange={() => {}}
          disabled
          options={[{ value: config.brandId, label: config.brandName }]}
        />
        <SelectField
          label="Configuration"
          value={draft.configuration}
          onChange={(value) => setDraft((current) => ({ ...current, configuration: value }))}
          options={CONFIG_OPTIONS}
        />
        <SelectField
          label="Status"
          value={draft.status}
          onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
          options={STATUS_OPTIONS}
        />
        <p className="rounded-lg bg-panel-soft px-3 py-2.5 text-xs text-muted-foreground">
          Brand tidak bisa dipindah. Kalau salah, nonaktifkan konfigurasi ini lalu buat yang baru.
        </p>
      </div>
    </Modal>
  );
}

function ImportConfigModal({ isOpen, onClose }) {
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
        <span className="text-sm font-medium text-strong">
          {file ? file.name : 'Klik untuk memilih berkas'}
        </span>
        <span className="text-xs text-muted-foreground">
          Pastikan format file sesuai template. Hanya menerima berkas .xlsx
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
