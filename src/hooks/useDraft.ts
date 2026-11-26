"use client";

import { useCallback, useMemo, useState } from "react";

const same = (a: unknown, b: unknown) => (Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b);

/**
 * Editable copy of server data with dirty tracking.
 * When `base` changes (first load, or after a save returns fresh data) the draft resets to it,
 * so pass a memoised value.
 */
export function useDraft<F extends Record<string, unknown>>(base: F | null) {
  const [draft, setDraft] = useState<F | null>(base);
  const [syncedFrom, setSyncedFrom] = useState<F | null>(base);
  if (base !== syncedFrom) {
    setSyncedFrom(base);
    setDraft(base);
  }

  const set = useCallback(<K extends keyof F>(key: K, value: F[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d)), []);
  const reset = useCallback(() => setDraft(base), [base]);
  const dirty = useMemo(
    () => (base && draft ? (Object.keys(base) as (keyof F)[]).filter((k) => !same(base[k], draft[k])) : []),
    [base, draft],
  );

  return { draft, set, reset, dirty, isDirty: dirty.length > 0 };
}
