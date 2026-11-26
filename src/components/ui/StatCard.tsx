import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Sparkline } from "./Metric";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  /** Trend pill shown before the hint (see <Delta>). */
  delta?: ReactNode;
  /** Recent daily values drawn as a sparkline beside the number. */
  spark?: number[];
  href?: string;
  loading?: boolean;
  accent?: "brand" | "danger" | "info" | "warning";
  active?: boolean;
  onClick?: () => void;
};

const ACCENT = {
  brand: "bg-brand-soft text-brand",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

export function StatCard({ label, value, icon, hint, delta, spark, href, loading, accent = "brand", active, onClick }: StatCardProps) {
  const interactive = !!(href || onClick);
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-muted">
          {icon ? <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", ACCENT[accent])}>{icon}</span> : null}
          <span className="truncate">{label}</span>
        </span>
        {href ? <ChevronRight size={15} aria-hidden className="shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-muted" /> : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 text-[28px] font-bold leading-none tracking-tight text-ink tnum">
          {loading ? <span className="skeleton inline-block h-7 w-20 align-middle" /> : value}
        </div>
        {spark && !loading ? <Sparkline data={spark} className="w-20 shrink-0 sm:w-24" height={30} /> : null}
      </div>
      {hint || delta ? (
        <div className="mt-2.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
          {loading ? <span className="skeleton inline-block h-3.5 w-28" /> : (
            <>
              {delta}
              {hint ? <span className="truncate">{hint}</span> : null}
            </>
          )}
        </div>
      ) : null}
    </>
  );
  const cls = cn(
    "group block rounded-xl border bg-surface p-4 text-left shadow-card transition-[border-color,box-shadow,transform] duration-150 ease-out",
    active ? "border-brand ring-4 ring-brand-ring" : "border-line",
    interactive && "hover:border-line-strong hover:shadow-raised active:scale-[0.99]",
  );
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={active} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
