import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...rest }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-surface shadow-card", className)} {...rest} />;
}

type CardHeaderProps = { title: ReactNode; description?: ReactNode; actions?: ReactNode; icon?: ReactNode; className?: string };

export function CardHeader({ title, description, actions, icon, className }: CardHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...rest} />;
}

/** Filter row at the top of a list card: search on the left, segments/filters on the right. */
export function CardToolbar({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between", className)} {...rest} />;
}
