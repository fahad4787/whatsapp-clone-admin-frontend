"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ChatTranscript, DataTable, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  fetchAdminConversation,
  fetchAdminConversations,
  getAdminToken,
  type AdminConversationDetail,
  type AdminConversationItem,
} from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

type TypeFilter = "all" | "direct" | "group";

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "direct", label: "Direct" },
  { key: "group", label: "Groups" },
];

const TYPE_BADGE: Record<string, { label: string; tone: "brown" | "green" }> = {
  group: { label: "Group", tone: "brown" },
  direct: { label: "Direct", tone: "green" },
};

const TTL_LABELS: Record<number, string> = { 0: "Off", 86_400: "24h", 604_800: "7d", 7_776_000: "90d" };
const ttlLabel = (s: number) => TTL_LABELS[Math.max(0, s)] ?? `${s}s`;

const typeBadge = (type: string) => TYPE_BADGE[type] ?? TYPE_BADGE.direct;

const COLUMNS: Column<AdminConversationItem>[] = [
  {
    key: "conversation",
    header: "Conversation",
    className: "max-w-[260px]",
    cell: (c) => (
      <>
        <div className="font-semibold text-bp-ink">{c.title}</div>
        <div className="mt-0.5 truncate text-[12px] text-bp-muted">{c.last_message_preview ?? "No messages"}</div>
      </>
    ),
  },
  { key: "type", header: "Type", cell: (c) => <StatusBadge label={typeBadge(c.type).label} tone={typeBadge(c.type).tone} /> },
  { key: "members", header: "Members", cell: (c) => c.member_count },
  { key: "msgs", header: "Msgs", cell: (c) => c.message_count },
  { key: "ttl", header: "TTL", cell: (c) => ttlLabel(c.disappearing_seconds) },
  {
    key: "last",
    header: "Last",
    className: "whitespace-nowrap text-[12px] text-bp-muted",
    cell: (c) => fmtDateTime(c.last_message_at ?? c.updated_at),
  },
];

export default function ConversationsPage() {
  const [draftQ, setDraftQ] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<string | null>(null);

  const fetcher = useCallback(
    async (t: string) =>
      (await fetchAdminConversations(t, { q: query || undefined, type: type === "all" ? undefined : type })).items,
    [query, type],
  );
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 8_000,
    errorMessage: "Could not load conversations — check your connection",
  });

  const loadDetail = useCallback(async (id: string, silent: boolean) => {
    const token = getAdminToken();
    if (!token) return;
    if (!silent) {
      setDetailLoading(true);
      setDetailError(null);
    }
    try {
      const data = await fetchAdminConversation(token, id);
      setDetail(data);
      // Keep the chosen viewpoint if still a member; otherwise the first member.
      setPerspective((cur) => (cur && data.members.some((m) => m.user_id === cur) ? cur : (data.members[0]?.user_id ?? null)));
    } catch {
      if (!silent) setDetailError("Could not load conversation");
    } finally {
      if (!silent) setDetailLoading(false);
    }
  }, []);

  // Opening another chat: clear the old one, then load.
  useEffect(() => {
    if (!openId) return;
    setDetail(null);
    setPerspective(null);
    void loadDetail(openId, false);
  }, [openId, loadDetail]);

  // Keep the open chat live without flicker.
  useAutoRefresh(async () => {
    if (openId) await loadDetail(openId, true);
  }, 5_000);

  const memberName = useMemo(() => {
    const map = new Map<string, string>();
    detail?.members.forEach((m) => map.set(m.user_id, m.display_name || m.phone));
    return map;
  }, [detail]);

  return (
    <div className="bp-page">
      <PageHeader
        title="Conversations"
        description="Live direct chats and groups — members, disappearing timer, and the transcript as the app shows it."
        actions={<RefreshButton onClick={() => void reload()} />}
      />
      <Alert>{error}</Alert>

      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draftQ.trim());
        }}
      >
        <input className="bp-input max-w-xs" placeholder="Search title or id" value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
        <button type="submit" className="bp-btn bp-btn-secondary">
          Search
        </button>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`bp-btn ${type === f.key ? "bp-btn-primary" : "bp-btn-secondary"}`}
            onClick={() => setType(f.key)}
          >
            {f.label}
          </button>
        ))}
      </form>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <DataTable
          columns={COLUMNS}
          rows={items}
          getKey={(c) => c.id}
          loading={loading}
          empty="No conversations"
          selectedKey={openId}
          onRowClick={(c) => setOpenId(c.id)}
          pageSize={10}
        />

        <div className="bp-card p-5 xl:sticky xl:top-20 xl:self-start">
          {detailLoading ? (
            <div className="py-10 text-center text-bp-muted">Loading chat…</div>
          ) : detailError ? (
            <Alert>{detailError}</Alert>
          ) : !detail ? (
            <div className="py-10 text-center text-bp-muted">Select a conversation to read it like the app shows it.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-lg font-extrabold text-bp-ink">{detail.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                  <StatusBadge label={typeBadge(detail.type).label} tone={typeBadge(detail.type).tone} />
                  <span className="text-bp-muted">TTL {ttlLabel(detail.disappearing_seconds)}</span>
                  {detail.only_admins_can_send ? (
                    <span className="rounded bg-[#fff4e5] px-2 py-0.5 text-[#9a6700]">Admins only send</span>
                  ) : null}
                </div>
                <div className="mt-1 font-mono text-[11px] text-bp-muted">{detail.id}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-bp-muted">View as</span>
                <select
                  className="bp-input !w-auto !py-1"
                  value={perspective ?? ""}
                  onChange={(e) => setPerspective(e.target.value)}
                >
                  {detail.members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {memberName.get(m.user_id)}
                      {m.role === "admin" ? " (admin)" : ""}
                    </option>
                  ))}
                </select>
                <span className="text-[12px] text-bp-muted">{detail.members.length} members · their messages show on the right</span>
              </div>

              <ChatTranscript messages={detail.messages} perspectiveId={perspective} isGroup={detail.type === "group"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
