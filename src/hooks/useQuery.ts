"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { errorMessage } from "@/lib/errors";
import { useAutoRefresh } from "./useAutoRefresh";

type Options = {
  /** Quietly re-fetch on this interval (ms) while the tab is visible. */
  refreshMs?: number;
  /** Skip fetching while false. */
  enabled?: boolean;
};

export type QueryState<T> = {
  data: T | undefined;
  setData: Dispatch<SetStateAction<T | undefined>>;
  /** True only for the first load of the current key (no data on screen yet). */
  loading: boolean;
  /** True while any fetch, including a background refresh, is in flight. */
  fetching: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Load data for a screen. Re-fetches when `key` changes, cancels stale requests, keeps the
 * previous data visible during background refreshes and reports a friendly error message.
 */
export function useQuery<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  { refreshMs, enabled = true }: Options = {},
): QueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(enabled);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef(key);
  keyRef.current = key;
  const controller = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    const runKey = keyRef.current;
    setFetching(true);
    try {
      const next = await fetcherRef.current(ac.signal);
      if (ac.signal.aborted) return;
      setData(next);
      setError(null);
      setLoadedKey(runKey);
    } catch (err) {
      if (ac.signal.aborted || (err as Error)?.name === "AbortError") return;
      setError(errorMessage(err, "Couldn't load this data. Check your connection and try again."));
      setLoadedKey(runKey);
    } finally {
      if (!ac.signal.aborted) setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void run();
    return () => controller.current?.abort();
  }, [key, enabled, run]);

  useAutoRefresh(() => (enabled && refreshMs ? run() : undefined), refreshMs ?? 0);

  return { data, setData, loading: loadedKey !== key && enabled, fetching, error, reload: run };
}
