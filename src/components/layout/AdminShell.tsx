"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { IconButton } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { getAdminToken, maybeRefreshAdminSession } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Sidebar } from "./Sidebar";
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

  // Close the mobile drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      try {
        localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, v ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !v;
    });

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted" aria-busy="true">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-line bg-surface transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[4.5rem]" : "w-[var(--sidebar-w)]",
        )}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-ink/35 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[min(17rem,85vw)] animate-slide-in-left bg-surface shadow-pop">
            <IconButton label="Close menu" size="sm" onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 z-10">
              <X size={17} />
            </IconButton>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
