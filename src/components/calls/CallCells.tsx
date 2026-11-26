import { Phone, Users, Video } from "lucide-react";
import { Badge, Person } from "@/components/ui";
import type { CallItem } from "@/lib/api";
import { callStatus } from "@/lib/status";
import { humanize } from "@/lib/format";

/** Who's on the call: initiator up front, the rest summarised. */
export function CallPeople({ c }: { c: CallItem }) {
  const caller = c.initiator.display_name || c.initiator.phone;
  const others = c.participants.filter((p) => p.user_id !== c.initiator.id);
  const sub =
    c.conversation_title && c.kind === "group"
      ? c.conversation_title
      : others.length === 1
        ? `to ${others[0].display_name || others[0].phone}`
        : others.length > 1
          ? `with ${others.length} people`
          : c.participants_label;
  return <Person name={caller} sub={sub} seed={c.initiator.id} />;
}

export function CallType({ c }: { c: CallItem }) {
  const Icon = c.media === "video" ? Video : Phone;
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted text-muted">
        <Icon size={14} />
      </span>
      {humanize(c.media)}
      {c.kind === "group" ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Users size={12} /> {c.participants.length}
        </span>
      ) : null}
    </span>
  );
}

export function CallStatusBadge({ c, live }: { c: CallItem; live?: boolean }) {
  const st = callStatus(c.status);
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Badge tone={st.tone} dot={live} pulse={live}>{st.label}</Badge>
      {c.end_reason && !live ? <span className="text-[11px] text-muted">{humanize(c.end_reason)}</span> : null}
    </span>
  );
}
