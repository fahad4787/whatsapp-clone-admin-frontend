"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { PanelLeft, Smartphone, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { STORAGE_KEYS } from "@/config/constants";

type ShellCtx = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  widthReady: boolean;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useAdminShell() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminShell must be used inside AdminShell");
  return ctx;
}

function applySidebarWidth(collapsed: boolean) {
  document.documentElement.style.setProperty("--sidebar-w", collapsed ? "4.75rem" : "16rem");
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [widthReady, setWidthReady] = useState(false);

  useLayoutEffect(() => {
    let next = false;
    try {
      next = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "1";
    } catch {
      /* ignore */
    }
    setCollapsed(next);
    applySidebarWidth(next);
    setWidthReady(true);
  }, []);

  useEffect(() => {
    if (!widthReady) return;
    applySidebarWidth(collapsed);
    try {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed, widthReady]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed((v) => !v);
  }, []);

  const value = useMemo(
    () => ({ collapsed, mobileOpen, toggleCollapsed, setMobileOpen, widthReady }),
    [collapsed, mobileOpen, toggleCollapsed, widthReady],
  );

  return (
    <Ctx.Provider value={value}>
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <button
              type="button"
              className="absolute inset-0 bg-[#0c1612]/35 backdrop-blur-[3px]"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(17.5rem,90vw)] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-end border-b border-bp-border px-2 py-2">
                <button
                  type="button"
                  className="bp-icon-btn"
                  aria-label="Close sidebar"
                  onClick={() => setMobileOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <Sidebar forceExpanded onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-bp-border/70 bg-white/80 px-3 backdrop-blur-xl sm:px-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="bp-icon-btn"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-pressed={collapsed}
                onClick={toggleCollapsed}
              >
                <PanelLeft size={18} />
              </button>
              <div className="hidden text-[13px] sm:block">
                <span className="font-semibold text-bp-ink">Admin</span>
                <span className="mx-1.5 text-bp-border">/</span>
                <span className="text-bp-muted">Console</span>
              </div>
            </div>
            <Link href="/android" className="bp-icon-btn" aria-label="Android app" title="Android app">
              <Smartphone size={18} />
            </Link>
          </header>
          <main className="mx-auto w-full max-w-[1380px] flex-1 overflow-auto px-3 py-4 sm:px-4 sm:py-5 md:px-5 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </Ctx.Provider>
  );
}
