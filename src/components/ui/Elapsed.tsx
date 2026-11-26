"use client";

import { useNow } from "@/hooks/useNow";
import { fmtDuration } from "@/lib/format";

/** Self-ticking "m:ss" since a timestamp; only this text re-renders each second. */
export function Elapsed({ since }: { since: string }) {
  const now = useNow(1000);
  return <>{fmtDuration(Math.max(0, Math.round((now - +new Date(since)) / 1000)))}</>;
}
