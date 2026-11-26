import { apiBaseUrl, request } from "./http";
import type {
  AdminItem,
  AdminRole,
  AppSettings,
  AuditItem,
  BackendHealth,
  CallItem,
  CallStatus,
  ChannelItem,
  ChannelPost,
  ConversationDetail,
  ConversationItem,
  CountryItem,
  Firewall,
  LegalDocs,
  LoginResult,
  Metrics,
  MetricsSeries,
  OtpItem,
  ReportItem,
  ReportStatus,
  SecuritySettings,
  StickerPack,
  TotpSetup,
  UserItem,
} from "./types";

type Items<T> = { items: T[] };
type Sig = AbortSignal | undefined;
const id = encodeURIComponent;

/** Admin sign-in. Ticket-bearing steps use the ticket as the bearer, never the stored session. */
export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const data = await request<LoginResult | Omit<Extract<LoginResult, { status: "ok" }>, "status">>(
      "/api/admin/auth/login",
      { method: "POST", body: { email, password }, anonymous: true },
    );
    return "access" in data ? { ...data, status: "ok" } : data;
  },
  async verifyTotp(ticket: string, code: string): Promise<Extract<LoginResult, { status: "ok" }>> {
    const data = await request<Omit<Extract<LoginResult, { status: "ok" }>, "status">>("/api/admin/auth/totp", {
      method: "POST",
      body: { code },
      bearer: ticket,
    });
    return { ...data, status: "ok" };
  },
  setupTotp: (ticket: string) => request<TotpSetup>("/api/admin/auth/totp/setup", { method: "POST", bearer: ticket }),
  async confirmTotp(ticket: string, code: string): Promise<Extract<LoginResult, { status: "ok" }>> {
    const data = await request<Omit<Extract<LoginResult, { status: "ok" }>, "status">>("/api/admin/auth/totp/confirm", {
      method: "POST",
      body: { code },
      bearer: ticket,
    });
    return { ...data, status: "ok" };
  },
};

