
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const capitalizeName = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export const validateCrewDraft = (draft, { isEditing = false, existingEmails = [] } = {}) => {
  const errors = {};

  if (!isEditing) {
    if (!draft.name?.trim()) errors.name = 'Nama tidak boleh kosong';

    if (!draft.email?.trim()) errors.email = 'Email tidak boleh kosong';
    else if (!EMAIL_PATTERN.test(draft.email.trim())) {
      errors.email = 'Format email yang kamu masukkan salah';
    } else if (existingEmails.includes(draft.email.trim().toLowerCase())) {
      errors.email = 'Email sudah pernah didaftarkan';
    }
  }

  if (!draft.outletId) errors.outletId = 'Nama outlet wajib dipilih';

  return errors;
};

export const isCrewDraftValid = (draft, options) =>
  Object.keys(validateCrewDraft(draft, options)).length === 0;
