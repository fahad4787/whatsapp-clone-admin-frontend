"use client";

import type { ReactNode } from "react";

export type Column<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  selectable,
  selected,
  onSelectedChange,
}: DataTableProps<T>) {
  const allIds = rows.map(rowKey);
  const allSelected = selectable && selected && allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleAll() {
    if (!onSelectedChange || !selected) return;
    if (allSelected) onSelectedChange(new Set());
    else onSelectedChange(new Set(allIds));
  }

  function toggleOne(id: string) {
    if (!onSelectedChange || !selected) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  }

  return (
    <div className="bp-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="bp-table">
          <thead>
            <tr>
              {selectable ? (
                <th className="w-12">
                  <input
                    type="checkbox"
                    className="bp-check"
                    aria-label="Select all"
                    checked={Boolean(allSelected)}
                    onChange={toggleAll}
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th key={col.id} className={col.className}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = rowKey(row);
              return (
                <tr key={id}>
                  {selectable ? (
                    <td>
                      <input
                        type="checkbox"
                        className="bp-check"
                        aria-label="Select row"
                        checked={Boolean(selected?.has(id))}
                        onChange={() => toggleOne(id)}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.id} className={col.className}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
