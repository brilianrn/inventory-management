'use client';

import { useEffect, useState } from 'react';
import { buildWasteReference } from '../domain/waste.rules';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button as UiButton } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BackLink, Fieldset } from '@/shared/ui/display';
import { formatDate, formatDateTime, formatDecimal } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, PageHeader } from '@/shared/ui/page-scaffold';
import { downloadCsv } from '@/shared/lib/export-file';

export default function WasteDetailView({
  document,
  isLoading,
  backHref,
  backLabel,
  title,
  fieldsetItems,
  exportFilename,
}) {
  const { showToast } = useToast();
  const [gallery, setGallery] = useState(null);

  useEffect(() => {
    if (!gallery) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setGallery(null);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gallery]);

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-muted-foreground">Dokumen tidak ditemukan.</p>
      </Card>
    );
  }

  const onExport = () => {
    const headers = ['Produk Terbuang', 'Kuantitas', 'UoM'];
    if (document.showExpiryColumn) headers.splice(1, 0, 'Tanggal Kadaluarsa');

    downloadCsv({
      filename: exportFilename,
      headers,
      rows: document.lines.map((line) => {
        const cells = [`[${line.productCode}] ${line.productName}`, formatDecimal(line.quantity), line.uom];
        if (document.showExpiryColumn) cells.splice(1, 0, formatDate(line.expiryDate));
        return cells;
      }),
    });
    showToast('Berhasil Export Data');
  };

  return (
    <>
      <BackLink href={backHref}>{backLabel}</BackLink>

      <PageHeader
        title={title}
        description={document.outletName}
        actions={
          <Button variant="outline" icon="download" onClick={onExport}>
            Export
          </Button>
        }
      />

      <Card className="mb-4">
        <Fieldset items={fieldsetItems} />
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-strong">
          Item dokumen
          <span className="ml-2 text-xs font-normal text-muted-foreground">{document.lines.length} baris</span>
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-xs font-semibold tracking-wide uppercase">Foto</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide uppercase">
                Produk Terbuang
              </TableHead>
              {document.showExpiryColumn ? (
                <TableHead className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap">
                  Tanggal Kadaluarsa
                </TableHead>
              ) : null}
              <TableHead className="text-right text-xs font-semibold tracking-wide uppercase">
                Kuantitas
              </TableHead>
              <TableHead className="text-xs font-semibold tracking-wide uppercase">UoM</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {document.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <UiButton
                    variant="outline"
                    size="icon-lg"
                    onClick={() => setGallery(line)}
                    disabled={!line.photoCount}
                    aria-label={line.photoCount ? `Lihat ${line.photoCount} foto` : 'Tidak ada foto'}
                  >
                    <Icon name="image" className="size-4" />
                  </UiButton>
                </TableCell>
                <TableCell className="text-body">
                  <span className="font-mono text-xs text-muted-foreground">[{line.productCode}]</span>{' '}
                  {line.productName}
                </TableCell>
                {document.showExpiryColumn ? (
                  <TableCell className="whitespace-nowrap text-body">
                    {formatDate(line.expiryDate)}
                  </TableCell>
                ) : null}
                <TableCell className="text-right tabular-nums text-body">
                  {formatDecimal(line.quantity)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-body">{line.uom}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={Boolean(gallery)}
        onClose={() => setGallery(null)}
        title="Bukti Foto"
        width="max-w-lg"
      >
        {gallery ? (
          <>
            <p className="mb-3 text-sm text-body">
              <span className="font-mono text-xs text-muted-foreground">[{gallery.productCode}]</span>{' '}
              {gallery.productName}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {gallery.photos?.length
                ? gallery.photos.map((photo, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-xl border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Bukti foto ${index + 1}`}
                        className="size-full object-cover"
                      />
                    </div>
                  ))
                : Array.from({ length: gallery.photoCount }).map((_, index) => (
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
            {!gallery.photos?.length ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Riwayat demo tidak menyertakan berkas gambar; bingkai di atas mewakili jumlah bukti
                foto yang diunggah outlet crew untuk item ini. Dokumen yang dikirim lewat aplikasi
                waste membawa fotonya sungguhan.
              </p>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}

export const buildWasteFieldset = (document) => [
  {
    label: 'Stock Waste Ref',
    wide: true,
    value: buildWasteReference({
      segment: document.displayCategoryName,
      outletName: document.outletName,
      createdAt: document.createdAt,
      formatDateTime,
    }),
  },
  { label: 'Kategori', value: document.displayCategoryName },
  { label: 'Outlet Crew', value: document.crewName },
  { label: 'Tanggal dan Waktu', value: formatDateTime(document.createdAt) },
];

export const buildReturnWasteFieldset = (document) => [
  {
    label: 'Ref Doc',
    wide: true,
    value: buildWasteReference({
      segment: document.destination,
      outletName: document.outletName,
      createdAt: document.createdAt,
      formatDateTime,
    }),
  },
  { label: 'Brand', value: document.brandName },
  { label: 'Kategori', value: document.wasteCategoryName },
  { label: 'Destination', value: document.destination },
  { label: 'Outlet Crew', value: document.crewName },
  { label: 'Tanggal dan Waktu', value: formatDateTime(document.createdAt) },
];
