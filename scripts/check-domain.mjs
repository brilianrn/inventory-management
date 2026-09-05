import assert from 'node:assert/strict';

import {
  ALL_PERMISSION_CODES,
  PERMISSION_BY_CODE,
  PERMISSIONS,
  RESTRICTED_CUTOFF_HOUR,
  buildPermissionTree,
} from '../src/packages/access/domain/permission.catalog.js';
import {
  canAccessRoute,
  canActNow,
  createAccessProfile,
  filterMenuByAccess,
  filterModulesByAccess,
  hasAnyPermission,
  hasPermission,
  isRestricted,
  resolveModuleEntry,
} from '../src/packages/access/domain/permission.rules.js';
import {
  MODULES,
  STOCK_MANAGEMENT_MENU,
  resolvePageTitle,
  resolveRoutePermission,
} from '../src/packages/access/domain/navigation.js';
import { PERSONAS, getPersona } from '../src/packages/access/domain/persona.js';
import {
  VARIANCE_TOLERANCE,
  calculateVariance,
  enrichStockTakeLine,
  isVarianceOutOfTolerance,
  resolveAllowValidate,
  selectBulkValidatable,
} from '../src/packages/documents/domain/stocktake.rules.js';
import {
  displayedWasteCategoryName,
  isReturnCategory,
  shouldShowExpiryColumn,
  buildWasteReference,
} from '../src/packages/documents/domain/waste.rules.js';
import {
  RETURN_CONFIGURATIONS,
  availableBrandsForConfig,
  isMaxQtyChanged,
  isReturnConfigChanged,
  parseMaxQty,
  resolveLastEdited,
} from '../src/packages/catalog/domain/configuration.rules.js';
import {
  buildSubmissionCounts,
  countProgress,
  filterSheetProducts,
  isCountInputAccepted,
  normalizeCount,
  remainingMs,
  resolveBrandStatus,
  sheetProgress,
} from '../src/packages/documents/domain/counting.rules.js';
import { createDraft, isDraftStale, takeFreshDraft, withCount } from '../src/packages/documents/domain/draft.rules.js';
import {
  REMINDER_HOURS,
  WEEK_DAYS,
  findScheduleConflict,
  isScheduleDraftDirty,
  isStartDateAllowed,
  sortWeekDays,
  validateScheduleDraft,
} from '../src/packages/catalog/domain/schedule.rules.js';
import { capitalizeName, validateCrewDraft } from '../src/packages/catalog/domain/crew-account.rules.js';
import { applyListFilter, optionsFromRows } from '../src/shared/lib/list-filter.js';
import {
  filterUsers,
  hasGrantChanged,
  isNewUserValid,
  toggleGrantPermission,
  validateNewUser,
  validateUserInfo,
} from '../src/packages/access/domain/user-account.rules.js';
import { BRANDS, OUTLETS, PRODUCTS, SUPPLIERS } from '../src/seed/master.js';
import { USERS } from '../src/seed/users.js';
import { buildDocumentHistory, buildStockTakeLines, buildWasteLines } from '../src/seed/documents.js';
import {
  buildStockLevels,
  increaseStock,
  readStock,
  reduceStock,
  stockKey,
} from '../src/seed/stock.js';
import {
  canViewPhotos,
  defaultReceiptNote,
  isExportAllowed,
  isPastDailyCutoff,
  isValidatable,
  msUntilDailyCutoff,
  resendableDrafts,
  validateCancelNote,
  validateReceipt,
  visibleToCrew,
} from '../src/packages/documents/domain/receiving.rules.js';
import {
  availableProducts,
  buildWasteSubmission,
  cardsComplete,
  categoryFilledCount,
  clampQuantityInput,
  emptyCard,
  isCardComplete,
  isOverMaxQuantity,
  isQuantityInputAccepted,
  isWithinWasteWindow,
  MAX_PHOTOS,
  MAX_QUANTITY_INPUT,
  normalizeQuantity,
  resolveWasteWindow,
  searchProducts,
  totalFilledCount,
} from '../src/packages/documents/domain/waste-input.rules.js';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const at = (hour) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date;
};

test('kode izin unik dan tiap izin punya tiga sifat wajib', () => {
  assert.equal(new Set(ALL_PERMISSION_CODES).size, ALL_PERMISSION_CODES.length);

  for (const permission of PERMISSIONS) {
    assert.ok(permission.label, `izin ${permission.code} tidak punya nama tampilan`);
    assert.ok(permission.group, `izin ${permission.code} tidak punya kelompok modul`);
    assert.equal(typeof permission.isMobile, 'boolean', `izin ${permission.code} tanpa penanda mobile`);
  }
});

test('hanya izin validasi stock take yang punya atribut tambahan', () => {
  const restrictable = PERMISSIONS.filter((permission) => permission.restrictable).map((p) => p.code);
  assert.deepEqual(restrictable, ['stocktake.validate']);
});

test('pohon izin memisahkan tab mobile dari tab portal', () => {
  const [stockManagement, mobileApp] = buildPermissionTree();
  const mobileCodes = mobileApp.sections.flatMap((s) => s.groups.flatMap((g) => g.permissions));
  const portalCodes = stockManagement.sections.flatMap((s) => s.groups.flatMap((g) => g.permissions));

  assert.ok(mobileCodes.length > 0);
  assert.ok(mobileCodes.every((permission) => permission.isMobile));
  assert.ok(portalCodes.every((permission) => !permission.isMobile));
  assert.equal(mobileCodes.length + portalCodes.length, PERMISSIONS.length);
});

test('izin yang tidak dimiliki selalu ditolak', () => {
  const access = createAccessProfile(['stocktake.view'], {});
  assert.equal(hasPermission(access, 'stocktake.view'), true);
  assert.equal(hasPermission(access, 'stocktake.edit'), false);
  assert.equal(hasAnyPermission(access, ['stocktake.edit', 'stocktake.view']), true);
  assert.equal(hasAnyPermission(access, ['stocktake.edit', 'receiving.view']), false);
});

test('route tanpa izin bebas diakses, route berizin mengikuti daftar izin', () => {
  const access = createAccessProfile(['stocktake.view'], {});
  assert.equal(canAccessRoute(access, null), true);
  assert.equal(canAccessRoute(access, 'stocktake.view'), true);
  assert.equal(canAccessRoute(access, 'returnwaste.view'), false);
});

