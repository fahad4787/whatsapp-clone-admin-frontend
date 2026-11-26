"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { IconButton } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { getAdminToken, maybeRefreshAdminSession } from "@/lib/api";
import { cn } from "@/lib/cn";
import { CommandPalette, rememberPage } from "./CommandPalette";
import { ShellProvider } from "./ShellContext";
import { Sidebar } from "./Sidebar";
import { OfflineNotice } from "./OfflineNotice";
import { Topbar } from "./Topbar";

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "1";
  } catch {
    return false;
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Guard: no token → login (remember where we were). Runs once; a later 401 is handled by the API client.
  useEffect(() => {
    if (!getAdminToken()) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setCollapsed(readCollapsed());
    setAuthed(true);
    void maybeRefreshAdminSession();
    const tick = () => {
      if (!document.hidden) void maybeRefreshAdminSession();
    };
    const id = window.setInterval(tick, 5 * 60_000);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [router]);

  // Close the mobile drawer on navigation and remember the page for the palette's "Recent" list.
  useEffect(() => {
    setMobileOpen(false);
    rememberPage(pathname);
  }, [pathname]);

  // ⌘K / Ctrl+K opens the command palette from anywhere (also "/" when not typing).
  useEffect(() => {
    if (!authed) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector('[aria-modal="true"]')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authed]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      try {
        localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, v ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !v;
    });
  }, []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted" aria-busy="true">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <ShellProvider collapsed={collapsed} toggleCollapsed={toggleCollapsed} openPalette={openPalette}>
      <a href="#main" className="sr-only z-[60] rounded-md bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-pop focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <div className="flex min-h-screen">
        {/* The column carries the surface + border at full page height; the aside inside stays pinned. */}
        <div
          className={cn(
            "hidden shrink-0 border-r border-line bg-surface transition-[width] duration-300 ease-out lg:block",
            collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
          )}
        >
          <aside className="sticky top-0 h-screen">
            <Sidebar collapsed={collapsed} />
          </aside>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 animate-fade-in bg-scrim backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-hidden />
            <div className="absolute inset-y-0 left-0 w-[min(17rem,85vw)] animate-slide-in-left border-r border-line bg-surface shadow-pop">
              <IconButton label="Close menu" size="sm" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3.5 z-10">
                <X size={17} />
              </IconButton>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMobile={() => setMobileOpen(true)} />
          <OfflineNotice />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={closePalette} collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
    </ShellProvider>
  );
}
