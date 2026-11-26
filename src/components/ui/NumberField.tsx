import type { ReactNode } from "react";
import { Field } from "./Field";
import { Input } from "./Input";

type NumberFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max?: number;
  unit?: string;
  error?: string | null;
  disabled?: boolean;
};

/** Whole-number input with bounds and an optional unit suffix. */
export function NumberField({ label, hint, value, onChange, min, max, unit, error, disabled }: NumberFieldProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(a) => (
        <Input
          {...a}
          type="number"
          inputMode="numeric"
          step={1}
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          trailing={unit ? <span className="pr-2 text-xs font-medium text-muted">{unit}</span> : undefined}
          className="tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      )}
    </Field>
  );
}
