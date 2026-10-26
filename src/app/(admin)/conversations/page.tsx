"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  fetchAdminConversation,
  fetchAdminConversations,
  type AdminConversationDetail,
  type AdminConversationItem,
} from "@/lib/api";

function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function ttlLabel(seconds: number): string {
  if (seconds <= 0) return "Off";
  if (seconds === 86_400) return "24h";
  if (seconds === 604_800) return "7d";
  if (seconds === 7_776_000) return "90d";
  return `${seconds}s`;
}

export default function ConversationsPage() {
  const [items, setItems] = useState<AdminConversationItem[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "group" | "direct">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (search?: string, filterType?: typeof type) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again to view conversations");
        setItems([]);
        return;
      }
      const t = filterType ?? type;
      const data = await fetchAdminConversations(token, {
        q: search,
        type: t === "all" ? undefined : t,
      });
      setItems(data.items);
    } catch {
      setError("Could not load conversations — check API / admin token");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: string) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await fetchAdminConversation(token, id);
      setDetail(data);
    } catch {
      setError("Could not load conversation detail");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Conversations"
        description="Live direct chats and groups from Waves 9–15 — members, TTL, recent messages."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load(q, type)}>
            Refresh
          </button>
        }
      />

      {error ? (
        <div className="mb-3 rounded-[var(--radius)] border border-[#f0d4d4] bg-[#fff7f7] px-4 py-2.5 text-sm">
          {error}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className="bp-input max-w-xs"
          placeholder="Search title or id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void load(q, type);
          }}
        />
        <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load(q, type)}>
          Search
        </button>
        {(["all", "direct", "group"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`bp-btn ${type === t ? "bp-btn-primary" : "bp-btn-secondary"}`}
            onClick={() => {
              setType(t);
              void load(q, t);
            }}
          >
            {t === "all" ? "All" : t === "direct" ? "Direct" : "Groups"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="bp-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bp-border bg-[#fafafa] text-[12px] uppercase tracking-wide text-bp-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Conversation</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Members</th>
                <th className="px-4 py-3 font-semibold">Msgs</th>
                <th className="px-4 py-3 font-semibold">TTL</th>
                <th className="px-4 py-3 font-semibold">Last</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-bp-muted">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-bp-muted">
                    No conversations
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-b border-bp-border last:border-0 hover:bg-[#f7fbf8]"
                    onClick={() => void openDetail(c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-bp-ink">{c.title}</div>
                      <div className="mt-0.5 line-clamp-1 text-[12px] text-bp-muted">
                        {c.last_message_preview ?? "No messages"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={c.type === "group" ? "Group" : "Direct"}
                        tone={c.type === "group" ? "brown" : "green"}
                      />
                    </td>
                    <td className="px-4 py-3">{c.member_count}</td>
                    <td className="px-4 py-3">{c.message_count}</td>
                    <td className="px-4 py-3">{ttlLabel(c.disappearing_seconds)}</td>
                    <td className="px-4 py-3 text-[12px] text-bp-muted">
                      {fmtWhen(c.last_message_at ?? c.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bp-card p-4">
          {detailLoading ? (
            <div className="py-10 text-center text-bp-muted">Loading detail…</div>
          ) : !detail ? (
            <div className="py-10 text-center text-bp-muted">
              Select a conversation to inspect members and recent messages.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-lg font-extrabold text-bp-ink">{detail.title}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-[12px]">
                  <StatusBadge
                    label={detail.type === "group" ? "Group" : "Direct"}
                    tone={detail.type === "group" ? "brown" : "green"}
                  />
                  <span className="text-bp-muted">TTL {ttlLabel(detail.disappearing_seconds)}</span>
                  {detail.only_admins_can_send ? (
                    <span className="rounded bg-[#fff4e5] px-2 py-0.5 text-[#9a6700]">Admins only send</span>
                  ) : null}
                </div>
                <div className="mt-1 font-mono text-[11px] text-bp-muted">{detail.id}</div>
              </div>

              <div>
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-bp-muted">
                  Members ({detail.members.length})
                </div>
                <ul className="space-y-1.5">
                  {detail.members.map((m) => (
                    <li key={m.user_id} className="flex items-center justify-between text-sm">
                      <span>
                        {m.display_name || m.phone}
                        <span className="ml-2 text-[12px] text-bp-muted">{m.phone}</span>
                      </span>
                      <StatusBadge label={m.role} tone={m.role === "admin" ? "green" : "gray"} />
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-bp-muted">
                  Recent messages
                </div>
                <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                  {detail.messages.length === 0 ? (
                    <li className="text-sm text-bp-muted">No messages</li>
                  ) : (
                    detail.messages.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-[var(--radius)] border border-bp-border bg-[#fafafa] px-3 py-2 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[12px] text-bp-muted">
                          <span className="font-semibold text-bp-ink">{m.sender_name}</span>
                          <span>{m.type}</span>
                          {m.edited_at ? <span>edited</span> : null}
                          {m.view_once ? <span>view-once</span> : null}
                          {m.forwarded ? <span>forwarded</span> : null}
                          <span className="ml-auto">{fmtWhen(m.created_at)}</span>
                        </div>
                        <div className="mt-1 text-bp-ink">
                          {m.text ||
                            (m.has_attachment
                              ? `Attachment${m.attachment_name ? `: ${m.attachment_name}` : ""}`
                              : "—")}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
