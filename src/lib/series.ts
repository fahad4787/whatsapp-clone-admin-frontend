import type { MetricsPoint } from "@/lib/api";

export type SeriesMetric = "signups" | "messages" | "calls";

/**
 * The series endpoint returns complete UTC days only, ending yesterday (today is still filling up).
 * Trend maths compares the last `n` days with the `n` before them. Returns null when the series is
 * too short to compare honestly.
 */
export function windows(points: MetricsPoint[] | undefined, n: number) {
  if (!points) return null;
  if (points.length < n * 2) return null;
  return { current: points.slice(-n), previous: points.slice(-n * 2, -n) };
}

export const sum = (pts: MetricsPoint[], metric: SeriesMetric) => pts.reduce((s, p) => s + p[metric], 0);

/** Percentage change, or null when there is no baseline to compare against. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

const dayFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
const longDayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "27 Nov" for a "YYYY-MM-DD" UTC day key. */
export const fmtDay = (key: string) => dayFmt.format(new Date(`${key}T00:00:00Z`));
export const fmtDayLong = (key: string) => longDayFmt.format(new Date(`${key}T00:00:00Z`));

/** A round axis maximum and step (1, 2, 2.5 or 5 × 10ⁿ) giving about `ticks` gridlines. */
export function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { max: ticks, step: 1 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  return { max: Math.ceil(max / step) * step, step };
}