test('peta route memakai kecocokan awalan terpanjang', () => {
  assert.equal(resolveRoutePermission('/stocktake'), 'stocktake.view');
  assert.equal(resolveRoutePermission('/stocktake/STK001'), 'stocktake.view');
  assert.equal(resolveRoutePermission('/stockwaste'), 'stockwaste.view');
  assert.equal(resolveRoutePermission('/ops/stocktake/control'), 'scheduler.view');
  assert.equal(resolveRoutePermission('/dashboard'), null);
  assert.equal(resolvePageTitle('/ops/receiving/desk'), 'Daftar Delivery Order');
});

test('menu induk yang seluruh anaknya tersaring habis ikut dibuang', () => {
  const onlyDashboard = createAccessProfile([], {});
  const filtered = filterMenuByAccess(STOCK_MANAGEMENT_MENU, onlyDashboard);
  assert.deepEqual(
    filtered.map((item) => item.id),
    ['dashboard'],
  );

  const withOneChild = createAccessProfile(['stocktake.view'], {});
  const partial = filterMenuByAccess(STOCK_MANAGEMENT_MENU, withOneChild);
  const adminPortal = partial.find((item) => item.id === 'admin-portal');
  assert.ok(adminPortal, 'menu induk harus muncul saat salah satu anaknya lolos');
  assert.deepEqual(
    adminPortal.children.map((child) => child.id),
    ['stocktake'],
  );
  assert.equal(
    partial.find((item) => item.id === 'configuration'),
    undefined,
    'menu Configuration harus hilang karena seluruh anaknya tersaring',
  );
});

test('modul di panel admin disaring dengan aturan minimal satu izin', () => {
  const crew = createAccessProfile(['mobile.stockwaste.input'], {});
  const visible = filterModulesByAccess(MODULES, crew).map((module) => module.id);
  assert.deepEqual(visible, ['stockwaste-ops']);
});

test('atribut Restricted hanya berlaku pada izin yang menandainya', () => {
  const access = createAccessProfile(['stocktake.validate', 'stocktake.edit'], {
    'stocktake.validate': { restricted: true },
    'stocktake.edit': { restricted: true },
  });

  assert.equal(isRestricted(access, 'stocktake.validate'), true);
  assert.equal(
    isRestricted(access, 'stocktake.edit'),
    false,
    'izin tanpa penanda restrictable harus mengabaikan atribut Restricted',
  );
});

test('mode Restricted menutup aksi setelah jam batas, Not Restricted tidak', () => {
  const restrictedAccess = createAccessProfile(['stocktake.validate'], {
    'stocktake.validate': { restricted: true },
  });
  const openAccess = createAccessProfile(['stocktake.validate'], {
    'stocktake.validate': { restricted: false },
  });

  const beforeCutoff = at(RESTRICTED_CUTOFF_HOUR - 1);
  const afterCutoff = at(RESTRICTED_CUTOFF_HOUR + 2);

  assert.equal(canActNow({ access: restrictedAccess, code: 'stocktake.validate', now: beforeCutoff }), true);
  assert.equal(canActNow({ access: restrictedAccess, code: 'stocktake.validate', now: afterCutoff }), false);
  assert.equal(canActNow({ access: openAccess, code: 'stocktake.validate', now: afterCutoff }), true);
});

test('tepat pada jam batas sudah dianggap lewat', () => {
  const access = createAccessProfile(['stocktake.validate'], {
    'stocktake.validate': { restricted: true },
  });
  assert.equal(canActNow({ access, code: 'stocktake.validate', now: at(RESTRICTED_CUTOFF_HOUR) }), false);
});

test('lima persona tersedia dengan kombinasi izin yang berbeda', () => {
  assert.equal(PERSONAS.length, 5);

  const signatures = PERSONAS.map((persona) => [...persona.permissions].sort().join('|'));
  assert.equal(new Set(signatures).size, 5, 'setiap persona harus punya kombinasi izin yang unik');

  assert.equal(getPersona('admin-penuh').permissions.length, ALL_PERMISSION_CODES.length);
  assert.equal(getPersona('validator-restricted').attributes['stocktake.validate'].restricted, true);
  assert.ok(getPersona('viewer').permissions.every((code) => code.endsWith('.view')));
  assert.ok(getPersona('outlet-crew').permissions.every((code) => PERMISSION_BY_CODE[code].isMobile));
  assert.equal(getPersona('tidak-ada').id, 'admin-penuh', 'persona tak dikenal jatuh ke bawaan');
});

test('persona Viewer Saja kehilangan seluruh tombol aksi', () => {
  const viewer = createAccessProfile(getPersona('viewer').permissions, {});
  const actionCodes = ALL_PERMISSION_CODES.filter((code) => !code.endsWith('.view'));
  assert.ok(actionCodes.every((code) => !hasPermission(viewer, code)));
});

test('selisih dan persentasenya dihitung dari stok sistem', () => {
  assert.deepEqual(calculateVariance({ stockOnHand: 100, counted: 105 }), {
    variance: 5,
    variancePercent: 0.05,
  });
  assert.deepEqual(calculateVariance({ stockOnHand: 80, counted: 60 }), {
    variance: -20,
    variancePercent: -0.25,
  });
});

test('stok sistem nol tidak menghasilkan pembagian nol', () => {
  const { variancePercent } = calculateVariance({ stockOnHand: 0, counted: 7 });
  assert.equal(variancePercent, 0);
  assert.ok(Number.isFinite(variancePercent));
});

test('penandaan selisih mengikuti ambang lima persen dan kasus stok nol', () => {
  const within = enrichStockTakeLine({ stockOnHand: 100, counted: 104, cost: 1000 });
  const above = enrichStockTakeLine({ stockOnHand: 100, counted: 106, cost: 1000 });
  const below = enrichStockTakeLine({ stockOnHand: 100, counted: 94, cost: 1000 });
  const zeroSoh = enrichStockTakeLine({ stockOnHand: 0, counted: 3, cost: 1000 });
  const zeroBoth = enrichStockTakeLine({ stockOnHand: 0, counted: 0, cost: 1000 });

  assert.equal(within.outOfTolerance, false);
  assert.equal(above.outOfTolerance, true);
  assert.equal(below.outOfTolerance, true);
  assert.equal(zeroSoh.outOfTolerance, true, 'stok sistem nol tapi terhitung isi harus ditandai');
  assert.equal(zeroBoth.outOfTolerance, false);

  assert.equal(
    isVarianceOutOfTolerance({ stockOnHand: 100, counted: 105, variancePercent: VARIANCE_TOLERANCE }),
    false,
    'tepat di ambang belum dianggap keluar toleransi',
  );
});

