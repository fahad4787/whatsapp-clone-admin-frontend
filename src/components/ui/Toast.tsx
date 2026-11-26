"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; title?: string; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string, title?: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

const DURATION: Record<ToastKind, number> = { success: 3500, error: 6000 };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, message: string, title?: string) => {
      const id = nextId.current++;
      // Keep the stack short; the newest is the one that matters.
      setItems((list) => [...list.slice(-3), { id, kind, message, title }]);
      window.setTimeout(() => dismiss(id), DURATION[kind]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push("success", m), error: (m, t) => push("error", m, t) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end">
        {items.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : XCircle;
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-pop"
            >
              <Icon size={18} className={cn("mt-px shrink-0", t.kind === "success" ? "text-brand" : "text-danger")} />
              <div className="min-w-0 flex-1 text-[13px]">
                {t.title ? <div className="font-semibold text-ink">{t.title}</div> : null}
                <div className={t.title ? "text-muted" : "font-medium text-ink"}>{t.message}</div>
              </div>
              <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-subtle hover:text-ink">
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
