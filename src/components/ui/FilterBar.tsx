import type { ReactNode } from "react";
import { SearchField, SelectField, type SelectOption } from "./primitives";

export type FilterSelect = {
  key: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

type Props = {
  search?: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string };
  selects?: FilterSelect[];
  /** Mutually exclusive quick filters rendered as a segmented control. */
  segments?: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void };
  children?: ReactNode;
};

/** One consistent toolbar for list filters: search + dropdowns + segmented quick filter. */
export function FilterBar({ search, selects, segments, children }: Props) {
  return (
    <form
      className="bp-filterbar"
      onSubmit={(e) => {
        e.preventDefault();
        search?.onSubmit();
      }}
    >
      {search ? <SearchField placeholder={search.placeholder} value={search.value} onChange={search.onChange} /> : null}
      {selects?.map((f) => (
        <SelectField key={f.key} options={f.options} value={f.value} onChange={f.onChange} />
      ))}
      {segments ? (
        <div className="bp-segment" role="group">
          {segments.options.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={segments.value === o.value}
              className={segments.value === o.value ? "is-active" : ""}
              onClick={() => segments.onChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
      {search ? (
        <button type="submit" className="bp-btn bp-btn-primary">
          Search
        </button>
      ) : null}
      {children}
    </form>
  );
}
