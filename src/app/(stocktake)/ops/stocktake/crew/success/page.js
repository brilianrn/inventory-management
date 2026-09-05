'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Icon from '@/shared/ui/icon';
import { Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';

function SuccessContent() {
  const params = useSearchParams();
  const isAutoSubmitted = params.get('auto') === '1';

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

      <h2 className="mt-5 text-lg font-semibold text-strong">Berhasil Mengisi Stocktake</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {isAutoSubmitted
          ? 'Waktu sesi habis dan jadwal ini ditandai kirim otomatis, jadi hitunganmu dikirim apa adanya. Sesi ini telah berakhir.'
          : 'Sesi ini telah berakhir. Hasil hitunganmu sudah masuk ke daftar dokumen back office untuk divalidasi.'}
      </p>

      <Card className="mt-6 w-full border-dashed text-left">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-strong">Catatan demo.</span> Di produksi crew menutup
          halaman ini dan kembali ke aplikasi workplace. Untuk keperluan peragaan, tautan di bawah
          membuka lagi gerbang masuk.
        </p>
        <Link
          href="/ops/stocktake/crew"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          Mulai sesi baru
          <Icon name="chevronRight" className="size-3.5" />
        </Link>
      </Card>
    </div>
  );
}

export default function CrewSuccessPage() {
  return (
    <MobileShell>
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </MobileShell>
  );
}
