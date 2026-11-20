import { useCallback, useEffect, useRef, useState } from "react";
import { getAdminToken } from "@/lib/api";
import { useAutoRefresh } from "./useAutoRefresh";

type Options = {
  /** Background refresh interval. 0 disables polling. */
  interval?: number;
  /** Message shown when the request fails. */
  errorMessage?: string;
};

/**
 * Loads a list for an admin screen and keeps it fresh in the background.
 *
 * - Skeleton only on the very first load; later refreshes swap data in place.
 * - A failed refresh keeps the last good rows and shows an error banner.
 * - Re-fetches when the fetcher identity changes (put filters in its deps).
 * - Writes are guarded so an older in-flight response can't overwrite a newer one.
 */
export function useAdminList<T>(
  fetcher: (token: string) => Promise<T[]>,
  { interval = 15_000, errorMessage = "Could not load data — check your connection" }: Options = {},
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    const mine = ++seq.current;
    try {
      const rows = await fetcher(token);
      if (mine !== seq.current) return;
      setItems(rows);
      setError(null);
    } catch {
      if (mine === seq.current) setError(errorMessage);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [fetcher, errorMessage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useAutoRefresh(reload, interval || 24 * 3_600_000);

  return { items, setItems, loading, error, setError, reload };
}
