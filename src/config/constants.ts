/** App-wide constants (no secrets). Swap when wiring real backend / CDN. */
export const APP = {
  name: "Aivora",
  adminLabel: "Admin console",
  androidVersion: "1.12.13",
  androidSize: "28.2 MB",
  /** Dummy install URL for local UI — replace with real CDN later. */
  downloadUrl: "https://download.aivora.dev/android/aivora-1.12.13.apk",
} as const;

export const STORAGE_KEYS = {
  adminSession: "av-admin-session",
  adminToken: "av-admin-token",
  sidebarCollapsed: "av-admin-sidebar-collapsed",
  mockStore: "av-admin-mock-store",
} as const;
