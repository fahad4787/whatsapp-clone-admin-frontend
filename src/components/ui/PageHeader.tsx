import type { ReactNode } from "react";

type PageHeaderProps = { title: string; description?: ReactNode; count?: number; actions?: ReactNode };

export function PageHeader({ title, description, count, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-[-0.02em] text-ink">
          {title}
          {count != null ? (
            <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[13px] font-semibold text-muted tnum ring-1 ring-inset ring-line">{count}</span>
          ) : null}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
