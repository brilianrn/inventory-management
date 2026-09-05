'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import WasteDetailView, { buildWasteFieldset } from '@/packages/documents/presentation/waste-detail';
import { getUseCases } from '@/shared/config/di';

export default function WasteDetailPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getUseCases()
      .documents.getWasteDetail(id)
      .then(({ data }) => {
        if (!alive) return;
        setDocument(data ?? null);
        setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <WasteDetailView
      document={document}
      isLoading={isLoading}
      backHref="/stockwaste"
      backLabel="Kembali ke daftar Waste"
      title="Detail Waste"
      fieldsetItems={document ? buildWasteFieldset(document) : []}
      exportFilename="waste_detail_export.csv"
    />
  );
}
