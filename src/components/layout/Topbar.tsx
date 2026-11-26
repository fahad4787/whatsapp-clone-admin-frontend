"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronDown, ChevronRight, LogOut, Menu, Monitor, Moon, PanelLeft, Search, Sun } from "lucide-react";
import { Avatar, Badge, IconButton } from "@/components/ui";
import { navGroupFor, navItemFor } from "@/config/nav";
import { useQuery } from "@/hooks/useQuery";
import { clearAdminSession, currentAdminIdentity, fetchHealth, type AdminIdentity } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useTheme, type ThemePref } from "@/lib/theme";
import { useShell } from "./ShellContext";

/** Small click-outside / Esc popover used by the theme and account menus. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function Menu_({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="menu" className={cn("absolute right-0 top-full z-30 mt-2 origin-top-right animate-pop-in rounded-lg border border-line bg-surface p-1 shadow-pop", className)}>
      {children}
    </div>
  );
}

function HealthPill() {
  const { data, loading } = useQuery("health", (signal) => fetchHealth(signal), { refreshMs: 60_000 });
  if (loading) return null;
  const ok = !!data?.ok && data.db === "up" && data.redis === "up";
  const title = data ? `Database ${data.db} · Redis ${data.redis}` : "Backend unreachable";
  return (
    <Badge tone={ok ? "success" : "danger"} dot pulse={ok} title={title}>
      <span className="hidden xl:inline">{ok ? "All systems normal" : data ? "Degraded" : "Backend offline"}</span>
      <span className="xl:hidden">{ok ? "Online" : "Issue"}</span>
    </Badge>
  );
}

const THEME_OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match system", icon: Monitor },
];

function ThemeMenu() {
  const { pref, setPref } = useTheme();
  const { open, setOpen, ref } = usePopover();
  const Current = pref === "dark" ? Moon : pref === "system" ? Monitor : Sun;
  return (
    <div ref={ref} className="relative">
      <IconButton label="Theme" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Current size={17} />
      </IconButton>
      {open ? (
        <Menu_ className="w-44">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={pref === value}
              onClick={() => {
                setPref(value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-ink-soft hover:bg-surface-hover hover:text-ink"
            >
              <Icon size={15} className="text-muted" />
              <span className="flex-1 text-left">{label}</span>
              {pref === value ? <Check size={14} className="text-brand" /> : null}
            </button>
          ))}
        </Menu_>
      ) : null}
    </div>
  );
}

function AccountMenu() {
  const { open, setOpen, ref } = usePopover();
  const [me, setMe] = useState<AdminIdentity>({ email: null, role: null });
  useEffect(() => setMe(currentAdminIdentity()), []);
  const roleLabel = me.role === "SUPER" ? "Super admin" : me.role === "MOD" ? "Moderator" : "Admin";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition-colors duration-150 hover:bg-surface-hover"
      >
        {/* The accessible name is the visible text (WCAG 2.5.3); below xl only the sr-only copy is present. */}
        <span aria-hidden>
          <Avatar name={me.email ?? "Admin"} size={30} />
        </span>
        <span className="sr-only xl:hidden">Account: {me.email ?? "Admin"}</span>
        <span className="hidden max-w-[11rem] text-left xl:block">
          <span className="block truncate text-[13px] font-semibold leading-tight text-ink">{me.email ?? "Admin"}</span>
          <span className="block text-[11px] leading-tight text-muted">{roleLabel}</span>
        </span>
        <ChevronDown size={14} aria-hidden className={cn("text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open ? (
        <Menu_ className="w-64">
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
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-danger hover:bg-danger-soft hover:text-danger-text"
          >
            <LogOut size={15} /> Sign out
          </button>
        </Menu_>
      ) : null}
    </div>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();
  const item = navItemFor(pathname);
  const group = navGroupFor(pathname);
  if (!item) return <div className="min-w-0 flex-1" />;
  const isHome = item.href === "/";
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {!isHome && group ? (
          <li className="hidden shrink-0 items-center gap-1.5 text-muted xl:flex">
            <Link href="/" className="rounded hover:text-ink">Admin</Link>
            <ChevronRight size={13} aria-hidden className="text-subtle" />
            <span>{group.label}</span>
            <ChevronRight size={13} aria-hidden className="text-subtle" />
          </li>
        ) : null}
        <li className="truncate font-semibold text-ink" aria-current="page">{item.label}</li>
      </ol>
    </nav>
  );
}

type TopbarProps = { onOpenMobile: () => void };

export function Topbar({ onOpenMobile }: TopbarProps) {
  const { collapsed, toggleCollapsed, openPalette } = useShell();
  return (
    <header className="sticky top-0 z-20 flex h-[var(--topbar-h)] items-center gap-2 border-b border-line bg-surface/80 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70 sm:gap-3 sm:px-5">
      <IconButton label="Open menu" onClick={onOpenMobile} className="lg:hidden">
        <Menu size={19} />
      </IconButton>
      <IconButton label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} onClick={toggleCollapsed} className="max-lg:hidden">
        <PanelLeft size={17} />
      </IconButton>
      <div className="mx-1 hidden h-5 w-px bg-line lg:block" aria-hidden />
      <Breadcrumbs />
      <button
        type="button"
        onClick={openPalette}
        className="hidden h-9 w-60 items-center gap-2 rounded-md border border-line bg-surface-muted px-2.5 text-[13px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink-soft xl:flex 2xl:w-72"
      >
        <Search size={15} aria-hidden />
        <span className="flex-1 text-left">Search pages, actions…</span>
        <kbd className="rounded border border-line bg-surface px-1.5 font-sans text-[10.5px] font-medium">⌘K</kbd>
      </button>
      <IconButton label="Search" onClick={openPalette} className="xl:hidden">
        <Search size={17} />
      </IconButton>
      <HealthPill />
      <ThemeMenu />
      <AccountMenu />
    </header>
  );
}