/** Public health probe — never throws; returns null when the API is unreachable. */
export async function fetchHealth(signal?: AbortSignal): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/health`, { signal, cache: "no-store" });
    return (await res.json()) as BackendHealth;
  } catch {
    return null;
  }
}

export const adminApi = {
  metrics: (signal?: Sig) => request<Metrics>("/api/admin/metrics", { signal }),
  /** Daily counts for the trend charts. Older backends return 404; callers treat that as "no trend data". */
  metricsSeries: (days: number, signal?: Sig) => request<MetricsSeries>("/api/admin/metrics/series", { query: { days }, signal }),

  otps: {
    list: (signal?: Sig) => request<Items<OtpItem>>("/api/admin/otps", { query: { limit: 100 }, signal }),
    generate: (phone: string) =>
      request<{ id: string; phone: string; code: string }>("/api/admin/otps/generate", { method: "POST", body: { phone } }),
  },

  users: {
    list: (p: { q?: string; banned?: boolean }, signal?: Sig) =>
      request<Items<UserItem>>("/api/admin/users", { query: { limit: 100, q: p.q?.trim(), banned: p.banned ? 1 : undefined }, signal }),
    create: (phone: string, display_name?: string) =>
      request<UserItem>("/api/admin/users", { method: "POST", body: { phone, display_name: display_name || undefined } }),
    ban: (userId: string, reason?: string) =>
      request<UserItem>(`/api/admin/users/${id(userId)}/ban`, { method: "POST", body: { reason: reason || undefined } }),
    unban: (userId: string) => request<UserItem>(`/api/admin/users/${id(userId)}/unban`, { method: "POST" }),
    remove: (userId: string) => request<null>(`/api/admin/users/${id(userId)}`, { method: "DELETE" }).then(() => true as const),
  },

  reports: {
    list: (status: ReportStatus | "all", signal?: Sig) =>
      request<Items<ReportItem>>("/api/admin/reports", { query: { limit: 100, status: status === "all" ? undefined : status }, signal }),
    resolve: (reportId: string, body: { action: "resolve" | "dismiss"; note?: string; ban_user?: boolean }) =>
      request<ReportItem>(`/api/admin/reports/${id(reportId)}/resolve`, { method: "POST", body }),
  },

  conversations: {
    list: (p: { q?: string; type?: "direct" | "group" }, signal?: Sig) =>
      request<Items<ConversationItem>>("/api/admin/conversations", { query: { limit: 100, q: p.q?.trim(), type: p.type }, signal }),
    get: (conversationId: string, signal?: Sig) =>
      request<ConversationDetail>(`/api/admin/conversations/${id(conversationId)}`, { query: { limit: 100 }, signal }),
  },

  calls: {
    live: (signal?: Sig) => request<Items<CallItem> & { count: number }>("/api/admin/calls/live", { signal }),
    list: (p: { q?: string; status?: CallStatus; media?: "audio" | "video" }, signal?: Sig) =>
      request<Items<CallItem>>("/api/admin/calls", { query: { limit: 200, q: p.q?.trim(), status: p.status, media: p.media }, signal }),
    end: (callId: string) => request<{ call: CallItem }>(`/api/admin/calls/${id(callId)}/end`, { method: "POST" }),
    streamUrl: (token: string) => `${apiBaseUrl()}/api/admin/calls/stream?token=${id(token)}`,
  },

  settings: {
    get: (signal?: Sig) => request<{ settings: AppSettings; defaults?: AppSettings }>("/api/admin/settings", { signal }),
    update: (patch: Partial<AppSettings>) => request<{ settings: AppSettings }>("/api/admin/settings", { method: "PUT", body: patch }),
  },

  countries: {
    list: (signal?: Sig) => request<Items<CountryItem>>("/api/admin/countries", { signal }),
    update: (iso: string, patch: Partial<Omit<CountryItem, "iso">>) =>
      request<CountryItem>(`/api/admin/countries/${id(iso)}`, { method: "PUT", body: patch }),
  },

  admins: {
    list: (signal?: Sig) => request<Items<AdminItem>>("/api/admin/admins", { signal }),
    create: (body: { email: string; password: string; display_name?: string; role: AdminRole }) =>
      request<AdminItem>("/api/admin/admins", { method: "POST", body }),
  },

  audit: (signal?: Sig) => request<Items<AuditItem>>("/api/admin/audit", { query: { limit: 200 }, signal }),

  channels: {
    list: (signal?: Sig) => request<Items<ChannelItem>>("/api/admin/channels", { signal }),
    create: (body: { name: string; description?: string | null; verified?: boolean; listed?: boolean }) =>
      request<ChannelItem>("/api/admin/channels", { method: "POST", body }),
    update: (channelId: string, patch: { name?: string; description?: string | null; verified?: boolean; listed?: boolean }) =>
      request<ChannelItem>(`/api/admin/channels/${id(channelId)}`, { method: "PATCH", body: patch }),
    remove: (channelId: string) => request<{ ok: boolean }>(`/api/admin/channels/${id(channelId)}`, { method: "DELETE" }),
    posts: (channelId: string, signal?: Sig) => request<Items<ChannelPost>>(`/api/admin/channels/${id(channelId)}/posts`, { signal }),
    hidePost: (channelId: string, postId: string) =>
      request<{ ok: boolean }>(`/api/admin/channels/${id(channelId)}/posts/${id(postId)}`, { method: "DELETE" }),
  },

  stickers: (signal?: Sig) => request<Items<StickerPack> & { note?: string }>("/api/admin/stickers", { signal }),

  firewall: {
    get: (signal?: Sig) => request<Firewall>("/api/admin/firewall", { signal }),
    update: (allowlist: string[]) => request<Firewall>("/api/admin/firewall", { method: "PUT", body: { allowlist } }),
  },

  legal: {
    get: (signal?: Sig) => request<LegalDocs>("/api/admin/legal", { signal }),
    update: (docs: LegalDocs) => request<LegalDocs>("/api/admin/legal", { method: "PUT", body: docs }),
  },

  security: {
    get: (signal?: Sig) => request<SecuritySettings & { note?: string }>("/api/admin/security", { signal }),
    update: (patch: Partial<SecuritySettings>) =>
      request<SecuritySettings & { note?: string }>("/api/admin/security", { method: "PUT", body: patch }),
  },
};