test('penanda boleh validasi menutup dokumen yang sudah tervalidasi', () => {
  const validated = { status: 'validated' };
  const unvalidated = { status: 'unvalidated' };

  assert.equal(resolveAllowValidate({ document: validated, restricted: false, now: at(9) }), false);
  assert.equal(resolveAllowValidate({ document: unvalidated, restricted: false, now: at(9) }), true);
  assert.equal(resolveAllowValidate({ document: unvalidated, restricted: true, now: at(9) }), true);
  assert.equal(resolveAllowValidate({ document: unvalidated, restricted: true, now: at(15) }), false);
});

test('validasi massal hanya melayani dokumen belum validasi bertanggal hari ini atau setelahnya', () => {
  const now = new Date(2025, 8, 10, 9, 0);
  const day = (offset) => new Date(2025, 8, 10 + offset).toISOString();

  const selected = selectBulkValidatable({
    documents: [
      { id: 'A', status: 'unvalidated', date: day(0) },
      { id: 'B', status: 'unvalidated', date: day(-1) },
      { id: 'C', status: 'validated', date: day(0) },
      { id: 'D', status: 'unvalidated', date: day(1) },
      { id: 'E', status: 'processed', date: day(0) },
    ],
    now,
  });

  assert.deepEqual(
    selected.map((document) => document.id),
    ['A', 'D'],
  );
});

test('jumlah data master sesuai target demo', () => {
  assert.equal(BRANDS.length, 6);
  assert.equal(OUTLETS.length, 12);
  assert.equal(SUPPLIERS.length, 5);
  assert.equal(PRODUCTS.length, 120);
  assert.equal(USERS.length, 8);
});

test('produk punya kategori, satuan, dan kode yang unik', () => {
  assert.equal(new Set(PRODUCTS.map((product) => product.id)).size, 120);
  assert.equal(new Set(PRODUCTS.map((product) => product.code)).size, 120);
  assert.ok(PRODUCTS.every((product) => product.categoryName && product.uom && product.brandName));
});

test('delapan pengguna punya kombinasi izin yang berbeda-beda', () => {
  const signatures = USERS.map((user) => [...user.permissions].sort().join('|'));
  assert.equal(new Set(signatures).size, 8);
  assert.ok(USERS.every((user) => user.permissions.every((code) => PERMISSION_BY_CODE[code])));
});

test('riwayat dokumen mencakup 60 hari dan seluruh jenis dokumen', () => {
  const history = buildDocumentHistory();
  const { stockTakeDocuments, wasteDocuments, returnWasteDocuments, deliveryOrders } = history;

  assert.ok(stockTakeDocuments.length > 0);
  assert.ok(wasteDocuments.length > 0);
  assert.ok(returnWasteDocuments.length > 0);
  assert.ok(deliveryOrders.length > 0);

  const anchor = new Date(history.anchorDate);
  const oldest = new Date(Math.min(...deliveryOrders.map((order) => new Date(order.shippingDate))));
  const spanDays = Math.round((anchor - oldest) / 86400000);
  assert.ok(spanDays >= 55 && spanDays <= 60, `rentang riwayat di luar dugaan: ${spanDays} hari`);
});

test('status dokumen tersebar, bukan satu nilai saja', () => {
  const { stockTakeDocuments, deliveryOrders } = buildDocumentHistory();

  const stockTakeStatuses = new Set(stockTakeDocuments.map((document) => document.status));
  const orderStatuses = new Set(deliveryOrders.map((order) => order.status));

  assert.ok(stockTakeStatuses.has('unvalidated'));
  assert.ok(stockTakeStatuses.has('validated'));
  assert.ok(stockTakeStatuses.size >= 3, 'status stock take terlalu seragam');
  assert.ok(orderStatuses.size >= 4, 'status delivery order terlalu seragam');
});

test('seed deterministik: dua kali bangun menghasilkan hasil identik', () => {
  const first = buildDocumentHistory();
  const second = buildDocumentHistory();
  assert.deepEqual(
    first.stockTakeDocuments.map((document) => document.id),
    second.stockTakeDocuments.map((document) => document.id),
  );
});

test('nama kategori teknis diganti label back office, sisanya apa adanya', () => {
  assert.equal(displayedWasteCategoryName('Produk Sisa Persiapan'), 'Sisa Preparation');
  assert.equal(displayedWasteCategoryName('produk central kitchen'), 'Waste CK Handling');
  assert.equal(displayedWasteCategoryName('Produk Kadaluarsa'), 'Produk Kadaluarsa');
  assert.equal(displayedWasteCategoryName(''), '');
});

test('kategori return dikenali terpisah dari kategori pembuangan', () => {
  assert.equal(isReturnCategory('Return to Brand Partner'), true);
  assert.equal(isReturnCategory('return to hub pusat'), true);
  assert.equal(isReturnCategory('Produk Kadaluarsa'), false);
});

test('kolom tanggal kadaluarsa hanya muncul bila ada baris yang punya tanggal', () => {
  assert.equal(shouldShowExpiryColumn([{ expiryDate: null }, { expiryDate: null }]), false);
  assert.equal(shouldShowExpiryColumn([{ expiryDate: null }, { expiryDate: '2025-09-01' }]), true);
  assert.equal(shouldShowExpiryColumn([]), false);
});

test('nomor referensi dirakit dari kategori, outlet, dan waktu pembuatan', () => {
  const reference = buildWasteReference({
    segment: 'Produk Kadaluarsa',
    outletName: 'Dapur Menteng (SO01)',
    createdAt: '2025-09-01T10:00:00.000Z',
    formatDateTime: () => ' - 01/09/2025 17:00',
  });
  assert.equal(reference, 'Inventory/Waste/Produk Kadaluarsa/Dapur Menteng (SO01) - 01/09/2025 17:00');
  assert.equal(buildWasteReference({ segment: null, outletName: 'X', createdAt: 'Y', formatDateTime: () => '' }), '-');
});

test('kolom terakhir diedit jatuh ke data pembuatan bila pengubahnya proses sistem', () => {
  const bySystem = resolveLastEdited({
    createdBy: 'Renata Wijoyo',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedBy: 'SYSTEM',
    updatedAt: '2025-08-01T00:00:00.000Z',
  });
  assert.equal(bySystem.by, 'Renata Wijoyo');
  assert.equal(bySystem.at, '2025-06-01T00:00:00.000Z');

  const byHuman = resolveLastEdited({
    createdBy: 'Renata Wijoyo',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedBy: 'Laras Nuraini',
    updatedAt: '2025-08-01T00:00:00.000Z',
  });
  assert.equal(byHuman.by, 'Laras Nuraini');
  assert.equal(byHuman.at, '2025-08-01T00:00:00.000Z');
});

