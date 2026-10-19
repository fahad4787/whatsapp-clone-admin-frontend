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

/** Matches live https://wa.zirvik.com/admin sidebar order and routes. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/users", label: "Users", icon: "users" },
  { href: "/otps", label: "OTP log", icon: "otp" },
  { href: "/conversations", label: "Conversations", icon: "conversations" },
  { href: "/live", label: "Live calls", icon: "live" },
  { href: "/calls", label: "Call history", icon: "calls" },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/countries", label: "Countries", icon: "countries" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/legal", label: "Legal", icon: "legal" },
  { href: "/android", label: "Android app", icon: "android" },
  { href: "/stickers", label: "Stickers", icon: "stickers" },
  { href: "/channels", label: "Channels", icon: "channels" },
  { href: "/admins", label: "Admin users", icon: "admins" },
  { href: "/audit", label: "Audit log", icon: "audit" },
  { href: "/security", label: "Security", icon: "security" },
  { href: "/firewall", label: "IP access", icon: "firewall" },
];
