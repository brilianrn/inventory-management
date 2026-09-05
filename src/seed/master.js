import { createRandom } from './random.js';

export const BRANDS = [
  { id: 'BR01', name: 'Kopi Kenari', partner: 'Kenari Group' },
  { id: 'BR02', name: 'Roti Bumi', partner: 'Bumi Pangan' },
  { id: 'BR03', name: 'Sambal Larangan', partner: 'Larangan Rasa' },
  { id: 'BR04', name: 'Teh Sekawan', partner: 'Sekawan Minuman' },
  { id: 'BR05', name: 'Mie Pandawa', partner: 'Pandawa Boga' },
  { id: 'BR06', name: 'Es Gemilang', partner: 'Gemilang Dessert' },
];

export const OUTLETS = [
  { id: 'SO01', name: 'Dapur Menteng', region: 'Jakarta Pusat' },
  { id: 'SO02', name: 'Dapur Kemayoran', region: 'Jakarta Pusat' },
  { id: 'SO03', name: 'Dapur Cilandak', region: 'Jakarta Selatan' },
  { id: 'SO04', name: 'Dapur Tebet', region: 'Jakarta Selatan' },
  { id: 'SO05', name: 'Dapur Kelapa Gading', region: 'Jakarta Utara' },
  { id: 'SO06', name: 'Dapur Cengkareng', region: 'Jakarta Barat' },
  { id: 'SO07', name: 'Dapur Serpong', region: 'Tangerang Selatan' },
  { id: 'SO08', name: 'Dapur Bintaro', region: 'Tangerang Selatan' },
  { id: 'SO09', name: 'Dapur Alam Sutera', region: 'Tangerang' },
  { id: 'SO10', name: 'Dapur Margonda', region: 'Depok' },
  { id: 'SO11', name: 'Dapur Cibubur', region: 'Bekasi' },
  { id: 'SO12', name: 'Dapur Pajajaran', region: 'Bogor' },
].map((outlet) => ({ ...outlet, displayName: `${outlet.name} (${outlet.id})` }));

export const SUPPLIERS = [
  { id: 'SP01', name: 'PT Anugerah Pangan Nusantara', category: 'Bahan Baku' },
  { id: 'SP02', name: 'CV Rasa Prima Sejahtera', category: 'Bumbu dan Saus' },
  { id: 'SP03', name: 'PT Boga Lestari Mandiri', category: 'Produk Setengah Jadi' },
  { id: 'SP04', name: 'CV Kemas Andalan', category: 'Kemasan' },
  { id: 'SP05', name: 'PT Segar Tani Makmur', category: 'Bahan Segar' },
];

export const HUB_LOCATIONS = [
  { id: 'HB01', name: 'Hub Pusat Cakung' },
  { id: 'HB02', name: 'Hub Barat Daan Mogot' },
];

export const PRODUCT_CATEGORIES = [
  { id: 'PC01', name: 'Food Material', uoms: ['Gr', 'Kg', 'Pcs'] },
  { id: 'PC02', name: 'Semi Finished Goods', uoms: ['Gr', 'Pax', 'Pcs'] },
  { id: 'PC03', name: 'Packaging Material', uoms: ['Pcs', 'Pack 25pcs', 'Pack 50pcs'] },
  { id: 'PC04', name: 'Beverage Material', uoms: ['Ml', 'Liter', 'Gr'] },
];

const ITEM_NAMES = {
  PC01: ['Tepung Serbaguna', 'Gula Halus', 'Minyak Kelapa', 'Garam Laut', 'Beras Pandan'],
  PC02: ['Adonan Dasar', 'Bumbu Marinasi', 'Saus Wijen', 'Kaldu Konsentrat', 'Pasta Cabai'],
  PC03: ['Kotak Kertas', 'Gelas Plastik', 'Sedotan Kertas', 'Kantong Kraft', 'Stiker Segel'],
  PC04: ['Bubuk Kopi', 'Sirup Karamel', 'Bubuk Cokelat', 'Krimer Nabati', 'Konsentrat Lemon'],
};

export const UOM_LIMITS = [
  { id: 'UM01', uom: 'Gr', maxQty: 20000 },
  { id: 'UM02', uom: 'Kg', maxQty: 250 },
  { id: 'UM03', uom: 'Ml', maxQty: 15000 },
  { id: 'UM04', uom: 'Liter', maxQty: 200 },
  { id: 'UM05', uom: 'Pcs', maxQty: 1500 },
  { id: 'UM06', uom: 'Pax', maxQty: 800 },
  { id: 'UM07', uom: 'Pack 25pcs', maxQty: 120 },
  { id: 'UM08', uom: 'Pack 50pcs', maxQty: 80 },
];

export const WASTE_CATEGORIES = [
  { id: 'WC01', name: 'Produk Kadaluarsa', requiresExpiryDate: true, isReturn: false },
  { id: 'WC02', name: 'Produk Rusak Belum Kadaluarsa', requiresExpiryDate: false, isReturn: false },
  { id: 'WC03', name: 'Produk Sisa Persiapan', requiresExpiryDate: false, isReturn: false },
  { id: 'WC04', name: 'Produk Central Kitchen', requiresExpiryDate: false, isReturn: false },
  { id: 'WC05', name: 'Pembuangan Operasional', requiresExpiryDate: false, isReturn: false },
  { id: 'WC06', name: 'Return to Brand Partner', requiresExpiryDate: true, isReturn: true },
  { id: 'WC07', name: 'Return to Hub Pusat', requiresExpiryDate: true, isReturn: true },
];

