
const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

export const applyListFilter = (rows = [], filter = {}, config = {}) => {
  const { query, dateFrom, dateTo, selections = {} } = filter;
  const { dateOf, selectors = {}, searchable } = config;
  const keyword = query?.trim().toLowerCase();

  return rows.filter((row) => {
    if (dateOf && (dateFrom || dateTo)) {
      const value = dateOf(row);
      if (!value) return false;
      const time = new Date(value).getTime();
      if (dateFrom && time < startOfDay(dateFrom)) return false;
      if (dateTo && time > endOfDay(dateTo)) return false;
    }

    for (const [key, chosen] of Object.entries(selections)) {
      if (!chosen?.length) continue;
      const accessor = selectors[key];
      if (!accessor) continue;
      if (!chosen.includes(accessor(row))) return false;
    }

    if (keyword && searchable) {
      const haystack = searchable(row).filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }

    return true;
  });
};

export const optionsFromRows = (rows = [], accessor) => {
  const values = [...new Set(rows.map(accessor).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return values.map((value) => ({ value, label: value }));
};
