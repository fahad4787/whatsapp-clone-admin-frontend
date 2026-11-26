import {
  Flag,
  Globe2,
  KeyRound,
  LayoutDashboard,
  Lock,
  Megaphone,
  MessagesSquare,
  Phone,
  Radio,
  Scale,
  ScrollText,
  Settings,
  Shield,
  ShieldBan,
  Smartphone,
  Sticker,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; description: string };
export type NavGroup = { id: string; label: string; items: NavItem[] };

/** Single source of truth for the sidebar, the topbar title and page descriptions. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Live health of the platform at a glance." }],
  },
  {
    id: "activity",
    label: "Activity",
    items: [
      { href: "/users", label: "Users", icon: Users, description: "Search, create, ban and remove accounts." },
      { href: "/otps", label: "OTP log", icon: KeyRound, description: "Verification codes sent to phones." },
      { href: "/conversations", label: "Conversations", icon: MessagesSquare, description: "Inspect chats and groups for moderation." },
      { href: "/live", label: "Live calls", icon: Radio, description: "Calls that are ringing or in progress right now." },
      { href: "/calls", label: "Call history", icon: Phone, description: "Every voice and video call." },
      { href: "/reports", label: "Reports", icon: Flag, description: "User reports waiting for review." },
    ],
  },
  {
    id: "product",
    label: "Product",
    items: [
      { href: "/countries", label: "Countries", icon: Globe2, description: "Where people can sign up." },
      { href: "/settings", label: "Settings", icon: Settings, description: "Limits and behaviour of the app." },
      { href: "/legal", label: "Legal", icon: Scale, description: "Terms of service and privacy policy." },
      { href: "/android", label: "Android app", icon: Smartphone, description: "Release versions and forced updates." },
      { href: "/stickers", label: "Stickers", icon: Sticker, description: "Sticker packs shipped with the app." },
      { href: "/channels", label: "Channels", icon: Megaphone, description: "Broadcast channels and their posts." },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { href: "/admins", label: "Admin users", icon: Shield, description: "People who can sign in to this console." },
      { href: "/audit", label: "Audit log", icon: ScrollText, description: "Every action taken by an admin." },
      { href: "/security", label: "Security", icon: Lock, description: "Sign-in protection for this console." },
      { href: "/firewall", label: "IP access", icon: ShieldBan, description: "Limit console sign-in to known networks." },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navItemFor(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((i) => isActivePath(pathname, i.href));
}
