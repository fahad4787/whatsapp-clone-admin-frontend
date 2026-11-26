"use client";

import { useMemo, useState } from "react";
import { Globe2, Pencil } from "lucide-react";
import {
  Badge,
  Button,
  ErrorCallout,
  Card,
  CardToolbar,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  Switch,
  type Column,
} from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type CountryItem } from "@/lib/api";
import { fmtNumber } from "@/lib/format";

type Filter = "all" | "enabled" | "disabled";

/** Regional-indicator flag from an ISO 3166 alpha-2 code. */
const flag = (iso: string) =>
  /^[A-Z]{2}$/i.test(iso) ? String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🏳️";

function EditCountryModal({ country, onClose, onSaved }: { country: CountryItem | null; onClose: () => void; onSaved: (c: CountryItem) => void }) {
  const { run, isPending } = useAction();
  const [form, setForm] = useState({ name: "", dial: "", sort: "" });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Load the selected country into the form when the modal opens for it.
  if (country && loadedFor !== country.iso) {
    setLoadedFor(country.iso);
    setForm({ name: country.name, dial: country.dial, sort: String(country.sort_order) });
    setTouched(false);
  }

  const name = form.name.trim();
  const dial = form.dial.trim();
  const sort = Number(form.sort);
  const errors = {
    name: !name ? "Enter a name." : name.length > 80 ? "Up to 80 characters." : null,
    dial: !dial ? "Enter a dial code." : !/^\+?\d{1,7}$/.test(dial) || dial.length > 8 ? "Digits only, like +92 (up to 8 characters)." : null,
    sort: form.sort.trim() === "" || !Number.isInteger(sort) || sort < 0 || sort > 9999 ? "A whole number from 0 to 9999." : null,
  };
  const valid = !errors.name && !errors.dial && !errors.sort;

  const close = () => {
    setLoadedFor(null);
    onClose();
  };
  const submit = async () => {
    setTouched(true);
    if (!country || !valid) return;
    const patch: Partial<Omit<CountryItem, "iso">> = {};
    if (name !== country.name) patch.name = name;
    if (dial !== country.dial) patch.dial = dial;
    if (sort !== country.sort_order) patch.sort_order = sort;
    if (!Object.keys(patch).length) return close();
    const saved = await run("save", () => adminApi.countries.update(country.iso, patch), { success: "Country updated", errorTitle: "Couldn't save" });
    if (saved) {
      onSaved(saved);
      close();
    }
  };

  return (
    <Modal
      open={!!country}
      onClose={close}
      size="sm"
      title={country ? `${flag(country.iso)} Edit ${country.name}` : "Edit country"}
      description="Changes show in the app's country picker on the sign-in screen."
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" loading={isPending("save")}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={touched ? errors.name : null} className="sm:col-span-2">
          {(a) => <Input {...a} value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        </Field>
        <Field label="Dial code" required error={touched ? errors.dial : null}>
          {(a) => <Input {...a} value={form.dial} maxLength={8} inputMode="tel" onChange={(e) => setForm({ ...form, dial: e.target.value })} />}
        </Field>
        <Field label="Sort order" hint="Lower shows first." error={touched ? errors.sort : null}>
          {(a) => <Input {...a} type="number" min={0} max={9999} step={1} value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value })} />}
        </Field>
      </div>
    </Modal>
  );
}

export default function CountriesPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<CountryItem | null>(null);
  const { run, isPending } = useAction();
  const list = useQuery("countries", (s) => adminApi.countries.list(s));
  const all = useMemo(() => list.data?.items ?? [], [list.data]);
  const enabledCount = all.filter((c) => c.enabled).length;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/^\+/, "");
    return all.filter((c) => {
      if (filter === "enabled" && !c.enabled) return false;
      if (filter === "disabled" && c.enabled) return false;
      if (!needle) return true;
      return c.name.toLowerCase().includes(needle) || c.iso.toLowerCase() === needle || c.dial.replace(/^\+/, "").startsWith(needle);
    });
  }, [all, q, filter]);

  // Keep the same order as the backend (sort order, then name) so an edit moves the row.
  const upsert = (c: CountryItem) =>
    list.setData((d) =>
      d
        ? {
            ...d,
            items: d.items
              .map((x) => (x.iso === c.iso ? c : x))
              .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
          }
        : d,
    );

  const toggle = async (c: CountryItem, enabled: boolean) => {
    upsert({ ...c, enabled }); // optimistic
    const saved = await run(c.iso, () => adminApi.countries.update(c.iso, { enabled }), {
      success: `${c.name} ${enabled ? "enabled" : "disabled"}`,
      errorTitle: "Couldn't update country",
    });
    upsert(saved ?? c);
  };

  const columns: Column<CountryItem>[] = [
    {
      key: "country",
      header: "Country",
      sortValue: (c) => c.name,
      cell: (c) => (
        <span className="flex items-center gap-3">
          <span className="text-xl leading-none" aria-hidden>{flag(c.iso)}</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{c.name}</span>
            <span className="text-xs text-muted">{c.iso}</span>
          </span>
        </span>
      ),
    },
    { key: "dial", header: "Dial code", sortValue: (c) => Number(c.dial.replace(/\D/g, "")), className: "tabular-nums font-medium", cell: (c) => (c.dial.startsWith("+") ? c.dial : `+${c.dial}`) },
    { key: "sort", header: "Order", sortValue: (c) => c.sort_order, align: "right", hideBelow: "sm", className: "tabular-nums text-muted", cell: (c) => c.sort_order },
    { key: "state", header: "Status", hideBelow: "md", cell: (c) => (c.enabled ? <Badge tone="success">Shown</Badge> : <Badge tone="neutral">Hidden</Badge>) },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <span className="inline-flex items-center gap-3">
          <Switch size="sm" label={`Show ${c.name}`} checked={c.enabled} disabled={isPending(c.iso)} onChange={(v) => void toggle(c, v)} />
          <IconButton label={`Edit ${c.name}`} size="sm" onClick={() => setEditing(c)}>
            <Pencil size={15} />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Countries"
        count={list.data ? all.length : undefined}
        description={list.data ? `${fmtNumber(enabledCount)} shown in the app's sign-in country picker.` : "Countries offered in the app's sign-in picker."}
      />
      {list.error ? <ErrorCallout error={list.error} onRetry={list.reload} retrying={list.fetching} className="mb-4" /> : null}
      <Card>
        <CardToolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Name, ISO or dial code" className="md:max-w-xs" aria-label="Search countries" />
          <Segmented
            label="Filter countries"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "enabled", label: "Shown", count: enabledCount },
              { value: "disabled", label: "Hidden", count: all.length - enabledCount },
            ]}
          />
        </CardToolbar>
        <DataTable
          label="Countries"
          columns={columns}
          rows={list.data ? rows : undefined}
          loading={list.loading}
          getKey={(c) => c.iso}
          resetKey={`${q}:${filter}`}
          pageSize={50}
          empty={<EmptyState icon={<Globe2 size={22} />} title="No countries match" description="Try a different search." />}
        />
      </Card>
      <EditCountryModal country={editing} onClose={() => setEditing(null)} onSaved={upsert} />
    </>
  );
}
