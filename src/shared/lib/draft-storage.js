import { takeFreshDraft } from '@/packages/documents/domain/draft.rules';

const isBrowser = () => typeof window !== 'undefined';

export const createDraftStorage = (storageKey) => ({
  readFresh: (now = new Date()) => {
    if (!isBrowser()) return null;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;

      const fresh = takeFreshDraft(JSON.parse(raw), now);
      if (!fresh) {
        window.localStorage.removeItem(storageKey);
        return null;
      }
      return fresh;
    } catch {
      window.localStorage.removeItem(storageKey);
      return null;
    }
  },

  write: (draft) => {
    if (!isBrowser()) return false;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
      return true;
    } catch {
      return false;
    }
  },

  clear: () => {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
  },
});
