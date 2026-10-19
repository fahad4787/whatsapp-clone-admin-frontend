import type { ReactNode } from "react";
import { Download, Plus, type LucideIcon } from "lucide-react";
import { Button, EmptyState, InfoBanner, PageHeader, SearchField, SelectField } from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/data/DataTable";

export type FilterConfig =
  | { type: "search"; placeholder: string }
  | { type: "select"; options: string[] }
  | { type: "chip"; label: string };

export type ActionConfig = {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: "plus" | "download";
};

export type ResourcePageProps<T> = {
  title: string;
  count?: string;
  banner?: { tone?: "green" | "warn"; text: string };
  actions?: ActionConfig[];
  filters?: FilterConfig[];
  columns?: Column<T>[];
  rows?: T[];
  rowKey?: (row: T) => string;
  selectable?: boolean;
  empty?: { icon: ReactNode; title: string };
  footer?: ReactNode;
};

const ACTION_ICONS: Record<NonNullable<ActionConfig["icon"]>, LucideIcon> = {
  plus: Plus,
  download: Download,
};

function ActionButtons({ actions }: { actions: ActionConfig[] }) {
  return (
    <>
      {actions.map((action) => {
        const Icon = action.icon ? ACTION_ICONS[action.icon] : null;
        return (
          <Button key={action.label} variant={action.variant ?? "primary"}>
            {Icon ? <Icon size={16} /> : null}
            {action.label}
          </Button>
        );
      })}
    </>
  );
}

function Filters({ filters }: { filters: FilterConfig[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.map((filter, i) => {
        if (filter.type === "search") {
          return <SearchField key={`s-${i}`} placeholder={filter.placeholder} />;
        }
        if (filter.type === "select") {
          return <SelectField key={`sel-${i}`} options={filter.options} />;
        }
        return (
          <Button key={`c-${i}`} variant="secondary">
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

/** Mapping-driven list/table page used by most admin resources. */
export function ResourcePage<T>({
  title,
  count,
  banner,
  actions,
  filters,
  columns,
  rows = [],
  rowKey,
  selectable,
  empty,
  footer,
}: ResourcePageProps<T>) {
  const showEmpty = Boolean(empty) && rows.length === 0;

  return (
    <div>
      <PageHeader
        title={title}
        count={count}
        actions={actions?.length ? <ActionButtons actions={actions} /> : undefined}
      />

      {banner ? <InfoBanner tone={banner.tone}>{banner.text}</InfoBanner> : null}
      {filters?.length ? <Filters filters={filters} /> : null}

      {showEmpty && empty ? (
        <EmptyState icon={empty.icon} title={empty.title} />
      ) : columns && rowKey ? (
        <DataTable columns={columns} rows={rows} rowKey={rowKey} selectable={selectable} />
      ) : null}

      {footer}
    </div>
  );
}
