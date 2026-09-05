'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DO_STATUS_TONE,
  msUntilDailyCutoff,
  visibleToCrew,
} from '@/packages/documents/domain/receiving.rules';
import { DELIVERY_ORDER_STATUS_LABEL, RECEIVING_CUTOFF } from '@/packages/documents/domain/status';
import { getUseCases } from '@/shared/config/di';
import { StatusBadge } from '@/shared/ui/display';
import { formatDate } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { SelectField } from '@/shared/ui/inputs';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

const pad = (value) => String(value).padStart(2, '0');

function CutoffCountdown({ onReach }) {
  const [remaining, setRemaining] = useState(() => msUntilDailyCutoff());
  const firedRef = useRef(false);
  const onReachRef = useRef(onReach);

  useEffect(() => {
    onReachRef.current = onReach;
  }, [onReach]);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = msUntilDailyCutoff();
      setRemaining(left);

      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        onReachRef.current?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining > 0 && remaining < 30 * 60 * 1000;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs ${
        remaining === 0 ? 'bg-danger-soft text-danger' : isUrgent ? 'bg-warn-soft text-warn' : 'bg-panel-soft text-muted-foreground'
      }`}
    >
      <span className="flex items-center gap-1.5">
        <Icon name="clock" className="size-3.5 shrink-0" />
        Batas konfirmasi {pad(RECEIVING_CUTOFF.hour)}:{pad(RECEIVING_CUTOFF.minute)}
      </span>
      <span className="font-semibold tabular-nums">
        {remaining === 0
          ? 'Waktu habis'
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
      </span>
    </div>
  );
}

export default function ReceivingCrewPage() {
  const [outletId, setOutletId] = useState('');

  const loadPage = useCallback(async () => {
    const { catalog, documents } = getUseCases();
    const [outletResult, orderResult] = await Promise.all([
      catalog.listOutlets(),
      documents.listDeliveryOrders(),
    ]);
    return { outlets: outletResult.data ?? [], orders: orderResult.data ?? [] };
  }, []);

  const { data, isLoading, reload } = useAsyncData(loadPage);
  const outlets = useMemo(() => data?.outlets ?? [], [data]);
  const orders = useMemo(() => data?.orders ?? [], [data]);

  const outlet = outlets.find((item) => item.id === outletId) ?? null;
  const visible = useMemo(() => visibleToCrew(orders, outletId), [orders, outletId]);

  return (
    <MobileShell>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-strong">
          {outlet ? outlet.displayName : 'Penerimaan DO'}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Surat jalan yang menuju outletmu hari ini.
        </p>
      </div>

      <Card className="mb-4 border-dashed">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-strong">Catatan demo.</span> Di produksi tautan dari
          workplace membawa identitas crew beserta lokasi tujuannya, dan daftar DO datang sudah
          tersaring. Demo ini menggantinya dengan pemilih outlet di bawah.
        </p>
      </Card>

      <div className="mb-4">
        <SelectField
          label="Outlet"
          value={outletId}
          placeholder="Pilih outlet"
          onChange={setOutletId}
          options={outlets.map((item) => ({ value: item.id, label: item.displayName }))}
        />
      </div>

      {outletId ? <CutoffCountdown onReach={reload} /> : null}

      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-panel" />
          ))
        ) : !outletId ? (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Pilih outlet untuk melihat surat jalan yang menuju ke sana.
          </p>
        ) : visible.length ? (
          visible.map((order) => (
            <Link
              key={order.id}
              href={`/ops/receiving/crew/${order.id}`}
              className="block rounded-xl border border-line bg-panel px-4 py-3.5 transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-strong">{order.doNumber}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(order.shippingDate)} · {order.sourceLocation}
                  </p>
                </div>
                <StatusBadge tone={DO_STATUS_TONE[order.status]}>
                  {DELIVERY_ORDER_STATUS_LABEL[order.status]}
                </StatusBadge>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Belum ada surat jalan untuk outlet ini.
          </p>
        )}
      </div>

      {visible.length ? (
        <Button variant="outline" icon="reset" className="mt-4 w-full justify-center" onClick={reload}>
          Muat ulang daftar
        </Button>
      ) : null}
    </MobileShell>
  );
}
