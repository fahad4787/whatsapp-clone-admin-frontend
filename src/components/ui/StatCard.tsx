import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
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

export function StatCard({ label, value, icon, hint, href, loading, accent = "brand", active, onClick }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold text-muted">{label}</span>
        {icon ? <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", ACCENT[accent])}>{icon}</span> : null}
      </div>
      <div className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight tabular-nums text-ink">
        {loading ? <span className="skeleton inline-block h-7 w-16 align-middle" /> : value}
      </div>
      {hint ? <div className="mt-1 truncate text-xs text-muted">{hint}</div> : null}
    </>
  );
  const cls = cn(
    "block rounded-2xl border bg-surface p-4 text-left shadow-card transition-[border-color,box-shadow,transform] duration-150",
    active ? "border-brand ring-4 ring-brand-ring" : "border-line",
    href || onClick ? "hover:-translate-y-px hover:border-line-strong hover:shadow-pop" : null,
  );
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} aria-pressed={active} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
