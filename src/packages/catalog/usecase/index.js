import { fail, ok } from '@/shared/domain/response.usecase';
import { availableBrandsForConfig, parseMaxQty } from '../domain/configuration.rules';
import { validateCrewDraft } from '../domain/crew-account.rules';
import { findScheduleConflict, sortWeekDays, validateScheduleDraft } from '../domain/schedule.rules';
import { CatalogUseCasePort } from '../port/usecase.port';

const groupByProductCategory = (products = []) => {
  const groups = new Map();

  products.forEach((product) => {
    if (!groups.has(product.categoryId)) {
      groups.set(product.categoryId, {
        categoryId: product.categoryId,
        categoryName: product.categoryName,
        products: [],
      });
    }
    groups.get(product.categoryId).products.push(product);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
};

export class CatalogUseCase extends CatalogUseCasePort {
  constructor(repository) {
    super();
    this.repository = repository;
  }

  getMasterSummary = async () => {
    try {
      const [brands, outlets, suppliers, products, schedules] = await Promise.all([
        this.repository.listBrands(),
        this.repository.listOutlets(),
        this.repository.listSuppliers(),
        this.repository.listProducts(),
        this.repository.listSchedules(),
      ]);

      return ok(
        {
          brands: brands.length,
          outlets: outlets.length,
          suppliers: suppliers.length,
          products: products.length,
          activeProducts: products.filter((product) => product.active).length,
          schedules: schedules.length,
          activeSchedules: schedules.filter((schedule) => schedule.active).length,
        },
        'Ringkasan master data berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat ringkasan master data');
    }
  };

  listProducts = async (filter) => {
    try {
      return ok(await this.repository.listProducts(filter), 'Daftar produk berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat daftar produk');
    }
  };

  listOutlets = async () => {
    try {
      return ok(await this.repository.listOutlets(), 'Daftar outlet berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat daftar outlet');
    }
  };

  listBrands = async () => {
    try {
      return ok(await this.repository.listBrands(), 'Daftar brand berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat daftar brand');
    }
  };

  listSchedules = async () => {
    try {
      return ok(await this.repository.listSchedules(), 'Daftar jadwal berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat daftar jadwal');
    }
  };

  getSchedule = async (id) => {
    try {
      const schedule = await this.repository.getSchedule(id);
      if (!schedule) return fail(new Error('Jadwal tidak ditemukan'));
      return ok(schedule, 'Detail jadwal berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat detail jadwal');
    }
  };

  saveSchedule = async ({ id = null, draft, actor, now = new Date() }) => {
    try {
      const payload = { ...draft, scheduleDays: sortWeekDays(draft.scheduleDays) };
      const errors = validateScheduleDraft({ ...payload, isEditing: Boolean(id) }, now);

      if (Object.keys(errors).length) {
        return { error: new Error('Form belum lengkap'), message: 'Form belum lengkap', errors };
      }

      const schedules = await this.repository.listSchedules();
      const conflict = findScheduleConflict({ schedules, draft: payload, excludeId: id });

      if (conflict) {
        return {
          error: new Error('Jadwal bentrok'),
          message: 'Jadwal gagal disimpan',
          errors: {
            scheduleTiming: `Outlet ini sudah punya jadwal pada hari dan jam yang sama (${conflict.scheduleDays.join(', ')} / ${conflict.reminderHour} WIB).`,
          },
        };
      }

      const saved = id
        ? await this.repository.updateSchedule(id, payload, actor)
        : await this.repository.createSchedule(payload, actor);

      return ok(saved, 'Berhasil Menyimpan Jadwal');
    } catch (error) {
      return fail(error, 'Jadwal gagal disimpan');
    }
  };

  listCrewAccounts = async () => {
    try {
      return ok(await this.repository.listCrewAccounts(), 'Daftar akun crew berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat akun crew');
    }
  };

  saveCrewAccount = async ({ id = null, draft, actor }) => {
    try {
      const accounts = await this.repository.listCrewAccounts();
      const existingEmails = accounts
        .filter((account) => account.id !== id)
        .map((account) => account.email.toLowerCase());

      const errors = validateCrewDraft(draft, { isEditing: Boolean(id), existingEmails });
      if (Object.keys(errors).length) {
        return { error: new Error('Form belum lengkap'), message: 'Form belum lengkap', errors };
      }

      const saved = id
        ? await this.repository.updateCrewAccount(id, draft, actor)
        : await this.repository.createCrewAccount(draft, actor);

      return ok(
        saved,
        id ? 'Berhasil Mengubah Pengguna' : 'Berhasil Menambahkan Pengguna',
      );
    } catch (error) {
      return fail(error, 'Akun crew gagal disimpan');
    }
  };

  listWasteCategories = async () => {
    try {
      return ok(await this.repository.listWasteCategories(), 'Daftar kategori waste berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat kategori waste');
    }
  };

  listWasteAppConfig = async () => {
    try {
      const [categories, configs, uomLimits] = await Promise.all([
        this.repository.listWasteCategories(),
        this.repository.listWasteProductConfig(),
        this.repository.listUomLimits(),
      ]);

      const configByCategory = new Map(configs.map((config) => [config.wasteCategoryId, config]));

      return ok(
        {
          categories: categories.map((category) => {
            const config = configByCategory.get(category.id);
            return {
              ...category,
              totalProducts: config?.productIds.length ?? 0,
              updatedAt: config?.updatedAt ?? null,
              updatedBy: config?.updatedBy ?? null,
            };
          }),
          uomLimits,
        },
        'Konfigurasi stock waste app berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat konfigurasi stock waste app');
    }
  };

  getWasteCategoryDetail = async (categoryId) => {
    try {
      const [categories, config, products] = await Promise.all([
        this.repository.listWasteCategories(),
        this.repository.getWasteCategoryConfig(categoryId),
        this.repository.listProducts(),
      ]);

      const category = categories.find((item) => item.id === categoryId);
      if (!category || !config) return fail(new Error('Kategori waste tidak ditemukan'));

      const assigned = new Set(config.productIds);
      const assignedProducts = products.filter((product) => assigned.has(product.id));

      return ok(
        {
          ...category,
          totalProducts: assignedProducts.length,
          updatedAt: config.updatedAt,
          updatedBy: config.updatedBy,
          groups: groupByProductCategory(assignedProducts),
        },
        'Detail kategori waste berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat detail kategori waste');
    }
  };

  getWasteInputSheet = async ({ outletId }) => {
    try {
      const [categories, configs, products, uomLimits, outlets, stock] = await Promise.all([
        this.repository.listWasteCategories(),
        this.repository.listWasteProductConfig(),
        this.repository.listProducts(),
        this.repository.listUomLimits(),
        this.repository.listOutlets(),
        this.repository.getOutletStock(outletId),
      ]);

      const outlet = outlets.find((item) => item.id === outletId);
      if (!outlet) return fail(new Error('Outlet tidak ditemukan'));

      const maxByUom = new Map(uomLimits.map((limit) => [limit.uom, limit.maxQty]));
      const productById = new Map(products.map((product) => [product.id, product]));
      const configByCategory = new Map(configs.map((config) => [config.wasteCategoryId, config]));

      const sheetCategories = categories
        .filter((category) => !category.isReturn)
        .map((category) => {
          const productIds = configByCategory.get(category.id)?.productIds ?? [];

          const categoryProducts = productIds
            .map((productId) => productById.get(productId))
            .filter((product) => product?.active)
            .map((product) => ({
              id: product.id,
              code: product.code,
              name: product.shortName,
              fullName: product.name,
              brandName: product.brandName,
              uom: product.uom,
              maxQty: maxByUom.get(product.uom) ?? null,
              stockOnHand: stock.get(product.id) ?? 0,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          return {
            id: category.id,
            name: category.name,
            requiresExpiryDate: category.requiresExpiryDate,
            products: categoryProducts,
          };
        })
        .filter((category) => category.products.length > 0);

      return ok(
        { outlet, categories: sheetCategories },
        'Lembar isian waste berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat lembar isian waste');
    }
  };

  getOutletStockSheet = async ({ outletId }) => {
    try {
      const [products, outlets, stock] = await Promise.all([
        this.repository.listProducts(),
        this.repository.listOutlets(),
        this.repository.getOutletStock(outletId),
      ]);

      const outlet = outlets.find((item) => item.id === outletId);
      if (!outlet) return fail(new Error('Outlet tidak ditemukan'));

      const rows = products
        .map((product) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          brandName: product.brandName,
          uom: product.uom,
          quantity: stock.get(product.id) ?? 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return ok({ outlet, rows }, 'Stok outlet berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat stok outlet');
    }
  };

  listAssignableProducts = async (categoryId) => {
    try {
      const [config, products] = await Promise.all([
        this.repository.getWasteCategoryConfig(categoryId),
        this.repository.listProducts(),
      ]);

      if (!config) return fail(new Error('Kategori waste tidak ditemukan'));

      const assigned = new Set(config.productIds);
      const available = products.filter((product) => !assigned.has(product.id));

      return ok(groupByProductCategory(available), 'Daftar produk tersedia berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat produk yang bisa ditambahkan');
    }
  };

  addProductsToWasteCategory = async ({ categoryId, productIds, actor }) => {
    try {
      if (!productIds?.length) return fail(new Error('Belum ada produk yang dipilih'));
      await this.repository.addProductsToWasteCategory(categoryId, productIds, actor);
      return ok(null, 'Produk Berhasil Ditambahkan');
    } catch (error) {
      return fail(error, 'Produk gagal ditambahkan');
    }
  };

  removeProductsFromWasteCategory = async ({ categoryId, productIds, actor }) => {
    try {
      if (!productIds?.length) return fail(new Error('Belum ada produk yang dipilih'));
      await this.repository.removeProductsFromWasteCategory(categoryId, productIds, actor);
      return ok(null, 'Produk berhasil dihapus dari kategori');
    } catch (error) {
      return fail(error, 'Produk gagal dihapus');
    }
  };

  updateUomLimit = async ({ id, maxQty, actor }) => {
    try {
      const parsed = parseMaxQty(maxQty);
      if (parsed === null) {
        return fail(new Error('Batas kuantitas harus bilangan bulat tidak negatif'), 'Data Gagal Diubah');
      }

      await this.repository.updateUomLimit(id, parsed, actor);
      return ok(null, 'Data Berhasil Diubah');
    } catch (error) {
      return fail(error, 'Data Gagal Diubah');
    }
  };

  listReturnWasteConfig = async () => {
    try {
      const [configs, brands] = await Promise.all([
        this.repository.listReturnWasteConfig(),
        this.repository.listBrands(),
      ]);

      return ok(
        { configs, availableBrands: availableBrandsForConfig(brands, configs) },
        'Konfigurasi return waste berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat konfigurasi return waste');
    }
  };

  createReturnWasteConfig = async ({ brandId, configuration, actor }) => {
    try {
      if (!brandId || !configuration) return fail(new Error('Brand dan konfigurasi wajib diisi'));
      await this.repository.createReturnWasteConfig({ brandId, configuration }, actor);
      return ok(null, 'Konfigurasi Berhasil ditambahkan');
    } catch (error) {
      return fail(error, 'Konfigurasi gagal ditambahkan');
    }
  };

  updateReturnWasteConfig = async ({ id, configuration, status, actor }) => {
    try {
      await this.repository.updateReturnWasteConfig(id, { configuration, status }, actor);
      return ok(null, 'Konfigurasi Berhasil diedit');
    } catch (error) {
      return fail(error, 'Konfigurasi gagal diedit');
    }
  };
}
