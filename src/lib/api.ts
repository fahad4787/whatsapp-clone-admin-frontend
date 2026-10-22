export type BackendHealth = {
  ok: boolean;
  service: string;
  db: "up" | "down";
  redis: "up" | "down";
  ts: string;
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
