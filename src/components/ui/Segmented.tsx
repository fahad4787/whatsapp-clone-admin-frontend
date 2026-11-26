"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

type SegmentedProps<V extends string> = {
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string; count?: number }[];
  label: string;
  className?: string;
};

/**
 * Pill tab group for switching a list filter. The white thumb slides to the selected option;
 * arrow keys, Home and End move the selection (roving tabindex).
 */
export function Segmented<V extends string>({ value, onChange, options, label, className }: SegmentedProps<V>) {
  const wrap = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  // Inline option arrays change identity every render; key the effect on their content instead.
  const optionsKey = options.map((o) => `${o.value}:${o.label}:${o.count ?? ""}`).join("|");

  useLayoutEffect(() => {
    const el = wrap.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el) return setThumb(null);
    const measure = () =>
      setThumb((t) => (t && t.x === el.offsetLeft && t.w === el.offsetWidth ? t : { x: el.offsetLeft, w: el.offsetWidth }));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Only slide after the first placement, so it doesn't fly in on mount.
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, [value, optionsKey]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    const next =
      e.key === "ArrowRight" ? (i + 1) % options.length
      : e.key === "ArrowLeft" ? (i - 1 + options.length) % options.length
      : e.key === "Home" ? 0
      : e.key === "End" ? options.length - 1
      : null;
    if (next == null) return;
    e.preventDefault();
    onChange(options[next].value);
    wrap.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={wrap}
      role="tablist"
      aria-label={label}
      onKeyDown={onKey}
      className={cn("relative inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-surface-muted p-1", className)}
    >
      {thumb ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-1 left-0 rounded-lg bg-surface shadow-xs ring-1 ring-line",
            animate && "transition-[transform,width] duration-200 ease-out",
          )}
          style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }}
        />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-ring",
              active ? "text-ink" : "text-muted hover:text-ink",
              !thumb && active && "bg-surface shadow-xs ring-1 ring-line",
            )}
          >
            {o.label}
            {o.count != null ? (
              <span className={cn("rounded-full px-1.5 text-[11px] tnum", active ? "bg-brand-soft text-brand-text" : "bg-line/70 text-muted")}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
