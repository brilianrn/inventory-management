'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Can, usePermission } from '@/packages/access/presentation';
import { getUseCases } from '@/shared/config/di';
import { downloadCsv } from '@/shared/lib/export-file';
import { BackLink, NotificationBanner } from '@/shared/ui/display';
import { formatDateTime, formatNumber } from '@/shared/ui/format';
import Icon from '@/shared/ui/icon';
import { SearchBox } from '@/shared/ui/inputs';
import { ConfirmDialog, Modal, useToast } from '@/shared/ui/overlays';
import { Button, Card, MoreMenu, MoreMenuItem, PageHeader } from '@/shared/ui/page-scaffold';
import { useAsyncData } from '@/shared/ui/use-async-data';

const filterGroups = (groups, query) => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return groups;

  return groups
    .map((group) => ({
      ...group,
      products: group.products.filter((product) =>
        `${product.code} ${product.name}`.toLowerCase().includes(keyword),
      ),
    }))
    .filter((group) => group.products.length > 0);
};

function ProductTree({ groups, isGroupOpen, onToggleGroup, selectable, selected, onToggleProduct }) {
  if (!groups.length) {
    return <p className="px-3 py-10 text-center text-sm text-muted-foreground">Tidak ada produk yang cocok.</p>;
  }

  return (
    <ul className="divide-y">
      {groups.map((group) => {
        const isOpen = isGroupOpen(group.categoryId);
        return (
          <li key={group.categoryId}>
            <button
              type="button"
              onClick={() => onToggleGroup(group.categoryId)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted"
            >
              <Icon
                name="chevronRight"
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
              <span className="flex-1 text-sm font-medium text-strong">{group.categoryName}</span>
              <span className="text-xs text-muted-foreground">{group.products.length} produk</span>
            </button>

            {isOpen ? (
              <ul className="border-t bg-muted/30">
                {group.products.map((product) => (
                  <li key={product.id}>
                    <Label className="flex items-start gap-2.5 px-3 py-2 pl-9 font-normal transition-colors hover:bg-muted">
                      {selectable ? (
                        <Checkbox
                          checked={selected.includes(product.id)}
                          onCheckedChange={() => onToggleProduct(product.id)}
                          className="mt-0.5"
                        />
                      ) : null}
                      <span className="min-w-0 text-sm text-body">
                        <span className="font-mono text-xs text-muted-foreground">[{product.code}]</span>{' '}
                        {product.name}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function WasteCategoryDetailPage() {
  const { id } = useParams();
  const { profile } = usePermission();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [banner, setBanner] = useState(null);

  const loadDetail = useCallback(async () => {
    const { data } = await getUseCases().catalog.getWasteCategoryDetail(id);
    return data ?? null;
  }, [id]);

  const { data: detail, isLoading, reload } = useAsyncData(loadDetail);

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const groups = useMemo(() => filterGroups(detail?.groups ?? [], query), [detail, query]);

  const isSearching = query.trim().length > 0;
  const isGroupOpen = (categoryId) => isSearching || expandedIds.includes(categoryId);

  const toggleGroup = (categoryId) =>
    setExpandedIds((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );

  const onExport = () => {
    downloadCsv({
      filename: `waste_category_${id}_products.csv`,
      headers: ['Kategori Produk', 'Kode', 'Nama Produk', 'UoM'],
      rows: (detail?.groups ?? []).flatMap((group) =>
        group.products.map((product) => [group.categoryName, product.code, product.name, product.uom]),
      ),
    });
    showToast('Berhasil Export Data');
  };

  const onRemove = async () => {
    setIsProcessing(true);
    const result = await getUseCases().catalog.removeProductsFromWasteCategory({
      categoryId: id,
      productIds: selected,
      actor: profile?.name,
    });
    setIsProcessing(false);
    setIsConfirmingRemove(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }

    setSelected([]);
    setIsSelecting(false);
    reload();
    setBanner(result.message);
  };

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-muted-foreground">Kategori tidak ditemukan.</p>
      </Card>
    );
  }

  const isEmpty = detail.totalProducts === 0;

  return (
    <>
      <BackLink href="/swconfiguration">Kembali ke Stock Waste App</BackLink>

      <PageHeader
        title={detail.name}
        description={`${formatNumber(detail.totalProducts)} produk terdaftar · terakhir diedit ${formatDateTime(detail.updatedAt)} oleh ${detail.updatedBy ?? '-'}`}
        actions={
          isSelecting ? (
            <Can permission="wasteapp.productRemove">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSelecting(false);
                  setSelected([]);
                }}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => setIsConfirmingRemove(true)}
                disabled={!selected.length}
              >
                Hapus ({selected.length})
              </Button>
            </Can>
          ) : (
            <>
              <Can permission="wasteapp.productAdd">
                <Button icon="plus" onClick={() => setIsAddOpen(true)}>
                  Tambah Produk
                </Button>
              </Can>
              <MoreMenu>
                <Can permission="wasteapp.productRemove" key="remove">
                  <MoreMenuItem onClick={() => setIsSelecting(true)}>Hapus Produk</MoreMenuItem>
                </Can>
                <Can permission="wasteapp.export" key="export">
                  <MoreMenuItem onClick={onExport}>Export</MoreMenuItem>
                </Can>
              </MoreMenu>
            </>
          )
        }
      />

      {banner ? <NotificationBanner message={banner} onDismiss={() => setBanner(null)} /> : null}

      <Card>
        {isEmpty ? (
          <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-14 text-center">
            <p className="text-sm font-semibold text-strong">Belum Ada Produk</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              Kategori ini belum punya produk apa pun. Tambahkan produk supaya bisa dipilih outlet
              crew saat mencatat waste.
            </p>
            <Can permission="wasteapp.productAdd">
              <div className="mt-5 flex justify-center">
                <Button icon="plus" onClick={() => setIsAddOpen(true)}>
                  Tambah Produk
                </Button>
              </div>
            </Can>
          </div>
        ) : (
          <>
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Cari kode atau nama produk"
              className="mb-4 w-full sm:w-80"
            />
            <div className="max-h-[32rem] overflow-y-auto rounded-xl border">
              <ProductTree
                groups={groups}
                isGroupOpen={isGroupOpen}
                onToggleGroup={toggleGroup}
                selectable={isSelecting}
                selected={selected}
                onToggleProduct={(productId) =>
                  setSelected((current) =>
                    current.includes(productId)
                      ? current.filter((item) => item !== productId)
                      : [...current, productId],
                  )
                }
              />
            </div>
          </>
        )}
      </Card>

      {isAddOpen ? (
        <AddProductModal
          categoryId={id}
          actor={profile?.name}
          onClose={() => setIsAddOpen(false)}
          onSaved={async (message) => {
            setIsAddOpen(false);
            reload();
            setBanner(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmingRemove}
        title="Hapus Produk dari Kategori?"
        description="Produk terpilih akan terhapus dari kategori ini dan tidak lagi muncul saat outlet crew input waste."
        confirmLabel="Hapus"
        isProcessing={isProcessing}
        onConfirm={onRemove}
        onCancel={() => setIsConfirmingRemove(false)}
      />
    </>
  );
}

function AddProductModal({ categoryId, actor, onClose, onSaved }) {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);
  const [selected, setSelected] = useState([]);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const [isConfirmingExit, setIsConfirmingExit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    getUseCases()
      .catalog.listAssignableProducts(categoryId)
      .then(({ data }) => setGroups(data ?? []));
  }, [categoryId]);

  const visibleGroups = useMemo(() => filterGroups(groups, query), [groups, query]);

  const isSearching = query.trim().length > 0;
  const isGroupOpen = (categoryId) => isSearching || expandedIds.includes(categoryId);

  const requestClose = () => {
    if (selected.length) {
      setIsConfirmingExit(true);
      return;
    }
    onClose();
  };

  const onSubmit = async () => {
    setIsProcessing(true);
    const result = await getUseCases().catalog.addProductsToWasteCategory({
      categoryId,
      productIds: selected,
      actor,
    });
    setIsProcessing(false);
    setIsConfirmingSave(false);

    if (result.error) {
      showToast(result.message, 'error');
      return;
    }
    onSaved(result.message);
  };

  return (
    <>
      <Modal
        isOpen
        onClose={requestClose}
        title={`Tambah Produk (${selected.length} dipilih)`}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Batal
            </Button>
            <Button onClick={() => setIsConfirmingSave(true)} disabled={!selected.length}>
              Simpan
            </Button>
          </>
        }
      >
        <SearchBox value={query} onChange={setQuery} placeholder="Cari kode atau nama produk" />
        <div className="mt-3 max-h-[24rem] overflow-y-auto rounded-xl border border-line">
          <ProductTree
            groups={visibleGroups}
            isGroupOpen={isGroupOpen}
            onToggleGroup={(categoryId_) =>
              setExpandedIds((current) =>
                current.includes(categoryId_)
                  ? current.filter((item) => item !== categoryId_)
                  : [...current, categoryId_],
              )
            }
            selectable
            selected={selected}
            onToggleProduct={(productId) =>
              setSelected((current) =>
                current.includes(productId)
                  ? current.filter((item) => item !== productId)
                  : [...current, productId],
              )
            }
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmingSave}
        title="Simpan Perubahan"
        description="Produk terpilih akan ditambahkan ke kategori ini dan muncul saat outlet crew input waste."
        confirmLabel="Simpan"
        isProcessing={isProcessing}
        onConfirm={onSubmit}
        onCancel={() => setIsConfirmingSave(false)}
      />

      <ConfirmDialog
        isOpen={isConfirmingExit}
        title="Hapus Perubahan"
        description="Produk yang sudah dipilih tidak akan tersimpan jika meninggalkan halaman ini."
        confirmLabel="Tetap Pilih Produk"
        cancelLabel="Hapus Perubahan"
        onConfirm={() => setIsConfirmingExit(false)}
        onCancel={() => {
          setIsConfirmingExit(false);
          setSelected([]);
          onClose();
        }}
      />
    </>
  );
}
