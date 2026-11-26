"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtNumber } from "@/lib/format";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A number that eases to its new value when it changes (not on first render, so loading never
 * "counts up" from zero). Tabular figures keep the width steady while it moves.
 */
export function AnimatedNumber({ value, format = fmtNumber, duration = 420 }: { value: number | null | undefined; format?: (n: number) => string; duration?: number }) {
  const [tween, setTween] = useState<number | null>(null);
  const shown = useRef(value);

  useEffect(() => {
    const from = shown.current;
    if (value == null || from == null || from === value || reducedMotion()) {
      shown.current = value;
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      const v = Math.round(from + (value - from) * eased);
      shown.current = v;
      setTween(p < 1 ? v : null);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      setTween(null);
    };
  }, [value, duration]);

  if (value == null) return <>—</>;
  return <span className="tnum">{format(tween ?? value)}</span>;
}

type DeltaProps = {
  /** Percent change; null means there was no baseline (previous period was zero). */
  pct: number | null;
  current: number;
  /** Which direction is good news. Colour follows this; the arrow always follows the number. */
  goodWhen?: "up" | "down";
  /** Read by screen readers after the number, e.g. "vs the 7 days before". */
  context: string;
  className?: string;
};

/** Small trend pill: arrow + percentage, coloured by whether the change is good news. */
export function Delta({ pct, current, goodWhen = "up", context, className }: DeltaProps) {
  const base = "inline-flex items-center gap-0.5 rounded-md px-1.5 py-px text-[11.5px] font-semibold tnum";
  if (pct == null) {
    return (
      <span className={cn(base, "bg-surface-muted text-muted", className)} title={context}>
        {current > 0 ? "New" : "No activity"}
        <span className="sr-only"> {context}</span>
      </span>
    );
  }
  const rounded = Math.round(pct);
  const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const good = dir === "flat" ? null : dir === goodWhen;
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const text = `${Math.abs(rounded) >= 1000 ? ">999" : Math.abs(rounded)}%`;
  return (
    <span
      className={cn(base, good == null ? "bg-surface-muted text-muted" : good ? "bg-brand-soft text-brand-text" : "bg-danger-soft text-danger-text", className)}
      title={context}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden />
      <span className="sr-only">{dir === "up" ? "Up " : dir === "down" ? "Down " : "Unchanged "}</span>
      {dir === "flat" ? "0%" : text}
      <span className="sr-only"> {context}</span>
    </span>
  );
}

/** Tiny trend line. Decorative: the numbers it shows are always available as text nearby. */
export function Sparkline({ data, className, height = 32 }: { data: number[]; className?: string; height?: number }) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const w = 100;
  const max = Math.max(...data, 1);
  const pad = 2;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - pad - (v / max) * (height - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("block overflow-visible", className)} style={{ height }}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--chart-1)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${w},${height}L0,${height}Z`} fill={`url(#sg-${id})`} />
      <path d={line} fill="none" stroke="var(--chart-1)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
