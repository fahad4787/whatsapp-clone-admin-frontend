"use client";

import { useEffect, useRef } from "react";
import { STORAGE_KEYS } from "@/config/constants";
import { apiBaseUrl, type AdminCallItem } from "@/lib/api";

export type AdminCallsStreamPayload = {
  type: "calls";
  items: AdminCallItem[];
  count: number;
  calls_active: number;
  calls_today: number;
};

/**
 * Subscribe to admin call SSE. Updates push whenever a call starts/answers/ends.
 * Falls back to a quiet poll if EventSource fails (proxy / CORS).
 */
export function useAdminCallsStream(
  onSnapshot: (payload: AdminCallsStreamPayload) => void,
  enabled = true,
) {
  const cb = useRef(onSnapshot);
  cb.current = onSnapshot;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let stopped = false;
    let es: EventSource | null = null;
    let pollTimer: number | null = null;
    let retryTimer: number | null = null;

    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;

    const startPollFallback = () => {
      if (pollTimer != null) return;
      const tick = async () => {
        if (stopped) return;
        try {
          const res = await fetch(`${apiBaseUrl()}/api/admin/calls/live`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            cache: "no-store",
          });
          if (!res.ok) return;
          const data = (await res.json()) as { items: AdminCallItem[]; count: number };
          cb.current({
            type: "calls",
            items: data.items,
            count: data.count,
            calls_active: data.count,
            calls_today: 0,
          });
        } catch {
          /* ignore */
        }
      };
      void tick();
      pollTimer = window.setInterval(() => void tick(), 5_000);
    };

    const connect = () => {
      if (stopped) return;
      const url = `${apiBaseUrl()}/api/admin/calls/stream?token=${encodeURIComponent(token)}`;
      es = new EventSource(url);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as AdminCallsStreamPayload;
          if (data?.type === "calls") cb.current(data);
        } catch {
          /* ignore bad frames */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        startPollFallback();
        if (!stopped && retryTimer == null) {
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            if (pollTimer != null) {
              window.clearInterval(pollTimer);
              pollTimer = null;
            }
            connect();
          }, 15_000);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      es?.close();
      if (pollTimer != null) window.clearInterval(pollTimer);
      if (retryTimer != null) window.clearTimeout(retryTimer);
    };
  }, [enabled]);
}
