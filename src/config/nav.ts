export type NavItem = {
  href: string;
  label: string;
  icon:
    | "dashboard"
    | "users"
    | "otp"
    | "conversations"
    | "live"
    | "calls"
    | "reports"
    | "countries"
    | "settings"
    | "legal"
    | "android"
    | "stickers"
    | "channels"
    | "admins"
    | "audit"
    | "security"
    | "firewall";
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Matches live https://wa.zirvik.com/admin sidebar order and routes. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: "dashboard" }],
  },
  {
    id: "activity",
    label: "Activity",
    items: [
      { href: "/users", label: "Users", icon: "users" },
      { href: "/otps", label: "OTP log", icon: "otp" },
      { href: "/conversations", label: "Conversations", icon: "conversations" },
      { href: "/live", label: "Live calls", icon: "live" },
      { href: "/calls", label: "Call history", icon: "calls" },
      { href: "/reports", label: "Reports", icon: "reports" },
    ],
  },
  {
    id: "product",
    label: "Product",
    items: [
      { href: "/countries", label: "Countries", icon: "countries" },
      { href: "/settings", label: "Settings", icon: "settings" },
      { href: "/legal", label: "Legal", icon: "legal" },
      { href: "/android", label: "Android app", icon: "android" },
      { href: "/stickers", label: "Stickers", icon: "stickers" },
      { href: "/channels", label: "Channels", icon: "channels" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { href: "/admins", label: "Admin users", icon: "admins" },
      { href: "/audit", label: "Audit log", icon: "audit" },
      { href: "/security", label: "Security", icon: "security" },
      { href: "/firewall", label: "IP access", icon: "firewall" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
