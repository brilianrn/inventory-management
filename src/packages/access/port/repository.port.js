export class AccessRepositoryPort {
  async listUsers() {
    throw new Error('AccessRepositoryPort.listUsers() belum diimplementasi');
  }

  async getUserById(id) {
    throw new Error('AccessRepositoryPort.getUserById() belum diimplementasi');
  }

  async createUser(params) {
    throw new Error('AccessRepositoryPort.createUser() belum diimplementasi');
  }

  async updateUserInfo(id, params) {
    throw new Error('AccessRepositoryPort.updateUserInfo() belum diimplementasi');
  }

  async saveUserGrant(id, grant) {
    throw new Error('AccessRepositoryPort.saveUserGrant() belum diimplementasi');
  }

  async listPermissionCatalog() {
    throw new Error('AccessRepositoryPort.listPermissionCatalog() belum diimplementasi');
  }
}
