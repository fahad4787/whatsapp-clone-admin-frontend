"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, DataTable, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { fetchAdminReports, getAdminToken, resolveAdminReport, type AdminReportItem } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

type Filter = "open" | "all";
type Tone = "green" | "yellow" | "red" | "gray";

const STATUS_TONE: Record<string, Tone> = { open: "yellow", resolved: "green", dismissed: "gray" };

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "all", label: "All" },
];

type Action = { key: string; label: string; variant: "primary" | "secondary"; run: "resolve" | "dismiss"; ban?: boolean };

const ACTIONS: Action[] = [
  { key: "dismiss", label: "Dismiss", variant: "secondary", run: "dismiss" },
  { key: "ban", label: "Ban + resolve", variant: "secondary", run: "resolve", ban: true },
  { key: "resolve", label: "Resolve", variant: "primary", run: "resolve" },
];

export default function ReportsPage() {
  const [filter, setFilter] = useState<Filter>("open");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(
    async (t: string) => (await fetchAdminReports(t, filter === "open" ? "open" : undefined)).items,
    [filter],
  );
  const { items, setItems, loading, error, reload } = useAdminList(fetcher, {
    interval: 12_000,
    errorMessage: "Could not load reports — check your connection",
  });

  const act = useCallback(
    async (report: AdminReportItem, a: Action) => {
      const token = getAdminToken();
      if (!token) return;
      setBusyId(report.id);
      setActionError(null);
      try {
        const updated = await resolveAdminReport(token, report.id, a.run, { ban_user: !!a.ban });
        setItems((list) =>
          filter === "open"
            ? list.filter((r) => r.id !== report.id)
            : list.map((r) => (r.id === report.id ? updated : r)),
        );
      } catch {
        setActionError("Could not update report");
      } finally {
        setBusyId(null);
      }
    },
    [filter, setItems],
  );

  const columns = useMemo<Column<AdminReportItem>[]>(
    () => [
      { key: "filed", header: "Filed", className: "whitespace-nowrap", cell: (r) => fmtDateTime(r.created_at) },
      { key: "reporter", header: "Reporter", className: "text-bp-green", cell: (r) => r.reporter.phone },
      { key: "target", header: "Target", cell: (r) => r.target_user?.phone ?? r.target_conversation_id ?? "—" },
      { key: "reason", header: "Reason", className: "max-w-[240px] truncate", cell: (r) => r.reason || "—" },
      {
        key: "status",
        header: "Status",
        cell: (r) => <StatusBadge label={r.status} tone={STATUS_TONE[r.status] ?? "gray"} />,
      },
      {
        key: "actions",
        header: "",
        align: "right",
        cell: (r) =>
          r.status !== "open" ? (
            <span className="text-bp-muted">—</span>
          ) : (
            <div className="flex justify-end gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={`bp-btn bp-btn-${a.variant}`}
                  disabled={busyId === r.id || (a.ban && !r.target_user_id)}
                  onClick={() => void act(r, a)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ),
      },
    ],
    [busyId, act],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="Reports"
        description="Review abuse reports from the app and take action."
        actions={
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`bp-btn ${filter === f.key ? "bp-btn-primary" : "bp-btn-secondary"}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
            <RefreshButton onClick={() => void reload()} />
          </div>
        }
      />
      <Alert>{actionError ?? error}</Alert>
      <DataTable
        columns={columns}
        rows={items}
        getKey={(r) => r.id}
        loading={loading}
        empty="No reports yet."
        expand={(r) =>
          r.messages && r.messages.length > 0 ? (
            <>
              <span className="font-semibold text-bp-ink">Reported messages: </span>
              {r.messages.map((m) => (
                <span key={m.id} className="mr-3 inline-block">
                  [{m.type}] {m.text}
                </span>
              ))}
              {r.target_conversation_id ? (
                <a className="ml-2 font-semibold text-bp-green underline" href="/conversations">
                  Open conversations
                </a>
              ) : null}
            </>
          ) : null
        }
      />
    </div>
  );
}
