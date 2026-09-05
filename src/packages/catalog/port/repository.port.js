export class CatalogRepositoryPort {
  async listBrands() {
    throw new Error('CatalogRepositoryPort.listBrands() belum diimplementasi');
  }

  async listOutlets() {
    throw new Error('CatalogRepositoryPort.listOutlets() belum diimplementasi');
  }

  async listSuppliers() {
    throw new Error('CatalogRepositoryPort.listSuppliers() belum diimplementasi');
  }

  async listProducts(filter) {
    throw new Error('CatalogRepositoryPort.listProducts() belum diimplementasi');
  }

  async listWasteCategories() {
    throw new Error('CatalogRepositoryPort.listWasteCategories() belum diimplementasi');
  }

  async listSchedules() {
    throw new Error('CatalogRepositoryPort.listSchedules() belum diimplementasi');
  }

  async getSchedule(id) {
    throw new Error('CatalogRepositoryPort.getSchedule() belum diimplementasi');
  }

  async createSchedule(payload, actor) {
    throw new Error('CatalogRepositoryPort.createSchedule() belum diimplementasi');
  }

  async updateSchedule(id, payload, actor) {
    throw new Error('CatalogRepositoryPort.updateSchedule() belum diimplementasi');
  }

  async listCrewAccounts() {
    throw new Error('CatalogRepositoryPort.listCrewAccounts() belum diimplementasi');
  }

  async createCrewAccount(payload, actor) {
    throw new Error('CatalogRepositoryPort.createCrewAccount() belum diimplementasi');
  }

  async updateCrewAccount(id, payload, actor) {
    throw new Error('CatalogRepositoryPort.updateCrewAccount() belum diimplementasi');
  }

  async listWasteProductConfig() {
    throw new Error('CatalogRepositoryPort.listWasteProductConfig() belum diimplementasi');
  }

  async getWasteCategoryConfig(categoryId) {
    throw new Error('CatalogRepositoryPort.getWasteCategoryConfig() belum diimplementasi');
  }

  async addProductsToWasteCategory(categoryId, productIds, actor) {
    throw new Error('CatalogRepositoryPort.addProductsToWasteCategory() belum diimplementasi');
  }

  async removeProductsFromWasteCategory(categoryId, productIds, actor) {
    throw new Error('CatalogRepositoryPort.removeProductsFromWasteCategory() belum diimplementasi');
  }

  async listUomLimits() {
    throw new Error('CatalogRepositoryPort.listUomLimits() belum diimplementasi');
  }

  async getOutletStock(outletId) {
    throw new Error('CatalogRepositoryPort.getOutletStock() belum diimplementasi');
  }

  async updateUomLimit(id, maxQty, actor) {
    throw new Error('CatalogRepositoryPort.updateUomLimit() belum diimplementasi');
  }

  async listReturnWasteConfig() {
    throw new Error('CatalogRepositoryPort.listReturnWasteConfig() belum diimplementasi');
  }

  async createReturnWasteConfig(payload, actor) {
    throw new Error('CatalogRepositoryPort.createReturnWasteConfig() belum diimplementasi');
  }

  async updateReturnWasteConfig(id, payload, actor) {
    throw new Error('CatalogRepositoryPort.updateReturnWasteConfig() belum diimplementasi');
  }
}
