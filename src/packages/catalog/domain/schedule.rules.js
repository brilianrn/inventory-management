
export const WEEK_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const WEEKEND_DAYS = ['Sabtu', 'Minggu'];

export const REMINDER_HOURS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, '0');
  const minute = String((index % 4) * 15).padStart(2, '0');
  return `${hour}:${minute}`;
});

export const SCHEDULE_STATUSES = [
  { code: 'active', label: 'Aktif' },
  { code: 'inactive', label: 'Nonaktif' },
];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const isStartDateAllowed = (value, now = new Date()) => {
  if (!value) return false;
  return startOfDay(value) >= startOfDay(now);
};

export const findScheduleConflict = ({ schedules = [], draft, excludeId = null }) =>
  schedules.find((schedule) => {
    if (schedule.id === excludeId) return false;
    if (schedule.outletId !== draft.outletId) return false;
    if (schedule.reminderHour !== draft.reminderHour) return false;
    return schedule.scheduleDays.some((day) => draft.scheduleDays.includes(day));
  }) ?? null;

export const validateScheduleDraft = (draft, now = new Date()) => {
  const errors = {};

  if (!draft.outletId) errors.outletId = 'Nama outlet wajib dipilih';
  if (!draft.brandIds?.length) errors.brandIds = 'Pilih minimal satu brand';

  if (!draft.startDate) errors.startDate = 'Tanggal mulai wajib diisi';
  else if (!isStartDateAllowed(draft.startDate, now)) {
    errors.startDate = 'Tanggal mulai tidak boleh sebelum hari ini';
  }

  if (!draft.scheduleDays?.length) errors.scheduleDays = 'Pilih minimal satu hari';
  if (!draft.reminderHour) errors.reminderHour = 'Jam pengingat wajib dipilih';
  if (draft.isEditing && !draft.status) errors.status = 'Status wajib dipilih';

  return errors;
};

export const isScheduleDraftValid = (draft, now = new Date()) =>
  Object.keys(validateScheduleDraft(draft, now)).length === 0;

export const isScheduleDraftDirty = (draft, original) => {
  if (!original) {
    return Boolean(
      draft.outletId || draft.brandIds?.length || draft.startDate || draft.scheduleDays?.length || draft.reminderHour,
    );
  }

  return (
    draft.outletId !== original.outletId ||
    draft.reminderHour !== original.reminderHour ||
    draft.status !== original.status ||
    new Date(draft.startDate).getTime() !== new Date(original.startDate).getTime() ||
    [...(draft.brandIds ?? [])].sort().join() !== [...(original.brandIds ?? [])].sort().join() ||
    [...(draft.scheduleDays ?? [])].sort().join() !== [...(original.scheduleDays ?? [])].sort().join()
  );
};

export const sortWeekDays = (days = []) =>
  [...days].sort((a, b) => WEEK_DAYS.indexOf(a) - WEEK_DAYS.indexOf(b));
