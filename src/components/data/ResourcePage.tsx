"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  EmptyState,
  FilterChip,
  FormField,
  InfoBanner,
  NumberInput,
  PageHeader,
  RowActions,
  SearchField,
  SelectField,
  TextInput,
} from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "./DataTable";
import { useMockStore, type StoreState } from "@/data/store";
import type { FormFieldSpec, ResourceSpec } from "@/features/resources/specs";

function fieldSpan(field: FormFieldSpec): "half" | "full" {
  if (field.span) return field.span;
  if (field.type === "select" || field.type === "number") return "half";
  return "full";
}

/** Promote a lonely half-width field so it never sits alone leaving empty space. */
function resolveFieldSpans(fields: FormFieldSpec[]): ("half" | "full")[] {
  const raw = fields.map(fieldSpan);
  const out = [...raw];
  let slot = 0;
  for (let i = 0; i < out.length; i++) {
    if (out[i] === "full") {
      slot = 0;
      continue;
    }
    if (slot === 0) {
      const nextIsHalf = i + 1 < out.length && out[i + 1] === "half";
      if (!nextIsHalf) out[i] = "full";
      else slot = 1;
    } else {
      slot = 0;
    }
  }
  return out;
}

type RowBase = { id: string };

function downloadCsv<T extends RowBase>(filename: string, rows: T[], keys: string[]) {
  const header = keys.join(",");
  const body = rows
    .map((row) =>
      keys
        .map((k) => {
          const v = String((row as Record<string, unknown>)[k] ?? "");
          return `"${v.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([[header, body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResourcePage<T extends RowBase>({ spec }: { spec: ResourceSpec<T> }) {
  const store = useMockStore();
  const rows = store[spec.key] as unknown as T[];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(spec.statusOptions?.[0] ?? "");
  const [typeFilter, setTypeFilter] = useState(spec.typeOptions?.[0] ?? "");
  const [chipOn, setChipOn] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (q) {
        const hit = spec.searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (spec.statusField && status && !status.toLowerCase().startsWith("any")) {
        if (String(row[spec.statusField]) !== status) return false;
      }
      if (spec.typeField && typeFilter) {
        const any = typeFilter.toLowerCase().includes("any") || typeFilter === "Groups and direct";
        if (!any) {
          const want = typeFilter === "Groups" ? "Group" : typeFilter;
          if (String(row[spec.typeField]) !== want) return false;
        }
      }
      if (chipOn && spec.chip && !spec.chip.match(row)) return false;
      return true;
    });
  }, [rows, query, status, typeFilter, chipOn, spec]);

  const columns: Column<T>[] = useMemo(() => {
    const base = [...spec.columns];
    if (spec.canEdit || spec.canDelete) {
      base.push({
        id: "_actions",
        header: "",
        className: "w-12 text-right",
        cell: (row) => {
          const actions = [];
          if (spec.canEdit) {
            actions.push({
              label: "Edit",
              icon: <Pencil size={14} />,
              onClick: () => {
                setDraft({ ...row });
                setModal("edit");
              },
            });
          }
          if (spec.canDelete) {
            actions.push({
              label: "Delete",
              tone: "danger" as const,
              icon: <Trash2 size={14} />,
              onClick: () => {
                if (!window.confirm(`Delete this ${spec.singular}?`)) return;
                store.remove(spec.key, row.id);
                store.pushAudit(`Deleted ${spec.singular}`, row.id);
                flash(`${spec.singular} deleted`);
              },
            });
          }
          return <RowActions actions={actions} />;
        },
      });
    }
    return base;
  }, [spec, store]);

  function openCreate() {
    setDraft(spec.defaults());
    setModal("create");
  }

  function saveDraft() {
    if (!draft) return;
    for (const field of spec.formFields) {
      if (field.required) {
        const v = (draft as Record<string, unknown>)[field.key];
        if (v === "" || v === undefined || v === null) {
          flash(`${field.label} is required`);
          return;
        }
      }
    }
    if (modal === "create") {
      store.create(spec.key, draft as unknown as StoreState[typeof spec.key][number]);
      store.pushAudit(`Created ${spec.singular}`, draft.id);
      flash(`${spec.singular} created`);
    } else {
      store.update(spec.key, draft.id, draft as unknown as Partial<StoreState[typeof spec.key][number]>);
      store.pushAudit(`Updated ${spec.singular}`, draft.id);
      flash(`${spec.singular} updated`);
    }
    setModal(null);
    setDraft(null);
  }

  function setField(key: string, value: string | number | boolean) {
    if (!draft) return;
    setDraft({ ...draft, [key]: value } as T);
  }

  const actions: ReactNode = (
    <>
      {spec.canExport ? (
        <Button
          variant="secondary"
          onClick={() => {
            const keys = Object.keys(filtered[0] ?? { id: "" });
            downloadCsv(`${spec.key}.csv`, filtered, keys);
            flash("CSV exported");
          }}
        >
          <Download size={16} /> Export CSV
        </Button>
      ) : null}
      {spec.canCreate ? (
        <Button variant="primary" onClick={openCreate}>
          <Plus size={16} /> {spec.createLabel ?? `Create ${spec.singular}`}
        </Button>
      ) : null}
    </>
  );

  const showEmpty = filtered.length === 0;

  return (
    <div className="bp-page">
      <PageHeader
        title={spec.title}
        count={`${filtered.length} ${filtered.length === 1 ? spec.singular : spec.key}`}
        description={spec.description}
        actions={actions}
      />

      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium text-bp-ink">
          {toast}
        </div>
      ) : null}

      {spec.banner ? <InfoBanner tone={spec.banner.tone}>{spec.banner.text}</InfoBanner> : null}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        {spec.searchPlaceholder ? (
          <SearchField placeholder={spec.searchPlaceholder} value={query} onChange={setQuery} />
        ) : null}
        {spec.statusOptions ? (
          <SelectField options={spec.statusOptions} value={status} onChange={setStatus} />
        ) : null}
        {spec.typeOptions ? (
          <SelectField options={spec.typeOptions} value={typeFilter} onChange={setTypeFilter} />
        ) : null}
        {spec.chip ? <FilterChip label={spec.chip.label} active={chipOn} onChange={setChipOn} /> : null}
        {selected.size > 0 && spec.canDelete ? (
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm(`Delete ${selected.size} selected?`)) return;
              selected.forEach((id) => store.remove(spec.key, id));
              store.pushAudit(`Bulk deleted ${spec.key}`, `${selected.size} rows`);
              setSelected(new Set());
              flash("Selection deleted");
            }}
          >
            Delete selected ({selected.size})
          </Button>
        ) : null}
      </div>

      {showEmpty ? (
        <EmptyState
          icon={spec.empty?.icon ?? <Plus size={28} />}
          title={spec.empty?.title ?? `No ${spec.key} found`}
          description={
            spec.empty?.description ??
            (query || status || chipOn ? "Try clearing search or filters." : `Create a ${spec.singular} to get started.`)
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          selectable={Boolean(spec.canDelete)}
          selected={selected}
          onSelectedChange={setSelected}
        />
      )}

      <Modal
        open={modal !== null && draft !== null}
        title={modal === "create" ? spec.createLabel ?? `Create ${spec.singular}` : `Edit ${spec.singular}`}
        description={modal === "create" ? `Add a new ${spec.singular} to the mock store.` : `Update this ${spec.singular}.`}
        size="lg"
        onClose={() => {
          setModal(null);
          setDraft(null);
        }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModal(null);
                setDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveDraft}>{modal === "create" ? "Create" : "Save changes"}</Button>
          </>
        }
      >
        {draft ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            {(() => {
              const spans = resolveFieldSpans(spec.formFields);
              return spec.formFields.map((field, index) => {
              const value = (draft as Record<string, unknown>)[field.key];
              const span = spans[index];
              const colClass = span === "full" ? "col-span-1 sm:col-span-2" : "col-span-1";

              if (field.type === "checkbox") {
                return (
                  <label
                    key={field.key}
                    className={`${colClass} flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-bp-border bg-[#fafcfb] px-3.5 py-3 text-sm font-semibold`}
                  >
                    <input
                      type="checkbox"
                      className="bp-check"
                      checked={Boolean(value)}
                      onChange={(e) => setField(field.key, e.target.checked)}
                    />
                    {field.label}
                  </label>
                );
              }
              if (field.type === "select") {
                return (
                  <FormField key={field.key} label={field.label} className={colClass}>
                    <SelectField
                      fullWidth
                      options={field.options ?? []}
                      value={String(value ?? field.options?.[0] ?? "")}
                      onChange={(v) => setField(field.key, v)}
                    />
                  </FormField>
                );
              }
              if (field.type === "number") {
                return (
                  <FormField key={field.key} label={field.label} className={colClass}>
                    <NumberInput
                      className="w-full"
                      value={Number(value ?? 0)}
                      onChange={(e) => setField(field.key, Number(e.target.value))}
                    />
                  </FormField>
                );
              }
              return (
                <FormField key={field.key} label={field.label} className={colClass}>
                  <TextInput
                    className="w-full"
                    value={String(value ?? "")}
                    onChange={(e) => setField(field.key, e.target.value)}
                    required={field.required}
                  />
                </FormField>
              );
            });
            })()}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

/** Legacy static props shape — prefer ResourcePage + ResourceSpec. */
export type ResourcePageProps<T> = {
  title: string;
  count?: string;
  description?: string;
  banner?: { tone?: "green" | "warn"; text: string };
  actions?: unknown;
  filters?: unknown;
  columns?: Column<T>[];
  rows?: T[];
  rowKey?: (row: T) => string;
  selectable?: boolean;
  empty?: { icon: ReactNode; title: string; description?: string };
  footer?: ReactNode;
};

export type FilterConfig =
  | { type: "search"; placeholder: string }
  | { type: "select"; options: string[] }
  | { type: "chip"; label: string };

export type ActionConfig = {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: "plus" | "download";
};
