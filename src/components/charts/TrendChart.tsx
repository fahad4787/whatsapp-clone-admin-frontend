"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { MetricsPoint } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNumber } from "@/lib/format";
import { fmtDay, fmtDayLong, niceScale, type SeriesMetric } from "@/lib/series";

type Props = {
  current: MetricsPoint[];
  previous: MetricsPoint[];
  metric: SeriesMetric;
  /** Noun for the tooltip and the accessible summary, e.g. "messages". */
  unit: string;
  height?: number;
};

const M = { top: 12, right: 12, bottom: 26, left: 44 };

/** Hook: element width via ResizeObserver (0 until measured). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Daily line for the current period with the previous period as a dashed comparison line.
 * Crosshair + tooltip on hover, arrow keys when focused. One y-axis, starts at zero.
 */
export function TrendChart({ current, previous, metric, unit, height = 240 }: Props) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = current.length;

  const cur = current.map((p) => p[metric]);
  const prev = previous.map((p) => p[metric]);
  const { max, step } = niceScale(Math.max(...cur, ...prev, 0));
  const iw = Math.max(width - M.left - M.right, 0);
  const ih = height - M.top - M.bottom;
  const x = (i: number) => M.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => M.top + ih - (v / max) * ih;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);

  // Up to ~6 date labels, fewer on narrow charts so each "Nov 20" (~40px) keeps a clear gap.
  const maxLabels = Math.max(2, Math.min(6, Math.floor(iw / 72)));
  const every = Math.max(1, Math.ceil(n / maxLabels));
  const xLabels = current.map((p, i) => ({ i, label: fmtDay(p.date) })).filter(({ i }) => (n - 1 - i) % every === 0);

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const d = e.key === "ArrowRight" ? 1 : -1;
      setHover((h) => Math.max(0, Math.min(n - 1, (h ?? (d > 0 ? -1 : n)) + d)));
    } else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(n - 1);
    else if (e.key === "Escape") setHover(null);
  };

  const total = cur.reduce((a, b) => a + b, 0);
  const peak = cur.length ? Math.max(...cur) : 0;
  const summary = n
    ? `${fmtNumber(total)} ${unit} from ${fmtDay(current[0].date)} to ${fmtDay(current[n - 1].date)}; busiest day ${fmtNumber(peak)}. Use left and right arrow keys to read each day.`
    : "No data";

  const h = hover;
  const tipLeft = h != null ? x(h) : 0;
  const flip = h != null && tipLeft > width - 190;

  return (
    <div ref={wrap} className="relative w-full select-none" style={{ height }}>
      {width > 0 && n > 0 ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={summary}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={M.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--chart-axis)] text-[11px] tnum">
                {fmtNumber(t)}
              </text>
            </g>
          ))}
          {xLabels.map(({ i, label }) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="fill-[var(--chart-axis)] text-[11px]">
              {label}
            </text>
          ))}

          <path d={`${path(cur)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill="var(--chart-1-fill)" className="animate-fade-in" />
          {prev.length === n ? (
            <path d={path(prev)} fill="none" stroke="var(--chart-compare)" strokeWidth={1.5} strokeDasharray="4 4" strokeLinejoin="round" />
          ) : null}
          <path d={path(cur)} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="chart-draw" pathLength={1} />

          {h != null ? (
            <g pointerEvents="none">
              <line x1={x(h)} x2={x(h)} y1={M.top} y2={M.top + ih} stroke="var(--line-strong)" />
              {prev.length === n ? <circle cx={x(h)} cy={y(prev[h])} r={4} fill="var(--surface)" stroke="var(--chart-compare)" strokeWidth={2} /> : null}
              <circle cx={x(h)} cy={y(cur[h])} r={4.5} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          ) : null}

          <rect
            x={M.left}
            y={M.top}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
          />
        </svg>
      ) : (
        <div className="skeleton h-full w-full" />
      )}

      {h != null && width > 0 ? (
        <div
          role="status"
          className={cn(
            "pointer-events-none absolute top-1 z-10 min-w-[10.5rem] rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop",
            flip ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
          )}
          style={{ left: tipLeft }}
        >
          <div className="mb-1.5 font-semibold text-ink">{fmtDayLong(current[h].date)}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-0.5 w-3 rounded-full bg-[var(--chart-1)]" aria-hidden /> This period
            </span>
            <span className="font-semibold text-ink tnum">{fmtNumber(cur[h])}</span>
          </div>
          {prev.length === n ? (
            <div className="mt-1 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="w-3 border-t-[1.5px] border-dashed border-[var(--chart-compare)]" aria-hidden /> {fmtDay(previous[h].date)}
              </span>
              <span className="font-medium text-ink-soft tnum">{fmtNumber(prev[h])}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The same data as an accessible table (toggle for screen-reader and spreadsheet users). */
export function TrendTable({ current, previous, metric, unit }: Omit<Props, "height">) {
  return (
    <div className="max-h-[240px] overflow-auto rounded-md border border-line">
      <table className="w-full text-[13px]">
        <caption className="sr-only">Daily {unit}, this period compared with the previous period</caption>
        <thead className="sticky top-0 bg-surface-muted text-left text-xs text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">Day</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">This period</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Previous period</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {current.map((p, i) => (
            <tr key={p.date}>
              <th scope="row" className="px-3 py-1.5 text-left font-medium text-ink-soft">{fmtDayLong(p.date)}</th>
              <td className="px-3 py-1.5 text-right text-ink tnum">{fmtNumber(p[metric])}</td>
              <td className="px-3 py-1.5 text-right text-muted tnum">
                {previous[i] ? <>{fmtNumber(previous[i][metric])} <span className="text-xs">({fmtDay(previous[i].date)})</span></> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
