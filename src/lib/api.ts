import { STORAGE_KEYS } from "@/config/constants";

export type BackendHealth = {
  ok: boolean;
  service: string;
  db: "up" | "down";
  redis: "up" | "down";
  ts: string;
};

export type AdminOtpItem = {
  id: string;
  phone: string;
  code: string | null;
  status: string;
  attempts: number;
  expires_at: string;
  created_at: string;
  consumed_at: string | null;
};

export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

let redirecting = false;

/** fetch for authenticated admin calls: a 401 means the session is gone — go to login once, keeping the page. */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await apiFetch(input, init);
  if (res.status === 401 && typeof window !== "undefined" && !redirecting) {
    const headers = new Headers(init?.headers);
    if (headers.get("Authorization")?.startsWith("Bearer ") && !input.includes("/auth/")) {
      redirecting = true;
      clearAdminSession();
      const next = encodeURIComponent(window.location.pathname);
      window.location.replace(`/login?next=${next}&expired=1`);
    }
  }
  return res;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error?: unknown }).error;
    if (typeof err === "string" && err) return err;
  }
  return fallback;
}

export async function fetchBackendHealth(
  signal?: AbortSignal,
): Promise<{ health: BackendHealth | null; error: string | null }> {
  const url = `${apiBaseUrl()}/health`;
  try {
    const res = await fetch(url, { signal, cache: "no-store" });
    const health = (await res.json()) as BackendHealth;
    return { health, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unreachable";
    return { health: null, error: message };
  }
}

export type AdminLoginResult =
  | { status: "ok"; access: string; admin: { id: string; email: string; display_name: string | null; role: string } }
  | { status: "totp_required" | "totp_enrollment_required"; ticket: string };

async function authPost(path: string, body: unknown, token?: string): Promise<AdminLoginResult> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await readJson(res)) as Record<string, unknown> | null;
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "login_failed"));
  if (data && typeof data.access === "string") return { status: "ok", ...(data as object) } as AdminLoginResult;
  return data as AdminLoginResult;
}

export const adminLogin = (email: string, password: string) =>
  authPost("/api/admin/auth/login", { email, password });

export const adminTotpLogin = (ticket: string, code: string) =>
  authPost("/api/admin/auth/totp", { code }, ticket);

/** Persist a freshly issued admin token. */
export function saveAdminToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.adminSession, "1");
    localStorage.setItem(STORAGE_KEYS.adminToken, token);
  } catch {
    /* ignore */
  }
}

function tokenTimes(token: string): { iat: number; exp: number } | null {
  try {
    const b = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(b)) as { iat?: number; exp?: number };
    return p.exp ? { iat: p.iat ?? p.exp - 8 * 3600, exp: p.exp } : null;
  } catch {
    return null;
  }
}

/** Renew the session once half of its lifetime is gone. Network blips are ignored (retried next tick). */
export async function maybeRefreshAdminSession(): Promise<void> {
  const token = localStorage.getItem(STORAGE_KEYS.adminToken);
  if (!token) return;
  const t = tokenTimes(token);
  if (!t) return;
  const now = Date.now() / 1000;
  if (now - t.iat < (t.exp - t.iat) / 2) return;
  try {
    const res = await apiFetch(`${apiBaseUrl()}/api/admin/auth/refresh`, {
      method: "POST",
      headers: adminHeaders(token),
    });
    if (!res.ok) return;
    const data = (await readJson(res)) as { access?: string } | null;
    if (data?.access) saveAdminToken(data.access);
  } catch {
    /* offline / cold start — try again later */
  }
}

export async function fetchAdminOtps(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/otps?limit=50`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(data, "otp_list_failed"));
  }
  return data as { items: AdminOtpItem[] };
}

export type AdminUserItem = {
  id: string;
  phone: string;
  display_name: string | null;
  about: string | null;
  avatar_url: string | null;
  banned: boolean;
  banned_at: string | null;
  last_seen_at: string | null;
  last_seen_privacy: string;
  online_privacy: string;
  created_at: string;
  updated_at: string;
  device_count: number;
  conversation_count: number;
};

export type AdminReportMessage = {
  id: string;
  conversation_id: string;
  type: string;
  text: string;
  created_at: string;
};

export type AdminReportItem = {
  id: string;
  reporter_id: string;
  target_user_id: string | null;
  target_conversation_id: string | null;
  reason: string | null;
  message_ids: string[];
  status: string;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter: { id: string; phone: string; display_name: string | null };
  target_user: { id: string; phone: string; display_name: string | null } | null;
  messages?: AdminReportMessage[];
};

export type AdminMetrics = {
  users_total: number;
  users_banned: number;
  users_online?: number;
  signups_today: number;
  messages_today: number;
  messages_last_7d: number;
  messages_media_today?: number;
  messages_voice_today?: number;
  messages_polls_today?: number;
  messages_events_today?: number;
  reports_open: number;
  conversations_total: number;
  conversations_groups?: number;
  conversations_direct?: number;
  conversations_disappearing?: number;
  calls_active?: number;
  calls_today?: number;
};

export type AdminCallParticipant = {
  user_id: string;
  status: string;
  phone: string;
  display_name: string | null;
};

export type AdminCallItem = {
  id: string;
  kind: string;
  media: string;
  status: string;
  end_reason: string | null;
  room_name: string;
  conversation_id: string | null;
  conversation_title: string | null;
  initiator: { id: string; phone: string; display_name: string | null };
  participants: AdminCallParticipant[];
  participants_label: string;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  expires_at: string | null;
};

export type AdminConversationItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  message_count: number;
  disappearing_seconds: number;
  only_admins_can_send: boolean;
  only_admins_can_edit_info: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  members: {
    user_id: string;
    phone: string;
    display_name: string | null;
    role: string;
  }[];
};

export type AdminConversationDetail = AdminConversationItem & {
  messages: {
    id: string;
    sender_id: string;
    sender_name: string;
    type: string;
    text: string | null;
    status: string;
    forwarded: boolean;
    view_once: boolean;
    edited_at: string | null;
    expires_at: string | null;
    deleted_for_everyone_at: string | null;
    created_at: string;
    attachment_name: string | null;
    attachment_mime: string | null;
    has_attachment: boolean;
  }[];
};

function adminHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

export async function fetchAdminUsers(token: string, q?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" });
  if (q?.trim()) params.set("q", q.trim());
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/users?${params}`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "users_list_failed"));
  return data as { items: AdminUserItem[] };
}

