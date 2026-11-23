"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, DataTable, FilterBar, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { fetchAdminCountries, getAdminToken, updateAdminCountry, type AdminCountryItem } from "@/lib/api";

export default function CountriesPage() {
  const [busyIso, setBusyIso] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const fetcher = useCallback(async (t: string) => (await fetchAdminCountries(t)).items, []);
  const { items, setItems, loading, error, reload } = useAdminList(fetcher, {
    interval: 60_000,
    errorMessage: "Could not load countries — check your connection",
  });

  const toggle = useCallback(
    async (c: AdminCountryItem) => {
      const token = getAdminToken();
      if (!token) return;
      setBusyIso(c.iso);
      setActionError(null);
      try {
        const updated = await updateAdminCountry(token, c.iso, { enabled: !c.enabled });
        setItems((list) => list.map((row) => (row.iso === updated.iso ? updated : row)));
      } catch {
        setActionError("Update failed");
      } finally {
        setBusyIso(null);
      }
    },
    [setItems],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (c) =>
        (status === "all" || (status === "enabled") === c.enabled) &&
        (!needle || `${c.name} ${c.iso} ${c.dial}`.toLowerCase().includes(needle)),
    );
  }, [items, q, status]);

  const columns = useMemo<Column<AdminCountryItem>[]>(
    () => [
      { key: "name", header: "Country", className: "font-semibold", cell: (c) => c.name },
      { key: "iso", header: "ISO", cell: (c) => c.iso },
      { key: "dial", header: "Dial", cell: (c) => c.dial },
      {
        key: "status",
        header: "Status",
        cell: (c) => <StatusBadge label={c.enabled ? "Enabled" : "Disabled"} tone={c.enabled ? "green" : "gray"} />,
      },
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (c) => (
          <button type="button" className="bp-btn bp-btn-secondary" disabled={busyIso === c.iso} onClick={() => void toggle(c)}>
            {c.enabled ? "Disable" : "Enable"}
          </button>
        ),
      },
    ],
    [busyIso, toggle],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="Countries"
        description="Allowlist dial codes for signup. Disabled countries cannot request OTP."
        actions={<RefreshButton onClick={() => void reload()} />}
      />
      <FilterBar
        search={{ value: q, onChange: setQ, onSubmit: () => {}, placeholder: "Search country, ISO, or dial code" }}
        segments={{
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "All" },
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
          ],
        }}
      />
      <Alert>{actionError ?? error}</Alert>
      <DataTable columns={columns} rows={rows} getKey={(c) => c.iso} loading={loading} empty="No countries found." />
    </div>
  );
}
