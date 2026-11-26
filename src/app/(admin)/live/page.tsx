"use client";

import { useState } from "react";
import { PhoneOff, Radio } from "lucide-react";
import { CallPeople, CallStatusBadge, CallType } from "@/components/calls/CallCells";
import { Badge, Button, Card, DataTable, Elapsed, EmptyState, PageHeader, StatCard, useConfirm, type Column } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useAdminCallsStream } from "@/hooks/useAdminCallsStream";
import { adminApi, type CallItem, type CallsSnapshot } from "@/lib/api";
import { fmtNumber, fmtTime } from "@/lib/format";

export default function LiveCallsPage() {
  const [snap, setSnap] = useState<CallsSnapshot | null>(null);
  const [callsToday, setCallsToday] = useState<number | null>(null);
  const { run, isPending } = useAction();
  const confirm = useConfirm();

  useAdminCallsStream((s) => {
    setSnap(s);
    // The polling fallback doesn't know today's total (-1); keep the last real number.
    if (s.calls_today >= 0) setCallsToday(s.calls_today);
  });

  const items = snap?.items ?? [];
  const ringing = items.filter((c) => c.status === "ringing").length;

  const forceEnd = async (c: CallItem) => {
    const ok = await confirm({
      title: "End this call for everyone?",
      description: `The ${c.media} call started by ${c.initiator.display_name || c.initiator.phone} is closed for all participants right away.`,
      confirmLabel: "End call",
    });
    if (!ok) return;
    const r = await run(c.id, () => adminApi.calls.end(c.id), { success: "Call ended", errorTitle: "Couldn't end the call" });
    if (r) setSnap((s) => (s ? { ...s, items: s.items.filter((x) => x.id !== c.id) } : s));
  };

  const columns: Column<CallItem>[] = [
    { key: "who", header: "Caller", cell: (c) => <CallPeople c={c} /> },
    { key: "type", header: "Type", hideBelow: "sm", cell: (c) => <CallType c={c} /> },
    { key: "status", header: "Status", cell: (c) => <CallStatusBadge c={c} live /> },
    { key: "started", header: "Started", hideBelow: "md", className: "whitespace-nowrap text-muted", cell: (c) => fmtTime(c.started_at) },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      className: "tabular-nums font-medium text-ink",
      cell: (c) => (c.answered_at ? <Elapsed since={c.answered_at} /> : <span className="whitespace-nowrap text-muted">Ringing <Elapsed since={c.started_at} /></span>),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (c) => (
        <Button size="sm" variant="danger-soft" icon={<PhoneOff size={14} />} loading={isPending(c.id)} onClick={() => void forceEnd(c)}>
          End
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Live calls"
        description="Updates the moment a call starts ringing, connects or ends."
        actions={snap ? <Badge tone="success" dot pulse>Live</Badge> : <Badge tone="neutral">Connecting…</Badge>}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Active now" value={fmtNumber(snap?.calls_active ?? 0)} loading={!snap} hint="Ringing or in progress" />
        <StatCard label="Ringing" value={fmtNumber(ringing)} loading={!snap} hint="Not answered yet" accent="warning" />
        <StatCard label="Calls today" value={callsToday == null ? "—" : fmtNumber(callsToday)} loading={!snap} hint="Since midnight" accent="info" />
      </div>
      <Card>
        <DataTable
          label="Live calls"
          columns={columns}
          rows={snap ? items : undefined}
          loading={!snap}
          getKey={(c) => c.id}
          pageSize={0}
          empty={<EmptyState icon={<Radio size={22} />} title="No calls right now" description="Leave this page open; calls appear here as soon as they start." />}
        />
      </Card>
    </>
  );
}
