"use client";

import { useMemo, useState } from "react";
import { Download, Phone } from "lucide-react";
import { CallPeople, CallStatusBadge, CallType } from "@/components/calls/CallCells";
import { Button, Callout, Card, CardToolbar, DataTable, EmptyState, PageHeader, SearchInput, Select, type Column } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type CallItem, type CallStatus } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { fmtDateTime, fmtDuration } from "@/lib/format";

type StatusFilter = "all" | CallStatus;
type MediaFilter = "all" | "audio" | "video";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "ended", label: "Ended" },
  { value: "missed", label: "Missed" },
  { value: "rejected", label: "Declined" },
  { value: "active", label: "In call" },
  { value: "ringing", label: "Ringing" },
];
const MEDIA_OPTIONS: { value: MediaFilter; label: string }[] = [
  { value: "all", label: "Voice & video" },
  { value: "audio", label: "Voice" },
  { value: "video", label: "Video" },
];

export default function CallsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [media, setMedia] = useState<MediaFilter>("all");
  const query = useDebouncedValue(q.trim(), 300);
  const key = `${query}:${status}:${media}`;

  const list = useQuery(
    `calls:${key}`,
    (s) => adminApi.calls.list({ q: query, status: status === "all" ? undefined : status, media: media === "all" ? undefined : media }, s),
    { refreshMs: 30_000 },
  );
  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  const columns: Column<CallItem>[] = [
    { key: "who", header: "Caller", cell: (c) => <CallPeople c={c} /> },
    { key: "type", header: "Type", hideBelow: "sm", cell: (c) => <CallType c={c} /> },
    { key: "status", header: "Result", cell: (c) => <CallStatusBadge c={c} /> },
    { key: "started", header: "When", hideBelow: "md", className: "whitespace-nowrap text-muted", cell: (c) => fmtDateTime(c.started_at) },
    { key: "duration", header: "Duration", align: "right", className: "tabular-nums", cell: (c) => fmtDuration(c.duration_seconds) },
  ];

  const exportCsv = () =>
    downloadCsv(`aivora-calls-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["id", "media", "kind", "status", "end_reason", "initiator_phone", "participants", "started_at", "answered_at", "ended_at", "duration_seconds"],
      ...items.map((c) => [
        c.id,
        c.media,
        c.kind,
        c.status,
        c.end_reason ?? "",
        c.initiator.phone,
        c.participants.map((p) => p.phone).join(" "),
        c.started_at,
        c.answered_at ?? "",
        c.ended_at ?? "",
        c.duration_seconds,
      ]),
    ]);

  const filtered = !!query || status !== "all" || media !== "all";

  return (
    <>
      <PageHeader
        title="Call history"
        count={list.data ? items.length : undefined}
        description="The latest 200 calls that match. Search by phone number or name."
        actions={<Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv} disabled={!items.length}>Export CSV</Button>}
      />
      {list.error ? <Callout tone="danger" className="mb-4">{list.error}</Callout> : null}
      <Card>
        <CardToolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Phone or name" className="md:max-w-xs" aria-label="Search calls" />
          <div className="flex gap-2">
            <Select aria-label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} className="w-40" />
            <Select aria-label="Media" value={media} onChange={setMedia} options={MEDIA_OPTIONS} className="w-40" />
          </div>
        </CardToolbar>
        <DataTable
          label="Call history"
          columns={columns}
          rows={list.data ? items : undefined}
          loading={list.loading}
          getKey={(c) => c.id}
          resetKey={key}
          empty={<EmptyState icon={<Phone size={22} />} title={filtered ? "No calls match" : "No calls yet"} description={filtered ? "Try clearing a filter." : "Calls appear here after they end."} />}
        />
      </Card>
    </>
  );
}
