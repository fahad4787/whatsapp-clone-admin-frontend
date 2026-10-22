"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl, fetchBackendHealth, type BackendHealth } from "@/lib/api";

type State =
  | { status: "loading" }
  | { status: "ok"; health: BackendHealth }
  | { status: "down"; detail: string };

export function BackendHealthBanner() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    void (async () => {
      const { health, error } = await fetchBackendHealth(ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (!health) {
        setState({ status: "down", detail: error ?? "unreachable" });
        return;
      }
      if (!health.ok) {
        setState({
          status: "down",
          detail: `db=${health.db} redis=${health.redis}`,
        });
        return;
      }
      setState({ status: "ok", health });
    })();
    return () => ctrl.abort();
  }, []);

  const base = apiBaseUrl();

  if (state.status === "loading") {
    return (
      <div className="mb-3 rounded-[var(--radius)] border border-bp-border bg-white px-4 py-2.5 text-sm text-bp-muted">
        Checking API at <span className="font-mono text-xs">{base}</span>…
      </div>
    );
  }

  if (state.status === "ok") {
    return (
      <div className="mb-3 rounded-[var(--radius)] border border-[#cfe8d8] bg-[#f3faf6] px-4 py-2.5 text-sm text-bp-ink">
        API <strong className="text-bp-green">healthy</strong>
        <span className="text-bp-muted"> · db {state.health.db} · redis {state.health.redis}</span>
        <span className="ml-2 font-mono text-[11px] text-bp-muted">{base}</span>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-[var(--radius)] border border-[#f0d4d4] bg-[#fff7f7] px-4 py-2.5 text-sm text-bp-ink">
      API <strong className="text-red-600">unreachable</strong>
      <span className="text-bp-muted"> · {state.detail}</span>
      <span className="ml-2 font-mono text-[11px] text-bp-muted">{base}</span>
    </div>
  );
}
