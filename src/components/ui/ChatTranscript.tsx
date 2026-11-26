"use client";

import { useEffect, useMemo, useRef } from "react";
import { Ban, CornerUpRight, Paperclip } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtTime } from "@/lib/format";
import type { ConversationMessage } from "@/lib/api";

type Props = {
  messages: ConversationMessage[];
  /** Whose point of view: their messages sit on the right, like in the app. */
  perspectiveId: string | null;
  isGroup: boolean;
};

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const dayKey = (iso: string) => new Date(iso).toDateString();

function Ticks({ status }: { status: string }) {
  if (status !== "sent" && status !== "delivered" && status !== "read") return null;
  return (
    <span aria-label={status} className={cn("font-bold tracking-tighter", status === "read" && "text-[#53bdeb]")}>
      {status === "sent" ? "✓" : "✓✓"}
    </span>
  );
}

/** Messenger-style transcript: incoming left, outgoing right, day dividers, receipts. */
export function ChatTranscript({ messages, perspectiveId, isGroup }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const sorted = useMemo(() => [...messages].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)), [messages]);

  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [sorted, perspectiveId]);

  return (
    <div
      ref={ref}
      className="chat"
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
    >
      {sorted.length === 0 ? <div className="py-10 text-center text-[13px] text-muted">No messages in this conversation yet.</div> : null}
      {sorted.map((m, i) => {
        const prev = sorted[i - 1];
        const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
        const mine = perspectiveId !== null && m.sender_id === perspectiveId;
        const firstOfRun = newDay || prev.sender_id !== m.sender_id;
        const deleted = !!m.deleted_for_everyone_at;
        return (
          <div key={m.id} className="contents">
            {newDay ? <div className="chat-day">{dayFmt.format(new Date(m.created_at))}</div> : null}
            <div className={cn("bubble", mine ? "bubble--out" : "bubble--in", firstOfRun && "bubble--tail", firstOfRun && !newDay && "bubble--gap")}>
              {isGroup && !mine && firstOfRun ? <div className="mb-0.5 text-xs font-bold text-brand">{m.sender_name}</div> : null}
              {m.forwarded ? (
                <div className="mb-0.5 flex items-center gap-1 text-[11px] italic text-muted">
                  <CornerUpRight size={11} /> Forwarded
                </div>
              ) : null}
              {deleted ? (
                <div className="flex items-center gap-1.5 italic text-muted">
                  <Ban size={13} /> This message was deleted
                </div>
              ) : (
                <>
                  {m.has_attachment ? (
                    <div className="mb-0.5 flex items-center gap-1.5 text-ink-soft">
                      <Paperclip size={13} className="text-muted" />
                      <span className="truncate">{m.attachment_name ?? m.attachment_mime ?? m.type}</span>
                    </div>
                  ) : null}
                  {m.text ? <div className="whitespace-pre-wrap break-words text-ink">{m.text}</div> : null}
                  {!m.text && !m.has_attachment ? <div className="text-muted">[{m.type}]</div> : null}
                </>
              )}
              <div className="bubble-meta">
                {m.view_once ? <span>view once</span> : null}
                {m.edited_at ? <span>edited</span> : null}
                <span>{fmtTime(m.created_at)}</span>
                {mine ? <Ticks status={m.status} /> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
