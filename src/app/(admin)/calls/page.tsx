"use client";

import { useCallback, useState } from "react";
import { Alert, DataTable, FilterBar, PageHeader, StatusBadge, type Column } from "@/components/ui";
import { useAdminCallsStream } from "@/hooks/useAdminCallsStream";
import { useAdminList } from "@/hooks/useAdminList";
import { downloadCsv, fetchAdminCalls, type AdminCallItem } from "@/lib/api";
import { fmtDateTime, fmtDuration } from "@/lib/format";

type Tone = "green" | "yellow" | "red" | "gray";
const OUTCOME_TONE: Record<string, Tone> = {
  ended: "green",
  missed: "red",
  rejected: "red",
  ringing: "yellow",
  active: "yellow",
};

const cap = (v: string) => v[0].toUpperCase() + v.slice(1);
const STATUS_FILTER = [{ value: "", label: "Any status" }, ...["ended", "missed", "rejected", "active", "ringing"].map((v) => ({ value: v, label: cap(v) }))];
const MEDIA_FILTER = [{ value: "", label: "Any media" }, ...["audio", "video"].map((v) => ({ value: v, label: cap(v) }))];

const COLUMNS: Column<AdminCallItem>[] = [
  { key: "started", header: "Started", className: "whitespace-nowrap", cell: (c) => fmtDateTime(c.started_at) },
  { key: "outcome", header: "Outcome", cell: (c) => <StatusBadge label={c.status} tone={OUTCOME_TONE[c.status] ?? "gray"} /> },
  { key: "type", header: "Type", className: "capitalize", cell: (c) => `${c.media} · ${c.kind}` },
  {
    key: "participants",
    header: "Participants",
    className: "text-bp-green",
    cell: (c) => (c.conversation_title ? `${c.conversation_title} · ${c.participants_label}` : c.participants_label),
  },
  { key: "duration", header: "Duration", cell: (c) => fmtDuration(c.duration_seconds) },
  { key: "reason", header: "Reason", className: "text-bp-muted text-sm", cell: (c) => c.end_reason ?? "—" },
];

export default function CallHistoryPage() {
  const [draftQ, setDraftQ] = useState("");
  const [applied, setApplied] = useState({ q: "", status: "", media: "" });

  const fetcher = useCallback(
    async (t: string) =>
      (
        await fetchAdminCalls(t, {
          q: applied.q || undefined,
          status: applied.status || undefined,
          media: applied.media || undefined,
          limit: 100,
        })
      ).items,
    [applied],
  );
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 30_000,
    errorMessage: "Could not load call history — check your connection",
  });

  // Calls starting/ending push a refresh immediately.
  useAdminCallsStream(() => void reload());

  function exportCalls() {
    downloadCsv("call-history.csv", [
      ["Started", "Type", "Media", "Status", "Initiator", "Participants", "Duration (s)", "End reason"],
      ...items.map((c) => [c.started_at, c.kind, c.media, c.status, c.initiator.phone, c.participants_label, c.duration_seconds, c.end_reason]),
    ]);
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Call history"
        description="Completed, missed, cancelled, and in-progress calls — updates live as calls change."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={exportCalls}>
            Export CSV
          </button>
        }
      />

      <FilterBar
        search={{ value: draftQ, onChange: setDraftQ, onSubmit: () => setApplied((a) => ({ ...a, q: draftQ.trim() })), placeholder: "Search phone, name, room, or call id" }}
        selects={[
          { key: "status", value: applied.status, options: STATUS_FILTER, onChange: (status) => setApplied((a) => ({ ...a, status })) },
          { key: "media", value: applied.media, options: MEDIA_FILTER, onChange: (media) => setApplied((a) => ({ ...a, media })) },
        ]}
      />

      <Alert>{error}</Alert>
      <DataTable columns={COLUMNS} rows={items} getKey={(c) => c.id} loading={loading} empty="No calls match this filter." />
    </div>
  );
}
