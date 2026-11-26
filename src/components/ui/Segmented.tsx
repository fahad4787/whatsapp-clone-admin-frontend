import { cn } from "@/lib/cn";

type SegmentedProps<V extends string> = {
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string; count?: number }[];
  label: string;
  className?: string;
};

/** Pill tab group for switching a list filter. */
export function Segmented<V extends string>({ value, onChange, options, label, className }: SegmentedProps<V>) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-surface-muted p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors duration-150",
              active ? "bg-surface text-ink shadow-xs ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
            {o.count != null ? (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-brand-soft text-brand-strong" : "bg-line/70 text-muted")}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
