"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";

type RunOptions<R> = {
  /** Toast shown on success. */
  success?: string | ((result: R) => string);
  /** Prefix for the error toast, e.g. "Couldn't ban user". */
  errorTitle?: string;
};

/**
 * Run a write (ban, save, delete…) with a pending flag per key, a success toast and a friendly
 * error toast. Returns the result, or undefined when it failed. One call per key at a time.
 */
export function useAction() {
  const toast = useToast();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const inFlight = useRef(new Set<string>());

  const run = useCallback(
    async <R,>(key: string, fn: () => Promise<R>, opts: RunOptions<R> = {}): Promise<R | undefined> => {
      if (inFlight.current.has(key)) return undefined;
      inFlight.current.add(key);
      setPending(new Set(inFlight.current));
      try {
        const result = await fn();
        if (opts.success) toast.success(typeof opts.success === "function" ? opts.success(result) : opts.success);
        return result;
      } catch (err) {
        toast.error(errorMessage(err), opts.errorTitle);
        return undefined;
      } finally {
        inFlight.current.delete(key);
        setPending(new Set(inFlight.current));
      }
    },
    [toast],
  );

  const isPending = useCallback((key: string) => pending.has(key), [pending]);

  return { run, isPending, anyPending: pending.size > 0 };
}
