'use client';

import { useParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/packages/access/presentation';
import {
  RESTRICTED_CUTOFF_HOUR,
  buildPermissionTree,
} from '@/packages/access/domain/permission.catalog';
import {
  hasGrantChanged,
  isUserInfoValid,
  toggleGrantPermission,
  validateUserInfo,
} from '@/packages/access/domain/user-account.rules';
import { getUseCases } from '@/shared/config/di';
import { BackLink, Fieldset, StatusBadge, Tabs } from '@/shared/ui/display';
import Icon from '@/shared/ui/icon';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { SelectField, TextField } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

const PERMISSION_TABS = buildPermissionTree();
const RESTRICTABLE_CODE = 'stocktake.validate';

export default function UserAccessDetailPage() {
  const params = useParams();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(PERMISSION_TABS[0].id);
  const [grant, setGrant] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadUser = useCallback(async () => {
    const { data } = await getUseCases().access.getUserAccess(params.id);
    if (data) setGrant({ permissions: [...data.permissions], attributes: { ...data.attributes } });
    return data ?? null;
  }, [params.id]);

  const { data: user, isLoading, reload } = useAsyncData(loadUser);

  const current = useMemo(
    () => ({ permissions: user?.permissions ?? [], attributes: user?.attributes ?? {} }),
    [user],
  );

  const isDirty = grant ? hasGrantChanged(current, grant) : false;

  const toggle = (code) => setGrant((draft) => toggleGrantPermission(draft, code));

  const setRestricted = (code, restricted) =>
    setGrant((draft) => ({
      ...draft,
      attributes: { ...draft.attributes, [code]: { ...(draft.attributes[code] ?? {}), restricted } },
    }));

  const onSave = async () => {
    setIsProcessing(true);
    const result = await getUseCases().access.assignPermissions(params.id, grant);
    setIsProcessing(false);
    setIsConfirming(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    reload();
    showToast('User Role Berhasil Disimpan');
  };

  if (isLoading || !user || !grant) {
    return (
      <>
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  const tab = PERMISSION_TABS.find((item) => item.id === activeTab) ?? PERMISSION_TABS[0];

  return (
    <>
      <BackLink href="/usersetting">Kembali ke daftar User Access</BackLink>

      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <>
            <StatusBadge tone={user.status ? 'active' : 'inactive'}>
              {user.status ? 'Aktif' : 'Tidak Aktif'}
            </StatusBadge>
            <Can permission="usermgmt.assign">
              <Button variant="outline" icon="edit" onClick={() => setIsEditOpen(true)}>
                Edit Informasi
              </Button>
            </Can>
          </>
        }
      />

      <Card className="mb-4">
        <Fieldset
          items={[
            { label: 'Nama Pengguna', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Jabatan', value: user.jobTitle },
            { label: 'Jumlah izin aktif', value: `${grant.permissions.length} izin` },
          ]}
        />
      </Card>

      <Card>
        <Tabs
          tabs={PERMISSION_TABS.map((item) => ({ id: item.id, label: item.label }))}
          activeId={activeTab}
          onChange={setActiveTab}
        />

        <div className="space-y-6">
          {tab.sections.map((section) => (
            <div key={section.id}>
              {section.label ? (
                <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {section.label}
                </h3>
              ) : null}

              <div className="space-y-3">
                {section.groups.map((group) => (
                  <div key={group.id} className="rounded-xl border">
                    <p className="border-b px-4 py-2.5 text-sm font-semibold text-strong">
                      {group.label}
                    </p>

                    <div className="space-y-1 px-2 py-2">
                      {[...group.permissions]
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map((permission) => {
                          const granted = grant.permissions.includes(permission.code);

                          return (
                            <div key={permission.code} className="rounded-lg px-2 py-1.5">
                              <Label className="flex items-start gap-2.5 font-normal">
                                <Checkbox
                                  checked={granted}
                                  onCheckedChange={() => toggle(permission.code)}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm text-body">{permission.label}</span>
                                  <span className="block font-mono text-[11px] text-muted-foreground">
                                    {permission.code}
                                  </span>
                                </span>
                              </Label>

                              {permission.code === RESTRICTABLE_CODE && granted ? (
                                <div className="mt-2 ml-7 space-y-1.5 border-l pl-3">
                                  <RadioGroup
                                    value={
                                      grant.attributes[permission.code]?.restricted
                                        ? 'restricted'
                                        : 'open'
                                    }
                                    onValueChange={(value) =>
                                      setRestricted(permission.code, value === 'restricted')
                                    }
                                    className="gap-1.5"
                                  >
                                    {[
                                      {
                                        value: 'restricted',
                                        title: 'Restricted',
                                        hint: `Hanya boleh edit dan validasi sampai pukul ${String(RESTRICTED_CUTOFF_HOUR).padStart(2, '0')}:00`,
                                      },
                                      {
                                        value: 'open',
                                        title: 'Not Restricted',
                                        hint: 'Boleh edit dan validasi kapan saja',
                                      },
                                    ].map((option) => (
                                      <Label
                                        key={option.value}
                                        className="flex items-start gap-2 font-normal"
                                      >
                                        <RadioGroupItem value={option.value} className="mt-0.5" />
                                        <span className="min-w-0">
                                          <span className="block text-xs font-medium text-strong">
                                            {option.title}
                                          </span>
                                          <span className="block text-[11px] text-muted-foreground">
                                            {option.hint}
                                          </span>
                                        </span>
                                      </Label>
                                    ))}
                                  </RadioGroup>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isDirty ? (
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted-foreground">
              Ada perubahan yang belum disimpan pada tab ini.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setGrant({
                    permissions: [...current.permissions],
                    attributes: { ...current.attributes },
                  })
                }
              >
                Batalkan
              </Button>
              <Button onClick={() => setIsConfirming(true)}>Simpan</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        isOpen={isConfirming}
        title="Simpan Perubahan"
        description="Pastikan pengaturan user role telah sesuai."
        cancelLabel="Cek Ulang"
        confirmLabel="Simpan"
        isProcessing={isProcessing}
        onConfirm={onSave}
        onCancel={() => setIsConfirming(false)}
      />

      {isEditOpen ? (
        <EditInfoModal
          user={user}
          onClose={() => setIsEditOpen(false)}
          onSaved={(message) => {
            setIsEditOpen(false);
            reload();
            showToast(message);
          }}
        />
      ) : null}
    </>
  );
}

function EditInfoModal({ user, onClose, onSaved }) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState({
    password: '',
    confirmPassword: '',
    status: user.status ? 'active' : 'inactive',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const errors = validateUserInfo(draft);
  const isValid = isUserInfoValid(draft);

  const onSubmit = async () => {
    setIsProcessing(true);
    const result = await getUseCases().access.updateUserInfo(user.id, {
      ...draft,
      status: draft.status === 'active',
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
      title="Edit Informasi User"
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
        <TextField label="Nama Pengguna" value={user.name} disabled />
        <TextField label="Email" value={user.email} disabled />

        <div className="relative">
          <TextField
            label="Password"
            type={isVisible ? 'text' : 'password'}
            value={draft.password}
            error={errors.password}
            hint="Kosongkan bila tidak ingin mengganti kata sandi."
            className="pr-11"
            onChange={(event) => setDraft((c) => ({ ...c, password: event.target.value }))}
          />
          <button
            type="button"
            onClick={() => setIsVisible((value) => !value)}
            aria-label={isVisible ? 'Sembunyikan kata sandi' : 'Perlihatkan kata sandi'}
            className="absolute top-7 right-3 text-muted-foreground transition-colors hover:text-strong"
          >
            <Icon name={isVisible ? 'close' : 'search'} className="size-4" />
          </button>
        </div>

        <TextField
          label="Konfirmasi Password"
          type={isVisible ? 'text' : 'password'}
          value={draft.confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => setDraft((c) => ({ ...c, confirmPassword: event.target.value }))}
        />

        <SelectField
          label="Status"
          value={draft.status}
          onChange={(value) => setDraft((c) => ({ ...c, status: value }))}
          options={[
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Nonaktif' },
          ]}
        />

        <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Spesifikasi mencatat bahwa mengubah status saja tetap mengharuskan mengetik ulang kata
          sandi, dan menandainya sebagai hal yang layak diperbaiki. Perbaikan itu diambil di sini:
          kata sandi hanya diperiksa bila diisi.
        </p>
      </div>
    </Modal>
  );
}
