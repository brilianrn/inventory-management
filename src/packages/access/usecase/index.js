import { fail, ok } from '@/shared/domain/response.usecase';
import { validateNewUser, validateUserInfo } from '../domain/user-account.rules';
import { RESTRICTED_CUTOFF_HOUR } from '../domain/permission.catalog';
import {
  canActNow,
  createAccessProfile,
  hasPermission,
  isRestricted,
  isWithinRestrictedWindow,
} from '../domain/permission.rules';
import { AccessUseCasePort } from '../port/usecase.port';

export class AccessUseCase extends AccessUseCasePort {
  constructor(repository) {
    super();
    this.repository = repository;
  }

  listUsers = async () => {
    try {
      const users = await this.repository.listUsers();
      return ok(users, 'Daftar pengguna berhasil dimuat');
    } catch (error) {
      return fail(error, 'Gagal memuat daftar pengguna');
    }
  };

  getUserAccess = async (id) => {
    try {
      const user = await this.repository.getUserById(id);
      if (!user) return fail(new Error('Pengguna tidak ditemukan'));

      return ok(
        { ...user, access: createAccessProfile(user.permissions, user.attributes) },
        'Detail pengguna berhasil dimuat',
      );
    } catch (error) {
      return fail(error, 'Gagal memuat detail pengguna');
    }
  };

  createUser = async (draft) => {
    try {
      const users = await this.repository.listUsers();
      const errors = validateNewUser(draft, users.map((user) => user.email));
      if (Object.keys(errors).length) return { ...fail(new Error('Form belum valid')), errors };

      const user = await this.repository.createUser(draft);
      return ok(user, 'Data Berhasil Ditambahkan');
    } catch (error) {
      return fail(error, 'Gagal menambahkan pengguna');
    }
  };

  updateUserInfo = async (id, draft) => {
    try {
      const errors = validateUserInfo(draft);
      if (Object.keys(errors).length) return { ...fail(new Error('Form belum valid')), errors };

      const user = await this.repository.updateUserInfo(id, draft);
      return ok(user, 'Informasi Berhasil Dirubah');
    } catch (error) {
      return fail(error, 'Gagal mengubah informasi pengguna');
    }
  };

  assignPermissions = async (id, grant) => {
    try {
      const saved = await this.repository.saveUserGrant(id, {
        permissions: grant.permissions ?? [],
        attributes: grant.attributes ?? {},
      });
      return ok(saved, 'User role berhasil disimpan');
    } catch (error) {
      return fail(error, 'Gagal menyimpan hak akses pengguna');
    }
  };

  evaluateAction = async ({ access, code, now = new Date(), cutoffHour = RESTRICTED_CUTOFF_HOUR }) => {
    try {
      if (!hasPermission(access, code)) {
        return ok({ allowed: false, reason: 'no-permission' }, 'Izin tidak dimiliki');
      }

      const restricted = isRestricted(access, code);
      const withinWindow = isWithinRestrictedWindow({ restricted, now, cutoffHour });

      if (!withinWindow) {
        return ok(
          { allowed: false, reason: 'outside-window' },
          `Izin bermode Restricted hanya berlaku sampai pukul ${String(cutoffHour).padStart(2, '0')}:00`,
        );
      }

      return ok({ allowed: true, reason: null }, 'Aksi diizinkan');
    } catch (error) {
      return fail(error, 'Gagal mengevaluasi izin aksi');
    }
  };

  canActNow = ({ access, code, now = new Date(), cutoffHour = RESTRICTED_CUTOFF_HOUR }) =>
    canActNow({ access, code, now, cutoffHour });
}
