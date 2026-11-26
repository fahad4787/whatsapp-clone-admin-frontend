import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const CALLOUT = {
  info: { cls: "border-info/15 bg-info-soft text-ink-soft", icon: Info, iconCls: "text-info" },
  success: { cls: "border-brand/15 bg-brand-soft text-ink-soft", icon: CheckCircle2, iconCls: "text-brand" },
  warning: { cls: "border-warning/20 bg-warning-soft text-ink-soft", icon: AlertTriangle, iconCls: "text-warning" },
  danger: { cls: "border-danger/20 bg-danger-soft text-ink-soft", icon: XCircle, iconCls: "text-danger" },
};

type CalloutProps = { tone?: keyof typeof CALLOUT; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string };

export function Callout({ tone = "info", title, children, action, className }: CalloutProps) {
  const { cls, icon: Icon, iconCls } = CALLOUT[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-[13px]", cls, className)}>
      <Icon size={18} className={cn("mt-px shrink-0", iconCls)} />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title ? <div className="font-semibold text-ink">{title}</div> : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type EmptyStateProps = { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string };

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon ? <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">{icon}</div> : null}
      <div className="text-[15px] font-bold text-ink">{title}</div>
      {description ? <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton block h-4", className)} />;
}
