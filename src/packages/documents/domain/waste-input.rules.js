
export const WASTE_WINDOW_OPEN_HOUR = 13;
export const WASTE_WINDOW_CLOSE_HOUR = 23;

export const MAX_PHOTOS = 10;

export const MAX_QUANTITY_INPUT = 99999;

export const isWithinWasteWindow = (now = new Date()) => {
  const hour = now.getHours();
  return hour >= WASTE_WINDOW_OPEN_HOUR && hour < WASTE_WINDOW_CLOSE_HOUR;
};

export const resolveWasteWindow = (mode = 'auto', now = new Date()) => {
  if (mode === 'open') return true;
  if (mode === 'closed') return false;
  return isWithinWasteWindow(now);
};

export const isQuantityInputAccepted = (raw) => {
  if (raw === '') return true;
  if (!/^[0-9]+([.,][0-9]*)?$/.test(raw)) return false;
  return !/^0[0-9]/.test(raw) && !/^0$/.test(raw) && !/^0[.,]/.test(raw);
};

export const clampQuantityInput = (raw) => {
  const numeric = normalizeQuantity(raw);
  if (numeric === null || numeric <= MAX_QUANTITY_INPUT) return raw;
  return String(MAX_QUANTITY_INPUT);
};

export const normalizeQuantity = (raw) => {
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim().replace(',', '.');
  if (text === '' || text === '.') return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

export const isOverMaxQuantity = (raw, maxQty) => {
  const value = normalizeQuantity(raw);
  if (value === null || !Number.isFinite(maxQty)) return false;
  return value > maxQty;
};

export const emptyCard = () => ({
  productId: '',
  quantity: '',
  expiryDate: '',
  photos: [],
});

export const isCardComplete = (card, { requiresExpiryDate = false, maxQty = null } = {}) => {
  if (!card?.productId) return false;

  const quantity = normalizeQuantity(card.quantity);
  if (quantity === null || quantity <= 0) return false;
  if (isOverMaxQuantity(card.quantity, maxQty)) return false;

  if (!card.photos?.length) return false;
  if (requiresExpiryDate && !card.expiryDate) return false;

  return true;
};

export const isCardBlank = (card) =>
  !card?.productId && !card?.quantity && !card?.expiryDate && !card?.photos?.length;

export const cardsComplete = (cards = [], resolveRules) =>
  cards.length > 0 && cards.every((card) => isCardComplete(card, resolveRules(card)));

export const availableProducts = (products = [], cards = [], currentIndex = -1) => {
  const taken = new Set(
    cards.map((card, index) => (index === currentIndex ? null : card.productId)).filter(Boolean),
  );
  return products.filter((product) => !taken.has(product.id));
};

export const searchProducts = (products = [], query = '') => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return products;
  return products.filter((product) =>
    `${product.name} ${product.code}`.toLowerCase().includes(keyword),
  );
};

export const categoryFilledCount = (draft, categoryId) => draft?.categories?.[categoryId]?.length ?? 0;

export const totalFilledCount = (draft) =>
  Object.values(draft?.categories ?? {}).reduce((sum, cards) => sum + cards.length, 0);

export const buildWasteSubmission = (draft) =>
  Object.entries(draft?.categories ?? {})
    .filter(([, cards]) => cards.length > 0)
    .map(([categoryId, cards]) => ({
      categoryId,
      items: cards.map((card) => ({
        productId: card.productId,
        quantity: normalizeQuantity(card.quantity) ?? 0,
        expiryDate: card.expiryDate || null,
        photos: [...(card.photos ?? [])],
      })),
    }));
