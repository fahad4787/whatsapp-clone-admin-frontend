"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  MessagesSquare,
  Radio,
  Phone,
  Flag,
  Globe2,
  Settings,
  Scale,
  Smartphone,
  Sticker,
  Megaphone,
  Shield,
  ScrollText,
  Lock,
  ShieldBan,
  LogOut,
} from "lucide-react";
import { NAV_GROUPS, type NavItem } from "@/config/nav";
import { useAdminShell } from "@/components/layout/AdminShell";

const ICONS: Record<
  NavItem["icon"],
  React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>
> = {
  dashboard: LayoutDashboard,
  users: Users,
  otp: KeyRound,
  conversations: MessagesSquare,
  live: Radio,
  calls: Phone,
  reports: Flag,
  countries: Globe2,
  settings: Settings,
  legal: Scale,
  android: Smartphone,
  stickers: Sticker,
  channels: Megaphone,
  admins: Shield,
  audit: ScrollText,
  security: Lock,
  firewall: ShieldBan,
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  forceExpanded?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ forceExpanded, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed: shellCollapsed, widthReady } = useAdminShell();
  const collapsed = forceExpanded ? false : shellCollapsed;

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-bp-border/90 bg-white/95 backdrop-blur-xl ${
        widthReady && !forceExpanded ? "transition-[width] duration-200 ease-out" : ""
      } ${collapsed ? "w-[4.75rem]" : "w-64"} ${forceExpanded ? "h-[calc(100vh-3rem)] w-full border-0" : ""}`}
    >
      <div className={`shrink-0 ${collapsed ? "px-2 pt-3.5 pb-3.5" : "px-3.5 pt-3.5 pb-3.5"}`}>
        <div
          className={`flex items-center gap-3 rounded-[var(--radius)] border border-[#cfdad3] bg-[#eef5f0] ${
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#1db866] to-bp-green-dark text-[13px] font-extrabold tracking-tight text-white shadow-[0_8px_18px_rgba(18,154,85,0.32)]">
            BP
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-[14px] font-extrabold tracking-tight text-bp-ink">Bolta Punjab</div>
              <div className="text-[10px] font-bold tracking-[0.08em] text-bp-muted uppercase">Admin · Dev</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-3 mb-0.5 border-t border-[#d0dbd4]" aria-hidden />

      <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 pt-4 pb-4" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {!collapsed ? (
              <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a9a92]">
                {group.label}
              </div>
            ) : (
              <div className="mx-auto mb-1.5 h-px w-6 bg-bp-border" aria-hidden />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={`group relative flex items-center gap-2.5 rounded-md text-[13.5px] transition-all duration-200 ${
                      collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                    } ${
                      active
                        ? "bg-bp-green-soft font-semibold text-bp-green shadow-[inset_3px_0_0_0_#129a55]"
                        : "font-medium text-bp-ink/70 hover:bg-[#f4f7f5] hover:text-bp-ink"
                    }`}
                  >
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.25 : 2}
                      className={`shrink-0 transition-colors ${
                        active ? "text-bp-green" : "text-[#7d8f86] group-hover:text-bp-ink"
                      }`}
                    />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={`m-2.5 flex items-center gap-2.5 rounded-md border border-bp-border bg-[#f7faf8] ${
          collapsed ? "flex-col px-2 py-3" : "px-3 py-3"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bp-green-soft text-sm font-bold text-bp-green ring-1 ring-bp-green/10">
          F
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Fixel</div>
            <div className="text-[11px] font-medium text-bp-muted">Superadmin</div>
          </div>
        ) : null}
        <Link
          href="/login"
          className="bp-icon-btn"
          title="Log out"
          aria-label="Log out"
          onClick={onNavigate}
        >
          <LogOut size={16} />
        </Link>
      </div>
    </aside>
  );
}
