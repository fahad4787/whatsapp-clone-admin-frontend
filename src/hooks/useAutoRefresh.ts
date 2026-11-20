import { useEffect, useRef } from "react";

/**
 * Re-runs `load` quietly on an interval — only while the tab is visible — and
 * once more when the tab regains focus. Never overlaps itself, so a slow API
 * (cold start) can't pile up requests.
 */
export function useAutoRefresh(load: () => Promise<unknown> | void, ms = 15_000) {
  const ref = useRef(load);
  useEffect(() => {
    ref.current = load;
  });

  useEffect(() => {
    let busy = false;
    let last = Date.now();
    const run = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        await ref.current();
      } finally {
        busy = false;
        last = Date.now();
      }
    };
    const id = window.setInterval(() => void run(), ms);
    const onVisible = () => {
      if (!document.hidden && Date.now() - last > 4_000) void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [ms]);
}
