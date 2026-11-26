/** App-wide constants (no secrets). */
export const STORAGE_KEYS = {
  adminToken: "av-admin-token",
  adminEmail: "av-admin-email",
  sidebarCollapsed: "av-admin-sidebar-collapsed",
} as const;

/** E.164 phone number, as the backend validates it. */
export const PHONE_RE = /^\+\d{7,15}$/;
