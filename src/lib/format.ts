/** Small, pure formatting helpers shared by admin screens. */

const valid = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(+d) ? null : d;
};

const dateTimeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const numberFmt = new Intl.NumberFormat();

export const fmtDateTime = (iso: string | null | undefined) => {
  const d = valid(iso);
  return d ? dateTimeFmt.format(d) : "—";
};

export const fmtDate = (iso: string | null | undefined) => {
  const d = valid(iso);
  return d ? dateFmt.format(d) : "—";
};

export const fmtTime = (iso: string | null | undefined) => {
  const d = valid(iso);
  return d ? timeFmt.format(d) : "—";
};

export const fmtNumber = (n: number | null | undefined) => (n == null ? "—" : numberFmt.format(n));

/** 75 → "1:15", 3725 → "1:02:05". */
export function fmtDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = String(totalSeconds % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** "5 min ago" style label. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  const d = valid(iso);
  if (!d) return "—";
  const s = Math.max(0, Math.round((now - +d) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 30 * 86_400) return `${Math.floor(s / 86_400)} d ago`;
  return fmtDate(iso);
}

/** "change_number" → "Change number". */
export const humanize = (s: string) => s.replace(/[_.]/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Two-letter initials; a phone-only name shows its last two digits instead of "+9". */
export function initials(name: string | null | undefined, fallback = "?"): string {
  const words = (name ?? "").trim().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  if (!words.length) return fallback;
  if (/^\d+$/.test(words.join(""))) return words.join("").slice(-2);
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
