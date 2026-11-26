"use client";

import { useEffect, useState } from "react";

/** Current time, re-rendering every `ms` (for countdowns and "x min ago" labels). */
export function useNow(ms = 1_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}
