import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const PALETTE = ["bg-brand-soft text-brand-strong", "bg-info-soft text-info", "bg-warning-soft text-warning", "bg-[#f3eefe] text-[#6d28d9]", "bg-[#fdf0f7] text-[#be185d]"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, seed, size = 36, className }: { name: string | null | undefined; seed?: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold", PALETTE[hash(seed ?? name ?? "") % PALETTE.length], className)}
    >
      {initials(name)}
    </span>
  );
}

type PersonProps = { name: string | null | undefined; sub?: ReactNode; seed?: string; size?: number; trailing?: ReactNode };

/** Avatar + name + secondary line (phone, email…). */
export function Person({ name, sub, seed, size = 36, trailing }: PersonProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} seed={seed} size={size} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 truncate font-semibold text-ink">
          <span className="truncate">{name || "Unnamed"}</span>
          {trailing}
        </div>
        {sub ? <div className="truncate text-xs text-muted">{sub}</div> : null}
      </div>
    </div>
  );
}
