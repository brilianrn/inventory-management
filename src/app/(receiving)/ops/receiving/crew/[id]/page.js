'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { usePermission } from '@/packages/access/presentation';
import NoteComposer from '@/packages/documents/presentation/note-composer';
import {
  MAX_RECEIPT_PHOTOS,
  RECEIPT_NOTE_PRESETS,
  defaultReceiptNote,
} from '@/packages/documents/domain/receiving.rules';
import { DeliveryOrderStatus } from '@/packages/documents/domain/status';
import { getUseCases } from '@/shared/config/di';
import { readResizedPhoto } from '@/shared/lib/photo';
import { formatDate, formatDecimal } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

export default function ReceivingCrewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = usePermission();
  const { showToast } = useToast();

  const [stage, setStage] = useState(null); 
  const [photos, setPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

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
      actor: profile?.name ?? 'Outlet crew',
      photos: action === 'receive' ? photos : [],
    });
    setIsProcessing(false);
    setStage(null);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    setPhotos([]);
    reload();
    setIsDone(true);
  };

  if (isLoading || !order) {
    return (
      <MobileShell>
        <Skeleton className="mb-3 h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </MobileShell>
    );
  }

  const isReceived = order.status === DeliveryOrderStatus.RECEIVED;
  const isCanceled = order.status === DeliveryOrderStatus.CANCELED;

  return (
    <MobileShell>
      <button
        type="button"
        onClick={() => router.push('/ops/receiving/crew')}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-body"
      >
        <Icon name="chevronRight" className="size-4 rotate-180" />
        Kembali
      </button>

      <div className="mb-4">
        <h2 className="text-base font-semibold text-strong">{order.doNumber}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(order.shippingDate)} · dari {order.sourceLocation}
        </p>
      </div>

      <div className="mb-28 space-y-3">
        {order.lines.map((line) => (
          <Card key={line.id} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm text-strong">{line.productName}</span>
              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                {line.productCode}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums text-strong">
                {formatDecimal(line.qtyDone)}
              </span>
              <span className="block text-xs text-muted-foreground">{line.uom}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t bg-card px-4 py-3">
        {isReceived ? (
          <div className="rounded-xl bg-brand-soft px-3 py-2.5 text-center">
            <p className="text-sm font-semibold text-brand">PRODUK TELAH DITERIMA</p>
            {order.remark ? <p className="mt-1 text-xs text-body">{order.remark}</p> : null}
          </div>
        ) : isCanceled ? (
          <div className="rounded-xl bg-muted px-3 py-2.5 text-center">
            <p className="text-sm font-semibold text-muted-foreground">PRODUK DIBATALKAN</p>
            {order.remark ? <p className="mt-1 text-xs text-body">{order.remark}</p> : null}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-center"
              onClick={() => setStage('cancel')}
            >
              Batalkan DO
            </Button>
            <Button className="flex-1 justify-center" onClick={() => setStage('photos')}>
              Terima DO
            </Button>
          </div>
        )}
      </div>

      <PhotoModal
        isOpen={stage === 'photos'}
        photos={photos}
        onChange={setPhotos}
        onClose={() => setStage(null)}
        onNext={() => setStage('receive')}
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

      <ConfirmDialog
        isOpen={isDone}
        tone="success"
        title={isReceived ? 'Konfirmasi Berhasil' : 'DO Berhasil Dibatalkan'}
        description={
          isReceived
            ? 'Pastikan kamu sudah memeriksa dan mengambil foto produk yang diterima. Stok outlet sudah bertambah.'
            : 'Surat jalan ini ditandai dibatalkan dan stok tidak berubah.'
        }
        confirmLabel="Kembali ke List DO"
        isSingleAction
        onConfirm={() => router.push('/ops/receiving/crew')}
        onCancel={() => setIsDone(false)}
      />
    </MobileShell>
  );
}

function PhotoModal({ isOpen, photos, onChange, onClose, onNext }) {
  const { showToast } = useToast();
  const [isReading, setIsReading] = useState(false);

  const onPick = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;

    if (photos.length + files.length > MAX_RECEIPT_PHOTOS) {
      showToast(`Maksimal ${MAX_RECEIPT_PHOTOS} foto bukti`, 'error');
      return;
    }

    setIsReading(true);
    try {
      const added = await Promise.all(files.map((file) => readResizedPhoto(file)));
      onChange([...photos, ...added.map((photo) => photo.dataUrl)]);
    } catch {
      showToast('Foto gagal dibaca', 'error');
    } finally {
      setIsReading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Foto Bukti Penerimaan"
      description={`Maksimal ${MAX_RECEIPT_PHOTOS} foto. Foto dikecilkan di peramban sebelum dikirim.`}
      width="max-w-sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={!photos.length} onClick={onNext}>
            Lanjut
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={`Foto ${index + 1}`} className="size-full object-cover" />
            <button
              type="button"
              aria-label={`Hapus foto ${index + 1}`}
              onClick={() => onChange(photos.filter((_, photoIndex) => photoIndex !== index))}
              className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
            >
              <Icon name="close" className="size-3" />
            </button>
          </div>
        ))}

        {photos.length < MAX_RECEIPT_PHOTOS ? (
          <Label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-brand hover:text-brand">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPick}
              disabled={isReading}
              className="sr-only"
            />
            <Icon name={isReading ? 'reset' : 'plus'} className="size-5" />
          </Label>
        ) : null}
      </div>

      {!photos.length ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Penerimaan wajib disertai minimal satu foto bukti.
        </p>
      ) : null}
    </Modal>
  );
}
