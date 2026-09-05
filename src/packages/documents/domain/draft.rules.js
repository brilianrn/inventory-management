

const sameCalendarDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isDraftStale = (draft, now = new Date()) => {
  if (!draft?.savedAt) return true;
  return !sameCalendarDay(new Date(draft.savedAt), now);
};

export const takeFreshDraft = (draft, now = new Date()) => (isDraftStale(draft, now) ? null : draft);

export const createDraft = ({ scheduleId, outletId, outletName, crewId, crewName, startedAt, autoSubmit }) => ({
  savedAt: new Date().toISOString(),
  scheduleId,
  outletId,
  outletName,
  crewId,
  crewName,
  startedAt,
  autoSubmit: Boolean(autoSubmit),
  counts: {},
});

export const withCount = (draft, productId, raw) => ({
  ...draft,
  savedAt: new Date().toISOString(),
  counts: { ...draft.counts, [productId]: raw },
});
