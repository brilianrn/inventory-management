import { createDraftStorage } from './draft-storage';

const storage = createDraftStorage('amb-counting-draft');

export const readFreshDraft = storage.readFresh;
export const writeDraft = storage.write;
export const clearDraft = storage.clear;
