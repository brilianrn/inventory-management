export class DocumentRepositoryPort {
  async listStockTakeDocuments(filter) {
    throw new Error('DocumentRepositoryPort.listStockTakeDocuments() belum diimplementasi');
  }

  async getStockTakeDocument(id) {
    throw new Error('DocumentRepositoryPort.getStockTakeDocument() belum diimplementasi');
  }

  async saveStockTakeCounts(id, counts) {
    throw new Error('DocumentRepositoryPort.saveStockTakeCounts() belum diimplementasi');
  }

  async validateStockTakeDocuments(ids, validatedBy) {
    throw new Error('DocumentRepositoryPort.validateStockTakeDocuments() belum diimplementasi');
  }

  async getCountingSheet(scheduleId) {
    throw new Error('DocumentRepositoryPort.getCountingSheet() belum diimplementasi');
  }

  async startCountingSession(payload) {
    throw new Error('DocumentRepositoryPort.startCountingSession() belum diimplementasi');
  }

  async saveProductCount(sessionId, productId, counted) {
    throw new Error('DocumentRepositoryPort.saveProductCount() belum diimplementasi');
  }

  async submitCountingSession(payload) {
    throw new Error('DocumentRepositoryPort.submitCountingSession() belum diimplementasi');
  }

  async submitWasteSession(params) {
    throw new Error('DocumentRepositoryPort.submitWasteSession() belum diimplementasi');
  }

  async listWasteDocuments(filter) {
    throw new Error('DocumentRepositoryPort.listWasteDocuments() belum diimplementasi');
  }

  async getWasteDocument(id) {
    throw new Error('DocumentRepositoryPort.getWasteDocument() belum diimplementasi');
  }

  async listReturnWasteDocuments(filter) {
    throw new Error('DocumentRepositoryPort.listReturnWasteDocuments() belum diimplementasi');
  }

  async getReturnWasteDocument(id) {
    throw new Error('DocumentRepositoryPort.getReturnWasteDocument() belum diimplementasi');
  }

  async getDeliveryOrder(id) {
    throw new Error('DocumentRepositoryPort.getDeliveryOrder() belum diimplementasi');
  }

  async validateDeliveryOrder(params) {
    throw new Error('DocumentRepositoryPort.validateDeliveryOrder() belum diimplementasi');
  }

  async syncDeliveryOrders() {
    throw new Error('DocumentRepositoryPort.syncDeliveryOrders() belum diimplementasi');
  }

  async resendDraftOrders() {
    throw new Error('DocumentRepositoryPort.resendDraftOrders() belum diimplementasi');
  }

  async listDeliveryOrders(filter) {
    throw new Error('DocumentRepositoryPort.listDeliveryOrders() belum diimplementasi');
  }
}
