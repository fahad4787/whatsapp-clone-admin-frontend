"use client";

import { useEffect, useRef } from "react";
import { adminApi, getAdminToken, type CallsSnapshot } from "@/lib/api";

/**
 * Live call snapshots over SSE, pushed whenever a call starts, is answered or ends.
 * Falls back to polling every 5 s when EventSource fails (proxy / CORS) and retries SSE every 15 s.
 */
export function useAdminCallsStream(onSnapshot: (snap: CallsSnapshot) => void, enabled = true) {
  const cb = useRef(onSnapshot);
  cb.current = onSnapshot;

  useEffect(() => {
    if (!enabled) return;
    const token = getAdminToken();
    if (!token) return;

    let stopped = false;
    let es: EventSource | null = null;
    let pollTimer: number | null = null;
    let retryTimer: number | null = null;

    const stopPolling = () => {
      if (pollTimer != null) window.clearInterval(pollTimer);
      pollTimer = null;
    };

    const startPolling = () => {
      if (pollTimer != null) return;
      const tick = async () => {
        if (stopped || document.hidden) return;
        try {
          const data = await adminApi.calls.live();
          cb.current({ items: data.items, count: data.count, calls_active: data.count, calls_today: -1 });
        } catch {
          /* ignore — next tick retries */
        }
      };
      void tick();
      pollTimer = window.setInterval(() => void tick(), 5_000);
    };

    const connect = () => {
      if (stopped) return;
      es = new EventSource(adminApi.calls.streamUrl(token));
      es.onopen = stopPolling;
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as CallsSnapshot & { type?: string };
          if (data?.type === "calls") cb.current(data);
        } catch {
          /* ignore malformed frames */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        startPolling();
        if (!stopped && retryTimer == null) {
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            connect();
          }, 15_000);
        }
      };
    };

    connect();
    return () => {
      stopped = true;
      es?.close();
      stopPolling();
      if (retryTimer != null) window.clearTimeout(retryTimer);
    };
  }, [enabled]);
}