export const RETURN_DESTINATIONS = ['Return to Brand Partner', 'Return to Hub Pusat'];

export const buildProducts = () => {
  const random = createRandom(70113);
  const products = [];

  BRANDS.forEach((brand, brandIndex) => {
    PRODUCT_CATEGORIES.forEach((category) => {
      ITEM_NAMES[category.id].forEach((itemName, itemIndex) => {
        const uom = random.pick(category.uoms);
        const sequence = products.length + 1;

        products.push({
          id: `PRD${String(sequence).padStart(4, '0')}`,
          code: `SKU${String(brandIndex + 1)}${category.id.slice(-2)}${String(itemIndex + 1).padStart(2, '0')}`,
          name: `${itemName}, ${brand.name}, ${uom}`,
          shortName: itemName,
          brandId: brand.id,
          brandName: brand.name,
          categoryId: category.id,
          categoryName: category.name,
          uom,
          cost: random.int(1500, 85000),
          supplierId: random.pick(SUPPLIERS).id,
          active: random.chance(0.94),
        });
      });
    });
  });

  return products;
};

export const PRODUCTS = buildProducts();

export const buildWasteProductConfig = () => {
  const random = createRandom(31337);
  return WASTE_CATEGORIES.map((category) => ({
    wasteCategoryId: category.id,
    wasteCategoryName: category.name,
    productIds: random.sample(PRODUCTS, random.int(28, 64)).map((product) => product.id),
    updatedAt: new Date(2025, 7, random.int(1, 28), random.int(8, 17), random.int(0, 59)).toISOString(),
    updatedBy: random.pick(['Renata Wijoyo', 'Laras Nuraini', 'Bagas Prayoga']),
  }));
};

export const buildReturnWasteConfig = () => {
  const random = createRandom(90210);
  return BRANDS.map((brand, index) => ({
    id: `RWC${String(index + 1).padStart(2, '0')}`,
    brandId: brand.id,
    brandName: brand.name,
    configuration: random.pick(RETURN_DESTINATIONS),
    status: random.chance(0.8) ? 'active' : 'inactive',
    createdBy: random.pick(['Renata Wijoyo', 'Laras Nuraini']),
    createdAt: new Date(2025, 5, 12, 9, 0).toISOString(),
    updatedBy: random.pick(['Laras Nuraini', 'Renata Wijoyo', 'SYSTEM']),
    updatedAt: new Date(2025, 7, random.int(1, 28), random.int(9, 16), random.int(0, 59)).toISOString(),
  }));
};

const WEEK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const buildSchedules = () => {
  const random = createRandom(11235);
  return OUTLETS.map((outlet, index) => ({
    id: `SCH${String(index + 1).padStart(2, '0')}`,
    outletId: outlet.id,
    outletName: outlet.displayName,
    brandIds: random.sample(BRANDS, random.int(2, 5)).map((brand) => brand.id),
    startDate: new Date(2025, 6, random.int(1, 28)).toISOString(),
    scheduleDays: random.sample(WEEK_DAYS, random.int(1, 3)).sort(
      (a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b),
    ),
    reminderHour: `${String(random.int(6, 20)).padStart(2, '0')}:${random.pick(['00', '15', '30', '45'])}`,
    autoSubmit: random.chance(0.35),
    active: random.chance(0.85),
  }));
};

const CREW_PEOPLE = [
  'Dwi Anggara',
  'Rian Maulana',
  'Putri Handayani',
  'Yoga Pratama',
  'Anisa Rahmawati',
  'Bayu Setiawan',
  'Galih Permana',
  'Ratih Kusumawati',
  'Fandi Nugroho',
  'Melati Ardiyanti',
  'Teguh Suryana',
  'Wulan Safitri',
];

export const buildCrewAccounts = () => {
  const random = createRandom(44021);

  return CREW_PEOPLE.map((name, index) => {
    const outlet = OUTLETS[index % OUTLETS.length];
    const slug = name.toLowerCase().replace(/\s+/g, '.');

    return {
      id: `CRW${String(index + 1).padStart(2, '0')}`,
      name,
      email: `${slug}@amb.demo`,
      outletId: outlet.id,
      outletName: outlet.displayName,
      active: random.chance(0.85),
      createdAt: new Date(2025, 4, random.int(1, 28), random.int(8, 16), random.int(0, 59)).toISOString(),
      updatedAt: new Date(2025, 7, random.int(1, 28), random.int(8, 16), random.int(0, 59)).toISOString(),
      updatedBy: random.pick(['Renata Wijoyo', 'Hendra Saputra']),
    };
  });
};

export const CREW_ACCOUNTS = buildCrewAccounts();

export const SCHEDULES = buildSchedules();
export const WASTE_PRODUCT_CONFIG = buildWasteProductConfig();
export const RETURN_WASTE_CONFIG = buildReturnWasteConfig();