test('daftar brand pada modal tambah hanya berisi yang belum punya konfigurasi', () => {
  const configs = [{ brandId: BRANDS[0].id }, { brandId: BRANDS[2].id }];
  const available = availableBrandsForConfig(BRANDS, configs).map((brand) => brand.id);
  assert.equal(available.includes(BRANDS[0].id), false);
  assert.equal(available.includes(BRANDS[2].id), false);
  assert.equal(available.length, BRANDS.length - 2);
});

test('tombol simpan konfigurasi hanya aktif bila ada yang benar-benar berubah', () => {
  const current = { configuration: RETURN_CONFIGURATIONS[0], status: 'active' };
  assert.equal(isReturnConfigChanged(current, { ...current }), false);
  assert.equal(isReturnConfigChanged(current, { ...current, status: 'inactive' }), true);
  assert.equal(isReturnConfigChanged(current, { ...current, configuration: RETURN_CONFIGURATIONS[1] }), true);
  assert.equal(isReturnConfigChanged(null, current), false);
});

test('batas kuantitas hanya menerima bilangan bulat tidak negatif', () => {
  assert.equal(parseMaxQty('120'), 120);
  assert.equal(parseMaxQty('0'), 0);
  assert.equal(parseMaxQty(''), null);
  assert.equal(parseMaxQty('12.5'), null);
  assert.equal(parseMaxQty('-3'), null);
  assert.equal(parseMaxQty('abc'), null);

  assert.equal(isMaxQtyChanged(120, '120'), false);
  assert.equal(isMaxQtyChanged(120, '150'), true);
  assert.equal(isMaxQtyChanged(120, '-1'), false, 'nilai tidak sah tidak dianggap perubahan');
});

test('penyaringan menggabungkan rentang tanggal, pilihan, dan pencarian bebas', () => {
  const rows = [
    { id: 'A', date: '2025-09-01T03:00:00.000Z', outlet: 'Dapur Menteng', status: 'validated' },
    { id: 'B', date: '2025-09-05T03:00:00.000Z', outlet: 'Dapur Tebet', status: 'unvalidated' },
    { id: 'C', date: '2025-09-10T03:00:00.000Z', outlet: 'Dapur Menteng', status: 'unvalidated' },
  ];
  const config = {
    dateOf: (row) => row.date,
    selectors: { outlet: (row) => row.outlet, status: (row) => row.status },
    searchable: (row) => [row.outlet, row.status],
  };

  assert.deepEqual(applyListFilter(rows, {}, config).map((row) => row.id), ['A', 'B', 'C']);

  assert.deepEqual(
    applyListFilter(rows, { dateFrom: '2025-09-05', dateTo: '2025-09-10' }, config).map((row) => row.id),
    ['B', 'C'],
    'batas rentang bersifat inklusif di kedua ujung',
  );

  assert.deepEqual(
    applyListFilter(rows, { selections: { outlet: ['Dapur Menteng'] } }, config).map((row) => row.id),
    ['A', 'C'],
  );

  assert.deepEqual(
    applyListFilter(
      rows,
      { selections: { outlet: ['Dapur Menteng'], status: ['unvalidated'] } },
      config,
    ).map((row) => row.id),
    ['C'],
    'beberapa kolom filter digabung dengan DAN, bukan ATAU',
  );

  assert.deepEqual(
    applyListFilter(rows, { query: 'tebet' }, config).map((row) => row.id),
    ['B'],
    'pencarian bebas tidak membedakan huruf besar-kecil',
  );

  assert.deepEqual(
    applyListFilter(rows, { selections: { outlet: [] } }, config).map((row) => row.id),
    ['A', 'B', 'C'],
    'pilihan kosong berarti tidak menyaring',
  );
});

test('pilihan filter diturunkan dari data yang sedang tampil dan diurutkan', () => {
  const rows = [{ outlet: 'Dapur Tebet' }, { outlet: 'Dapur Menteng' }, { outlet: 'Dapur Tebet' }];
  assert.deepEqual(
    optionsFromRows(rows, (row) => row.outlet),
    [
      { value: 'Dapur Menteng', label: 'Dapur Menteng' },
      { value: 'Dapur Tebet', label: 'Dapur Tebet' },
    ],
  );
});

const sampleBrands = [
  {
    brandId: 'B1',
    brandName: 'Brand Satu',
    categories: [
      { categoryId: 'C1', categoryName: 'Kategori A', products: [{ id: 'P1' }, { id: 'P2' }] },
      { categoryId: 'C2', categoryName: 'Kategori B', products: [{ id: 'P3' }] },
    ],
  },
  {
    brandId: 'B2',
    brandName: 'Brand Dua',
    categories: [{ categoryId: 'C1', categoryName: 'Kategori A', products: [{ id: 'P4' }] }],
  },
];

test('kotak hasil hitung hanya menerima angka, titik, dan koma', () => {
  assert.equal(isCountInputAccepted(''), true);
  assert.equal(isCountInputAccepted('12'), true);
  assert.equal(isCountInputAccepted('12,5'), true);
  assert.equal(isCountInputAccepted('12.5'), true);
  assert.equal(isCountInputAccepted('0'), true);
  assert.equal(isCountInputAccepted(',5'), false, 'nilai berawalan koma ditolak');
  assert.equal(isCountInputAccepted('12a'), false);
  assert.equal(isCountInputAccepted('-3'), false);
  assert.equal(isCountInputAccepted('1,2,3'), false);
});

test('koma diubah jadi titik saat nilainya dinormalkan', () => {
  assert.equal(normalizeCount('12,5'), 12.5);
  assert.equal(normalizeCount('12.5'), 12.5);
  assert.equal(normalizeCount('0'), 0);
  assert.equal(normalizeCount(''), null);
  assert.equal(normalizeCount(undefined), null);
  assert.equal(normalizeCount('abc'), null);
});

test('nol dihitung sebagai terisi, kosong tidak', () => {
  const progress = countProgress([{ id: 'P1' }, { id: 'P2' }], { P1: '0' });
  assert.deepEqual(progress, { filled: 1, total: 2, isComplete: false });

  const complete = countProgress([{ id: 'P1' }], { P1: '0' });
  assert.equal(complete.isComplete, true);
});

test('status chip brand mengikuti kelengkapan produknya', () => {
  const partial = resolveBrandStatus(sampleBrands[0], { P1: '1' });
  assert.equal(partial.status, 'incomplete');
  assert.deepEqual([partial.filled, partial.total], [1, 3]);

  const full = resolveBrandStatus(sampleBrands[0], { P1: '1', P2: '2', P3: '0' });
  assert.equal(full.status, 'complete');
});

