import { RotateCcw, Save } from "lucide-react";
import { Button } from "./Button";

type SaveBarProps = {
  /** Number of changed fields; the bar hides at 0. */
  count: number;
  saving?: boolean;
  /** Blocks saving and explains why (e.g. a validation error). */
  blockedReason?: string | null;
  onSave: () => void;
  onReset: () => void;
};

/** Floating bar that appears while a form has unsaved changes. */
export function SaveBar({ count, saving, blockedReason, onSave, onReset }: SaveBarProps) {
  if (count === 0) return null;
  return (
    <div className="pointer-events-none sticky bottom-4 z-20 mt-6 flex justify-center">
      <div
        role="region"
        aria-label="Unsaved changes"
        className="pointer-events-auto flex w-full max-w-xl animate-pop-in items-center gap-3 rounded-2xl border border-line bg-surface/95 py-2.5 pl-4 pr-2.5 shadow-pop backdrop-blur"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold text-ink">
            {count} unsaved {count === 1 ? "change" : "changes"}
          </span>
          {blockedReason ? <span className="block truncate text-xs font-medium text-danger">{blockedReason}</span> : null}
        </p>
        <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onReset} disabled={saving}>
          Discard
        </Button>
        <Button size="sm" icon={<Save size={14} />} onClick={onSave} loading={saving} disabled={!!blockedReason}>
          Save
        </Button>
      </div>
    </div>
  );
}
