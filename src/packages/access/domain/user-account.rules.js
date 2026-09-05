
export const MAX_FIELD_LENGTH = 255;

export const BLOCKED_PASSWORD_KEYS = ['e', 'E', '+', '-', '.', ','];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email = '') => EMAIL_PATTERN.test(email.trim());

export const validateNewUser = (draft = {}, existingEmails = []) => {
  const errors = {};
  const name = draft.name?.trim() ?? '';
  const email = draft.email?.trim() ?? '';
  const password = draft.password ?? '';
  const confirmPassword = draft.confirmPassword ?? '';

  if (!name) errors.name = 'Silahkan isi nama user terlebih dahulu';
  else if (name.length > MAX_FIELD_LENGTH) errors.name = `Maksimal ${MAX_FIELD_LENGTH} karakter`;

  if (!email) errors.email = 'Silahkan isi email user terlebih dahulu';
  else if (!isValidEmail(email)) errors.email = 'Tulis email dengan format alamatemail@email.com';
  else if (existingEmails.some((item) => item.toLowerCase() === email.toLowerCase())) {
    errors.email = 'Email sudah pernah didaftarkan';
  }

  if (!password) errors.password = 'Silahkan isi password user terlebih dahulu';

  if (!confirmPassword) {
    errors.confirmPassword = 'Silahkan isi konfirmasi password user terlebih dahulu';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Password tidak sama';
  }

  return errors;
};

export const isNewUserValid = (draft, existingEmails) =>
  Object.keys(validateNewUser(draft, existingEmails)).length === 0;

export const validateUserInfo = (draft = {}) => {
  const errors = {};
  const password = draft.password ?? '';
  const confirmPassword = draft.confirmPassword ?? '';

  if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Password Tidak Sesuai';
  }
  if (!password && confirmPassword) {
    errors.password = 'Silahkan isi password terlebih dahulu';
  }

  return errors;
};

export const isUserInfoValid = (draft) => Object.keys(validateUserInfo(draft)).length === 0;

export const filterUsers = (users = [], query = '') => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return users;
  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword),
  );
};

const sameSet = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

export const hasGrantChanged = (current = {}, draft = {}) => {
  if (!sameSet(current.permissions, draft.permissions)) return true;

  const codes = new Set([
    ...Object.keys(current.attributes ?? {}),
    ...Object.keys(draft.attributes ?? {}),
  ]);

  for (const code of codes) {
    if (!draft.permissions?.includes(code)) continue;
    if (Boolean(current.attributes?.[code]?.restricted) !== Boolean(draft.attributes?.[code]?.restricted)) {
      return true;
    }
  }

  return false;
};

export const toggleGrantPermission = (grant, code) => {
  const has = grant.permissions.includes(code);
  const permissions = has
    ? grant.permissions.filter((item) => item !== code)
    : [...grant.permissions, code];

  const attributes = { ...grant.attributes };
  if (has) delete attributes[code];

  return { permissions, attributes };
};
