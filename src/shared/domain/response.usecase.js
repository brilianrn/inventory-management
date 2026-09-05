
export const ok = (data, message = '') => ({ data, message });

export const fail = (error, message) => {
  const normalized = error instanceof Error ? error : new Error(String(error));
  return { error: normalized, message: message || normalized.message };
};