test('kemajuan seluruh lembar menghitung semua brand', () => {
  const progress = sheetProgress(sampleBrands, { P1: '1', P4: '0' });
  assert.deepEqual(progress, { filled: 2, total: 4, isComplete: false });
});

test('produk yang dibiarkan kosong terkirim sebagai nol', () => {
  const payload = buildSubmissionCounts(sampleBrands, { P1: '1,5', P3: '2' });
  assert.deepEqual(payload, [
    { productId: 'P1', counted: 1.5 },
    { productId: 'P2', counted: 0 },
    { productId: 'P3', counted: 2 },
    { productId: 'P4', counted: 0 },
  ]);
});

test('sakelar produk kosong dan pencarian menyaring daftar', () => {
  const categories = [
    {
      categoryId: 'C1',
      categoryName: 'Kategori A',
      products: [
        { id: 'P1', code: 'SKU1', name: 'Gula Halus' },
        { id: 'P2', code: 'SKU2', name: 'Tepung Serbaguna' },
      ],
    },
  ];

  const onlyEmpty = filterSheetProducts(categories, { counts: { P1: '3' }, onlyEmpty: true });
  assert.deepEqual(onlyEmpty[0].products.map((product) => product.id), ['P2']);

  const searched = filterSheetProducts(categories, { counts: {}, query: 'gula' });
  assert.deepEqual(searched[0].products.map((product) => product.id), ['P1']);

  const noMatch = filterSheetProducts(categories, { counts: {}, query: 'zzz' });
  assert.equal(noMatch.length, 0, 'kategori tanpa hasil ikut dibuang');
});

test('sesi berlaku dua jam dan tidak pernah bernilai negatif', () => {
  const started = new Date('2026-09-05T08:00:00');
  assert.equal(remainingMs(started, new Date('2026-09-05T09:00:00')), 60 * 60 * 1000);
  assert.equal(remainingMs(started, new Date('2026-09-05T10:00:00')), 0);
  assert.equal(remainingMs(started, new Date('2026-09-05T12:00:00')), 0);
});

test('draf dari hari sebelumnya dianggap basi', () => {
  const now = new Date('2026-09-05T09:00:00');
  assert.equal(isDraftStale({ savedAt: '2026-09-05T01:00:00' }, now), false);
  assert.equal(isDraftStale({ savedAt: '2026-09-04T23:59:00' }, now), true);
  assert.equal(isDraftStale(null, now), true);
  assert.equal(isDraftStale({}, now), true);

  assert.equal(takeFreshDraft({ savedAt: '2026-09-04T10:00:00' }, now), null);
  assert.ok(takeFreshDraft({ savedAt: '2026-09-05T10:00:00' }, now));
});

test('menyimpan isian menyegarkan stempel waktu draf', () => {
  const draft = createDraft({
    scheduleId: 'SCH01',
    outletId: 'SO01',
    outletName: 'Dapur Menteng (SO01)',
    crewId: 'CRW01',
    crewName: 'Dwi Anggara',
    startedAt: '2026-09-05T08:00:00.000Z',
    autoSubmit: true,
  });

  assert.deepEqual(draft.counts, {});
  assert.equal(draft.autoSubmit, true);

  const updated = withCount(draft, 'P1', '12,5');
  assert.equal(updated.counts.P1, '12,5');
  assert.equal(updated.scheduleId, 'SCH01');
  assert.ok(new Date(updated.savedAt).getTime() >= new Date(draft.savedAt).getTime());
});

test('pilihan jam pengingat tersedia per 15 menit sepanjang hari', () => {
  assert.equal(REMINDER_HOURS.length, 96);
  assert.equal(REMINDER_HOURS[0], '00:00');
  assert.equal(REMINDER_HOURS[1], '00:15');
  assert.equal(REMINDER_HOURS.at(-1), '23:45');
});

test('tanggal mulai tidak boleh sebelum hari ini', () => {
  const now = new Date('2026-09-05T09:00:00');
  assert.equal(isStartDateAllowed('2026-09-05', now), true, 'hari ini masih boleh');
  assert.equal(isStartDateAllowed('2026-09-06', now), true);
  assert.equal(isStartDateAllowed('2026-09-04', now), false);
  assert.equal(isStartDateAllowed(null, now), false);
});

test('form jadwal menolak field wajib yang kosong', () => {
  const now = new Date('2026-09-05T09:00:00');
  const errors = validateScheduleDraft({ brandIds: [], scheduleDays: [] }, now);

  assert.ok(errors.outletId);
  assert.ok(errors.brandIds);
  assert.ok(errors.startDate);
  assert.ok(errors.scheduleDays);
  assert.ok(errors.reminderHour);

  const valid = validateScheduleDraft(
    {
      outletId: 'SO01',
      brandIds: ['BR01'],
      startDate: '2026-09-06',
      scheduleDays: ['Senin'],
      reminderHour: '08:00',
    },
    now,
  );
  assert.deepEqual(valid, {});
});

test('status wajib diisi hanya saat mode edit', () => {
  const now = new Date('2026-09-05T09:00:00');
  const base = {
    outletId: 'SO01',
    brandIds: ['BR01'],
    startDate: '2026-09-06',
    scheduleDays: ['Senin'],
    reminderHour: '08:00',
  };

  assert.equal(validateScheduleDraft({ ...base, isEditing: false }, now).status, undefined);
  assert.ok(validateScheduleDraft({ ...base, isEditing: true, status: '' }, now).status);
});

test('bentrok jadwal dikenali dari outlet, hari, dan jam yang sama', () => {
  const schedules = [
    { id: 'SCH01', outletId: 'SO01', scheduleDays: ['Senin', 'Rabu'], reminderHour: '08:00' },
    { id: 'SCH02', outletId: 'SO02', scheduleDays: ['Senin'], reminderHour: '08:00' },
  ];

  const clash = findScheduleConflict({
    schedules,
    draft: { outletId: 'SO01', scheduleDays: ['Rabu'], reminderHour: '08:00' },
  });
  assert.equal(clash?.id, 'SCH01');

  const differentHour = findScheduleConflict({
    schedules,
    draft: { outletId: 'SO01', scheduleDays: ['Rabu'], reminderHour: '09:00' },
  });
  assert.equal(differentHour, null);

  const selfEdit = findScheduleConflict({
    schedules,
    draft: { outletId: 'SO01', scheduleDays: ['Rabu'], reminderHour: '08:00' },
    excludeId: 'SCH01',
  });
  assert.equal(selfEdit, null, 'jadwal yang sedang disunting tidak bentrok dengan dirinya sendiri');
});