export async function banAdminUser(token: string, userId: string, reason?: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/users/${userId}/ban`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "ban_failed"));
  return data as AdminUserItem;
}

export async function unbanAdminUser(token: string, userId: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/users/${userId}/unban`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "unban_failed"));
  return data as AdminUserItem;
}

export async function deleteAdminUser(token: string, userId: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
  if (res.status === 204) return;
  const data = await readJson(res);
  throw new ApiError(res.status, errorMessage(data, "delete_failed"));
}

export async function fetchAdminReports(token: string, status?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" });
  if (status) params.set("status", status);
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/reports?${params}`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "reports_list_failed"));
  return data as { items: AdminReportItem[] };
}

export async function resolveAdminReport(
  token: string,
  reportId: string,
  action: "resolve" | "dismiss",
  opts?: { note?: string; ban_user?: boolean },
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/reports/${reportId}/resolve`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      note: opts?.note,
      ban_user: opts?.ban_user ?? false,
    }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "resolve_failed"));
  return data as AdminReportItem;
}

export async function fetchAdminMetrics(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/metrics`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "metrics_failed"));
  return data as AdminMetrics;
}

export async function fetchAdminConversations(
  token: string,
  opts?: { q?: string; type?: string },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ limit: "100" });
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.type) params.set("type", opts.type);
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/conversations?${params}`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "conversations_failed"));
  return data as { items: AdminConversationItem[] };
}

export async function fetchAdminConversation(
  token: string,
  id: string,
  signal?: AbortSignal,
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/conversations/${id}?limit=50`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "conversation_failed"));
  return data as AdminConversationDetail;
}

/** Clear local admin session (e.g. after 401). */
export function clearAdminSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.adminToken);
    localStorage.removeItem(STORAGE_KEYS.adminSession);
  } catch {
    /* ignore */
  }
}

export async function fetchAdminLiveCalls(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/calls/live`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "live_calls_failed"));
  return data as { items: AdminCallItem[]; count: number };
}

export async function fetchAdminCalls(
  token: string,
  opts?: { q?: string; status?: string; media?: string; limit?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ limit: String(opts?.limit ?? 50) });
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.status?.trim()) params.set("status", opts.status.trim());
  if (opts?.media?.trim()) params.set("media", opts.media.trim());
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/calls?${params}`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "calls_list_failed"));
  return data as { items: AdminCallItem[] };
}

export async function endAdminCall(token: string, callId: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/calls/${callId}/end`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "force_end_failed"));
  return data as { call: AdminCallItem };
}

/** Wave 20 — snake_case settings from API. */
export type AdminSettingsDto = {
  otp_length: number;
  otp_expiry: number;
  otp_attempts: number;
  otp_gap: number;
  otp_per_phone_hourly: number;
  otp_per_ip_hourly: number;
  ring_timeout: number;
  max_group_call_participants: number;
  max_group_size: number;
  upload_limit_mb: number;
  edit_window_minutes: number;
  maintenance_mode: boolean;
  latest_android_version: string;
  latest_android_version_code: number;
  min_android_version_code: number;
  download_url: string;
  allow_people_search: boolean;
  min_search_chars: number;
  sms_enabled: boolean;
};

export type AdminCountryItem = {
  iso: string;
  name: string;
  dial: string;
  enabled: boolean;
  sort_order: number;
};

export type AdminAuditItem = {
  id: string;
  action: string;
  meta: unknown;
  created_at: string;
  actor: { id: string; email: string; display_name: string | null };
};

export type AdminAdminItem = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  updated_at?: string;
};

