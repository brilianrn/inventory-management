'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Can, usePermission } from '@/packages/access/presentation';
import { BLOCKED_QTY_KEYS, isMaxQtyChanged } from '@/packages/catalog/domain/configuration.rules';
import { getUseCases } from '@/shared/config/di';
import DataTable from '@/shared/ui/data-table';
import { Tabs } from '@/shared/ui/display';
import { formatDateTime, formatNumber } from '@/shared/ui/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

const TABS = [
  { id: 'category', label: 'WASTE CATEGORY' },
  { id: 'qty', label: 'WASTE QTY SETTING' },
];

export default function WasteAppConfigPage() {
  const { showToast } = useToast();
  const { can, profile } = usePermission();

  const [activeTab, setActiveTab] = useState('category');
  const [categoryPage, setCategoryPage] = useState(0);
  const [uomPage, setUomPage] = useState(0);
  const [editingUom, setEditingUom] = useState(null);

  const loadConfig = useCallback(async () => {
    const { data } = await getUseCases().catalog.listWasteAppConfig();
    return data ?? { categories: [], uomLimits: [] };
  }, []);

  const { data: config = { categories: [], uomLimits: [] }, isLoading, reload } =
    useAsyncData(loadConfig);

  const categoryColumns = useMemo(
    () => [
      { key: 'name', header: 'Nama Kategori Waste', render: (row) => row.name },
      {
        key: 'totalProducts',
        header: 'Total Produk',
        width: '9rem',
        render: (row) => `${formatNumber(row.totalProducts)} Produk`,
      },
      {
        key: 'updatedAt',
        header: 'Terakhir Diedit',
        render: (row) => formatDateTime(row.updatedAt),
      },
      { key: 'updatedBy', header: 'User', render: (row) => row.updatedBy ?? '-' },
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/swconfiguration/${row.id}`}>Detail</Link>
          </Button>
        ),
      },
    ],
    [],
  );

  const uomColumns = useMemo(() => {
    const base = [
      { key: 'uom', header: 'UoM', render: (row) => row.uom },
      {
        key: 'maxQty',
        header: 'Max Quantity',
        width: '10rem',
        render: (row) => formatNumber(row.maxQty),
      },
      {
        key: 'updatedAt',
        header: 'Terakhir Diedit',
        render: (row) => formatDateTime(row.updatedAt),
      },
      { key: 'updatedBy', header: 'User', render: (row) => row.updatedBy ?? '-' },
    ];

    if (!can('wasteapp.uomEdit')) return base;

    return [
      ...base,
      {
        key: 'action',
        header: 'Aksi',
        width: '6rem',
        render: (row) => (
          <Button variant="outline" size="sm" onClick={() => setEditingUom(row)}>
            Edit
          </Button>
        ),
      },
    ];
  }, [can]);

  return (
    <>
      <PageHeader
        title="Stock Waste App"
        description="Kontrol pencegahan sebelum data masuk: produk apa yang boleh dipilih per kategori, dan batas kuantitas per satuan."
      />

      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} />

      <Card>
        {activeTab === 'category' ? (
          <DataTable
            columns={categoryColumns}
            rows={config.categories}
            rowKey={(row) => row.id}
            pageIndex={categoryPage}
            onPageChange={setCategoryPage}
            isLoading={isLoading}
            emptyTitle="Belum ada kategori waste"
          />
        ) : (
          <DataTable
            columns={uomColumns}
            rows={config.uomLimits}
            rowKey={(row) => row.id}
            pageIndex={uomPage}
            onPageChange={setUomPage}
            isLoading={isLoading}
            emptyTitle="Belum ada satuan"
          />
        )}
      </Card>

      {editingUom ? (
        <EditUomModal
          limit={editingUom}
          actor={profile?.name}
          onClose={() => setEditingUom(null)}
          onSaved={async (message) => {
            setEditingUom(null);
            reload();
            showToast(message);
          }}
        />
      ) : null}
    </>
  );
}

function EditUomModal({ limit, actor, onClose, onSaved }) {
  const { showToast } = useToast();
  const [value, setValue] = useState(String(limit.maxQty));
  const [isProcessing, setIsProcessing] = useState(false);

  const canSave = isMaxQtyChanged(limit.maxQty, value);

  const onSubmit = async () => {
    setIsProcessing(true);
    const result = await getUseCases().catalog.updateUomLimit({ id: limit.id, maxQty: value, actor });
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
      title="Edit UoM"
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
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Name UoM
          </Label>
          <Input value={limit.uom} disabled />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Max Quantity
          </Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={value}
            onKeyDown={(event) => BLOCKED_QTY_KEYS.includes(event.key) && event.preventDefault()}
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Batas qty yang dapat diinput oleh Outlet Crew.
          </p>
        </div>
      </div>
    </Modal>
  );
}
