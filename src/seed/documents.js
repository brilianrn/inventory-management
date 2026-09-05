import {
  BRANDS,
  HUB_LOCATIONS,
  OUTLETS,
  PRODUCTS,
  RETURN_DESTINATIONS,
  SCHEDULES,
  SUPPLIERS,
  WASTE_CATEGORIES,
} from './master.js';
import { createRandom, seedFromString } from './random.js';

export const HISTORY_DAYS = 60;

const CREW_NAMES = [
  'Dwi Anggara',
  'Rian Maulana',
  'Putri Handayani',
  'Yoga Pratama',
  'Anisa Rahmawati',
  'Bayu Setiawan',
  'Nadia Kusuma',
  'Galih Permana',
];

const BACKOFFICE_NAMES = ['Renata Wijoyo', 'Bagas Prayoga', 'Sinta Marlina', 'Laras Nuraini'];

export const anchorToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const shiftDays = (base, days) => {
  const date = new Date(base);
  date.setDate(date.getDate() - days);
  return date;
};

const atTime = (date, hour, minute) => {
  const stamped = new Date(date);
  stamped.setHours(hour, minute, 0, 0);
  return stamped;
};

const pad = (value) => String(value).padStart(2, '0');

const formatDocDate = (date) => `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

const buildStockTakeDocuments = (today) => {
  const random = createRandom(50021);
  const documents = [];

  for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = shiftDays(today, dayOffset);
    if (date.getDay() === 0) continue; 

    const scheduled = random.sample(SCHEDULES, random.int(2, 4));

    scheduled.forEach((schedule) => {
      const outlet = OUTLETS.find((item) => item.id === schedule.outletId);
      const startHour = random.int(7, 10);
      const startedAt = atTime(date, startHour, random.int(0, 59));
      const finished = dayOffset > 0 || random.chance(0.6);
      const endedAt = finished
        ? atTime(date, startHour + random.int(1, 2), random.int(0, 59))
        : null;

      const status = (() => {
        if (dayOffset > 6) return random.weighted([
          { value: 'validated', weight: 88 },
          { value: 'unvalidated', weight: 8 },
          { value: 'processed', weight: 4 },
        ]);
        if (dayOffset > 1) return random.weighted([
          { value: 'validated', weight: 55 },
          { value: 'unvalidated', weight: 30 },
          { value: 'processed', weight: 10 },
          { value: 'notified', weight: 5 },
        ]);
        return random.weighted([
          { value: 'unvalidated', weight: 45 },
          { value: 'processed', weight: 25 },
          { value: 'notified', weight: 20 },
          { value: 'validated', weight: 10 },
        ]);
      })();

      const id = `STK${formatDocDate(date).replace(/-/g, '')}${schedule.outletId}`;
      const validator = status === 'validated' ? random.pick(BACKOFFICE_NAMES) : null;

      documents.push({
        id,
        type: 'stocktake',
        scheduleId: schedule.id,
        scheduleName: `Inventory/STO/${outlet.displayName}/${formatDocDate(date)}`,
        date: date.toISOString(),
        outletId: outlet.id,
        outletName: outlet.displayName,
        startTime: startedAt.toISOString(),
        endTime: endedAt ? endedAt.toISOString() : null,
        status,
        crewName: random.pick(CREW_NAMES),
        crewEmail: `crew${schedule.outletId.toLowerCase()}@amb.demo`,
        brandIds: schedule.brandIds,
        itemCount: random.int(18, 46),
        validatedBy: validator,
        validatedAt: validator ? atTime(date, random.int(11, 16), random.int(0, 59)).toISOString() : null,
        updatedBy: random.pick(BACKOFFICE_NAMES),
        updatedAt: atTime(date, random.int(11, 17), random.int(0, 59)).toISOString(),
      });
    });
  }

  return documents;
};

export const buildStockTakeLines = (document) => {
  const random = createRandom(seedFromString(document.id));

  const submitted = document.submittedCounts ?? null;
  const pool = PRODUCTS.filter((product) => document.brandIds.includes(product.brandId));
  const chosen = submitted
    ? submitted
        .map((entry) => ({
          product: PRODUCTS.find((item) => item.id === entry.productId),
          counted: entry.counted,
        }))
        .filter((entry) => entry.product)
    : random
        .sample(pool.length ? pool : PRODUCTS, document.itemCount)
        .map((product) => ({ product, counted: null }));

  return chosen.map(({ product, counted: submittedCount }, index) => {
    const stockOnHand = random.chance(0.06) ? 0 : random.float(0, 480, 2);
    const drift = random.weighted([
      { value: random.float(-0.02, 0.02, 4), weight: 68 },
      { value: random.float(-0.12, -0.05, 4), weight: 16 },
      { value: random.float(0.05, 0.14, 4), weight: 16 },
    ]);
    const generated =
      stockOnHand === 0
        ? random.chance(0.5)
          ? 0
          : random.float(1, 12, 2)
        : Number(Math.max(0, stockOnHand * (1 + drift)).toFixed(2));
    const counted = submittedCount ?? generated;

    return {
      id: `${document.id}-L${String(index + 1).padStart(3, '0')}`,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      brandName: product.brandName,
      categoryName: product.categoryName,
      uom: product.uom,
      stockOnHand,
      counted,
      cost: product.cost,
    };
  });
};

const buildWasteDocuments = (today) => {
  const random = createRandom(60413);
  const wasteDocuments = [];
  const returnDocuments = [];

  const disposalCategories = WASTE_CATEGORIES.filter((category) => !category.isReturn);

  for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = shiftDays(today, dayOffset);

    const wasteCount = random.int(2, 5);
    for (let index = 0; index < wasteCount; index += 1) {
      const outlet = random.pick(OUTLETS);
      const category = random.pick(disposalCategories);
      const createdAt = atTime(date, random.int(13, 22), random.int(0, 59));

      wasteDocuments.push({
        id: `WST${formatDocDate(date).replace(/-/g, '')}${outlet.id}${index + 1}`,
        type: 'waste',
        date: date.toISOString(),
        createdAt: createdAt.toISOString(),
        outletId: outlet.id,
        outletName: outlet.displayName,
        wasteCategoryId: category.id,
        wasteCategoryName: category.name,
        requiresExpiryDate: category.requiresExpiryDate,
        crewName: random.pick(CREW_NAMES),
        itemCount: random.int(1, 9),
        reference: `Inventory/Waste/${category.name}/${outlet.displayName}`,
      });
    }

    if (random.chance(0.75)) {
      const outlet = random.pick(OUTLETS);
      const brand = random.pick(BRANDS);
      const destination = random.pick(RETURN_DESTINATIONS);
      const createdAt = atTime(date, random.int(13, 21), random.int(0, 59));

      returnDocuments.push({
        id: `RTN${formatDocDate(date).replace(/-/g, '')}${outlet.id}`,
        type: 'return-waste',
        date: date.toISOString(),
        createdAt: createdAt.toISOString(),
        outletId: outlet.id,
        outletName: outlet.displayName,
        brandId: brand.id,
        brandName: brand.name,
        destination,
        wasteCategoryName: destination,
        requiresExpiryDate: true,
        crewName: random.pick(CREW_NAMES),
        itemCount: random.int(1, 7),
        reference: `Inventory/Waste/${destination}/${outlet.displayName}`,
      });
    }
  }

  return { wasteDocuments, returnDocuments };
};

export const buildWasteLines = (document) => {
  if (document.submittedLines) return document.submittedLines;

  const random = createRandom(seedFromString(document.id));
  const chosen = random.sample(PRODUCTS, document.itemCount);

  return chosen.map((product, index) => ({
    id: `${document.id}-L${String(index + 1).padStart(3, '0')}`,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    uom: product.uom,
    quantity: random.float(0.5, 24, 2),
    expiryDate: document.requiresExpiryDate
      ? new Date(
          new Date(document.date).getTime() + random.int(-6, 20) * 86400000,
        ).toISOString()
      : null,
    photoCount: random.int(1, 4),
  }));
};

const buildDeliveryOrders = (today) => {
  const random = createRandom(78901);
  const orders = [];
  const sources = [...SUPPLIERS.map((s) => s.name), ...HUB_LOCATIONS.map((h) => h.name)];

  let sequence = 1;

  for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = shiftDays(today, dayOffset);
    const count = random.int(3, 6);

    for (let index = 0; index < count; index += 1) {
      const outlet = random.pick(OUTLETS);

      const status = (() => {
        if (dayOffset > 3) return random.weighted([
          { value: 'received', weight: 78 },
          { value: 'canceled', weight: 10 },
          { value: 'not_received', weight: 9 },
          { value: 'draft', weight: 3 },
        ]);
        if (dayOffset > 0) return random.weighted([
          { value: 'received', weight: 52 },
          { value: 'sent', weight: 24 },
          { value: 'not_received', weight: 12 },
          { value: 'canceled', weight: 8 },
          { value: 'draft', weight: 4 },
        ]);
        return random.weighted([
          { value: 'sent', weight: 46 },
          { value: 'draft', weight: 24 },
          { value: 'received', weight: 22 },
          { value: 'canceled', weight: 8 },
        ]);
      })();

      const validated = status === 'received' || status === 'canceled';
      const validatedAt = validated
        ? atTime(date, random.int(9, 21), random.int(0, 59)).toISOString()
        : null;

      orders.push({
        id: `DO${String(sequence).padStart(5, '0')}`,
        type: 'delivery-order',
        doNumber: `DO/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${String(sequence).padStart(4, '0')}`,
        shippingDate: date.toISOString(),
        sourceLocation: random.pick(sources),
        destinationOutletId: outlet.id,
        destinationLocation: outlet.displayName,
        status,
        user: validated ? random.pick([...CREW_NAMES, ...BACKOFFICE_NAMES]) : null,
        dateValidate: validatedAt,
        remark: (() => {
          if (status === 'received') return random.pick([
            'Barang lengkap dan sesuai surat jalan.',
            'Diterima dengan kondisi kemasan baik.',
            'Ada selisih minor, sudah dikonfirmasi ke pengirim.',
          ]);
          if (status === 'canceled') return random.pick([
            'Kendaraan tidak sampai sampai batas waktu.',
            'Barang tidak sesuai pesanan.',
            'Outlet tutup lebih awal.',
          ]);
          return '';
        })(),
        photoCount: status === 'received' ? random.int(1, 5) : 0,
        needsAttention: status === 'not_received' || (status === 'sent' && dayOffset > 1),
        itemCount: random.int(4, 22),
      });

      sequence += 1;
    }
  }

  return orders;
};

export const buildDeliveryOrderLines = (order) => {
  const random = createRandom(seedFromString(order.id));
  const chosen = random.sample(PRODUCTS, order.itemCount);

  return chosen.map((product, index) => ({
    id: `${order.id}-L${String(index + 1).padStart(3, '0')}`,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    uom: product.uom,
    qtyDone: random.float(1, 90, 2),
  }));
};

export const buildDocumentHistory = () => {
  const today = anchorToday();
  const { wasteDocuments, returnDocuments } = buildWasteDocuments(today);

  return {
    anchorDate: today.toISOString(),
    stockTakeDocuments: buildStockTakeDocuments(today),
    wasteDocuments,
    returnWasteDocuments: returnDocuments,
    deliveryOrders: buildDeliveryOrders(today),
  };
};
