
export const SESSION_DURATION_HOURS = 2;

export const resolveSessionDeadline = (startedAt) => {
  const deadline = new Date(startedAt);
  deadline.setHours(deadline.getHours() + SESSION_DURATION_HOURS);
  return deadline;
};

export const remainingMs = (startedAt, now = new Date()) =>
  Math.max(0, resolveSessionDeadline(startedAt).getTime() - now.getTime());

export const isCountInputAccepted = (raw) => {
  if (raw === '') return true;
  if (raw.startsWith(',')) return false;
  return /^[0-9]*[.,]?[0-9]*$/.test(raw);
};

export const normalizeCount = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = Number(String(raw).replace(',', '.'));
  return Number.isFinite(value) ? value : null;
};

export const isProductCounted = (raw) => normalizeCount(raw) !== null;

export const countProgress = (products = [], counts = {}) => {
  const filled = products.filter((product) => isProductCounted(counts[product.id])).length;
  return { filled, total: products.length, isComplete: products.length > 0 && filled === products.length };
};

export const resolveBrandStatus = (brand, counts = {}) => {
  const products = brand.categories.flatMap((category) => category.products);
  const progress = countProgress(products, counts);
  return { ...progress, status: progress.isComplete ? 'complete' : 'incomplete' };
};

export const sheetProgress = (brands = [], counts = {}) => {
  const products = brands.flatMap((brand) =>
    brand.categories.flatMap((category) => category.products),
  );
  return countProgress(products, counts);
};

export const buildSubmissionCounts = (brands = [], counts = {}) =>
  brands
    .flatMap((brand) => brand.categories.flatMap((category) => category.products))
    .map((product) => ({
      productId: product.id,
      counted: normalizeCount(counts[product.id]) ?? 0,
    }));

export const filterSheetProducts = (categories = [], { counts = {}, onlyEmpty = false, query = '' }) => {
  const keyword = query.trim().toLowerCase();

  return categories
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => {
        if (onlyEmpty && isProductCounted(counts[product.id])) return false;
        if (keyword) {
          const haystack = `${product.code} ${product.name}`.toLowerCase();
          if (!haystack.includes(keyword)) return false;
        }
        return true;
      }),
    }))
    .filter((category) => category.products.length > 0);
};
