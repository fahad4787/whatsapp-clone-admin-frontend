import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  size?: "sm" | "md";
};

export function Switch({ checked, onChange, disabled, label, size = "md" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-brand" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full bg-knob shadow-sm transition-transform duration-200 ease-out",
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          checked ? (size === "sm" ? "translate-x-[18px]" : "translate-x-[22px]") : "translate-x-0.5",
        )}
      />
    </button>
  );
}

type SwitchRowProps = Omit<SwitchProps, "label"> & { label: ReactNode; description?: ReactNode; ariaLabel?: string };

/** A labelled setting row with a switch on the right. */
export function SwitchRow({ label, description, ariaLabel, ...rest }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        {description ? <div className="mt-0.5 text-xs leading-relaxed text-muted">{description}</div> : null}
      </div>
      <div className="pt-0.5">
        <Switch label={ariaLabel ?? (typeof label === "string" ? label : "Toggle")} {...rest} />
      </div>
    </div>
  );
}
