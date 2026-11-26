"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Flag, MessagesSquare, Quote, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  ErrorCallout,
  Card,
  CardToolbar,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Person,
  Segmented,
  Skeleton,
  SwitchRow,
  Textarea,
} from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type ReportItem, type ReportStatus } from "@/lib/api";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { REPORT_STATUS } from "@/lib/status";

type Filter = ReportStatus | "all";
type Decision = "resolve" | "dismiss";

const name = (p: { display_name: string | null; phone: string }) => p.display_name || p.phone;

function ResolveModal({
  target,
  onClose,
  onDone,
}: {
  target: { report: ReportItem; action: Decision } | null;
  onClose: () => void;
  onDone: (r: ReportItem) => void;
}) {
  const { run, isPending } = useAction();
  const [note, setNote] = useState("");
  const [ban, setBan] = useState(false);
  const report = target?.report;
  const action = target?.action ?? "resolve";
  const close = () => {
    setNote("");
    setBan(false);
    onClose();
  };
  const submit = async () => {
    if (!report || note.length > 1000) return;
    const updated = await run(
      "resolve",
      () => adminApi.reports.resolve(report.id, { action, note: note.trim() || undefined, ban_user: action === "resolve" && ban }),
      { success: action === "dismiss" ? "Report dismissed" : ban ? "Report resolved and user banned" : "Report resolved", errorTitle: "Couldn't update the report" },
    );
    if (updated) {
      onDone(updated);
      close();
    }
  };

  return (
    <Modal
      open={!!report}
      onClose={close}
      size="sm"
      title={action === "dismiss" ? "Dismiss report" : "Resolve report"}
      description={action === "dismiss" ? "Close it without taking action." : "Mark it handled. You can also ban the reported user."}
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" variant={ban && action === "resolve" ? "danger" : "primary"} loading={isPending("resolve")}>
            {action === "dismiss" ? "Dismiss" : ban ? "Resolve and ban" : "Resolve"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Note"
          hint={`${note.length}/1000 · Optional, saved with the report and in the audit log.`}
          error={note.length > 1000 ? "Keep the note under 1000 characters." : null}
        >
          {(a) => <Textarea {...a} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you found and what you did" />}
        </Field>
        {action === "resolve" && report?.target_user ? (
          <div className="rounded-xl border border-line bg-surface-muted/60 px-4 py-3">
            <SwitchRow
              label={`Ban ${name(report.target_user)}`}
              description="Signs them out everywhere and blocks sign-in until you unban them."
              checked={ban}
              onChange={setBan}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function ReportCard({ r, onDecide }: { r: ReportItem; onDecide: (r: ReportItem, a: Decision) => void }) {
  const st = REPORT_STATUS[r.status];
  const convoId = r.target_conversation_id ?? r.messages?.[0]?.conversation_id ?? null;
  return (
    <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Person name={name(r.reporter)} sub="Reporter" seed={r.reporter.id} size={30} />
          <ArrowRight size={16} className="shrink-0 text-muted" aria-label="reported" />
          {r.target_user ? (
            <Person name={name(r.target_user)} sub={r.target_user.phone} seed={r.target_user.id} size={30} />
          ) : (
            <span className="text-sm font-medium text-ink-soft">A conversation</span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-ink">{r.reason?.trim() || <span className="text-muted">No reason given</span>}</p>
        {r.messages?.length ? (
          <ul className="space-y-1.5">
            {r.messages.map((m) => (
              <li key={m.id} className="flex gap-2 rounded-lg bg-surface-muted px-3 py-2 text-[13px] text-ink-soft">
                <Quote size={13} className="mt-0.5 shrink-0 text-subtle" />
                <span className="min-w-0 break-words">{m.text}</span>
                <span className="ml-auto shrink-0 text-[11px] text-muted">{fmtDateTime(m.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {r.resolution_note ? (
          <p className="text-[13px] text-muted">
            <span className="font-semibold text-ink-soft">Note:</span> {r.resolution_note}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <Badge tone={st.tone} dot>{st.label}</Badge>
          <span title={fmtDateTime(r.created_at)}>Reported {timeAgo(r.created_at)}</span>
          {r.resolved_at ? <span>· Closed {fmtDateTime(r.resolved_at)}</span> : null}
          {convoId ? (
            <Link href={`/conversations?id=${encodeURIComponent(convoId)}`} className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-text">
              <MessagesSquare size={13} /> Open chat
            </Link>
          ) : null}
        </div>
      </div>
      {r.status === "open" ? (
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={() => onDecide(r, "resolve")}>Resolve</Button>
          <Button size="sm" variant="secondary" icon={<XCircle size={15} />} onClick={() => onDecide(r, "dismiss")}>Dismiss</Button>
        </div>
      ) : null}
    </li>
  );
}

export default function ReportsPage() {
  const [filter, setFilter] = useState<Filter>("open");
  const [target, setTarget] = useState<{ report: ReportItem; action: Decision } | null>(null);
  const list = useQuery(`reports:${filter}`, (s) => adminApi.reports.list(filter, s), { refreshMs: 30_000 });
  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  const onDone = (u: ReportItem) =>
    list.setData((d) => {
      if (!d) return d;
      // The resolve response has no quoted messages; keep the ones already loaded.
      const merged = d.items.map((x) => (x.id === u.id ? { ...x, ...u, messages: x.messages } : x));
      return { ...d, items: filter === "all" || filter === u.status ? merged : merged.filter((x) => x.id !== u.id) };
    });

  return (
    <>
      <PageHeader
        title="Reports"
        count={list.data ? items.length : undefined}
        description="What people reported from the app. Resolve, dismiss, or ban the reported user."
        actions={<ButtonLink href="/users?banned=1" variant="secondary">Banned users</ButtonLink>}
      />
      {list.error ? <ErrorCallout error={list.error} onRetry={list.reload} retrying={list.fetching} className="mb-4" /> : null}
      <Card>
        <CardToolbar>
          <Segmented
            label="Report status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "open", label: "Open" },
              { value: "resolved", label: "Resolved" },
              { value: "dismissed", label: "Dismissed" },
              { value: "all", label: "All" },
            ]}
          />
        </CardToolbar>
        {list.loading && !list.data ? (
          <div className="space-y-4 p-5">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : items.length ? (
          <ul className="divide-y divide-line">
            {items.map((r) => <ReportCard key={r.id} r={r} onDecide={(report, action) => setTarget({ report, action })} />)}
          </ul>
        ) : (
          <EmptyState
            icon={<Flag size={22} />}
            title={filter === "open" ? "Nothing to review" : "No reports here"}
            description={filter === "open" ? "New reports from the app show up here." : "Try another filter."}
          />
        )}
      </Card>
      <ResolveModal target={target} onClose={() => setTarget(null)} onDone={onDone} />
    </>
  );
}
