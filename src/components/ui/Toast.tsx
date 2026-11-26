"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; title?: string; message: string; leaving?: boolean };
type ToastApi = { success: (message: string) => void; error: (message: string, title?: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

const DURATION: Record<ToastKind, number> = { success: 3500, error: 6000 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  // Per-toast countdown that pauses while the pointer or focus is on the stack (WCAG 2.2.1).
  const timers = useRef(new Map<number, { left: number; started: number; handle?: number }>());
  const paused = useRef(false);

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t?.handle) window.clearTimeout(t.handle);
    timers.current.delete(id);
    setItems((list) => list.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    window.setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 160);
  }, []);

  const arm = useCallback(
    (id: number) => {
      const t = timers.current.get(id);
      if (!t || paused.current) return;
      t.started = Date.now();
      t.handle = window.setTimeout(() => dismiss(id), t.left);
    },
    [dismiss],
  );

  const pause = useCallback(() => {
    if (paused.current) return;
    paused.current = true;
    timers.current.forEach((t) => {
      if (t.handle) window.clearTimeout(t.handle);
      t.handle = undefined;
      t.left = Math.max(1200, t.left - (Date.now() - t.started));
    });
  }, []);

  const resume = useCallback(() => {
    if (!paused.current) return;
    paused.current = false;
    timers.current.forEach((_, id) => arm(id));
  }, [arm]);

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => t.handle && window.clearTimeout(t.handle));
  }, []);

  // A removed toast never fires blur/pointerleave (e.g. focus was on its Dismiss button), so after
  // each change re-check whether focus or the pointer is really still on the stack.
  const stackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stackRef.current;
    if (!paused.current || !el) return;
    if (!el.contains(document.activeElement) && !el.matches(":hover")) resume();
  }, [items, resume]);

  const push = useCallback(
    (kind: ToastKind, message: string, title?: string) => {
      const id = nextId.current++;
      // Keep the stack short; the newest is the one that matters.
      // timers holds exactly the toasts that are showing and not leaving, oldest first.
      [...timers.current.keys()].slice(0, Math.max(0, timers.current.size - 3)).forEach(dismiss);
      setItems((list) => [...list, { id, kind, message, title }]);
      timers.current.set(id, { left: DURATION[kind], started: Date.now() });
      arm(id);
    },
    [arm, dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push("success", m), error: (m, t) => push("error", m, t) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        ref={stackRef}
        aria-live="polite"
        onPointerEnter={pause}
        onPointerLeave={resume}
        onFocus={pause}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && resume()}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {items.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : XCircle;
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop",
                t.leaving ? "animate-toast-out" : "animate-toast-in",
              )}
            >
              <Icon size={18} className={cn("mt-px shrink-0", t.kind === "success" ? "text-brand" : "text-danger")} />
              <div className="min-w-0 flex-1 text-[13px]">
                {t.title ? <div className="font-semibold text-ink">{t.title}</div> : null}
                <div className={t.title ? "text-muted" : "font-medium text-ink"}>{t.message}</div>
              </div>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="-m-1 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
