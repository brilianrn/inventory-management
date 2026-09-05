'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Can, usePermission } from '@/packages/access/presentation';
import { getUseCases } from '@/shared/config/di';
import { getSeedSummary } from '@/seed';
import Icon from '@/shared/ui/icon';
import { SearchBox, SelectField } from '@/shared/ui/inputs';
import { formatDecimal } from '@/shared/ui/format';
import { Card, PageHeader, StatCard } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

const numberFormat = new Intl.NumberFormat('id-ID');

export default function DashboardPage() {
  const { now, profile, permissions, afterCutoff } = usePermission();
  const [operational, setOperational] = useState(null);
  const [master, setMaster] = useState(null);

  useEffect(() => {
    let alive = true;
    const { documents, catalog } = getUseCases();

    Promise.all([documents.getOperationalSummary({ now }), catalog.getMasterSummary()]).then(
      ([operationalResult, masterResult]) => {
        if (!alive) return;
        if (operationalResult.data) setOperational(operationalResult.data);
        if (masterResult.data) setMaster(masterResult.data);
      },
    );

    return () => {
      alive = false;
    };
  }, [now]);

  const seed = getSeedSummary();

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${profile?.name?.split(' ')[0] ?? 'Pengguna'}`}
        description="Ringkasan operasional 60 hari terakhir. Kartu dan menu yang tampil menyesuaikan kombinasi izin yang sedang aktif."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Can permission="stocktake.view">
          <StatCard
            label="Stock take menunggu validasi"
            value={numberFormat.format(operational?.stockTake.awaitingValidation ?? 0)}
            hint={`${operational?.stockTake.bulkValidatable ?? 0} dokumen bisa divalidasi massal`}
            tone="warn"
          />
        </Can>

        <Can permission="stocktake.view">
          <StatCard
            label="Dokumen stock take"
            value={numberFormat.format(operational?.stockTake.total ?? 0)}
            hint={`${operational?.stockTake.today ?? 0} dibuat hari ini`}
          />
        </Can>

        <Can permission="stockwaste.view">
          <StatCard
            label="Dokumen waste"
            value={numberFormat.format(operational?.waste.total ?? 0)}
            hint={`${numberFormat.format(operational?.waste.itemCount ?? 0)} baris produk tercatat`}
          />
        </Can>

        <Can permission="receiving.view">
          <StatCard
            label="DO perlu perhatian"
            value={numberFormat.format(operational?.deliveryOrders.needsAttention ?? 0)}
            hint={`${operational?.deliveryOrders.awaitingReceipt ?? 0} menunggu penerimaan`}
            tone="danger"
          />
        </Can>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="layers" className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-strong">Data demo yang tersedia</h3>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {[
              ['Brand', seed.brands],
              ['Outlet', seed.outlets],
              ['Supplier', seed.suppliers],
              ['Produk', seed.products],
              ['Pengguna', seed.users],
              ['Jadwal aktif', master?.activeSchedules ?? 0],
              ['Dokumen stock take', seed.stockTakeDocuments],
              ['Dokumen waste', seed.wasteDocuments],
              ['Dokumen return', seed.returnWasteDocuments],
              ['Delivery order', seed.deliveryOrders],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-strong">
                  {numberFormat.format(value)}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 border-t border-line pt-3 text-xs text-muted-foreground">
            Seluruh nama brand, outlet, produk, pemasok, dan pengguna di sini fiktif, dibuat khusus
            untuk demo amb.
          </p>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Icon name="shield" className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-strong">Hak akses aktif</h3>
          </div>

          <p className="text-3xl font-semibold tabular-nums text-brand">{permissions.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">izin menyala untuk sesi ini</p>

          <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Simulasi lewat jam batas</span>
              <span className={afterCutoff ? 'font-semibold text-warn' : 'text-strong'}>
                {afterCutoff ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Validasi stock take</span>
              <Can
                permission="stocktake.validate"
                respectTimeWindow
                fallback={<span className="font-semibold text-muted-foreground">Tertutup</span>}
              >
                <span className="font-semibold text-brand">Terbuka</span>
              </Can>
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-panel-soft px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            Coba matikan izin lihat mana pun di panel demo, lalu perhatikan menu di sidebar dan
            kartu di halaman ini ikut menghilang tanpa memuat ulang halaman.
          </p>
        </Card>
      </div>

      <OutletStockPanel />
    </>
  );
}

function OutletStockPanel() {
  const [outletId, setOutletId] = useState('SO01');
  const [query, setQuery] = useState('');

  const loadOutlets = useCallback(async () => {
    const { data } = await getUseCases().catalog.listOutlets();
    return data ?? [];
  }, []);

  const loadStock = useCallback(async () => {
    const { data } = await getUseCases().catalog.getOutletStockSheet({ outletId });
    return data ?? null;
  }, [outletId]);

  const { data: outlets = [] } = useAsyncData(loadOutlets);
  const { data: sheet, isLoading } = useAsyncData(loadStock);

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const all = sheet?.rows ?? [];
    const matched = keyword
      ? all.filter((row) => `${row.name} ${row.code}`.toLowerCase().includes(keyword))
      : all;
    return matched.slice(0, 12);
  }, [sheet, query]);

  return (
    <Card className="mt-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="box" className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-strong">Stok outlet berjalan</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Berkurang saat dokumen waste dikirim, bertambah saat surat jalan dikonfirmasi diterima.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            value={outletId}
            onChange={setOutletId}
            placeholder="Pilih outlet"
            options={outlets.map((outlet) => ({ value: outlet.id, label: outlet.displayName }))}
          />
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Cari produk"
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-lg bg-panel-soft" />
          ))}
        </div>
      ) : rows.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm text-body">{row.name}</span>
                <span className="block font-mono text-xs text-muted-foreground">{row.code}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-strong">
                {formatDecimal(row.quantity)}{' '}
                <span className="text-xs font-normal text-muted-foreground">{row.uom}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Tidak ada produk yang cocok.
        </p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Menampilkan {rows.length} dari {sheet?.rows?.length ?? 0} produk. Persempit dengan pencarian.
      </p>
    </Card>
  );
}
