import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export const controlClass = cn(
  "w-full rounded-[10px] border border-line bg-surface text-sm text-ink shadow-xs transition-[border-color,box-shadow] duration-150",
  "placeholder:text-subtle hover:border-line-strong",
  "focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
);

type InputProps = ComponentProps<"input"> & { invalid?: boolean; leading?: ReactNode; trailing?: ReactNode };

export function Input({ invalid, leading, trailing, className, ...rest }: InputProps) {
  const input = (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlClass, "h-10 px-3", leading ? "pl-9" : null, trailing ? "pr-10" : null, className)}
      {...rest}
    />
  );
  if (!leading && !trailing) return input;
  return (
    <div className="relative">
      {leading ? <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle">{leading}</span> : null}
      {input}
      {trailing ? <span className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</span> : null}
    </div>
  );
}

export function Textarea({ invalid, className, ...rest }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea aria-invalid={invalid || undefined} className={cn(controlClass, "min-h-24 px-3 py-2.5 leading-relaxed", className)} {...rest} />;
}

export type SelectOption<V extends string = string> = { value: V; label: string };

type SelectProps<V extends string> = Omit<ComponentProps<"select">, "onChange" | "value"> & {
  value: V;
  onChange: (value: V) => void;
  options: readonly SelectOption<V>[];
};

export function Select<V extends string>({ value, onChange, options, className, ...rest }: SelectProps<V>) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(controlClass, "h-10 cursor-pointer appearance-none pl-3 pr-9")}
        value={value}
        onChange={(e) => onChange(e.target.value as V)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

type SearchInputProps = Omit<ComponentProps<"input">, "onChange" | "value"> & { value: string; onChange: (value: string) => void };

export function SearchInput({ value, onChange, placeholder = "Search", className, ...rest }: SearchInputProps) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, "h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden")}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-ink"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