test('hari diurutkan mengikuti urutan minggu, bukan urutan pilih', () => {
  assert.deepEqual(sortWeekDays(['Jumat', 'Senin', 'Rabu']), ['Senin', 'Rabu', 'Jumat']);
  assert.equal(WEEK_DAYS.length, 7);
});

test('perubahan form terdeteksi walau urutan pilihannya berbeda', () => {
  const original = {
    outletId: 'SO01',
    brandIds: ['BR01', 'BR02'],
    startDate: '2026-09-06',
    scheduleDays: ['Senin', 'Rabu'],
    reminderHour: '08:00',
    status: 'active',
  };

  assert.equal(
    isScheduleDraftDirty({ ...original, brandIds: ['BR02', 'BR01'], scheduleDays: ['Rabu', 'Senin'] }, original),
    false,
    'urutan berbeda dengan isi sama bukan perubahan',
  );
  assert.equal(isScheduleDraftDirty({ ...original, reminderHour: '09:00' }, original), true);
  assert.equal(isScheduleDraftDirty({ ...original, brandIds: ['BR01'] }, original), true);
  assert.equal(isScheduleDraftDirty({ outletId: 'SO01' }, null), true, 'form kosong yang mulai diisi dianggap berubah');
});

test('nama crew ditampilkan dengan huruf awal kapital', () => {
  assert.equal(capitalizeName('dwi anggara'), 'Dwi Anggara');
  assert.equal(capitalizeName('RIAN MAULANA'), 'Rian Maulana');
  assert.equal(capitalizeName(''), '');
});

test('validasi akun crew berbeda antara mode tambah dan edit', () => {
  const tambah = validateCrewDraft({ name: '', email: '', outletId: '' });
  assert.ok(tambah.name);
  assert.ok(tambah.email);
  assert.ok(tambah.outletId);

  assert.ok(validateCrewDraft({ name: 'A', email: 'bukan-email', outletId: 'SO01' }).email);
  assert.ok(
    validateCrewDraft(
      { name: 'A', email: 'ada@stockops.demo', outletId: 'SO01' },
      { existingEmails: ['ada@stockops.demo'] },
    ).email,
    'email yang sudah terdaftar ditolak',
  );

  const edit = validateCrewDraft({ name: '', email: '', outletId: 'SO01' }, { isEditing: true });
  assert.deepEqual(edit, {});
  assert.ok(validateCrewDraft({ name: '', email: '', outletId: '' }, { isEditing: true }).outletId);
});

test('dokumen kiriman crew memakai hasil hitungnya sendiri, bukan angka undian', () => {
  const submittedCounts = [
    { productId: PRODUCTS[0].id, counted: 12.5 },
    { productId: PRODUCTS[1].id, counted: 0 },
  ];
  const lines = buildStockTakeLines({
    id: 'STK05092026SO04',
    brandIds: [PRODUCTS[0].brandId],
    itemCount: submittedCounts.length,
    submittedCounts,
  });

  assert.deepEqual(
    lines.map((line) => [line.productId, line.counted]),
    submittedCounts.map((entry) => [entry.productId, entry.counted]),
  );

  const seeded = buildStockTakeLines({
    id: 'STK05092026SO04',
    brandIds: [PRODUCTS[0].brandId],
    itemCount: 2,
  });
  assert.equal(seeded.length, 2);
});

test('jendela pengisian waste terbuka pukul 13:00 sampai 23:00', () => {
  const at = (hour) => new Date(2026, 8, 5, hour, 30);

  assert.equal(isWithinWasteWindow(at(12)), false, 'pukul 12:30 masih tertutup');
  assert.equal(isWithinWasteWindow(at(13)), true, 'pukul 13:30 terbuka');
  assert.equal(isWithinWasteWindow(at(22)), true, 'pukul 22:30 masih terbuka');
  assert.equal(isWithinWasteWindow(at(23)), false, 'pukul 23:30 sudah tertutup');

  assert.equal(resolveWasteWindow('open', at(3)), true);
  assert.equal(resolveWasteWindow('closed', at(15)), false);
  assert.equal(resolveWasteWindow('auto', at(15)), true);
});

test('kotak jumlah waste menolak huruf dan nilai berawalan nol', () => {
  assert.equal(isQuantityInputAccepted(''), true, 'kosong boleh sebagai keadaan antara');
  assert.equal(isQuantityInputAccepted('12'), true);
  assert.equal(isQuantityInputAccepted('12,5'), true, 'koma diterima sebagai desimal');
  assert.equal(isQuantityInputAccepted('12.5'), true);

  assert.equal(isQuantityInputAccepted('0'), false, 'membuang nol produk bukan pencatatan waste');
  assert.equal(isQuantityInputAccepted('012'), false);
  assert.equal(isQuantityInputAccepted('0,5'), false);
  assert.equal(isQuantityInputAccepted('abc'), false);
  assert.equal(isQuantityInputAccepted('1,2,3'), false);
});

test('jumlah di atas 99.999 dipangkas, bukan ditolak', () => {
  assert.equal(clampQuantityInput('120000'), String(MAX_QUANTITY_INPUT));
  assert.equal(clampQuantityInput('500'), '500', 'nilai di bawah batas dibiarkan apa adanya');
  assert.equal(normalizeQuantity('12,5'), 12.5, 'koma diubah jadi titik sebelum dikirim');
  assert.equal(normalizeQuantity(''), null);
});

test('batas kuantitas per satuan membuat kartu tidak valid', () => {
  assert.equal(isOverMaxQuantity('250', 200), true);
  assert.equal(isOverMaxQuantity('200', 200), false, 'tepat di batas masih boleh');
  assert.equal(isOverMaxQuantity('', 200), false, 'kosong belum dinilai melebihi');

  const card = { productId: 'PRD0001', quantity: '250', photos: ['foto'], expiryDate: '' };
  assert.equal(isCardComplete(card, { maxQty: 200 }), false, 'melebihi batas menggagalkan kartu');
  assert.equal(isCardComplete({ ...card, quantity: '10' }, { maxQty: 200 }), true);
});

