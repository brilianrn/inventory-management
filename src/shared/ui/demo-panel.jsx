'use client';

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  RESTRICTED_CUTOFF_HOUR,
  buildPermissionTree,
} from '@/packages/access/domain/permission.catalog';
import { PERSONAS } from '@/packages/access/domain/persona';
import {
  WASTE_WINDOW_CLOSE_HOUR,
  WASTE_WINDOW_OPEN_HOUR,
} from '@/packages/documents/domain/waste-input.rules';
import { usePermission } from '@/packages/access/presentation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { goOffline, goOnline } from '@/shared/store/connection.slice';
import {
  resetDemo,
  setAfterCutoff,
  setWasteWindow,
  setPanelOpen,
  setPermissionGroup,
  setPersona,
  setRestricted,
  togglePermission,
} from '@/shared/store/demo.slice';
import Icon from './icon';

const RESTRICTABLE_CODE = 'stocktake.validate';

const ToggleRow = ({ checked, onChange, label, description }) => (
  <Label className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3 font-normal transition-colors hover:border-line-strong">
    <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    <span className="min-w-0">
      <span className="block text-sm font-medium text-strong">{label}</span>
      {description ? (
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      ) : null}
    </span>
  </Label>
);

const PermissionRow = ({ permission, granted, restricted, onToggle, onRestrictChange }) => (
  <div className="rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
    <Label className="flex items-start gap-2.5 font-normal">
      <Checkbox checked={granted} onCheckedChange={onToggle} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-body">{permission.label}</span>
        <span className="block font-mono text-[11px] text-muted-foreground">{permission.code}</span>
      </span>
    </Label>

    {permission.restrictable && granted ? (
      <div className="mt-2 ml-7 space-y-1.5 border-l pl-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Atribut tambahan
        </p>

        <RadioGroup
          value={restricted ? 'restricted' : 'open'}
          onValueChange={(value) => onRestrictChange(value === 'restricted')}
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
            <Label key={option.value} className="flex items-start gap-2 font-normal">
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-strong">{option.title}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>
    ) : null}
  </div>
);

