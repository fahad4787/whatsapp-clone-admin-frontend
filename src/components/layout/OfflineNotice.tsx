"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Thin banner under the top bar while the browser reports no network. Data on screen may be stale. */
export function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="flex animate-fade-in items-center justify-center gap-2 border-b border-warning/20 bg-warning-soft px-4 py-2 text-[13px] font-medium text-ink-soft">
      <WifiOff size={15} className="shrink-0 text-warning" aria-hidden />
      You&apos;re offline. Figures on this page may be out of date and changes won&apos;t save until you reconnect.
    </div>
  );
}
