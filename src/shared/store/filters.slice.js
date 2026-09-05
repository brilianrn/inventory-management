import { createSlice } from '@reduxjs/toolkit';

export const FilterScope = {
  STOCK_TAKE: 'stockTake',
  WASTE_DOC: 'wasteDoc',
  RETURN_DOC: 'returnDoc',
  SCHEDULER: 'scheduler',
  RETURN_WASTE_CONFIG: 'returnWasteConfig',
  DELIVERY_ORDER: 'deliveryOrder',
};

export const EMPTY_SCOPE = {
  query: '',
  dateFrom: null,
  dateTo: null,
  selections: {},
  pageIndex: 0,
};

const initialState = Object.values(FilterScope).reduce((acc, scope) => {
  acc[scope] = { ...EMPTY_SCOPE, selections: {} };
  return acc;
}, {});

const scopeOf = (state, scope) => {
  if (!state[scope]) state[scope] = { ...EMPTY_SCOPE, selections: {} };
  return state[scope];
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      const { scope, query } = action.payload;
      const current = scopeOf(state, scope);
      current.query = query;
      current.pageIndex = 0;
    },

    applyFilter: (state, action) => {
      const { scope, dateFrom, dateTo, selections } = action.payload;
      const current = scopeOf(state, scope);
      current.dateFrom = dateFrom ?? null;
      current.dateTo = dateTo ?? null;
      current.selections = selections ?? {};
      current.pageIndex = 0;
    },

    resetFilter: (state, action) => {
      const { scope } = action.payload;
      const { query } = scopeOf(state, scope);
      state[scope] = { ...EMPTY_SCOPE, selections: {}, query };
    },

    setPageIndex: (state, action) => {
      const { scope, pageIndex } = action.payload;
      scopeOf(state, scope).pageIndex = pageIndex;
    },
  },
});

export const { setQuery, applyFilter, resetFilter, setPageIndex } = filtersSlice.actions;

export default filtersSlice.reducer;

export const isScopeFiltered = (scopeState) => {
  if (!scopeState) return false;
  if (scopeState.dateFrom || scopeState.dateTo) return true;
  return Object.values(scopeState.selections ?? {}).some((values) => values.length > 0);
};
