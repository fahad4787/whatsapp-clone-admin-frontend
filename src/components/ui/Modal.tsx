"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

const FOCUSABLE = 'input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])';

/** Esc to close, body scroll lock, focus first field, trap Tab, restore focus on close. */
export function useOverlay(open: boolean, onClose: () => void, panel: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const el = panel.current;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>("input,select,textarea") ?? el;
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === "Tab" && el) {
        const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!nodes.length) return;
        const [head, tail] = [nodes[0], nodes[nodes.length - 1]];
        if (e.shiftKey && document.activeElement === head) {
          e.preventDefault();
          tail.focus();
        } else if (!e.shiftKey && document.activeElement === tail) {
          e.preventDefault();
          head.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, panel]);
}

/**
 * Keeps an overlay mounted for `ms` after `open` turns false so it can play its exit animation.
 * Honours reduced motion by unmounting immediately.
 */
export function usePresence(open: boolean, ms = 180) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open || !mounted) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setMounted(false), reduce ? 0 : ms);
    return () => window.clearTimeout(t);
  }, [open, mounted, ms]);
  return { mounted, closing: mounted && !open };
}

/** While closing, keep showing what was on screen when the overlay was last open (its data may be cleared already). */
function useLastOpen<T>(open: boolean, value: T) {
  const last = useRef(value);
  if (open) last.current = value;
  return last.current;
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Wrap the body+footer in a form; submit fires on Enter. */
  onSubmit?: () => void;
};

const WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", onSubmit }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  const { mounted, closing } = usePresence(open, 160);
  const view = useLastOpen(open, { title, description, children, footer });
  if (!mounted || typeof document === "undefined") return null;

  const inner = (
    <>
      {view.children ? <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{view.children}</div> : null}
      {view.footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-muted/60 px-6 py-4">{view.footer}</div> : null}
    </>
  );

  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4", closing && "pointer-events-none")}>
      <div className={cn("absolute inset-0 bg-scrim backdrop-blur-[2px]", closing ? "animate-fade-out" : "animate-fade-in")} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof view.title === "string" ? view.title : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-t-2xl border border-line bg-surface shadow-pop outline-none sm:rounded-xl",
          closing ? "animate-pop-out" : "animate-pop-in",
          WIDTH[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink">{view.title}</h2>
            {view.description ? <p className="mt-0.5 text-[13px] text-muted">{view.description}</p> : null}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2">
            <X size={16} />
          </IconButton>
        </div>
        {onSubmit ? (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!closing) onSubmit();
            }}
          >
            {inner}
          </form>
        ) : (
          inner
        )}
      </div>
    </div>,
    document.body,
  );
}

type DrawerProps = { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; width?: "md" | "lg" };

/** Right-side panel for record details. */
export function Drawer({ open, onClose, title, description, children, footer, width = "md" }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, panel);
  const { mounted, closing } = usePresence(open, 200);
  const view = useLastOpen(open, { title, description, children, footer });
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    <div className={cn("fixed inset-0 z-50", closing && "pointer-events-none")}>
      <div className={cn("absolute inset-0 bg-scrim", closing ? "animate-fade-out" : "animate-fade-in")} onClick={onClose} aria-hidden />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={typeof view.title === "string" ? view.title : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-pop outline-none",
          closing ? "animate-slide-out" : "animate-slide-in",
          width === "lg" ? "max-w-2xl" : "max-w-md",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight text-ink">{view.title}</h2>
            {view.description ? <p className="mt-0.5 text-[13px] text-muted">{view.description}</p> : null}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2">
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{view.children}</div>
        {view.footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{view.footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}
