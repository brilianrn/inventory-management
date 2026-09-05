'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  availableProducts,
  cardsComplete,
  clampQuantityInput,
  emptyCard,
  isCardComplete,
  isOverMaxQuantity,
  isQuantityInputAccepted,
  MAX_PHOTOS,
  searchProducts,
} from '@/packages/documents/domain/waste-input.rules';
import { getUseCases } from '@/shared/config/di';
import { readResizedPhoto } from '@/shared/lib/photo';
import {
  readFreshWasteDraft,
  withCategoryCards,
  writeWasteDraft,
} from '@/shared/lib/waste-draft.storage';
import { formatDate, formatDecimal, formatTime } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBox } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card } from '@/shared/ui/page-scaffold';
import { MobileShell } from '@/shared/ui/shells';
import { useAsyncData } from '@/shared/ui/use-async-data';

export default function WasteCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const categoryId = params.category;

  const [draft, setDraft] = useState(() => readFreshWasteDraft());
  const [cards, setCards] = useState(() => {
    const saved = readFreshWasteDraft()?.categories?.[params.category];
    return saved?.length ? saved.map((card) => ({ ...card })) : [emptyCard()];
  });

  const [pickerIndex, setPickerIndex] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const outletId = draft?.outletId ?? null;

  const loadSheet = useCallback(async () => {
    if (!outletId) return null;
    const { data } = await getUseCases().catalog.getWasteInputSheet({ outletId });
    return data ?? null;
  }, [outletId]);

  const { data: sheet, isLoading } = useAsyncData(loadSheet);

  const category = useMemo(
    () => sheet?.categories?.find((item) => item.id === categoryId) ?? null,
    [sheet, categoryId],
  );

  const productById = useMemo(
    () => new Map((category?.products ?? []).map((product) => [product.id, product])),
    [category],
  );

  const rulesFor = useCallback(
    (card) => ({
      requiresExpiryDate: Boolean(category?.requiresExpiryDate),
      maxQty: productById.get(card.productId)?.maxQty ?? null,
    }),
    [category, productById],
  );

  const isComplete = cardsComplete(cards, rulesFor);

  const patchCard = (index, changes) => {
    setIsDirty(true);
    setCards((current) =>
      current.map((card, cardIndex) => (cardIndex === index ? { ...card, ...changes } : card)),
    );
  };

  const addCard = () => {
    if (!isCardComplete(cards[0], rulesFor(cards[0]))) {
      showToast('Lengkapi dulu kartu paling atas', 'error');
      return;
    }
    setIsDirty(true);
    setCards((current) => [emptyCard(), ...current]);
  };

  const removeCard = (index) => {
    setIsDirty(true);
    setCards((current) => current.filter((_, cardIndex) => cardIndex !== index));
  };

  const chooseProduct = (index, productId) => {
    patchCard(index, { productId, quantity: '', photos: [] });
    setPickerIndex(null);
  };

  const changeQuantity = (index, raw) => {
    if (!isQuantityInputAccepted(raw)) return;
    patchCard(index, { quantity: clampQuantityInput(raw) });
  };

  const save = () => {
    const next = withCategoryCards(draft, categoryId, cards);
    const stored = writeWasteDraft(next);
    setDraft(next);
    setIsDirty(false);

    if (!stored) {
      showToast('Draf tidak muat di penyimpanan peramban — kurangi foto', 'error');
      return;
    }

    router.push('/ops/stockwaste/crew');
  };

  const leave = () => router.push('/ops/stockwaste/crew');

  if (!draft) {
    return (
      <MobileShell>
        <Card className="text-center">
          <p className="text-sm text-muted-foreground">
            Sesi belum dimulai. Kembali ke gerbang masuk untuk memilih outlet dan crew.
          </p>
          <Button className="mt-4 w-full justify-center" onClick={leave}>
            Ke gerbang masuk
          </Button>
        </Card>
      </MobileShell>
    );
  }

  if (isLoading || !sheet) {
    return (
      <MobileShell>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </MobileShell>
    );
  }

  if (!category) {
    return (
      <MobileShell>
        <Card className="text-center">
          <p className="text-sm text-muted-foreground">
            Kategori ini tidak tersedia untuk outletmu.
          </p>
          <Button className="mt-4 w-full justify-center" onClick={leave}>
            Kembali ke daftar kategori
          </Button>
        </Card>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (isDirty ? setIsLeaving(true) : leave())}
          className="inline-flex items-center gap-1 text-sm font-medium text-body"
        >
          <Icon name="chevronRight" className="size-4 rotate-180" />
          Kembali
        </button>

        <button
          type="button"
          onClick={() => setIsInfoOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand"
        >
          <Icon name="info" className="size-4" />
          Info Form
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm text-muted-foreground">
          Kategori: <span className="font-medium text-strong">{category.name}</span>
        </p>
        <Button size="sm" icon="plus" onClick={addCard}>
          Tambah Produk
        </Button>
      </div>

      <div className="mb-24 space-y-3">
        {cards.map((card, index) => {
          const product = productById.get(card.productId) ?? null;
          const overMax = isOverMaxQuantity(card.quantity, product?.maxQty);

          return (
            <Card key={index} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Produk {cards.length - index}
                </span>
                {cards.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    aria-label="Hapus kartu"
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Nama Produk
                </Label>
                <button
                  type="button"
                  onClick={() => setPickerIndex(index)}
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-transparent px-3 py-2 text-left text-sm transition-colors hover:border-brand"
                >
                  <span className={product ? 'text-strong' : 'text-muted-foreground'}>
                    {product ? product.name : 'Pilih produk'}
                  </span>
                  <Icon name="search" className="size-4 shrink-0 text-muted-foreground" />
                </button>
                {product ? (
                  <p className="text-xs text-muted-foreground">
                    {product.brandName} · stok outlet {formatDecimal(product.stockOnHand)}{' '}
                    {product.uom}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Jumlah
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={card.quantity}
                    placeholder="0"
                    disabled={!product}
                    aria-invalid={overMax}
                    onChange={(event) => changeQuantity(index, event.target.value)}
                    className="pr-16 tabular-nums"
                  />
                  {product ? (
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                      {product.uom}
                    </span>
                  ) : null}
                </div>
                {product ? (
                  <p className={`text-xs ${overMax ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {overMax
                      ? 'Hasil hitung melebihi batas maks'
                      : `Batas maks ${formatDecimal(product.maxQty)} ${product.uom}`}
                  </p>
                ) : null}
              </div>

              {category.requiresExpiryDate ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Tanggal Kadaluarsa
                  </Label>
                  <Input
                    type="date"
                    value={card.expiryDate}
                    onChange={(event) => patchCard(index, { expiryDate: event.target.value })}
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Foto
                </Label>
                <Button
                  variant="outline"
                  icon="image"
                  className="w-full justify-center"
                  disabled={!product || !card.quantity || overMax}
                  onClick={() => setPhotoIndex(index)}
                >
                  {card.photos.length ? `${card.photos.length} foto terunggah` : 'Unggah foto'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t bg-card px-4 py-3">
        <Button className="w-full justify-center" disabled={!isComplete} onClick={save}>
          Simpan
        </Button>
      </div>

      <ProductPicker
        isOpen={pickerIndex !== null}
        products={
          pickerIndex === null ? [] : availableProducts(category.products, cards, pickerIndex)
        }
        onPick={(productId) => chooseProduct(pickerIndex, productId)}
        onClose={() => setPickerIndex(null)}
      />

      <PhotoModal
        isOpen={photoIndex !== null}
        photos={photoIndex === null ? [] : cards[photoIndex].photos}
        onChange={(photos) => patchCard(photoIndex, { photos })}
        onClose={() => setPhotoIndex(null)}
      />

      <Modal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title="Info Form"
        width="max-w-sm"
      >
        <dl className="space-y-3">
          {[
            ['Outlet', draft.outletName],
            ['Outlet Crew', draft.crewName],
            ['Kategori', category.name],
            ['Mulai', `${formatDate(draft.startedAt)} ${formatTime(draft.startedAt)}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm text-strong">{value}</dd>
            </div>
          ))}
        </dl>
      </Modal>

      <ConfirmDialog
        isOpen={isLeaving}
        title="Tinggalkan Halaman Ini?"
        description="Perubahan yang belum disimpan akan dihapus. Yakin lanjutkan?"
        confirmLabel="Lanjutkan"
        onConfirm={leave}
        onCancel={() => setIsLeaving(false)}
      />
    </MobileShell>
  );
}

function ProductPicker({ isOpen, products, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const results = searchProducts(products, query);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Pilih Produk" width="max-w-sm">
      <SearchBox value={query} onChange={setQuery} placeholder="Cari nama produk" />

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {results.length ? (
          results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setQuery('');
                onPick(product.id);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-strong">{product.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {product.brandName} · {product.uom}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatDecimal(product.stockOnHand)}
              </span>
            </button>
          ))
        ) : (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            Produk tidak dapat ditemukan
          </p>
        )}
      </div>
    </Modal>
  );
}

function PhotoModal({ isOpen, photos, onChange, onClose }) {
  const { showToast } = useToast();
  const [isReading, setIsReading] = useState(false);

  const onPick = async (event) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      showToast(`Maksimal ${MAX_PHOTOS} foto per produk`, 'error');
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
      title="Foto Bukti"
      description={`Maksimal ${MAX_PHOTOS} foto. Foto dikecilkan di peramban sebelum dikirim.`}
      width="max-w-sm"
      footer={<Button onClick={onClose}>Selesai</Button>}
    >
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
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

        {photos.length < MAX_PHOTOS ? (
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
          Setiap produk waste wajib punya minimal satu foto bukti.
        </p>
      ) : null}
    </Modal>
  );
}
