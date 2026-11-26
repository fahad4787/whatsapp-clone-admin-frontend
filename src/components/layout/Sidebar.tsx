"use client";

import { useState, type FocusEvent, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { AivoraBrand } from "@/components/brand";
import { NAV_GROUPS, isActivePath, type NavItem } from "@/config/nav";
import { cn } from "@/lib/cn";
import { fmtNumber } from "@/lib/format";
import { useShell } from "./ShellContext";

type SidebarProps = { collapsed?: boolean; onNavigate?: () => void; className?: string };

function NavCount({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { metrics } = useShell();
  const badge = item.badge;
  const n = badge ? metrics?.[badge.metric] : undefined;
  if (!badge || !n) return null;
  const live = badge.tone === "live";
  if (collapsed) {
    return (
      <span
        aria-hidden
        className={cn("absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-surface", live ? "bg-brand" : "bg-warning")}
      />
    );
  }
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-semibold leading-5 tnum",
        live ? "bg-brand-soft text-brand-text" : "bg-warning-soft text-warning",
      )}
    >
      {live ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden /> : null}
      {fmtNumber(n)}
      <span className="sr-only"> {badge.label}</span>
    </span>
  );
}

export function Sidebar({ collapsed = false, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const { openPalette } = useShell();
  // Collapsed mode: one fixed-position tooltip (the nav scrolls, so in-flow tooltips would be clipped).
  const [tip, setTip] = useState<{ label: string; top: number; left: number } | null>(null);
  const tipProps = (label: string) =>
    collapsed
      ? {
          onMouseEnter: (e: MouseEvent<HTMLElement>) => showTip(label, e.currentTarget),
          onFocus: (e: FocusEvent<HTMLElement>) => showTip(label, e.currentTarget),
          onMouseLeave: () => setTip(null),
          onBlur: () => setTip(null),
        }
      : {};
  const showTip = (label: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className={cn("flex h-[var(--topbar-h)] shrink-0 items-center", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" onClick={onNavigate} title="Go to dashboard" className="rounded-lg">
          <AivoraBrand size={30} subtitle="Admin console" collapsed={collapsed} />
        </Link>
      </div>

      <div className={cn("pb-2 pt-1", collapsed ? "px-2" : "px-3")}>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            openPalette();
          }}
          {...tipProps("Search  ⌘K")}
          className={cn(
            "group relative flex h-9 w-full items-center gap-2.5 rounded-md border border-line bg-surface-muted text-[13px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink-soft",
            collapsed ? "justify-center" : "px-2.5",
          )}
        >
          <Search size={15} className="shrink-0" aria-hidden />
          {collapsed ? (
            <span className="sr-only">Search and jump to</span>
          ) : (
            <>
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border border-line bg-surface px-1.5 font-sans text-[10.5px] font-medium text-muted">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      <nav aria-label="Main" className={cn("flex-1 space-y-5 overflow-y-auto pb-4 pt-2", collapsed ? "px-2" : "px-3")}>
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-5 bg-line" aria-hidden />
            ) : (
              <div className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{group.label}</div>
            )}
            <ul className="space-y-px">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        setTip(null);
                        onNavigate?.();
                      }}
                      {...tipProps(item.label)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md text-[13.5px] transition-colors duration-150",
                        collapsed ? "h-10 justify-center" : "h-9 px-2.5",
                        active ? "bg-brand-soft font-semibold text-brand-text" : "font-medium text-ink-soft hover:bg-surface-hover hover:text-ink",
                      )}
                    >
                      {/* Active indicator: a short brand bar that grows in. */}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-[transform,opacity] duration-200 ease-out",
                          collapsed && "-left-2",
                          active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
                        )}
                      />
                      <Icon size={17} strokeWidth={active ? 2.2 : 1.9} className={cn("shrink-0", active ? "text-brand" : "text-muted group-hover:text-ink-soft")} />
                      {collapsed ? (
                        <span className="sr-only">{item.label}</span>
                      ) : (
                        <span className="truncate">{item.label}</span>
                      )}
                      <NavCount item={item} collapsed={collapsed} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {collapsed && tip ? (
        <div
          aria-hidden
          style={{ top: tip.top, left: tip.left }}
          className="pointer-events-none fixed z-50 -translate-y-1/2 animate-fade-in whitespace-pre rounded-md bg-ink px-2 py-1 text-xs font-medium text-surface shadow-pop"
        >
          {tip.label}
        </div>
      ) : null}
    </div>
  );
}
