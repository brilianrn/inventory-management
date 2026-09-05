import { createDraftStorage } from './draft-storage';

const storage = createDraftStorage('amb-waste-draft');

export const readFreshWasteDraft = storage.readFresh;
export const writeWasteDraft = storage.write;
export const clearWasteDraft = storage.clear;

export const createWasteDraft = ({ outletId, outletName, crewId, crewName, startedAt }) => ({
  savedAt: new Date().toISOString(),
  outletId,
  outletName,
  crewId,
  crewName,
  startedAt,
  categories: {},
});

export const withCategoryCards = (draft, categoryId, cards) => ({
  ...draft,
  savedAt: new Date().toISOString(),
  categories: { ...draft.categories, [categoryId]: cards },
});
