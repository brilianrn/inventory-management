import { buildDeliveryOrderLines, buildStockTakeLines, buildWasteLines } from '@/seed/documents';
import { increaseStock, readStock, reduceStock } from '@/seed/stock';
import { DocumentRepositoryPort } from '../port/repository.port';

const withinRange = (value, filter = {}) => {
  const date = new Date(value).getTime();
  if (filter.from && date < new Date(filter.from).getTime()) return false;
  if (filter.to && date > new Date(filter.to).getTime()) return false;
  return true;
};

const matchesCommonFilter = (document, filter = {}) => {
  if (!withinRange(document.date ?? document.shippingDate, filter)) return false;
  if (filter.outletId && document.outletId !== filter.outletId && document.destinationOutletId !== filter.outletId) {
    return false;
  }
  if (filter.status?.length && !filter.status.includes(document.status)) return false;
  return true;
};

const sortByDateDesc = (a, b) =>
  new Date(b.date ?? b.shippingDate).getTime() - new Date(a.date ?? a.shippingDate).getTime();

export class InMemoryDocumentRepository extends DocumentRepositoryPort {
  constructor(seed) {
    super();
    this.seed = seed;
    this.stockTakeDocuments = seed.stockTakeDocuments.map((document) => ({ ...document }));
    this.countOverrides = new Map();
    this.countingSessions = new Map();
    this.sessionSequence = 0;
  }

