/** App-wide constants (no secrets). Swap when wiring real backend / CDN. */
export const APP = {
  name: "Bolta Punjab",
  adminLabel: "Admin console",
  androidVersion: "1.12.13",
  androidSize: "28.2 MB",
  /** Dummy install URL for local UI — replace with real CDN later. */
  downloadUrl: "https://download.boltapunjab.dev/android/bolta-punjab-1.12.13.apk",
} as const;

export const STORAGE_KEYS = {
  adminSession: "bp-admin-session",
  sidebarCollapsed: "bp-admin-sidebar-collapsed",
  mockStore: "bp-admin-mock-store",
} as const;
