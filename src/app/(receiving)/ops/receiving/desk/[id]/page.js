'use client';

import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Can, usePermission } from '@/packages/access/presentation';
import {
  DO_STATUS_TONE,
  RECEIPT_NOTE_PRESETS,
  defaultReceiptNote,
} from '@/packages/documents/domain/receiving.rules';
import { DELIVERY_ORDER_STATUS_LABEL } from '@/packages/documents/domain/status';
import { getUseCases } from '@/shared/config/di';
import { BackLink, Fieldset, StatusBadge } from '@/shared/ui/display';
import { formatDate, formatDecimal } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { DeskShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';
import NoteComposer from '@/packages/documents/presentation/note-composer';

export default function DeliveryOrderDetailPage() {
  const params = useParams();
  const { profile } = usePermission();
  const { showToast } = useToast();

  const [stage, setStage] = useState(null); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const loadOrder = useCallback(async () => {
    const { data } = await getUseCases().documents.getDeliveryOrderDetail(params.id);
    return data ?? null;
  }, [params.id]);

  const { data: order, isLoading, reload } = useAsyncData(loadOrder);

  const submit = async (action, note) => {
    setIsProcessing(true);
    const result = await getUseCases().documents.validateDeliveryOrder({
      id: params.id,
      action,
      note,
      actor: profile?.name ?? 'Back office',
    });
    setIsProcessing(false);
    setStage(null);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    reload();
    showToast(result.message);
  };

  if (isLoading || !order) {
    return (
      <DeskShell>
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </DeskShell>
    );
  }

  return (
    <DeskShell>
      <BackLink href="/ops/receiving/desk">Kembali ke daftar Delivery Order</BackLink>

      <PageHeader
        title={order.doNumber}
        description={`${order.sourceLocation} → ${order.destinationLocation}`}
        actions={
          <>
            <StatusBadge tone={DO_STATUS_TONE[order.status]}>
              {DELIVERY_ORDER_STATUS_LABEL[order.status]}
            </StatusBadge>

            <Button
              variant="outline"
              icon="image"
              disabled={!order.canViewPhotos}
              onClick={() => setIsGalleryOpen(true)}
            >
              Lihat Bukti Foto
            </Button>

            <Can permission="receiving.validate">
              <Button icon="check" disabled={!order.canValidate} onClick={() => setStage('choose')}>
                Validasi DO
              </Button>
            </Can>
          </>
        }
      />

      <Card className="mb-4">
        <Fieldset
          items={[
            { label: 'Nomor DO', value: order.doNumber },
            { label: 'Sumber', value: order.sourceLocation },
            { label: 'Tanggal Kirim', value: formatDate(order.shippingDate) },
            { label: 'Tujuan', value: order.destinationLocation },
            { label: 'Catatan', value: order.remark || '-', wide: true },
          ]}
        />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-strong">
            Item dokumen{' '}
            <span className="font-normal text-muted-foreground">
              {order.lines.length} baris · kolom Stok Tujuan menunjukkan stok berjalan di{' '}
              {order.destinationLocation}
            </span>
          </h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-12 text-[13px] font-semibold tracking-wide uppercase">
                Produk
              </TableHead>
              <TableHead className="h-12 w-36 text-right text-[13px] font-semibold tracking-wide uppercase">
                Kuantitas
              </TableHead>
              <TableHead className="h-12 w-36 text-[13px] font-semibold tracking-wide uppercase">
                UoM
              </TableHead>
              <TableHead className="h-12 w-44 text-right text-[13px] font-semibold tracking-wide uppercase">
                Stok Tujuan
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="py-3.5 text-body">
                  <span className="font-mono text-xs text-muted-foreground">
                    [{line.productCode}]
                  </span>{' '}
                  {line.productName}
                </TableCell>
                <TableCell className="py-3.5 text-right tabular-nums text-body">
                  {formatDecimal(line.qtyDone)}
                </TableCell>
                <TableCell className="py-3.5 whitespace-nowrap text-body">{line.uom}</TableCell>
                <TableCell className="py-3.5 text-right tabular-nums text-muted-foreground">
                  {formatDecimal(line.destinationStock)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        isOpen={stage === 'choose'}
        title="Validasi Dokumen?"
        description="Pilih tindakan untuk surat jalan ini. Menerima DO menambah stok di lokasi tujuan."
        cancelLabel="Batalkan DO"
        confirmLabel="Terima DO"
        onCancel={() => setStage('cancel')}
        onConfirm={() => setStage('receive')}
      />

      <NoteComposer
        isOpen={stage === 'receive'}
        title="Konfirmasi Penerimaan"
        description="Masukan catatan untuk konfirmasi penerimaan."
        presets={RECEIPT_NOTE_PRESETS}
        initialNote={defaultReceiptNote()}
        confirmLabel="Konfirmasi"
        isProcessing={isProcessing}
        onSubmit={(note) => submit('receive', note)}
        onClose={() => setStage(null)}
      />

      <NoteComposer
        isOpen={stage === 'cancel'}
        title="Catatan Pembatalan"
        description="Berikan alasan pembatalan dokumen."
        confirmLabel="Batalkan DO"
        isProcessing={isProcessing}
        onSubmit={(note) => submit('cancel', note)}
        onClose={() => setStage(null)}
      />

      <Modal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        title="Bukti Foto"
        width="max-w-lg"
      >
        <div className="grid grid-cols-2 gap-3">
          {order.photos?.length
            ? order.photos.map((photo, index) => (
                <div key={index} className="aspect-square overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`Bukti ${index + 1}`} className="size-full object-cover" />
                </div>
              ))
            : Array.from({ length: order.photoCount ?? 0 }).map((_, index) => (
                <div
                  key={index}
                  className="grid aspect-square place-items-center rounded-xl border border-dashed bg-muted/40 text-muted-foreground"
                >
                  <div className="text-center">
                    <Icon name="image" className="mx-auto size-6" />
                    <p className="mt-1.5 text-xs">Foto {index + 1}</p>
                  </div>
                </div>
              ))}
        </div>

        {!order.photos?.length ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Riwayat demo tidak menyertakan berkas gambar; bingkai di atas mewakili jumlah bukti foto
            yang diunggah outlet crew. DO yang dikonfirmasi lewat aplikasi crew membawa fotonya
            sungguhan.
          </p>
        ) : null}
      </Modal>
    </DeskShell>
  );
}
