import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Search } from "lucide-react";

type Tone = "green" | "yellow" | "gray" | "red" | "brown";

const TONE: Record<Tone, string> = {
  green: "text-bp-green",
  yellow: "text-amber-500",
  gray: "text-slate-400",
  red: "text-bp-danger",
  brown: "text-[#9a6b2f]",
};

export function PageHeader({
  title,
  count,
  actions,
}: {
  title: string;
  count?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[1.65rem] font-extrabold tracking-tight text-bp-ink">{title}</h1>
        {count ? (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-sm font-medium text-bp-muted shadow-sm ring-1 ring-bp-border">
            {count}
          </span>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
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
    <section className="bp-card mb-4 p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
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
    <label className={`block text-sm font-semibold ${className}`}>
      {label}
      <div className="mt-1.5">{children}</div>
      {hint ? <div className="mt-1 text-xs font-normal text-bp-muted">{hint}</div> : null}
    </label>
  );
}

export function NumberInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`bp-input ${className}`} type="number" {...props} />;
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`bp-input ${className}`} type="text" {...props} />;
}

export function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-3">
      <input type="checkbox" defaultChecked={defaultChecked} className="accent-bp-green" />
      {label}
    </label>
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
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        tone === "lavender" ? "bg-violet-100 text-violet-700" : "bg-bp-green-soft text-bp-green"
      }`}
    >
      {initials || "?"}
    </div>
  );
}

export function StatusBadge({ label, tone = "green" }: { label: string; tone?: Tone }) {
  return <span className={`bp-badge ${TONE[tone]}`}>{label}</span>;
}

export function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <label className="relative block min-w-[220px] flex-1">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bp-muted" />
      <input className="bp-input pl-9" placeholder={placeholder} />
    </label>
  );
}

export function SelectField({ options }: { options: string[] }) {
  return (
    <select className="bp-input w-auto min-w-[140px]" defaultValue={options[0]}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

export function InfoBanner({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "warn" }) {
  return (
    <div
      className={`mb-4 rounded-xl px-4 py-3 text-sm ${
        tone === "warn" ? "bg-[var(--bp-warn)] text-[var(--bp-warn-text)]" : "bg-bp-green-soft text-bp-ink"
      }`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="bp-card flex flex-col items-center justify-center gap-3 px-6 py-20 text-bp-muted">
      {icon}
      <div className="text-base font-semibold text-bp-ink">{title}</div>
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
      <div>
        <div className="font-semibold">{name}</div>
        {subtitle ? <div className="text-sm text-bp-muted">{subtitle}</div> : null}
      </div>
    </div>
  );
}
