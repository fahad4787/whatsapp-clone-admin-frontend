import { STORAGE_KEYS } from "@/config/constants";

/** Error thrown for any failed API call. `code` is the backend's `error` field (or a client-side code). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const apiBaseUrl = (): string =>
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

/* ───────────────────────── Session storage ───────────────────────── */

function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const getAdminToken = (): string | null => store()?.getItem(STORAGE_KEYS.adminToken) ?? null;

export function saveAdminSession(token: string, email?: string) {
  const s = store();
  s?.setItem(STORAGE_KEYS.adminToken, token);
  if (email) s?.setItem(STORAGE_KEYS.adminEmail, email);
}

export function clearAdminSession() {
  const s = store();
  s?.removeItem(STORAGE_KEYS.adminToken);
  s?.removeItem(STORAGE_KEYS.adminEmail);
}

type TokenClaims = { role?: string; iat?: number; exp?: number };

function claims(token: string | null): TokenClaims | null {
  if (!token) return null;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64)) as TokenClaims;
  } catch {
    return null;
  }
}

export type AdminIdentity = { email: string | null; role: "SUPER" | "MOD" | null };

/** Who is signed in — display only; the server verifies every request. */
export function currentAdminIdentity(): AdminIdentity {
  const role = claims(getAdminToken())?.role;
  return {
    email: store()?.getItem(STORAGE_KEYS.adminEmail) ?? null,
    role: role === "SUPER" || role === "MOD" ? role : null,
  };
}

/* ───────────────────────── Request helper ───────────────────────── */

type Query = Record<string, string | number | boolean | null | undefined>;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Bearer token to send instead of the stored admin session (e.g. a TOTP ticket). Disables the 401 redirect. */
  bearer?: string;
  /** Send no Authorization header at all. */
  anonymous?: boolean;
};

let redirecting = false;

function sessionExpired() {
  if (redirecting || typeof window === "undefined") return;
  redirecting = true;
  clearAdminSession();
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.replace(`/login?next=${next}&expired=1`);
}

function buildUrl(path: string, query?: Query): string {
  const url = `${apiBaseUrl()}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Typed JSON request against the Aivora backend. Throws ApiError on any non-2xx or network failure. */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, bearer, anonymous } = opts;
  const token = anonymous ? null : (bearer ?? getAdminToken());
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError(0, "network_error");
  }

  if (res.status === 401 && token && !bearer && !anonymous) sessionExpired();

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const code = (data as { error?: unknown } | null)?.error;
    throw new ApiError(res.status, typeof code === "string" && code ? code : `http_${res.status}`);
  }
  return data as T;
}

/* ───────────────────────── Sliding session ───────────────────────── */

/** Renew the session once half of its lifetime has passed. Failures are ignored and retried next tick. */
export async function maybeRefreshAdminSession(): Promise<void> {
  const token = getAdminToken();
  const c = claims(token);
  if (!token || !c?.exp) return;
  const iat = c.iat ?? c.exp - 8 * 3600;
  if (Date.now() / 1000 - iat < (c.exp - iat) / 2) return;
  try {
    const data = await request<{ access?: string }>("/api/admin/auth/refresh", { method: "POST" });
    if (data?.access) saveAdminSession(data.access);
  } catch {
    /* offline / cold start — try again later */
  }
}
