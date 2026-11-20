import { Fragment, type ReactNode } from "react";
import { SkeletonRows } from "@/components/ui/primitives";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "right";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  /** Optional full-width row rendered under a data row (return null for none). */
  expand?: (row: T) => ReactNode;
};

/** Column-config table with skeleton, empty state, selection and row expansion. */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  loading,
  empty = "Nothing here yet.",
  onRowClick,
  selectedKey,
  expand,
}: Props<T>) {
  return (
    <div className="bp-card overflow-x-auto">
      <table className="bp-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows cols={columns.length} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="bp-empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = getKey(row);
              const extra = expand?.(row);
              return (
                <Fragment key={key}>
                  <tr
                    className={`${onRowClick ? "is-clickable" : ""} ${selectedKey === key ? "is-selected" : ""}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                  {extra ? (
                    <tr>
                      <td colSpan={columns.length} className="!bg-[#fafcfb] !py-2.5 text-[12px] text-bp-muted">
                        {extra}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
