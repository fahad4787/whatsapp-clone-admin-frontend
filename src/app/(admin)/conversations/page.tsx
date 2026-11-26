"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock, Lock, MessagesSquare, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  ErrorCallout,
  Card,
  CardHeader,
  CardToolbar,
  ChatTranscript,
  EmptyState,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  Skeleton,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type ConversationItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNumber, humanize, timeAgo } from "@/lib/format";

type TypeFilter = "all" | "direct" | "group";

const TTL: Record<number, string> = { 86_400: "24 hours", 604_800: "7 days", 7_776_000: "90 days" };
const ttlLabel = (s: number) => (s > 0 ? (TTL[s] ?? `${Math.round(s / 3600)} h`) : null);

function ConversationRow({ c, active, onSelect }: { c: ConversationItem; active: boolean; onSelect: () => void }) {
  const ttl = ttlLabel(c.disappearing_seconds);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active || undefined}
        className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", active ? "bg-brand-soft/70" : "hover:bg-surface-muted")}
      >
        <Avatar name={c.title} seed={c.id} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13.5px] font-semibold text-ink">{c.title}</span>
            <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.last_message_at ?? c.updated_at)}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">{c.last_message_preview ?? "No messages yet"}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={c.type === "group" ? "info" : "brand"}>{c.type === "group" ? "Group" : "Direct"}</Badge>
            <span className="text-[11px] text-muted">
              {fmtNumber(c.member_count)} members · {fmtNumber(c.message_count)} messages
            </span>
            {ttl ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                <Clock size={11} /> {ttl}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}

function ConversationDetail({ id }: { id: string }) {
  const detail = useQuery(`conversation:${id}`, (s) => adminApi.conversations.get(id, s), { refreshMs: 5_000 });
  const [perspective, setPerspective] = useState<string>("");
  const d = detail.data;

  // Default "view as" to the first member, like opening the chat on their phone.
  useEffect(() => {
    if (d && (!perspective || !d.members.some((m) => m.user_id === perspective))) setPerspective(d.members[0]?.user_id ?? "");
  }, [d, perspective]);

  if (detail.error && !d) return <ErrorCallout error={detail.error} onRetry={detail.reload} retrying={detail.fetching} className="m-5" />;
  if (!d) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  const ttl = ttlLabel(d.disappearing_seconds);
  return (
    <>
      <CardHeader
        title={d.title}
        description={`${d.type === "group" ? "Group" : "Direct chat"} · ${fmtNumber(d.member_count)} members · ${fmtNumber(d.message_count)} messages`}
        icon={d.type === "group" ? <Users size={16} /> : <MessagesSquare size={16} />}
        actions={
          d.members.length ? (
            <Select
              aria-label="View as"
              className="w-48"
              value={perspective}
              onChange={setPerspective}
              options={d.members.map((m) => ({ value: m.user_id, label: `View as ${m.display_name || m.phone}` }))}
            />
          ) : null
        }
      />
      <div className="space-y-4 p-5">
        {d.description ? <p className="text-[13px] text-ink-soft">{d.description}</p> : null}
        <div className="flex flex-wrap gap-2">
          {ttl ? <Badge tone="warning"><Clock size={12} /> Disappearing after {ttl}</Badge> : null}
          {d.only_admins_can_send ? <Badge tone="neutral"><Lock size={12} /> Only admins can send</Badge> : null}
          {d.only_admins_can_edit_info ? <Badge tone="neutral"><Lock size={12} /> Only admins edit info</Badge> : null}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Members</div>
          <ul className="flex flex-wrap gap-2">
            {d.members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-xs">
                <Avatar name={m.display_name || m.phone} seed={m.user_id} size={22} />
                <span className="font-medium text-ink">{m.display_name || m.phone}</span>
                {m.role && m.role.toLowerCase() !== "member" ? <span className="text-muted">· {humanize(m.role.toLowerCase())}</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <ChatTranscript messages={d.messages} perspectiveId={perspective || null} isGroup={d.type === "group"} />
        {d.message_count > d.messages.length ? (
          <p className="text-center text-xs text-muted">Showing the latest {d.messages.length} of {fmtNumber(d.message_count)} messages.</p>
        ) : null}
      </div>
    </>
  );
}

function ConversationsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openId = params.get("id");
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  // Follow ?q= when it changes underneath us (e.g. a search from the command palette).
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (urlQ !== seenUrlQ) {
    setSeenUrlQ(urlQ);
    setQ(urlQ);
  }
  const [type, setType] = useState<TypeFilter>("all");
  const query = useDebouncedValue(q.trim(), 300);

  const list = useQuery(`conversations:${type}:${query}`, (s) => adminApi.conversations.list({ q: query, type: type === "all" ? undefined : type }, s), {
    refreshMs: 15_000,
  });
  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  const open = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("id", id);
    else next.delete("id");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <>
      <PageHeader title="Conversations" count={list.data ? items.length : undefined} description="Read-only view for moderation. Search by group name, phone number or member name." />
      {list.error ? <ErrorCallout error={list.error} onRetry={list.reload} retrying={list.fetching} className="mb-4" /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Card className="flex max-h-[calc(100vh-12rem)] flex-col overflow-hidden lg:sticky lg:top-[calc(var(--topbar-h)+2rem)]">
          <CardToolbar className="md:flex-col md:items-stretch">
            <SearchInput value={q} onChange={setQ} placeholder="Group name, phone or member" aria-label="Search conversations" />
            <Segmented
              label="Conversation type"
              value={type}
              onChange={setType}
              options={[
                { value: "all", label: "All" },
                { value: "direct", label: "Direct" },
                { value: "group", label: "Groups" },
              ]}
            />
          </CardToolbar>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.loading ? (
              <div className="space-y-4 p-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length ? (
              <ul className="divide-y divide-line">
                {items.map((c) => (
                  <ConversationRow key={c.id} c={c} active={c.id === openId} onSelect={() => open(c.id)} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={<MessagesSquare size={22} />} title={query ? "No matches" : "No conversations yet"} description={query ? "Try a phone number with country code, or part of a name." : "Chats appear once people start messaging."} />
            )}
          </div>
        </Card>

        <Card className="min-h-[24rem] overflow-hidden">
          {openId ? (
            <ConversationDetail key={openId} id={openId} />
          ) : (
            <EmptyState className="h-full py-24" icon={<MessagesSquare size={22} />} title="Select a conversation" description="Pick a chat on the left to read its latest messages and members." />
          )}
        </Card>
      </div>
    </>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense>
      <ConversationsView />
    </Suspense>
  );
}
