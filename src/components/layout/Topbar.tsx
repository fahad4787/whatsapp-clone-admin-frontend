"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, PanelLeft } from "lucide-react";
import { Avatar, Badge, IconButton } from "@/components/ui";
import { navItemFor } from "@/config/nav";
import { useQuery } from "@/hooks/useQuery";
import { clearAdminSession, currentAdminIdentity, fetchHealth, type AdminIdentity } from "@/lib/api";
import { cn } from "@/lib/cn";

function HealthPill() {
  const { data, loading } = useQuery("health", (signal) => fetchHealth(signal), { refreshMs: 60_000 });
  if (loading) return null;
  const ok = !!data?.ok && data.db === "up" && data.redis === "up";
  const title = data ? `Database ${data.db} · Redis ${data.redis}` : "Backend unreachable";
  return (
    <Badge tone={ok ? "success" : "danger"} dot pulse={ok} title={title}>
      <span className="hidden sm:inline">{ok ? "All systems normal" : data ? "Degraded" : "Backend offline"}</span>
      <span className="sm:hidden">{ok ? "Online" : "Issue"}</span>
    </Badge>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<AdminIdentity>({ email: null, role: null });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setMe(currentAdminIdentity()), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const roleLabel = me.role === "SUPER" ? "Super admin" : me.role === "MOD" ? "Moderator" : "Admin";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted"
      >
        <Avatar name={me.email ?? "Admin"} size={32} />
        <span className="hidden max-w-[12rem] text-left md:block">
          <span className="block truncate text-[13px] font-semibold text-ink">{me.email ?? "Admin"}</span>
          <span className="block text-[11px] text-muted">{roleLabel}</span>
        </span>
        <ChevronDown size={15} className={cn("text-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-30 mt-2 w-64 animate-pop-in rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          <div className="px-3 py-2.5">
            <div className="truncate text-[13px] font-semibold text-ink">{me.email ?? "Admin"}</div>
            <div className="text-xs text-muted">{roleLabel}</div>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              clearAdminSession();
              // Full navigation drops all in-memory state (polling, cached rows).
              window.location.replace("/login");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-danger hover:bg-danger-soft"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

type TopbarProps = { collapsed: boolean; onToggleCollapsed: () => void; onOpenMobile: () => void };

export function Topbar({ collapsed, onToggleCollapsed, onOpenMobile }: TopbarProps) {
  const pathname = usePathname();
  const item = navItemFor(pathname);
  return (
    <header className="sticky top-0 z-20 flex h-[var(--topbar-h)] items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
      <IconButton label="Open menu" onClick={onOpenMobile} className="lg:hidden">
        <Menu size={19} />
      </IconButton>
      <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} onClick={onToggleCollapsed} className="hidden lg:inline-flex">
        <PanelLeft size={18} />
      </IconButton>
      <div className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-ink">{item?.label ?? "Admin"}</div>
      <HealthPill />
      <AccountMenu />
    </header>
  );
}
