import { useEffect, useRef } from "react";
import { fmtTime } from "@/lib/format";
import type { AdminConversationDetail } from "@/lib/api";

type Msg = AdminConversationDetail["messages"][number];

type Props = {
  messages: Msg[];
  /** Whose point of view: their messages sit on the right (like the app). */
  perspectiveId: string | null;
  isGroup: boolean;
};

/** Receipt ticks for outgoing messages. */
const TICKS: Record<string, { label: string; className: string }> = {
  sent: { label: "✓", className: "" },
  delivered: { label: "✓✓", className: "" },
  read: { label: "✓✓", className: "text-[#53bdeb]" },
};

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const dayKey = (iso: string) => new Date(iso).toDateString();

function body(m: Msg): string {
  if (m.deleted_for_everyone_at) return "🚫 This message was deleted";
  if (m.text) return m.text;
  if (m.has_attachment) return `📎 ${m.attachment_name ?? m.type}`;
  return `[${m.type}]`;
}

/** WhatsApp-style transcript: incoming left, outgoing right, day dividers, receipts. */
export function ChatTranscript({ messages, perspectiveId, isGroup }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages, perspectiveId]);

  const sorted = [...messages].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));

  return (
    <div
      ref={ref}
      className="bp-chat"
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
    >
      {sorted.length === 0 ? <div className="py-6 text-center text-sm text-bp-muted">No messages</div> : null}
      {sorted.map((m, i) => {
        const prev = sorted[i - 1];
        const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
        const mine = perspectiveId !== null && m.sender_id === perspectiveId;
        const firstOfRun = newDay || prev.sender_id !== m.sender_id;
        const tick = mine ? TICKS[m.status] : undefined;
        const deleted = !!m.deleted_for_everyone_at;
        return (
          <div key={m.id} className="contents">
            {newDay ? <div className="bp-chat-day">{dayLabel(m.created_at)}</div> : null}
            <div
              className={`bp-bubble ${mine ? "bp-bubble--out" : "bp-bubble--in"} ${firstOfRun ? "bp-bubble--tail" : ""} ${
                firstOfRun && !newDay ? "bp-bubble--gap" : ""
              } ${deleted ? "italic text-bp-muted" : ""}`}
            >
              {isGroup && !mine && firstOfRun ? <div className="mb-0.5 text-[12px] font-bold text-bp-green">{m.sender_name}</div> : null}
              {m.forwarded ? <div className="mb-0.5 text-[11px] italic text-bp-muted">↪ Forwarded</div> : null}
              <div className="whitespace-pre-wrap text-bp-ink">{body(m)}</div>
              <div className="bp-bubble-meta">
                {m.view_once ? <span>view-once</span> : null}
                {m.edited_at ? <span>edited</span> : null}
                <span>{fmtTime(m.created_at)}</span>
                {tick ? <span className={`font-bold tracking-tighter ${tick.className}`}>{tick.label}</span> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
