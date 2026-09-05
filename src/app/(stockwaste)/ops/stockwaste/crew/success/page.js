'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Icon from '@/shared/ui/icon';
import { Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';

function SuccessContent() {
  const params = useSearchParams();
  const documentCount = Number(params.get('documents') ?? 0);

  useEffect(() => {
    const onPopState = () => window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon name="check" className="size-7" strokeWidth={2.5} />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-strong">Berhasil Mengirim Form Waste</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {documentCount > 1
          ? `${documentCount} dokumen waste terbentuk — satu untuk tiap kategori yang kamu isi.`
          : 'Satu dokumen waste terbentuk.'}{' '}
        Stok outlet sudah berkurang sebesar kuantitas yang dicatat.
      </p>

      <Card className="mt-6 w-full border-dashed text-left">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-strong">Catatan demo.</span> Di produksi crew menutup
          halaman ini dan kembali ke aplikasi workplace. Dokumennya sudah bisa dilihat di daftar
          Waste pada Inventory Admin.
        </p>
        <Link
          href="/ops/stockwaste/crew"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          Mulai sesi baru
          <Icon name="chevronRight" className="size-3.5" />
        </Link>
      </Card>
    </div>
  );
}

export default function WasteSuccessPage() {
  return (
    <MobileShell>
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </MobileShell>
  );
}
