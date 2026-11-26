import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-brand-soft text-brand-strong",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-muted text-muted ring-1 ring-inset ring-line",
};

type BadgeProps = { tone?: Tone; dot?: boolean; pulse?: boolean; children: ReactNode; className?: string; title?: string };

export function Badge({ tone = "neutral", dot, pulse, children, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}
    >
      {dot ? (
        <span className="relative flex h-1.5 w-1.5">
          {pulse ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" /> : null}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}
