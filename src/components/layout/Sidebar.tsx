"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AivoraBrand } from "@/components/brand";
import { NAV_GROUPS, isActivePath } from "@/config/nav";
import { cn } from "@/lib/cn";

type SidebarProps = { collapsed?: boolean; onNavigate?: () => void; className?: string };

export function Sidebar({ collapsed = false, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className={cn("flex h-[var(--topbar-h)] shrink-0 items-center border-b border-line", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" onClick={onNavigate} aria-label="Aivora Admin home" className="rounded-lg">
          <AivoraBrand size={32} subtitle="Admin console" collapsed={collapsed} />
        </Link>
      </div>

      <nav aria-label="Main" className={cn("flex-1 space-y-5 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-line" aria-hidden />
            ) : (
              <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-subtle">{group.label}</div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-[10px] text-[13.5px] transition-colors duration-150",
                        collapsed ? "h-10 justify-center" : "h-9 px-3",
                        active ? "bg-brand-soft font-semibold text-brand-strong" : "font-medium text-ink-soft hover:bg-surface-muted hover:text-ink",
                      )}
                    >
                      <Icon size={18} strokeWidth={active ? 2.25 : 2} className={cn("shrink-0", active ? "text-brand" : "text-subtle group-hover:text-ink-soft")} />
                      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
