import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-soft";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  // Fill is the existing --brand-strong (#0b7a42): white label = 5.4:1 (AA). The
  // lighter #129a55 only reached 3.4:1. Hover/press deepen the same hex.
  primary:
    "bg-brand-strong text-white shadow-xs hover:bg-[color-mix(in_oklab,var(--brand-strong)_86%,black)] active:bg-[color-mix(in_oklab,var(--brand-strong)_78%,black)]",
  secondary: "border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-surface-muted",
  ghost: "text-ink-soft hover:bg-brand-soft hover:text-brand-text",
  danger: "bg-danger-solid text-white shadow-xs hover:bg-danger-solid-hover",
  "danger-soft": "border border-transparent bg-danger-soft text-danger-text hover:border-danger/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  md: "h-10 gap-2 rounded-[10px] px-4 text-sm",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant, size, loading, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode };

export function ButtonLink({ variant = "secondary", size, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

type IconButtonProps = ComponentProps<"button"> & { label: string; tone?: "default" | "danger"; size?: "sm" | "md" };

/** Square, icon-only button. `label` is required for screen readers and the tooltip. */
export function IconButton({ label, tone = "default", size = "md", className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger-text" : "hover:bg-brand-soft hover:text-brand-text",
        className,
      )}
      {...rest}
    />
  );
}
