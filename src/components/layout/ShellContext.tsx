"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type Metrics } from "@/lib/api";

type ShellState = {
  /** Platform counters used for nav badges. Undefined until the first load (or if it fails). */
  metrics: Metrics | undefined;
  collapsed: boolean;
  toggleCollapsed: () => void;
  openPalette: () => void;
};

const Ctx = createContext<ShellState | null>(null);

export function ShellProvider({
  collapsed,
  toggleCollapsed,
  openPalette,
  children,
}: Omit<ShellState, "metrics"> & { children: ReactNode }) {
  // One shared, quiet poll for the counts in the sidebar. Pages fetch their own detailed data.
  const { data } = useQuery("shell-metrics", (s) => adminApi.metrics(s), { refreshMs: 60_000 });
  const value = useMemo(() => ({ metrics: data, collapsed, toggleCollapsed, openPalette }), [data, collapsed, toggleCollapsed, openPalette]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useShell must be used inside <ShellProvider>");
  return v;
}
