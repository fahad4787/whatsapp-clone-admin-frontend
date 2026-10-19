"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "lg" ? "max-w-2xl" : "max-w-xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[8vh] pb-10 sm:pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bp-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-[#0c1612]/45 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} animate-[bp-modal-in_160ms_ease-out] rounded-[var(--radius)] border border-bp-border bg-white shadow-[0_20px_50px_rgba(12,22,18,0.18)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-bp-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="bp-modal-title" className="text-[1.05rem] font-bold tracking-tight text-bp-ink">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-bp-muted">{description}</p> : null}
          </div>
          <button type="button" className="bp-icon-btn shrink-0" aria-label="Close dialog" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[min(62vh,28rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-bp-border bg-[#fafcfb] px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        ) : (
          <div className="flex justify-end border-t border-bp-border bg-[#fafcfb] px-5 py-3.5 sm:px-6">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
