'use client';

import { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  applyFilter,
  EMPTY_SCOPE,
  isScopeFiltered,
  resetFilter,
  setPageIndex,
  setQuery,
} from '@/shared/store/filters.slice';

export const useListFilters = (scope) => {
  const dispatch = useDispatch();
  const applied = useSelector((state) => state.filters[scope] ?? EMPTY_SCOPE);

  const [draft, setDraft] = useState(() => ({
    dateFrom: applied.dateFrom,
    dateTo: applied.dateTo,
    selections: applied.selections,
  }));

  const toggleDraftSelection = useCallback((key, value) => {
    setDraft((current) => {
      const chosen = current.selections[key] ?? [];
      const next = chosen.includes(value)
        ? chosen.filter((item) => item !== value)
        : [...chosen, value];
      return { ...current, selections: { ...current.selections, [key]: next } };
    });
  }, []);

  const setDraftDates = useCallback(({ from, to }) => {
    setDraft((current) => ({ ...current, dateFrom: from, dateTo: to }));
  }, []);

  const apply = useCallback(() => {
    dispatch(applyFilter({ scope, ...draft }));
  }, [dispatch, draft, scope]);

  const reset = useCallback(() => {
    dispatch(resetFilter({ scope }));
    setDraft({ dateFrom: null, dateTo: null, selections: {} });
  }, [dispatch, scope]);

  const changeQuery = useCallback(
    (value) => dispatch(setQuery({ scope, query: value })),
    [dispatch, scope],
  );

  const changePage = useCallback(
    (index) => dispatch(setPageIndex({ scope, pageIndex: index })),
    [dispatch, scope],
  );

  const isFiltering = useMemo(() => isScopeFiltered(applied), [applied]);

  return {
    applied,
    draft,
    isFiltering,
    draftSelection: (key) => draft.selections[key] ?? [],
    toggleDraftSelection,
    setDraftDates,
    apply,
    reset,
    changeQuery,
    changePage,
  };
};
