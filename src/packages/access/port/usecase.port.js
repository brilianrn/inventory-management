export class AccessUseCasePort {
  async listUsers() {
    throw new Error('AccessUseCasePort.listUsers() belum diimplementasi');
  }

  async getUserAccess(id) {
    throw new Error('AccessUseCasePort.getUserAccess() belum diimplementasi');
  }

  async createUser(draft) {
    throw new Error('AccessUseCasePort.createUser() belum diimplementasi');
  }

  async updateUserInfo(id, draft) {
    throw new Error('AccessUseCasePort.updateUserInfo() belum diimplementasi');
  }

  async assignPermissions(id, grant) {
    throw new Error('AccessUseCasePort.assignPermissions() belum diimplementasi');
  }

  async evaluateAction({ access, code, now }) {
    throw new Error('AccessUseCasePort.evaluateAction() belum diimplementasi');
  }
}