  getCountingSheet = async (scheduleId) => {
    const schedule = this.seed.schedules.find((item) => item.id === scheduleId);
    if (!schedule) return null;

    const outlet = this.seed.outlets.find((item) => item.id === schedule.outletId);

    const brands = schedule.brandIds
      .map((brandId) => {
        const brand = this.seed.brands.find((item) => item.id === brandId);
        if (!brand) return null;

        const products = this.seed.products.filter(
          (product) => product.brandId === brandId && product.active,
        );

        const categories = [...new Set(products.map((product) => product.categoryId))]
          .map((categoryId) => {
            const inCategory = products.filter((product) => product.categoryId === categoryId);
            return {
              categoryId,
              categoryName: inCategory[0].categoryName,
              products: inCategory
                .map((product) => ({
                  id: product.id,
                  code: product.code,
                  name: product.shortName,
                  uom: product.uom,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            };
          })
          .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

        return { brandId, brandName: brand.name, categories };
      })
      .filter(Boolean)
      .filter((brand) => brand.categories.length > 0);

    return {
      scheduleId: schedule.id,
      scheduleName: `Inventory/STO/${schedule.outletName}`,
      outletId: schedule.outletId,
      outletName: schedule.outletName,
      outletRegion: outlet?.region ?? null,
      scheduleDays: [...schedule.scheduleDays],
      reminderHour: schedule.reminderHour,
      autoSubmit: schedule.autoSubmit,
      brands,
    };
  };

  startCountingSession = async ({ scheduleId, crewId, crewName, startedAt }) => {
    this.sessionSequence += 1;
    const session = {
      id: `SES${String(this.sessionSequence).padStart(4, '0')}`,
      scheduleId,
      crewId,
      crewName,
      startedAt,
      counts: new Map(),
      submittedAt: null,
    };

    this.countingSessions.set(session.id, session);
    return { id: session.id, scheduleId, crewId, crewName, startedAt };
  };

  saveProductCount = async (sessionId, productId, counted) => {
    const session = this.countingSessions.get(sessionId);
    if (!session) return { saved: false };

    session.counts.set(productId, counted);
    return { saved: true };
  };

  submitCountingSession = async ({ scheduleId, crewName, startedAt, counts = [], autoSubmitted = false }) => {
    const schedule = this.seed.schedules.find((item) => item.id === scheduleId);
    if (!schedule) throw new Error('Jadwal tidak ditemukan');

    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const stamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const id = `STK${stamp}${schedule.outletId}`;

    const document = {
      id,
      type: 'stocktake',
      scheduleId: schedule.id,
      scheduleName: `Inventory/STO/${schedule.outletName}/${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
      outletId: schedule.outletId,
      outletName: schedule.outletName,
      startTime: new Date(startedAt).toISOString(),
      endTime: now.toISOString(),
      status: 'unvalidated',
      crewName,
      crewEmail: null,
      brandIds: [...schedule.brandIds],
      itemCount: counts.length,
      submittedCounts: counts,
      validatedBy: null,
      validatedAt: null,
      updatedBy: crewName,
      updatedAt: now.toISOString(),
      autoSubmitted,
    };

    const existingIndex = this.stockTakeDocuments.findIndex((item) => item.id === id);
    if (existingIndex >= 0) this.stockTakeDocuments[existingIndex] = document;
    else this.stockTakeDocuments.unshift(document);

    return { ...document };
  };

  #applyOverrides = (document, lines) => {
    const overrides = this.countOverrides.get(document.id);
    if (!overrides) return lines;
    return lines.map((line) =>
      overrides.has(line.id) ? { ...line, counted: overrides.get(line.id) } : line,
    );
  };

  listStockTakeDocuments = async (filter = {}) =>
    this.stockTakeDocuments.filter((document) => matchesCommonFilter(document, filter)).sort(sortByDateDesc);

  getStockTakeDocument = async (id) => {
    const document = this.stockTakeDocuments.find((item) => item.id === id);
    if (!document) return null;
    return { ...document, lines: this.#applyOverrides(document, buildStockTakeLines(document)) };
  };

  saveStockTakeCounts = async (id, counts = []) => {
    const document = this.stockTakeDocuments.find((item) => item.id === id);
    if (!document) throw new Error('Dokumen tidak ditemukan');

    const overrides = this.countOverrides.get(id) ?? new Map();
    counts.forEach(({ lineId, counted }) => overrides.set(lineId, counted));
    this.countOverrides.set(id, overrides);

    document.updatedAt = new Date().toISOString();
    return { ...document };
  };

  validateStockTakeDocuments = async (ids = [], validatedBy = 'SYSTEM') => {
    const validatedAt = new Date().toISOString();
    const touched = [];

    ids.forEach((id) => {
      const document = this.stockTakeDocuments.find((item) => item.id === id);
      if (!document || document.status !== 'unvalidated') return;
      document.status = 'validated';
      document.validatedBy = validatedBy;
      document.validatedAt = validatedAt;
      touched.push({ ...document });
    });

    return touched;
  };

  submitWasteSession = async ({ outletId, crewName, categories = [], submittedAt }) => {
    const outlet = this.seed.outlets.find((item) => item.id === outletId);
    if (!outlet) throw new Error('Outlet tidak ditemukan');

    const now = submittedAt ? new Date(submittedAt) : new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const stamp = `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}`;
    const productById = new Map(this.seed.products.map((product) => [product.id, product]));

    const created = categories
      .filter((entry) => entry.items?.length)
      .map((entry, entryIndex) => {
        const category = this.seed.wasteCategories.find((item) => item.id === entry.categoryId);
        if (!category) throw new Error('Kategori waste tidak ditemukan');

        const documentId = `WST${stamp}${outlet.id}${entryIndex + 1}`;

        const lines = entry.items.map((item, itemIndex) => {
          const product = productById.get(item.productId);
          if (!product) throw new Error('Produk tidak ditemukan');

          reduceStock(this.seed.stockLevels, outlet.id, product.id, item.quantity);

          return {
            id: `${documentId}-L${String(itemIndex + 1).padStart(3, '0')}`,
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            uom: product.uom,
            quantity: item.quantity,
            expiryDate: item.expiryDate ?? null,
            photoCount: item.photos?.length ?? 0,
            photos: [...(item.photos ?? [])],
          };
        });

        return {
          id: documentId,
          type: 'waste',
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(),
          createdAt: now.toISOString(),
          outletId: outlet.id,
          outletName: outlet.displayName,
          wasteCategoryId: category.id,
          wasteCategoryName: category.name,
          requiresExpiryDate: category.requiresExpiryDate,
          crewName,
          itemCount: lines.length,
          reference: `Inventory/Waste/${category.name}/${outlet.displayName}`,
          submittedLines: lines,
        };
      });

    created.forEach((document) => {
      const existingIndex = this.seed.wasteDocuments.findIndex((item) => item.id === document.id);
      if (existingIndex >= 0) this.seed.wasteDocuments[existingIndex] = document;
      else this.seed.wasteDocuments.unshift(document);
    });

    return created.map(({ submittedLines, ...document }) => document);
  };

  listWasteDocuments = async (filter = {}) =>
    this.seed.wasteDocuments.filter((document) => matchesCommonFilter(document, filter)).sort(sortByDateDesc);

  getWasteDocument = async (id) => {
    const document = this.seed.wasteDocuments.find((item) => item.id === id);
    if (!document) return null;
    return { ...document, lines: buildWasteLines(document) };
  };

  listReturnWasteDocuments = async (filter = {}) =>
    this.seed.returnWasteDocuments
      .filter((document) => matchesCommonFilter(document, filter))
      .sort(sortByDateDesc);

  getReturnWasteDocument = async (id) => {
    const document = this.seed.returnWasteDocuments.find((item) => item.id === id);
    if (!document) return null;
    return { ...document, lines: buildWasteLines(document) };
  };

  listDeliveryOrders = async (filter = {}) =>
    this.seed.deliveryOrders.filter((order) => matchesCommonFilter(order, filter)).sort(sortByDateDesc);

  getDeliveryOrder = async (id) => {
    const order = this.seed.deliveryOrders.find((item) => item.id === id);
    if (!order) return null;

    const lines = this.getDeliveryOrderLinesSync(order).map((line) => ({
      ...line,
      destinationStock: readStock(this.seed.stockLevels, order.destinationOutletId, line.productId),
    }));

    return { ...order, lines };
  };

  getDeliveryOrderLinesSync = (order) => order.submittedLines ?? buildDeliveryOrderLines(order);

  getDeliveryOrderLines = async (id) => {
    const order = this.seed.deliveryOrders.find((item) => item.id === id);
    return order ? this.getDeliveryOrderLinesSync(order) : [];
  };

  validateDeliveryOrder = async ({ id, action, note = '', actor = 'SYSTEM', photos = [] }) => {
    const order = this.seed.deliveryOrders.find((item) => item.id === id);
    if (!order) throw new Error('Delivery order tidak ditemukan');

    if (order.status === 'received' || order.status === 'canceled') {
      throw new Error('Delivery order ini sudah divalidasi dan tidak bisa diubah lagi');
    }

    if (action === 'receive') {
      this.getDeliveryOrderLinesSync(order).forEach((line) => {
        increaseStock(this.seed.stockLevels, order.destinationOutletId, line.productId, line.qtyDone);
      });
    } else if (action !== 'cancel') {
      throw new Error('Aksi validasi tidak dikenal');
    }

    order.status = action === 'receive' ? 'received' : 'canceled';
    order.user = actor;
    order.remark = note;
    order.dateValidate = new Date().toISOString();
    order.needsAttention = false;
    order.photos = action === 'receive' ? [...photos] : [];
    order.photoCount = order.photos.length;

    return { ...order };
  };

  syncDeliveryOrders = async () => {
    let sent = 0;
    this.seed.deliveryOrders.forEach((order) => {
      if (order.status === 'draft') {
        order.status = 'sent';
        sent += 1;
      }
    });
    return { sent };
  };

  resendDraftOrders = async () => this.syncDeliveryOrders();
}
