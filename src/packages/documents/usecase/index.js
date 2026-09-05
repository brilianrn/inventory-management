import { fail, ok } from '@/shared/domain/response.usecase';
import { canViewPhotos, isValidatable, validateCancelNote } from '../domain/receiving.rules';
import { DeliveryOrderStatus, StockTakeStatus } from '../domain/status';
import { resolveAllowValidate, selectBulkValidatable, summarizeStockTakeLines } from '../domain/stocktake.rules';
import { buildSubmissionCounts, sheetProgress } from '../domain/counting.rules';
import { displayedWasteCategoryName, shouldShowExpiryColumn } from '../domain/waste.rules';
import { DocumentUseCasePort } from '../port/usecase.port';

const countByStatus = (documents) =>
  documents.reduce((acc, document) => {
    acc[document.status] = (acc[document.status] ?? 0) + 1;
    return acc;
  }, {});

const isSameDay = (value, reference) => {
  const date = new Date(value);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
};

const withDisplayCategory = (document) => ({
  ...document,
  displayCategoryName: displayedWasteCategoryName(document.wasteCategoryName),
});

export class DocumentUseCase extends DocumentUseCasePort {
  constructor(repository) {
    super();
    this.repository = repository;
  }

  getOperationalSummary = async ({ now = new Date() } = {}) => {
    try {
      const [stockTake, waste, returnWaste, orders] = await Promise.all([
        this.repository.listStockTakeDocuments(),
        this.repository.listWasteDocuments(),
        this.repository.listReturnWasteDocuments(),
        this.repository.listDeliveryOrders(),
      ]);

      const stockTakeStatus = countByStatus(stockTake);
      const orderStatus = countByStatus(orders);

      return ok(
        {
          stockTake: {
            total: stockTake.length,
            today: stockTake.filter((document) => isSameDay(document.date, now)).length,
            awaitingValidation: stockTakeStatus[StockTakeStatus.UNVALIDATED] ?? 0,
            validated: stockTakeStatus[StockTakeStatus.VALIDATED] ?? 0,
            bulkValidatable: selectBulkValidatable({ documents: stockTake, now }).length,
            byStatus: stockTakeStatus,
          },
          waste: {
            total: waste.length,
            today: waste.filter((document) => isSameDay(document.date, now)).length,
            itemCount: waste.reduce((sum, document) => sum + document.itemCount, 0),
          },
          returnWaste: {
            total: returnWaste.length,
            today: returnWaste.filter((document) => isSameDay(document.date, now)).length,
            itemCount: returnWaste.reduce((sum, document) => sum + document.itemCount, 0),
          },
          deliveryOrders: {
            total: orders.length,
            today: orders.filter((order) => isSameDay(order.shippingDate, now)).length,
            awaitingReceipt:
              (orderStatus[DeliveryOrderStatus.SENT] ?? 0) + (orderStatus[DeliveryOrderStatus.DRAFT] ?? 0),
            needsAttention: orders.filter((order) => order.needsAttention).length,
            byStatus: orderStatus,
          },
        },
        'Ringkasan operasional berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat ringkasan operasional');
    }
  };

  listStockTakeDocuments = async ({ filter, restricted = false, now = new Date() } = {}) => {
    try {
      const documents = await this.repository.listStockTakeDocuments(filter);

      return ok(
        documents.map((document) => ({
          ...document,
          isAllowValidate: resolveAllowValidate({ document, restricted, now }),
        })),
        'Daftar dokumen stock take berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat dokumen stock take');
    }
  };

  getStockTakeDetail = async ({ id, restricted = false, now = new Date() }) => {
    try {
      const document = await this.repository.getStockTakeDocument(id);
      if (!document) return fail(new Error('Dokumen tidak ditemukan'));

      const summary = summarizeStockTakeLines(document.lines);

      return ok(
        {
          ...document,
          ...summary,
          isAllowValidate: resolveAllowValidate({ document, restricted, now }),
        },
        'Detail dokumen berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat detail dokumen');
    }
  };

  saveStockTakeCounts = async ({ id, counts, restricted = false, now = new Date() }) => {
    try {
      const document = await this.repository.getStockTakeDocument(id);
      if (!document) return fail(new Error('Dokumen tidak ditemukan'));

      if (!resolveAllowValidate({ document, restricted, now })) {
        return fail(new Error('Dokumen tidak bisa disunting saat ini'), 'Data Gagal Diedit');
      }

      await this.repository.saveStockTakeCounts(id, counts);
      return ok(null, 'Data Berhasil Diedit');
    } catch (error) {
      return fail(error, 'Data Gagal Diedit');
    }
  };

  validateStockTake = async ({ ids = [], validatedBy, restricted = false, now = new Date() }) => {
    try {
      const documents = await this.repository.listStockTakeDocuments();
      const allowed = documents
        .filter((document) => ids.includes(document.id))
        .filter((document) => resolveAllowValidate({ document, restricted, now }))
        .map((document) => document.id);

      if (!allowed.length) {
        return fail(new Error('Tidak ada dokumen yang bisa divalidasi'), 'Data Gagal Divalidasi');
      }

      const validated = await this.repository.validateStockTakeDocuments(allowed, validatedBy);
      return ok(validated, 'Data Berhasil Divalidasi');
    } catch (error) {
      return fail(error, 'Data Gagal Divalidasi');
    }
  };

  listBulkValidatable = async ({ now = new Date(), restricted = false } = {}) => {
    try {
      const documents = await this.repository.listStockTakeDocuments();
      const candidates = selectBulkValidatable({ documents, now }).filter((document) =>
        resolveAllowValidate({ document, restricted, now }),
      );
      return ok(candidates, 'Kandidat validasi massal berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat kandidat validasi massal');
    }
  };

