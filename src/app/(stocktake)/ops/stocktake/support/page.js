'use client';

import { useCallback, useMemo, useState } from 'react';
import { Can, usePermission } from '@/packages/access/presentation';
import { capitalizeName } from '@/packages/catalog/domain/crew-account.rules';
import { getUseCases } from '@/shared/config/di';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import { formatDateTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SearchBox, SelectField, TextField } from '@/shared/ui/inputs';
import { Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, MoreMenu, MoreMenuItem, PageHeader } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

export default function TechnicalSupportPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [editing, setEditing] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadPage = useCallback(async () => {
    const { catalog } = getUseCases();
    const [accountResult, outletResult] = await Promise.all([
      catalog.listCrewAccounts(),
      catalog.listOutlets(),
    ]);
    return { accounts: accountResult.data ?? [], outlets: outletResult.data ?? [] };
  }, []);

  const { data, isLoading, reload } = useAsyncData(loadPage);
  const accounts = useMemo(() => data?.accounts ?? [], [data]);
  const outlets = useMemo(() => data?.outlets ?? [], [data]);

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return accounts;
    return accounts.filter((account) =>
      `${account.name} ${account.email} ${account.outletName}`.toLowerCase().includes(keyword),
    );
  }, [accounts, query]);

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Nama', render: (row) => capitalizeName(row.name) },
      { key: 'email', header: 'Email', render: (row) => row.email },
      { key: 'outletName', header: 'Nama Outlet', render: (row) => row.outletName },
      {
        key: 'status',
        header: 'Status',
        width: '7rem',
        render: (row) => (
          <StatusBadge tone={row.active ? 'active' : 'inactive'}>
            {row.active ? 'aktif' : 'nonaktif'}
          </StatusBadge>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Terakhir Diubah',
        render: (row) => formatDateTime(row.updatedAt),
      },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Can permission="usermgmt.assign" fallback={<span className="text-xs text-muted-foreground">—</span>}>
            <Button variant="outline" size="sm" onClick={() => setEditing(row)}>
            Edit
          </Button>
          </Can>
        ),
      },
    ],
    [],
  );

  const onSaved = async (message) => {
    setIsAdding(false);
    setEditing(null);
    reload();
    showToast(message);
  };

  return (
    <DeskShell>
      <PageHeader
        title="Akun Outlet Crew"
        description="Wajah Technical Support: mengelola akun crew yang mengisi perhitungan stok di outlet."
        actions={
          <>
            <Can permission="usermgmt.assign">
              <Button icon="plus" onClick={() => setIsAdding(true)}>
                Tambah Pengguna
              </Button>
            </Can>
            <MoreMenu>
              <Can permission="usermgmt.assign" key="import">
                <MoreMenuItem onClick={() => setIsImportOpen(true)}>Import</MoreMenuItem>
              </Can>
            </MoreMenu>
          </>
        }
      />

      <Card>
        <div className="mb-4">
          <SearchBox
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPageIndex(0);
            }}
            placeholder="Cari nama, email, atau outlet"
            className="w-full sm:w-72"
          />
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          isLoading={isLoading}
          emptyTitle="Tidak ada akun crew"
        />
      </Card>

      {isAdding ? (
        <CrewAccountModal outlets={outlets} onClose={() => setIsAdding(false)} onSaved={onSaved} />
      ) : null}

      {editing ? (
        <CrewAccountModal
          account={editing}
          outlets={outlets}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      ) : null}

      <ImportCrewModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </DeskShell>
  );
}

function CrewAccountModal({ account = null, outlets, onClose, onSaved }) {
  const { profile } = usePermission();
  const { showToast } = useToast();
  const isEditing = Boolean(account);

  const [draft, setDraft] = useState({
    name: account?.name ?? '',
    email: account?.email ?? '',
    outletId: account?.outletId ?? '',
    active: account?.active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const patch = (changes) => {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors({});
  };

  const onSubmit = async () => {
    setIsProcessing(true);
    setErrors({});

    const result = await getUseCases().catalog.saveCrewAccount({
      id: account?.id ?? null,
      draft,
      actor: profile?.name,
    });

    setIsProcessing(false);

    if (result.error) {
      setErrors(result.errors ?? {});
      if (!result.errors) showToast(result.message, 'error');
      return;
    }

    onSaved(result.message);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Informasi Pengguna"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={isProcessing}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Nama"
          value={draft.name}
          disabled={isEditing}
          placeholder="Cth: Susanto"
          error={errors.name}
          onChange={(event) => patch({ name: event.target.value })}
        />

        <TextField
          label="Email"
          type="email"
          value={draft.email}
          disabled={isEditing}
          placeholder="nama@amb.demo"
          error={errors.email}
          onChange={(event) => patch({ email: event.target.value })}
        />

        <div>
          <SelectField
            label="Nama Outlet"
            value={draft.outletId}
            placeholder="Pilih outlet"
            onChange={(value) => patch({ outletId: value })}
            options={outlets.map((outlet) => ({ value: outlet.id, label: outlet.displayName }))}
          />
          {errors.outletId ? (
            <p className="mt-1.5 text-xs text-destructive">{errors.outletId}</p>
          ) : null}
        </div>

        {isEditing ? (
          <Label className="flex items-center gap-2.5 font-normal">
            <Checkbox
              checked={draft.active}
              onCheckedChange={(value) => patch({ active: Boolean(value) })}
            />
            <span className="text-sm text-body">Status Pengguna Aktif</span>
          </Label>
        ) : (
          <p className="rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            Nama dan email hanya bisa diisi saat menambah pengguna. Setelah tersimpan, keduanya
            terkunci dan yang bisa diubah hanya outlet serta statusnya.
          </p>
        )}
      </div>
    </Modal>
  );
}

function ImportCrewModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const onPick = (event) => {
    const picked = event.target.files?.[0] ?? null;
    if (picked && !/\.(xlsx|csv)$/i.test(picked.name)) {
      setFile(null);
      setError('Gagal mengupload file. Pastikan formatnya .xlsx atau .csv.');
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
      title="Import Akun Crew"
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
        <input type="file" accept=".xlsx,.csv" onChange={onPick} className="sr-only" />
        <Icon name="upload" className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium text-strong">
          {file ? file.name : 'Klik untuk memilih berkas'}
        </span>
        <span className="text-xs text-muted-foreground">Gunakan template pengguna agar kolomnya cocok</span>
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
