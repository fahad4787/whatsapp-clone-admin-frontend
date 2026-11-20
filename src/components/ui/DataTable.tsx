import { Fragment, useEffect, useState, type ReactNode } from "react";
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
  /** Client-side pagination. Pass false to show every row. Default page size 20. */
  pageSize?: number | false;
};

const PAGE_SIZES = [10, 20, 50, 100];

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
  pageSize = 20,
}: Props<T>) {
  const [size, setSize] = useState(pageSize || 0);
  const [page, setPage] = useState(0);
  const paged = size > 0;
  const pages = paged ? Math.max(1, Math.ceil(rows.length / size)) : 1;

  // Rows shrink (filter, delete, refresh) -> stay on a valid page.
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  const visible = paged ? rows.slice(page * size, page * size + size) : rows;
  const from = rows.length === 0 ? 0 : page * size + 1;
  const to = paged ? Math.min(rows.length, (page + 1) * size) : rows.length;

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
            visible.map((row) => {
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
      {paged && !loading && rows.length > PAGE_SIZES[0] ? (
        <div className="bp-pager">
          <span>
            {from}–{to} of {rows.length}
          </span>
          <div className="bp-pager-controls">
            <label className="flex items-center gap-1.5">
              Rows
              <select
                className="bp-pager-select"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={page === 0} onClick={() => setPage(0)} aria-label="First page">
              «
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <span className="min-w-[4.5rem] text-center">
              Page {page + 1} / {pages}
            </span>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" disabled={page >= pages - 1} onClick={() => setPage(pages - 1)} aria-label="Last page">
              »
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
