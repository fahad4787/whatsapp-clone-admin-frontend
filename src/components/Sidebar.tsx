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
import { NAV_ITEMS, type NavItem } from "@/lib/nav";

const ICONS: Record<NavItem["icon"], React.ComponentType<{ className?: string; size?: number }>> = {
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-bp-border bg-white/90 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-bp-green to-bp-green-dark text-sm font-extrabold tracking-tight text-white shadow-[0_8px_20px_rgba(29,170,97,0.35)]">
          BP
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight text-bp-ink">Bolta Punjab</div>
          <div className="text-xs font-medium text-bp-muted">Admin · Dev</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-4" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] transition-all duration-200 ${
                active
                  ? "bg-bp-green-soft font-semibold text-bp-green shadow-[inset_3px_0_0_0_#1daa61]"
                  : "font-medium text-bp-ink/75 hover:bg-slate-50 hover:text-bp-ink"
              }`}
            >
              <Icon
                size={17}
                className={`transition-colors ${active ? "text-bp-green" : "text-bp-muted group-hover:text-bp-ink"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-2.5 flex items-center gap-2.5 rounded-xl border border-bp-border bg-slate-50/80 px-3 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bp-green-soft text-sm font-bold text-bp-green">
          F
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">Fixel</div>
          <div className="text-[11px] font-medium text-bp-muted">Superadmin</div>
        </div>
        <Link
          href="/login"
          className="rounded-lg p-2 text-bp-muted transition-colors hover:bg-white hover:text-bp-ink"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </Link>
      </div>
    </aside>
  );
}
