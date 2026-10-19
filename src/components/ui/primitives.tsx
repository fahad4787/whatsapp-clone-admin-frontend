"use client";

import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import type { StatusTone } from "@/types/status";

const TONE: Record<StatusTone, string> = {
  green: "text-bp-green",
  yellow: "text-amber-600",
  gray: "text-slate-500",
  red: "text-bp-danger",
  brown: "text-[#9a6b2f]",
};

export function PageHeader({
  title,
  count,
  description,
  actions,
}: {
  title: string;
  count?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-[1.85rem] font-extrabold tracking-tight text-bp-ink">{title}</h1>
          {count ? <span className="bp-count-pill">{count}</span> : null}
        </div>
        {description ? (
          <p className="mt-1.5 text-[0.925rem] leading-relaxed text-bp-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      className={`bp-btn bp-btn-${variant} ${className}`}
      type={props.type ?? "button"}
      {...props}
    />
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bp-card mb-4 p-4 sm:p-5">
      <h2 className="mb-4 text-[15px] font-bold tracking-tight text-bp-ink">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-semibold text-bp-ink ${className}`}>
      {label}
      <div className="mt-2 font-normal">{children}</div>
      {hint ? <div className="mt-1.5 text-xs font-normal leading-relaxed text-bp-muted">{hint}</div> : null}
    </label>
  );
}

export function NumberInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`bp-input ${className}`} type="number" {...props} />;
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`bp-input ${className}`} type="text" {...props} />;
}

export function ToggleRow({
  label,
  defaultChecked,
  checked,
  onChange,
}: {
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (on: boolean) => void;
}) {
  const id = useId();
  const [inner, setInner] = useState(Boolean(defaultChecked));
  const on = checked ?? inner;

  return (
    <div className="flex items-center justify-between gap-3 sm:col-span-3">
      <label htmlFor={id} className="cursor-pointer text-sm font-semibold text-bp-ink">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => {
          const next = !on;
          if (checked === undefined) setInner(next);
          onChange?.(next);
        }}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          on ? "bg-bp-green" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function Avatar({ name, tone = "green" }: { name: string; tone?: "green" | "lavender" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tracking-wide ring-1 ring-black/5 ${
        tone === "lavender" ? "bg-violet-100 text-violet-700" : "bg-bp-green-soft text-bp-green"
      }`}
    >
      {initials || "?"}
    </div>
  );
}

export function StatusBadge({ label, tone = "green" }: { label: string; tone?: StatusTone }) {
  return <span className={`bp-badge ${TONE[tone]}`}>{label}</span>;
}

/** Search with icon beside the field — never overlaps placeholder. */
export function SearchField({
  placeholder,
  className = "",
  value,
  onChange,
}: {
  placeholder: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [inner, setInner] = useState("");
  const controlled = value !== undefined;
  const current = controlled ? value : inner;

  function set(next: string) {
    if (!controlled) setInner(next);
    onChange?.(next);
  }

  return (
    <label className={`bp-control min-w-[min(100%,18rem)] flex-1 ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <span className="bp-control-icon shrink-0" aria-hidden>
        <Search size={16} strokeWidth={2} />
      </span>
      <input
        className="bp-control-field"
        placeholder={placeholder}
        value={current}
        onChange={(e) => set(e.target.value)}
      />
      {current ? (
        <button
          type="button"
          className="inline-flex shrink-0 rounded-md p-1 text-bp-muted hover:bg-slate-100 hover:text-bp-ink"
          aria-label="Clear search"
          onClick={() => set("")}
        >
          <X size={14} />
        </button>
      ) : null}
    </label>
  );
}

/** Select with chevron outside the text — no clipping. */
export function SelectField({
  options,
  className = "",
  value,
  onChange,
  fullWidth = false,
  ...props
}: {
  options: string[];
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Stretch to parent (forms/modals). Toolbar filters stay content-sized. */
  fullWidth?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "value" | "onChange">) {
  const longest = options.reduce((a, b) => (a.length >= b.length ? a : b), "");
  const minWidth = `calc(${Math.max(longest.length, 10)}ch + 3.25rem)`;

  return (
    <label
      className={`bp-control ${fullWidth ? "flex w-full" : "inline-flex shrink-0"} ${className}`}
      style={fullWidth ? { width: "100%", minWidth: 0 } : { minWidth, width: "max-content" }}
    >
      <span className="sr-only">Filter</span>
      <select
        className={`bp-control-select ${fullWidth ? "w-full" : ""}`}
        value={value ?? options[0]}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="bp-control-icon shrink-0" aria-hidden>
        <ChevronDown size={16} strokeWidth={2} />
      </span>
    </label>
  );
}

export function FilterChip({
  label,
  active,
  onChange,
}: {
  label: string;
  active?: boolean;
  onChange?: (active: boolean) => void;
}) {
  const [inner, setInner] = useState(false);
  const isOn = active ?? inner;

  return (
    <button
      type="button"
      aria-pressed={isOn}
      onClick={() => {
        const next = !isOn;
        if (active === undefined) setInner(next);
        onChange?.(next);
      }}
      className={`inline-flex h-[var(--control-h)] items-center gap-1.5 rounded-[var(--radius-sm)] border px-3.5 text-sm font-semibold transition-all duration-200 ${
        isOn
          ? "border-bp-green bg-bp-green-soft text-bp-green shadow-[0_0_0_3px_rgba(18,154,85,0.1)]"
          : "border-bp-border bg-white text-bp-ink/80 shadow-[0_1px_1px_rgba(12,22,18,0.02)] hover:border-[#c9d6cf] hover:bg-[#f7faf8]"
      }`}
    >
      {isOn ? <Check size={14} strokeWidth={2.5} /> : null}
      {label}
    </button>
  );
}

export function InfoBanner({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "warn" }) {
  return (
    <div
      className={`mb-5 rounded-[var(--radius-sm)] px-4 py-3.5 text-sm leading-relaxed ${
        tone === "warn"
          ? "border border-amber-200/90 bg-[var(--bp-warn)] text-[var(--bp-warn-text)]"
          : "border border-emerald-100 bg-bp-green-soft text-bp-ink"
      }`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="bp-card flex flex-col items-center justify-center gap-4 px-6 py-28 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[#f4f7f5] text-bp-muted ring-1 ring-bp-border">
        {icon}
      </div>
      <div>
        <div className="text-base font-bold tracking-tight text-bp-ink">{title}</div>
        {description ? <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-bp-muted">{description}</p> : null}
      </div>
    </div>
  );
}

export function PersonCell({
  name,
  subtitle,
  tone,
}: {
  name: string;
  subtitle?: string;
  tone?: "green" | "lavender";
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} tone={tone} />
      <div className="min-w-0">
        <div className="truncate font-semibold text-bp-ink">{name}</div>
        {subtitle ? <div className="truncate text-[13px] text-bp-muted">{subtitle}</div> : null}
      </div>
    </div>
  );
}
