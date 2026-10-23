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

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${apiBaseUrl()}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "login_failed");
  }
  return data as {
    access: string;
    admin: { id: string; email: string; display_name: string | null; role: string };
  };
}

export async function fetchAdminOtps(token: string, signal?: AbortSignal) {
  const res = await fetch(`${apiBaseUrl()}/api/admin/otps?limit=50`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "otp_list_failed");
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
  created_at: string;
  updated_at: string;
  device_count: number;
  conversation_count: number;
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
};

export type AdminMetrics = {
  users_total: number;
  users_banned: number;
  signups_today: number;
  messages_today: number;
  messages_last_7d: number;
  reports_open: number;
  conversations_total: number;
};

function adminHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

export async function fetchAdminUsers(token: string, q?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" });
  if (q?.trim()) params.set("q", q.trim());
  const res = await fetch(`${apiBaseUrl()}/api/admin/users?${params}`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "users_list_failed");
  return data as { items: AdminUserItem[] };
}

export async function banAdminUser(token: string, userId: string, reason?: string) {
  const res = await fetch(`${apiBaseUrl()}/api/admin/users/${userId}/ban`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "ban_failed");
  return data as AdminUserItem;
}

export async function unbanAdminUser(token: string, userId: string) {
  const res = await fetch(`${apiBaseUrl()}/api/admin/users/${userId}/unban`, {
    method: "POST",
    headers: adminHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "unban_failed");
  return data as AdminUserItem;
}

export async function fetchAdminReports(token: string, status?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: "100" });
  if (status) params.set("status", status);
  const res = await fetch(`${apiBaseUrl()}/api/admin/reports?${params}`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "reports_list_failed");
  return data as { items: AdminReportItem[] };
}

export async function resolveAdminReport(
  token: string,
  reportId: string,
  action: "resolve" | "dismiss",
  opts?: { note?: string; ban_user?: boolean },
) {
  const res = await fetch(`${apiBaseUrl()}/api/admin/reports/${reportId}/resolve`, {
    method: "POST",
    headers: { ...adminHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      note: opts?.note,
      ban_user: opts?.ban_user ?? false,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "resolve_failed");
  return data as AdminReportItem;
}

export async function fetchAdminMetrics(token: string, signal?: AbortSignal) {
  const res = await fetch(`${apiBaseUrl()}/api/admin/metrics`, {
    headers: adminHeaders(token),
    signal,
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "metrics_failed");
  return data as AdminMetrics;
}