export default function DemoPanel() {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.demo.panelOpen);
  const personaId = useSelector((state) => state.demo.personaId);
  const permissions = useSelector((state) => state.demo.permissions);
  const attributes = useSelector((state) => state.demo.attributes);
  const afterCutoff = useSelector((state) => state.demo.afterCutoff);
  const wasteWindow = useSelector((state) => state.demo.wasteWindow);
  const isOffline = useSelector((state) => state.connection.offline);

  const { canActRightNow, can, isRestricted } = usePermission();
  const [activeTab, setActiveTab] = useState('stock-management');

  const tree = useMemo(() => buildPermissionTree(), []);
  const activeTabData = tree.find((tab) => tab.id === activeTab) ?? tree[0];
  const granted = useMemo(() => new Set(permissions), [permissions]);

  const validateAllowedNow = canActRightNow(RESTRICTABLE_CODE);
  const validateRestricted = isRestricted(RESTRICTABLE_CODE);

  return (
    <>
      {!open ? (
        <Button
          size="lg"
          onClick={() => dispatch(setPanelOpen(true))}
          className="fixed right-5 bottom-5 z-50 h-11 rounded-full px-4 shadow-lg"
        >
          <Icon name="sparkles" className="size-4" strokeWidth={2} />
          Panel Demo
        </Button>
      ) : null}

      <Sheet open={open} onOpenChange={(value) => dispatch(setPanelOpen(value))}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="flex-row items-start gap-3 space-y-0 border-b px-5 py-4">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <Icon name="sparkles" className="size-4.5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-sm">Panel Demo Hak Akses</SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                Alat peraga portofolio. Di sistem produksi daftar izin datang dari sesi login dan
                panel ini tidak ada.
              </SheetDescription>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Persona
              </h2>
              <div className="space-y-1.5">
                {PERSONAS.map((persona) => {
                  const active = personaId === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => dispatch(setPersona(persona.id))}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
                        active
                          ? 'border-brand bg-brand-soft'
                          : 'bg-muted/40 hover:border-line-strong',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            active ? 'text-brand' : 'text-strong',
                          )}
                        >
                          {persona.name}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {persona.permissions.length} izin
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {persona.summary}
                      </span>
                    </button>
                  );
                })}

                {personaId === 'custom' ? (
                  <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                    Kombinasi izin sudah diubah manual — tidak lagi sama dengan persona mana pun.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Simulasi waktu
              </h2>
              <ToggleRow
                checked={afterCutoff}
                onChange={(value) => dispatch(setAfterCutoff(value))}
                label={`Anggap sekarang sudah lewat pukul ${String(RESTRICTED_CUTOFF_HOUR).padStart(2, '0')}:00`}
                description="Menguji aturan Restricted: pemilik izin bermode Restricted kehilangan tombol edit dan validasi setelah jam batas."
              />

              <div
                className={cn(
                  'rounded-lg border p-3 text-xs',
                  can(RESTRICTABLE_CODE)
                    ? validateAllowedNow
                      ? 'border-brand/40 bg-brand-soft text-brand'
                      : 'border-warn/40 bg-warn-soft text-warn'
                    : 'bg-muted/40 text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Icon name="clock" className="size-3.5" />
                  Status validasi stock take
                </span>
                <p className="mt-1 leading-relaxed">
                  {!can(RESTRICTABLE_CODE)
                    ? 'Izin validasi tidak dimiliki — tombol validasi tersembunyi.'
                    : validateAllowedNow
                      ? `Terbuka${validateRestricted ? ' (mode Restricted, masih dalam jam)' : ' (mode Not Restricted)'}.`
                      : 'Tertutup — mode Restricted dan jam batas sudah lewat.'}
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Jendela pengisian waste
              </h2>

              <RadioGroup
                value={wasteWindow}
                onValueChange={(value) => dispatch(setWasteWindow(value))}
                className="gap-1.5 rounded-lg border bg-muted/40 p-3"
              >
                {[
                  {
                    value: 'auto',
                    title: 'Ikuti jam sekarang',
                    hint: `Form terbuka pukul ${WASTE_WINDOW_OPEN_HOUR}:00–${WASTE_WINDOW_CLOSE_HOUR}:00`,
                  },
                  { value: 'open', title: 'Paksa terbuka', hint: 'Form waste selalu bisa diisi' },
                  {
                    value: 'closed',
                    title: 'Paksa tertutup',
                    hint: 'Crew melihat pesan di luar jam pengisian',
                  },
                ].map((option) => (
                  <Label key={option.value} className="flex items-start gap-2 font-normal">
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-strong">{option.title}</span>
                      <span className="block text-xs text-muted-foreground">{option.hint}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Simulasi koneksi
              </h2>
              <ToggleRow
                checked={isOffline}
                onChange={() => dispatch(isOffline ? goOnline() : goOffline({ simulated: true }))}
                label="Putuskan koneksi internet"
                description="Halaman outlet crew menampilkan pita merah; portal back office menampilkan dialog. Mematikannya lagi memunculkan pita hijau pemulihan."
              />
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Daftar izin
                </h2>
                <span className="text-xs text-muted-foreground">{permissions.length} aktif</span>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  {tree.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex-1 text-xs">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                {activeTabData.sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    {section.label ? (
                      <p className="text-xs font-semibold tracking-wide text-strong uppercase">
                        {section.label}
                      </p>
                    ) : null}

                    {section.groups.map((group) => {
                      const codes = group.permissions.map((permission) => permission.code);
                      const allGranted = codes.every((code) => granted.has(code));

                      return (
                        <div key={group.id} className="rounded-xl border p-2.5">
                          <div className="mb-1 flex items-center justify-between gap-2 px-2">
                            <p className="text-xs font-semibold text-strong">{group.label}</p>
                            <button
                              type="button"
                              onClick={() =>
                                dispatch(setPermissionGroup({ codes, granted: !allGranted }))
                              }
                              className="text-xs font-medium text-brand transition-opacity hover:opacity-70"
                            >
                              {allGranted ? 'Kosongkan' : 'Pilih semua'}
                            </button>
                          </div>

                          {group.permissions.map((permission) => (
                            <PermissionRow
                              key={permission.code}
                              permission={permission}
                              granted={granted.has(permission.code)}
                              restricted={Boolean(attributes?.[permission.code]?.restricted)}
                              onToggle={() => dispatch(togglePermission(permission.code))}
                              onRestrictChange={(value) =>
                                dispatch(setRestricted({ code: permission.code, restricted: value }))
                              }
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="border-t px-5 py-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => dispatch(resetDemo())}
              className="w-full"
            >
              <Icon name="reset" className="size-4" />
              Kembalikan ke persona awal
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
