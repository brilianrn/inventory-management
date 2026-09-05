'use client';

import { useCallback, useEffect, useState } from 'react';

export const useAsyncData = (loader) => {
  const [state, setState] = useState({ data: undefined, isLoading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;

    loader().then((result) => {
      if (alive) setState({ data: result, isLoading: false });
    });

    return () => {
      alive = false;
    };
  }, [loader, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data: state.data, isLoading: state.isLoading, reload };
};