test('kartu waste lengkap bila produk, jumlah, foto, dan tanggal wajibnya terisi', () => {
  const base = { productId: 'PRD0001', quantity: '5', photos: ['foto'], expiryDate: '' };

  assert.equal(isCardComplete(base, { maxQty: 100 }), true);
  assert.equal(isCardComplete({ ...base, productId: '' }, { maxQty: 100 }), false);
  assert.equal(isCardComplete({ ...base, quantity: '' }, { maxQty: 100 }), false);
  assert.equal(isCardComplete({ ...base, photos: [] }, { maxQty: 100 }), false, 'foto wajib');

  assert.equal(isCardComplete(base, { maxQty: 100, requiresExpiryDate: true }), false);
  assert.equal(
    isCardComplete({ ...base, expiryDate: '2026-09-30' }, { maxQty: 100, requiresExpiryDate: true }),
    true,
  );

  assert.equal(isCardComplete(emptyCard(), {}), false);
  assert.equal(cardsComplete([], () => ({})), false, 'tanpa kartu belum bisa disimpan');
});

test('produk yang sudah dipakai kartu lain tidak ditawarkan lagi', () => {
  const products = [{ id: 'PRD0001' }, { id: 'PRD0002' }, { id: 'PRD0003' }];
  const cards = [{ productId: 'PRD0002' }, { productId: 'PRD0003' }];

  assert.deepEqual(
    availableProducts(products, cards, 0).map((product) => product.id),
    ['PRD0001', 'PRD0002'],
    'produk kartu sendiri tetap muncul supaya pilihannya terlihat',
  );
  assert.deepEqual(availableProducts(products, cards, -1).map((product) => product.id), ['PRD0001']);
});

test('pencarian produk waste mencocokkan nama dan kode', () => {
  const products = [
    { id: 'PRD0001', name: 'Bubuk Kopi', code: 'SKU1PC401' },
    { id: 'PRD0002', name: 'Gula Halus', code: 'SKU1PC101' },
  ];

  assert.equal(searchProducts(products, 'bubuk').length, 1);
  assert.equal(searchProducts(products, 'SKU1PC1').length, 1, 'kode ikut dicari');
  assert.equal(searchProducts(products, 'zzz').length, 0, 'menghasilkan daftar kosong');
  assert.equal(searchProducts(products, '').length, 2);
});

test('satu dokumen dibentuk per kategori yang berisi produk', () => {
  const draft = {
    categories: {
      WC01: [{ productId: 'PRD0001', quantity: '12,5', expiryDate: '2026-09-30', photos: ['a'] }],
      WC02: [],
      WC03: [{ productId: 'PRD0007', quantity: '4', expiryDate: '', photos: ['b', 'c'] }],
    },
  };

  assert.equal(categoryFilledCount(draft, 'WC01'), 1);
  assert.equal(categoryFilledCount(draft, 'WC02'), 0);
  assert.equal(totalFilledCount(draft), 2);

  const submission = buildWasteSubmission(draft);
  assert.deepEqual(
    submission.map((entry) => entry.categoryId),
    ['WC01', 'WC03'],
    'kategori kosong tidak menghasilkan dokumen',
  );
  assert.equal(submission[0].items[0].quantity, 12.5, 'koma sudah dinormalkan');
  assert.equal(submission[1].items[0].expiryDate, null, 'tanggal kosong dikirim sebagai null');
  assert.equal(MAX_PHOTOS, 10);
});

test('stok outlet berkurang sebesar kuantitas waste dan tidak menembus nol', () => {
  const levels = buildStockLevels();
  levels.set(stockKey('SO01', 'PRD0001'), 50);

  assert.equal(reduceStock(levels, 'SO01', 'PRD0001', 12.5), 37.5);
  assert.equal(readStock(levels, 'SO01', 'PRD0001'), 37.5);

  assert.equal(reduceStock(levels, 'SO01', 'PRD0001', 999), 0, 'stok berhenti di nol');

  const other = readStock(levels, 'SO02', 'PRD0001');
  reduceStock(levels, 'SO01', 'PRD0001', 5);
  assert.equal(readStock(levels, 'SO02', 'PRD0001'), other);
});

test('dokumen waste kiriman crew memakai barisnya sendiri berikut fotonya', () => {
  const submittedLines = [
    { id: 'L1', productId: 'PRD0001', quantity: 3, expiryDate: null, photoCount: 2, photos: ['a', 'b'] },
  ];
  const submitted = buildWasteLines({ id: 'WST05092026SO011', itemCount: 1, submittedLines });
  assert.deepEqual(submitted, submittedLines);

  const seeded = buildWasteLines({ id: 'WST05092026SO011', itemCount: 3, requiresExpiryDate: false });
  assert.equal(seeded.length, 3);
  assert.equal(seeded[0].photos, undefined, 'riwayat seed tidak membawa berkas gambar');
});

test('DO yang sudah diterima atau dibatalkan terkunci dari validasi ulang', () => {
  assert.equal(isValidatable('draft'), true);
  assert.equal(isValidatable('sent'), true);
  assert.equal(isValidatable('not_received'), true, 'DO lewat batas masih bisa ditangani');
  assert.equal(isValidatable('received'), false);
  assert.equal(isValidatable('canceled'), false);
});

test('galeri bukti foto hanya terbuka untuk DO diterima yang berfoto', () => {
  assert.equal(canViewPhotos({ status: 'received', photoCount: 3 }), true);
  assert.equal(canViewPhotos({ status: 'received', photoCount: 0 }), false);
  assert.equal(canViewPhotos({ status: 'sent', photoCount: 3 }), false);
  assert.equal(canViewPhotos(null), false);
});

test('ekspor DO menuntut filter aktif dan hasil tidak kosong', () => {
  assert.equal(isExportAllowed(true, [{ id: 'DO1' }]), true);
  assert.equal(isExportAllowed(true, []), false, 'hasil kosong tidak bisa diekspor');
  assert.equal(isExportAllowed(false, [{ id: 'DO1' }]), false, 'tanpa filter tidak bisa diekspor');
});

test('batas penerimaan harian jatuh pukul 22:30', () => {
  const at = (hour, minute) => new Date(2026, 8, 5, hour, minute);

  assert.equal(isPastDailyCutoff(at(22, 29)), false);
  assert.equal(isPastDailyCutoff(at(22, 30)), true);
  assert.equal(isPastDailyCutoff(at(23, 0)), true);
  assert.equal(msUntilDailyCutoff(at(22, 0)), 30 * 60 * 1000, 'sisa setengah jam');
  assert.equal(msUntilDailyCutoff(at(23, 0)), 0, 'lewat batas berarti nol, bukan negatif');
});