export async function fetchAdminSettings(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/settings`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "settings_failed"));
  return data as { settings: AdminSettingsDto };
}

export async function putAdminSettings(token: string, patch: Partial<AdminSettingsDto>) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/settings`, {
    method: "PUT",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "settings_save_failed"));
  return data as { settings: AdminSettingsDto };
}

export async function fetchAdminCountries(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/countries`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "countries_failed"));
  return data as { items: AdminCountryItem[] };
}

export async function updateAdminCountry(
  token: string,
  iso: string,
  patch: { enabled?: boolean; name?: string; dial?: string; sort_order?: number },
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/countries/${encodeURIComponent(iso)}`, {
    method: "PUT",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "country_update_failed"));
  return data as AdminCountryItem;
}

export async function fetchAdminAudit(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/audit?limit=100`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "audit_failed"));
  return data as { items: AdminAuditItem[] };
}

export async function fetchAdminAdmins(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/admins`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "admins_failed"));
  return data as { items: AdminAdminItem[] };
}

export async function createAdminAdmin(
  token: string,
  body: { email: string; password: string; display_name?: string; role?: "SUPER" | "MOD" },
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/admins`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "admin_create_failed"));
  return data as AdminAdminItem;
}

export type AdminChannelItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  verified: boolean;
  listed: boolean;
  followers: number;
  posts: number;
  created_at: string;
  updated_at: string;
};

export type AdminChannelPostItem = {
  id: string;
  text: string;
  deleted: boolean;
  view_count: number;
  created_at: string;
};

export type AdminStickerPackItem = {
  id: string;
  name: string;
  publisher: string;
  featured: boolean;
  stickers: number;
  created: string;
};

export async function fetchAdminChannels(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/channels`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "channels_failed"));
  return data as { items: AdminChannelItem[] };
}

export async function createAdminChannel(
  token: string,
  body: { name: string; slug?: string; description?: string; verified?: boolean; listed?: boolean },
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/channels`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "channel_create_failed"));
  return data as AdminChannelItem;
}

export async function patchAdminChannel(
  token: string,
  id: string,
  patch: { name?: string; description?: string | null; verified?: boolean; listed?: boolean },
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/channels/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "channel_update_failed"));
  return data as AdminChannelItem;
}

export async function deleteAdminChannel(token: string, id: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/channels/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "channel_delete_failed"));
  return data as { ok: boolean };
}

export async function fetchAdminChannelPosts(token: string, id: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/channels/${encodeURIComponent(id)}/posts`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "channel_posts_failed"));
  return data as { items: AdminChannelPostItem[] };
}

export async function hideAdminChannelPost(token: string, channelId: string, postId: string) {
  const res = await apiFetch(
    `${apiBaseUrl()}/api/admin/channels/${encodeURIComponent(channelId)}/posts/${encodeURIComponent(postId)}`,
    { method: "DELETE", headers: adminHeaders(token) },
  );
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "channel_post_hide_failed"));
  return data as { ok: boolean };
}

export async function fetchAdminStickers(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/stickers`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "stickers_failed"));
  return data as { items: AdminStickerPackItem[]; note?: string };
}

export async function fetchAdminFirewall(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/firewall`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "firewall_failed"));
  return data as { allowlist: string[]; client_ip: string | null };
}

export async function putAdminFirewall(token: string, allowlist: string[]) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/firewall`, {
    method: "PUT",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ allowlist }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "firewall_save_failed"));
  return data as { allowlist: string[]; client_ip: string | null };
}

export type AdminLegalDocs = {
  privacy_policy: string;
  terms_of_service: string;
};

export async function fetchAdminLegal(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/legal`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "legal_failed"));
  return data as AdminLegalDocs;
}

export async function putAdminLegal(token: string, body: AdminLegalDocs) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/legal`, {
    method: "PUT",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "legal_save_failed"));
  return data as AdminLegalDocs;
}

export type AdminSecuritySettings = {
  require_2fa: boolean;
  lock_after_fail: boolean;
  session_hours: number;
  max_fail_attempts: number;
  lock_minutes: number;
  note?: string;
};

export async function fetchAdminSecurity(token: string, signal?: AbortSignal) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/security`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "security_failed"));
  return data as AdminSecuritySettings;
}

export async function putAdminSecurity(
  token: string,
  body: Partial<Omit<AdminSecuritySettings, "note">>,
) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/security`, {
    method: "PUT",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "security_save_failed"));
  return data as AdminSecuritySettings;
}

export async function createAdminUser(token: string, phone: string, displayName?: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/users`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ phone, display_name: displayName || undefined }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "create_user_failed"));
  return data as AdminUserItem;
}

export async function generateAdminOtp(token: string, phone: string) {
  const res = await apiFetch(`${apiBaseUrl()}/api/admin/otps/generate`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new ApiError(res.status, errorMessage(data, "otp_generate_failed"));
  return data as { id: string; phone: string; code: string };
}

/** Download rows as a CSV file in the browser. */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Current admin bearer token (null when signed out or storage is unavailable). */
export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.adminToken);
  } catch {
    return null;
  }
}
