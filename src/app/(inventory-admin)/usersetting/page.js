'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/packages/access/presentation';
import {
  filterUsers,
  isNewUserValid,
  validateNewUser,
} from '@/packages/access/domain/user-account.rules';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import DataTable from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/display';
import { formatDate } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Label } from '@/components/ui/label';
import { SearchBox, TextField } from '@/shared/ui/inputs';
import { Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, MoreMenu, MoreMenuItem, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

function PasswordField({ label, value, error, onChange }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <TextField
        label={label}
        type={isVisible ? 'text' : 'password'}
        value={value}
        error={error}
        className="pr-11"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Perlihatkan kata sandi'}
        className="absolute top-7 right-3 text-muted-foreground transition-colors hover:text-strong"
      >
        <Icon name={isVisible ? 'close' : 'search'} className="size-4" />
      </button>
    </div>
  );
}

export default function UserAccessPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    const { data } = await getUseCases().access.listUsers();
    return data ?? [];
  }, []);

  const { data: users = [], isLoading, reload } = useAsyncData(loadUsers);
  const rows = useMemo(() => filterUsers(users, query), [users, query]);

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Nama', render: (row) => row.name },
      { key: 'email', header: 'Email', render: (row) => row.email },
      {
        key: 'status',
        header: 'Status',
        width: '9rem',
        render: (row) => (
          <StatusBadge tone={row.status ? 'active' : 'inactive'}>
            {row.status ? 'AKTIF' : 'TIDAK AKTIF'}
          </StatusBadge>
        ),
      },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/usersetting/${row.id}`}>Atur</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const onExport = () => {
    downloadCsv({
      filename: 'user_access_export.csv',
      headers: ['Nama', 'Email', 'Jabatan', 'Status', 'Jumlah Izin', 'Dibuat'],
      rows: users.map((user) => [
        user.name,
        user.email,
        user.jobTitle,
        user.status ? 'AKTIF' : 'TIDAK AKTIF',
        user.permissionCount,
        formatDate(user.createdAt),
      ]),
    });
    showToast('Berhasil Export Data');
  };

  return (
    <>
      <PageHeader
        title="User Access"
        description="Daftar pengguna beserta kombinasi izinnya. Hak akses diberikan di halaman detail, bukan saat pengguna dibuat."
        actions={
          <>
            <Can permission="usermgmt.assign">
              <Button icon="plus" onClick={() => setIsAdding(true)}>
                Tambah User
              </Button>
            </Can>
            <MoreMenu>
              <Can permission="usermgmt.assign" key="import">
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
        <div className="mb-4">
          <SearchBox
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPageIndex(0);
            }}
            placeholder="Cari nama atau email"
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
          emptyTitle="Tidak ada pengguna"
        />
      </Card>

      {isAdding ? (
        <AddUserModal
          existingEmails={users.map((user) => user.email)}
          onClose={() => setIsAdding(false)}
          onSaved={(message) => {
            setIsAdding(false);
            reload();
            showToast(message);
          }}
        />
      ) : null}

      <ImportUserModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </>
  );
}

function AddUserModal({ existingEmails, onClose, onSaved }) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const errors = validateNewUser(draft, existingEmails);
  const isValid = isNewUserValid(draft, existingEmails);
  const shown = (field) => (touched[field] ? errors[field] : undefined);

  const patch = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const onSubmit = async () => {
    setIsProcessing(true);
    const result = await getUseCases().access.createUser(draft);
    setIsProcessing(false);

    if (result.error) {
      setTouched({ name: true, email: true, password: true, confirmPassword: true });
      if (!result.errors) showToast(result.message, 'error');
      return;
    }

    onSaved(result.message);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Tambah User"
      description="Pengguna baru dibuat tanpa satu pun hak akses. Berikan izinnya lewat halaman detail."
      width="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Batal
          </Button>
          <Button onClick={onSubmit} disabled={!isValid || isProcessing}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label="Nama"
          value={draft.name}
          error={shown('name')}
          placeholder="Cth: Renata Wijoyo"
          onChange={patch('name')}
        />
        <TextField
          label="Email"
          type="email"
          value={draft.email}
          error={shown('email')}
          placeholder="nama@amb.demo"
          onChange={patch('email')}
        />
        <PasswordField label="Password" value={draft.password} error={shown('password')} onChange={patch('password')} />
        <PasswordField
          label="Konfirmasi Password"
          value={draft.confirmPassword}
          error={shown('confirmPassword')}
          onChange={patch('confirmPassword')}
        />
      </div>
    </Modal>
  );
}

function ImportUserModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const onPick = (event) => {
    const picked = event.target.files?.[0] ?? null;
    if (picked && !picked.name.toLowerCase().endsWith('.xlsx')) {
      setFile(null);
      setError('Gagal mengupload file. Pastikan file yang diupload menggunakan format (.xlsx)');
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
          Gunakan templat pengguna agar kolomnya cocok
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