test('aplikasi crew hanya menampilkan DO outletnya yang sudah dikirim', () => {
  const orders = [
    { id: 'DO1', destinationOutletId: 'SO01', status: 'sent' },
    { id: 'DO2', destinationOutletId: 'SO01', status: 'draft' },
    { id: 'DO3', destinationOutletId: 'SO02', status: 'sent' },
    { id: 'DO4', destinationOutletId: 'SO01', status: 'received' },
  ];

  assert.deepEqual(
    visibleToCrew(orders, 'SO01').map((order) => order.id),
    ['DO1', 'DO4'],
    'draf belum terkirim tidak muncul di layar crew',
  );
  assert.deepEqual(resendableDrafts(orders).map((order) => order.id), ['DO2']);
});

test('pembatalan menuntut alasan, penerimaan menuntut foto dan catatan', () => {
  assert.ok(validateCancelNote('   '), 'alasan kosong ditolak');
  assert.equal(validateCancelNote('Kendaraan tidak sampai'), null);

  assert.ok(validateReceipt({ photos: [], note: 'ok' }).photos, 'foto bukti wajib');
  assert.ok(validateReceipt({ photos: ['a'], note: '' }).note, 'catatan wajib');
  assert.deepEqual(validateReceipt({ photos: ['a'], note: 'Barang lengkap' }), {});

  const tooMany = Array.from({ length: 11 }, (_, index) => `foto${index}`);
  assert.ok(validateReceipt({ photos: tooMany, note: 'ok' }).photos, 'lebih dari sepuluh ditolak');

  assert.ok(defaultReceiptNote().length > 0, 'ada satu catatan siap pakai bawaan');
});

test('DO yang diterima menambah stok di lokasi tujuan', () => {
  const levels = buildStockLevels();
  levels.set(stockKey('SO01', 'PRD0001'), 20);

  assert.equal(increaseStock(levels, 'SO01', 'PRD0001', 12.5), 32.5);
  assert.equal(readStock(levels, 'SO01', 'PRD0001'), 32.5);

  assert.equal(reduceStock(levels, 'SO01', 'PRD0001', 2.5), 30);

  const other = readStock(levels, 'SO02', 'PRD0001');
  increaseStock(levels, 'SO01', 'PRD0001', 100);
  assert.equal(readStock(levels, 'SO02', 'PRD0001'), other);
});

test('tambah user menolak email duplikat sambil mengetik', () => {
  const existing = ['renata.wijoyo@amb.demo'];
  const base = { name: 'Baru', email: 'baru@amb.demo', password: 'x', confirmPassword: 'x' };

  assert.equal(isNewUserValid(base, existing), true);
  assert.equal(
    validateNewUser({ ...base, email: 'RENATA.WIJOYO@amb.demo' }, existing).email,
    'Email sudah pernah didaftarkan',
    'pemeriksaan duplikat tidak peduli besar-kecil huruf',
  );
  assert.ok(validateNewUser({ ...base, email: 'bukan-email' }, existing).email);
  assert.ok(validateNewUser({ ...base, name: '  ' }, existing).name);
  assert.equal(
    validateNewUser({ ...base, confirmPassword: 'beda' }, existing).confirmPassword,
    'Password tidak sama',
  );
});

test('edit informasi hanya memeriksa sandi bila diisi', () => {
  assert.deepEqual(validateUserInfo({ password: '', confirmPassword: '' }), {});
  assert.equal(
    validateUserInfo({ password: 'abc', confirmPassword: 'abd' }).confirmPassword,
    'Password Tidak Sesuai',
  );
  assert.deepEqual(validateUserInfo({ password: 'abc', confirmPassword: 'abc' }), {});
});

test('pencarian user hanya menyaring nama atau email', () => {
  const users = [
    { name: 'Renata Wijoyo', email: 'renata@amb.demo', jobTitle: 'Inventory Manager' },
    { name: 'Bagas Prayoga', email: 'bagas@amb.demo', jobTitle: 'Staff Gudang' },
  ];

  assert.equal(filterUsers(users, 'renata').length, 1);
  assert.equal(filterUsers(users, 'bagas@amb').length, 1);
  assert.equal(filterUsers(users, 'Gudang').length, 0, 'kolom lain tidak ikut dicari');
  assert.equal(filterUsers(users, '').length, 2);
});

test('tombol simpan hak akses hanya muncul saat ada perubahan', () => {
  const current = {
    permissions: ['stocktake.view', 'stocktake.validate'],
    attributes: { 'stocktake.validate': { restricted: true } },
  };

  assert.equal(hasGrantChanged(current, current), false);
  assert.equal(
    hasGrantChanged(current, { ...current, permissions: ['stocktake.validate', 'stocktake.view'] }),
    false,
    'urutan izin tidak dianggap perubahan',
  );
  assert.equal(hasGrantChanged(current, { ...current, permissions: ['stocktake.view'] }), true);

  assert.equal(
    hasGrantChanged(current, {
      ...current,
      attributes: { 'stocktake.validate': { restricted: false } },
    }),
    true,
  );
});

test('mencabut izin ikut membuang atribut tambahannya', () => {
  const grant = {
    permissions: ['stocktake.view', 'stocktake.validate'],
    attributes: { 'stocktake.validate': { restricted: true } },
  };

  const off = toggleGrantPermission(grant, 'stocktake.validate');
  assert.deepEqual(off.permissions, ['stocktake.view']);
  assert.equal(off.attributes['stocktake.validate'], undefined);

  const on = toggleGrantPermission(off, 'stocktake.validate');
  assert.equal(on.permissions.includes('stocktake.validate'), true);
});

test('kartu modul mengarah ke halaman yang benar-benar bisa dibuka', () => {
  const menu = [
    { id: 'control', path: '/ops/stocktake/control', permission: 'scheduler.view' },
    { id: 'support', path: '/ops/stocktake/support', permission: 'usermgmt.view' },
    { id: 'crew', path: '/ops/stocktake/crew', permission: 'mobile.stocktake.count' },
  ];
  const fallback = '/ops/stocktake/control';

  const crew = createAccessProfile(['mobile.stocktake.count'], {});
  assert.equal(resolveModuleEntry(menu, crew, fallback), '/ops/stocktake/crew');

  const control = createAccessProfile(['scheduler.view', 'mobile.stocktake.count'], {});
  assert.equal(resolveModuleEntry(menu, control, fallback), '/ops/stocktake/control');

  const none = createAccessProfile([], {});
  assert.equal(resolveModuleEntry(menu, none, fallback), fallback);

  const nested = [{ id: 'group', children: [{ id: 'a', path: '/stocktake', permission: 'stocktake.view' }] }];
  const viewer = createAccessProfile(['stocktake.view'], {});
  assert.equal(resolveModuleEntry(nested, viewer, '/dashboard'), '/stocktake');
});

let failed = 0;

for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} pemeriksaan lolos`);
process.exit(failed ? 1 : 0);
