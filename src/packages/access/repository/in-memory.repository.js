import { PERMISSIONS } from '../domain/permission.catalog';
import { AccessRepositoryPort } from '../port/repository.port';

export class InMemoryAccessRepository extends AccessRepositoryPort {
  constructor(seed) {
    super();
    this.users = seed.users.map((user) => ({ ...user }));
  }

  listUsers = async () =>
    this.users.map(({ permissions, attributes, ...user }) => ({
      ...user,
      permissionCount: permissions.length,
    }));

  getUserById = async (id) => {
    const user = this.users.find((item) => item.id === id);
    return user ? { ...user, permissions: [...user.permissions], attributes: { ...user.attributes } } : null;
  };

  createUser = async ({ name, email }) => {
    const sequence = this.users.length + 1;
    const user = {
      id: `USR${String(sequence).padStart(2, '0')}`,
      name: name.trim(),
      email: email.trim(),
      jobTitle: 'Belum diatur',
      outlet: null,
      status: true,
      createdAt: new Date().toISOString(),
      permissions: [],
      attributes: {},
    };

    this.users.unshift(user);
    return { ...user };
  };

  updateUserInfo = async (id, { status }) => {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Pengguna tidak ditemukan');

    this.users[index] = { ...this.users[index], status: Boolean(status) };
    return { ...this.users[index] };
  };

  saveUserGrant = async (id, grant) => {
    const index = this.users.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Pengguna tidak ditemukan');

    this.users[index] = {
      ...this.users[index],
      permissions: [...new Set(grant.permissions)],
      attributes: { ...grant.attributes },
    };

    return { ...this.users[index] };
  };

  listPermissionCatalog = async () => PERMISSIONS.map((permission) => ({ ...permission }));
}
