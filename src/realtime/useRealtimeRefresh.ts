import { useEffect, useMemo, useRef } from 'react';
import { useRealtime } from './RealtimeProvider';

type Options = {
  debounceMs?: number;
};

export function useRealtimeRefresh(
  scopes: string[],
  onRefresh: () => void,
  options: Options = {},
) {
  const { subscribe } = useRealtime();
  const refreshRef = useRef(onRefresh);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceMs = options.debounceMs ?? 300;
  const scopeKey = scopes.join('|');
  const scopeSet = useMemo(() => new Set(scopes), [scopeKey]);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(
    () =>
      subscribe((event) => {
        if (!scopeSet.has(event.scope)) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          refreshRef.current();
        }, debounceMs);
      }),
    [debounceMs, scopeSet, subscribe],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );
}
