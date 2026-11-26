"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  /** Hide below this breakpoint to keep small screens readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[] | null | undefined;
  getKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  /** Client-side paging; 0 shows everything. */
  pageSize?: number;
  /** Change this to jump back to page 1 (e.g. when filters change). */
  resetKey?: unknown;
  label: string;
};

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };
const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

export function DataTable<T>({ columns, rows, getKey, loading, empty, onRowClick, selectedKey, pageSize = 25, resetKey, label }: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [resetKey]);

  const list = rows ?? [];
  const pages = pageSize > 0 ? Math.max(1, Math.ceil(list.length / pageSize)) : 1;
  const current = Math.min(page, pages - 1);
  const visible = pageSize > 0 ? list.slice(current * pageSize, current * pageSize + pageSize) : list;
  const showSkeleton = loading && !rows;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm" aria-label={label} aria-busy={loading || undefined}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "sticky top-0 z-[1] whitespace-nowrap border-b border-line bg-surface-muted px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted first:pl-5 last:pr-5",
                    ALIGN[c.align ?? "left"],
                    c.hideBelow && HIDE[c.hideBelow],
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSkeleton
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn("border-b border-line px-4 py-3.5 first:pl-5 last:pr-5", c.hideBelow && HIDE[c.hideBelow])}>
                        <span className="skeleton block h-4 w-full max-w-[10rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((row) => {
                  const key = getKey(row);
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (e) => {
                              if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                onRowClick(row);
                              }
                            }
                          : undefined
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-selected={selectedKey != null ? selectedKey === key : undefined}
                      className={cn(
                        "transition-colors duration-100",
                        onRowClick && "cursor-pointer hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40",
                        selectedKey === key && "bg-brand-soft/60",
                      )}
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={cn(
                            "border-b border-line px-4 py-3 align-middle text-ink-soft first:pl-5 last:pr-5",
                            ALIGN[c.align ?? "left"],
                            c.hideBelow && HIDE[c.hideBelow],
                            c.className,
                          )}
                        >
                          {c.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {!showSkeleton && list.length === 0 ? empty : null}
      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3 px-5 py-3 text-[13px] text-muted">
          <span className="tabular-nums">
            {current * pageSize + 1}–{Math.min(list.length, (current + 1) * pageSize)} of {list.length}
          </span>
          <div className="flex items-center gap-1">
            <IconButton label="Previous page" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              <ChevronLeft size={16} />
            </IconButton>
            <span className="px-1 tabular-nums">
              {current + 1} / {pages}
            </span>
            <IconButton label="Next page" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              <ChevronRight size={16} />
            </IconButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
