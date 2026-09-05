
export const SYSTEM_ACTOR = 'SYSTEM';

export const RETURN_CONFIGURATIONS = ['Return to Brand Partner', 'Return to Hub Pusat'];

export const RETURN_STATUSES = [
  { code: 'active', label: 'Aktif' },
  { code: 'inactive', label: 'Nonaktif' },
];

export const resolveLastEdited = (config) => {
  const bySystem = !config.updatedBy || config.updatedBy === SYSTEM_ACTOR;
  return {
    by: bySystem ? config.createdBy : config.updatedBy,
    at: bySystem ? config.createdAt : config.updatedAt,
  };
};

export const availableBrandsForConfig = (brands = [], configs = []) => {
  const taken = new Set(configs.map((config) => config.brandId));
  return brands.filter((brand) => !taken.has(brand.id));
};

export const isReturnConfigChanged = (current, draft) => {
  if (!current || !draft) return false;
  return current.configuration !== draft.configuration || current.status !== draft.status;
};

export const BLOCKED_QTY_KEYS = ['e', 'E', '+', '-', '.', ','];

export const parseMaxQty = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
};

export const isMaxQtyChanged = (currentValue, draftValue) => {
  const parsed = parseMaxQty(draftValue);
  return parsed !== null && parsed !== currentValue;
};