  getCountingSheet = async (scheduleId) => {
    try {
      const sheet = await this.repository.getCountingSheet(scheduleId);
      if (!sheet) return fail(new Error('Jadwal tidak ditemukan'));
      if (!sheet.brands.length) {
        return fail(new Error('Jadwal ini belum punya brand yang bisa dihitung'));
      }
      return ok(sheet, 'Lembar hitung berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat lembar hitung');
    }
  };

  startCounting = async ({ scheduleId, crewId, crewName, startedAt = new Date().toISOString() }) => {
    try {
      const session = await this.repository.startCountingSession({
        scheduleId,
        crewId,
        crewName,
        startedAt,
      });
      return ok(session, 'Sesi perhitungan dimulai');
    } catch (error) {
      return fail(error, 'Gagal memulai sesi perhitungan');
    }
  };

  saveProductCount = async ({ sessionId, productId, counted }) => {
    try {
      const result = await this.repository.saveProductCount(sessionId, productId, counted ?? 0);
      return ok(result, 'Hasil hitung tersimpan');
    } catch (error) {
      return fail(error, 'Hasil hitung gagal tersimpan');
    }
  };

  submitCounting = async ({ sheet, counts, crewName, startedAt, autoSubmitted = false }) => {
    try {
      const payload = buildSubmissionCounts(sheet.brands, counts);
      const progress = sheetProgress(sheet.brands, counts);

      const document = await this.repository.submitCountingSession({
        scheduleId: sheet.scheduleId,
        crewName,
        startedAt,
        counts: payload,
        autoSubmitted,
      });

      return ok(
        { document, progress },
        autoSubmitted ? 'Waktu habis — hitungan dikirim otomatis' : 'Berhasil Mengisi Stocktake',
      );
    } catch (error) {
      return fail(error, 'Gagal mengirim hasil hitung');
    }
  };

  submitWaste = async ({ outletId, crewName, categories = [], submittedAt }) => {
    try {
      const filled = categories.filter((entry) => entry.items?.length);
      if (!filled.length) return fail(new Error('Belum ada kategori yang berisi produk'));

      const documents = await this.repository.submitWasteSession({
        outletId,
        crewName,
        submittedAt,
        categories: filled,
      });

      return ok(
        { documents, documentCount: documents.length },
        `Berhasil mengirim ${documents.length} dokumen waste`,
      );
    } catch (error) {
      return fail(error, 'Tidak dapat melakukan submit form. Coba kembali sesaat lagi.');
    }
  };

  listWasteDocuments = async (filter) => {
    try {
      const documents = await this.repository.listWasteDocuments(filter);
      return ok(documents.map(withDisplayCategory), 'Daftar dokumen waste berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat dokumen waste');
    }
  };

  getWasteDetail = async (id) => {
    try {
      const document = await this.repository.getWasteDocument(id);
      if (!document) return fail(new Error('Dokumen tidak ditemukan'));

      return ok(
        {
          ...withDisplayCategory(document),
          showExpiryColumn: shouldShowExpiryColumn(document.lines),
        },
        'Detail dokumen waste berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat detail dokumen waste');
    }
  };

  listReturnWasteDocuments = async (filter) => {
    try {
      return ok(
        await this.repository.listReturnWasteDocuments(filter),
        'Daftar dokumen return waste berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat dokumen return waste');
    }
  };

  getReturnWasteDetail = async (id) => {
    try {
      const document = await this.repository.getReturnWasteDocument(id);
      if (!document) return fail(new Error('Dokumen tidak ditemukan'));

      return ok(
        { ...document, showExpiryColumn: shouldShowExpiryColumn(document.lines) },
        'Detail dokumen return waste berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat detail dokumen return waste');
    }
  };

  getDeliveryOrderDetail = async (id) => {
    try {
      const order = await this.repository.getDeliveryOrder(id);
      if (!order) return fail(new Error('Delivery order tidak ditemukan'));

      return ok(
        { ...order, canValidate: isValidatable(order.status), canViewPhotos: canViewPhotos(order) },
        'Detail delivery order berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat detail delivery order');
    }
  };

  validateDeliveryOrder = async ({ id, action, note = '', actor, photos = [] }) => {
    try {
      if (action === 'cancel') {
        const problem = validateCancelNote(note);
        if (problem) return fail(new Error(problem), problem);
      }

      const order = await this.repository.validateDeliveryOrder({ id, action, note, actor, photos });

      return ok(
        order,
        action === 'receive' ? 'Konfirmasi Berhasil' : 'DO Berhasil Dibatalkan',
      );
    } catch (error) {
      return fail(error, 'Konfirmasi DO gagal dikirim, silakan melakukan konfirmasi ulang.');
    }
  };

  syncDeliveryOrders = async () => {
    try {
      const { sent } = await this.repository.syncDeliveryOrders();
      return ok({ sent }, `Data DO diperbarui — ${sent} draf ikut terkirim ke outlet`);
    } catch (error) {
      return fail(error, 'Gagal menarik ulang data DO');
    }
  };

  resendDraftOrders = async () => {
    try {
      const { sent } = await this.repository.resendDraftOrders();
      return ok({ sent }, 'Seluruh Draf DO Terkirim!');
    } catch (error) {
      return fail(error, 'Gagal mengirim ulang draf DO');
    }
  };

  listDeliveryOrders = async (filter) => {
    try {
      return ok(await this.repository.listDeliveryOrders(filter), 'Daftar delivery order berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat delivery order');
    }
  };
}
