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
};

export function DataTable<T>({ columns, rows, rowKey, selectable }: DataTableProps<T>) {
  return (
    <div className="bp-card overflow-hidden">
      <table className="bp-table">
        <thead>
          <tr>
            {selectable ? (
              <th>
                <input type="checkbox" aria-label="Select all" />
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
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {selectable ? (
                <td>
                  <input type="checkbox" aria-label="Select row" />
                </td>
              ) : null}
              {columns.map((col) => (
                <td key={col.id} className={col.className}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
