import { readStock } from '@/seed/stock';
import { CatalogRepositoryPort } from '../port/repository.port';

const nowIso = () => new Date().toISOString();

export class InMemoryCatalogRepository extends CatalogRepositoryPort {
  constructor(seed) {
    super();
    this.seed = seed;
    this.wasteProductConfig = seed.wasteProductConfig.map((config) => ({
      ...config,
      productIds: [...config.productIds],
    }));
    this.uomLimits = seed.uomLimits.map((limit) => ({
      ...limit,
      updatedAt: limit.updatedAt ?? '2025-08-04T02:15:00.000Z',
      updatedBy: limit.updatedBy ?? 'Laras Nuraini',
    }));
    this.returnWasteConfig = seed.returnWasteConfig.map((config) => ({ ...config }));
    this.schedules = seed.schedules;
    this.crewAccounts = seed.crewAccounts;
    this.stockLevels = seed.stockLevels;
  }

  listBrands = async () => [...this.seed.brands];

  listOutlets = async () => [...this.seed.outlets];

  listSuppliers = async () => [...this.seed.suppliers];

  listProducts = async (filter = {}) => {
    const { brandId, categoryId, query } = filter;
    const keyword = query?.trim().toLowerCase();

    return this.seed.products.filter((product) => {
      if (brandId && product.brandId !== brandId) return false;
      if (categoryId && product.categoryId !== categoryId) return false;
      if (keyword) {
        const haystack = `${product.code} ${product.name}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  };

  listWasteCategories = async () => [...this.seed.wasteCategories];

  listSchedules = async () =>
    this.schedules.map((schedule) => ({
      ...schedule,
      brandIds: [...schedule.brandIds],
      scheduleDays: [...schedule.scheduleDays],
    }));

  getSchedule = async (id) => {
    const schedule = this.schedules.find((item) => item.id === id);
    if (!schedule) return null;
    return { ...schedule, brandIds: [...schedule.brandIds], scheduleDays: [...schedule.scheduleDays] };
  };

  createSchedule = async (payload, actor = 'SYSTEM') => {
    const outlet = this.seed.outlets.find((item) => item.id === payload.outletId);
    if (!outlet) throw new Error('Outlet tidak ditemukan');

    const created = {
      id: `SCH${String(this.schedules.length + 1).padStart(2, '0')}`,
      outletId: outlet.id,
      outletName: outlet.displayName,
      brandIds: [...payload.brandIds],
      startDate: new Date(payload.startDate).toISOString(),
      scheduleDays: [...payload.scheduleDays],
      reminderHour: payload.reminderHour,
      autoSubmit: Boolean(payload.autoSubmit),
      active: true,
      updatedBy: actor,
      updatedAt: nowIso(),
    };

    this.schedules.push(created);
    return { ...created };
  };

  updateSchedule = async (id, payload, actor = 'SYSTEM') => {
    const schedule = this.schedules.find((item) => item.id === id);
    if (!schedule) throw new Error('Jadwal tidak ditemukan');

    schedule.brandIds = [...payload.brandIds];
    schedule.startDate = new Date(payload.startDate).toISOString();
    schedule.scheduleDays = [...payload.scheduleDays];
    schedule.reminderHour = payload.reminderHour;
    schedule.active = payload.status === 'active';
    if (payload.autoSubmit !== undefined) schedule.autoSubmit = Boolean(payload.autoSubmit);
    schedule.updatedBy = actor;
    schedule.updatedAt = nowIso();

    return { ...schedule };
  };

  listCrewAccounts = async () => this.crewAccounts.map((account) => ({ ...account }));

  createCrewAccount = async (payload, actor = 'SYSTEM') => {
    const email = payload.email.trim().toLowerCase();
    if (this.crewAccounts.some((account) => account.email.toLowerCase() === email)) {
      throw new Error('Email sudah pernah didaftarkan');
    }

    const outlet = this.seed.outlets.find((item) => item.id === payload.outletId);
    if (!outlet) throw new Error('Outlet tidak ditemukan');

    const created = {
      id: `CRW${String(this.crewAccounts.length + 1).padStart(2, '0')}`,
      name: payload.name.trim(),
      email,
      outletId: outlet.id,
      outletName: outlet.displayName,
      active: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      updatedBy: actor,
    };

    this.crewAccounts.push(created);
    return { ...created };
  };

  updateCrewAccount = async (id, payload, actor = 'SYSTEM') => {
    const account = this.crewAccounts.find((item) => item.id === id);
    if (!account) throw new Error('Akun tidak ditemukan');

    const outlet = this.seed.outlets.find((item) => item.id === payload.outletId);
    if (!outlet) throw new Error('Outlet tidak ditemukan');

    account.outletId = outlet.id;
    account.outletName = outlet.displayName;
    account.active = Boolean(payload.active);
    account.updatedAt = nowIso();
    account.updatedBy = actor;

    return { ...account };
  };

  listWasteProductConfig = async () =>
    this.wasteProductConfig.map((config) => ({ ...config, productIds: [...config.productIds] }));

  getWasteCategoryConfig = async (categoryId) => {
    const config = this.wasteProductConfig.find((item) => item.wasteCategoryId === categoryId);
    return config ? { ...config, productIds: [...config.productIds] } : null;
  };

  addProductsToWasteCategory = async (categoryId, productIds = [], actor = 'SYSTEM') => {
    const config = this.wasteProductConfig.find((item) => item.wasteCategoryId === categoryId);
    if (!config) throw new Error('Kategori waste tidak ditemukan');

    config.productIds = [...new Set([...config.productIds, ...productIds])];
    config.updatedAt = nowIso();
    config.updatedBy = actor;

    return { ...config, productIds: [...config.productIds] };
  };

  removeProductsFromWasteCategory = async (categoryId, productIds = [], actor = 'SYSTEM') => {
    const config = this.wasteProductConfig.find((item) => item.wasteCategoryId === categoryId);
    if (!config) throw new Error('Kategori waste tidak ditemukan');

    const removed = new Set(productIds);
    config.productIds = config.productIds.filter((id) => !removed.has(id));
    config.updatedAt = nowIso();
    config.updatedBy = actor;

    return { ...config, productIds: [...config.productIds] };
  };

  listUomLimits = async () => this.uomLimits.map((limit) => ({ ...limit }));

  getOutletStock = async (outletId) => {
    const stock = new Map();
    this.seed.products.forEach((product) => {
      stock.set(product.id, readStock(this.stockLevels, outletId, product.id));
    });
    return stock;
  };

  updateUomLimit = async (id, maxQty, actor = 'SYSTEM') => {
    const limit = this.uomLimits.find((item) => item.id === id);
    if (!limit) throw new Error('Satuan tidak ditemukan');

    limit.maxQty = maxQty;
    limit.updatedAt = nowIso();
    limit.updatedBy = actor;

    return { ...limit };
  };

  listReturnWasteConfig = async () => this.returnWasteConfig.map((config) => ({ ...config }));

  createReturnWasteConfig = async (payload, actor = 'SYSTEM') => {
    if (this.returnWasteConfig.some((config) => config.brandId === payload.brandId)) {
      throw new Error('Brand ini sudah punya konfigurasi');
    }

    const brand = this.seed.brands.find((item) => item.id === payload.brandId);
    if (!brand) throw new Error('Brand tidak ditemukan');

    const created = {
      id: `RWC${String(this.returnWasteConfig.length + 1).padStart(2, '0')}`,
      brandId: brand.id,
      brandName: brand.name,
      configuration: payload.configuration,
      status: 'active',
      createdBy: actor,
      createdAt: nowIso(),
      updatedBy: actor,
      updatedAt: nowIso(),
    };

    this.returnWasteConfig.push(created);
    return { ...created };
  };

  updateReturnWasteConfig = async (id, payload, actor = 'SYSTEM') => {
    const config = this.returnWasteConfig.find((item) => item.id === id);
    if (!config) throw new Error('Konfigurasi tidak ditemukan');

    config.configuration = payload.configuration ?? config.configuration;
    config.status = payload.status ?? config.status;
    config.updatedBy = actor;
    config.updatedAt = nowIso();

    return { ...config };
  };
}
