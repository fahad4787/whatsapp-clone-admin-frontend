"use client";

import { useCallback } from "react";
import { Alert, DataTable, PageHeader, RefreshButton, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { fetchAdminAudit, type AdminAuditItem } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

const COLUMNS: Column<AdminAuditItem>[] = [
  { key: "when", header: "When", className: "whitespace-nowrap text-bp-muted", cell: (r) => fmtDateTime(r.created_at) },
  { key: "actor", header: "Actor", className: "font-semibold", cell: (r) => r.actor.display_name || r.actor.email },
  { key: "action", header: "Action", cell: (r) => <span className="bp-mono">{r.action}</span> },
  {
    key: "detail",
    header: "Detail",
    className: "max-w-md truncate text-bp-muted",
    cell: (r) => (r.meta ? JSON.stringify(r.meta) : "—"),
  },
];

export default function AuditPage() {
  const fetcher = useCallback(async (t: string) => (await fetchAdminAudit(t)).items, []);
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 10_000,
    errorMessage: "Could not load audit log",
  });

  return (
    <div className="bp-page">
      <PageHeader
        title="Audit log"
        description="Admin actions (login, bans, settings, countries)."
        actions={<RefreshButton onClick={() => void reload()} />}
      />
      <Alert>{error}</Alert>
      <DataTable columns={COLUMNS} rows={items} getKey={(r) => r.id} loading={loading} empty="No events yet" />
    </div>
  );
}
