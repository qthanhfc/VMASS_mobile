import { useEffect, useMemo, useRef } from 'react';
import { useRealtime } from './RealtimeProvider';

type Options = {
  debounceMs?: number;
  enabled?: boolean;
  actions?: string[];
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
  const enabled = options.enabled ?? true;
  const scopeKey = scopes.join('|');
  const actionKey = (options.actions || []).join('|');
  const scopeSet = useMemo(() => new Set(scopes), [scopeKey]);
  const actionSet = useMemo(
    () => new Set((options.actions || []).map((item) => item.trim()).filter(Boolean)),
    [actionKey],
  );

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(
    () => {
      if (!enabled) return;
      return subscribe((event) => {
        if (!scopeSet.has(event.scope)) return;
        if (actionSet.size > 0 && !actionSet.has(event.action)) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          refreshRef.current();
        }, debounceMs);
      });
    },
    [actionSet, debounceMs, enabled, scopeSet, subscribe],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );
}
