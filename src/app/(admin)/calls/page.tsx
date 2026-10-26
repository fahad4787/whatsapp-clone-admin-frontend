"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { useAdminCallsStream } from "@/hooks/useAdminCallsStream";
import { fetchAdminCalls, type AdminCallItem } from "@/lib/api";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDuration(sec: number) {
  if (sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function outcomeTone(status: string): "green" | "yellow" | "red" | "gray" {
  if (status === "ended") return "green";
  if (status === "missed" || status === "rejected") return "red";
  if (status === "ringing" || status === "active") return "yellow";
  return "gray";
}

export default function CallHistoryPage() {
  const [items, setItems] = useState<AdminCallItem[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [media, setMedia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (opts?: { q?: string; status?: string; media?: string }) => {
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again to view call history");
        setItems([]);
        return;
      }
      const data = await fetchAdminCalls(token, {
        q: opts?.q,
        status: opts?.status || undefined,
        media: opts?.media || undefined,
        limit: 100,
      });
      setItems(data.items);
    } catch {
      setError("Could not load call history — check API / admin token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ q, status, media });
    // Initial load only — search form + stream drive later refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount load
  }, [load]);

  // When any call changes (start/end), refresh history for current filters.
  useAdminCallsStream(() => {
    void load({ q, status, media });
  });

  return (
    <div className="bp-page">
      <PageHeader
        title="Call history"
        description="Completed, missed, cancelled, and in-progress calls — list updates when calls change."
      />

      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load({ q, status, media });
        }}
      >
        <input
          className="bp-input min-w-[200px] flex-1"
          placeholder="Search phone, name, room, or call id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="bp-input w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Any status</option>
          <option value="ended">Ended</option>
          <option value="missed">Missed</option>
          <option value="rejected">Rejected</option>
          <option value="active">Active</option>
          <option value="ringing">Ringing</option>
        </select>
        <select
          className="bp-input w-auto"
          value={media}
          onChange={(e) => setMedia(e.target.value)}
        >
          <option value="">Any media</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
        </select>
        <button type="submit" className="bp-btn bp-btn-primary">
          Search
        </button>
      </form>

      {error ? (
        <div className="mb-3 rounded-[var(--radius)] border border-[#f0d4d4] bg-[#fff7f7] px-4 py-2.5 text-sm">
          {error}
        </div>
      ) : null}

      <div className="bp-card overflow-hidden">
        <table className="bp-table">
          <thead>
            <tr>
              <th>Started</th>
              <th>Outcome</th>
              <th>Type</th>
              <th>Participants</th>
              <th>Duration</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-bp-muted">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-bp-muted">
                  No calls match this filter.
                </td>
              </tr>
            ) : null}
            {items.map((c) => (
              <tr key={c.id}>
                <td className="whitespace-nowrap">{formatWhen(c.started_at)}</td>
                <td>
                  <StatusBadge label={c.status} tone={outcomeTone(c.status)} />
                </td>
                <td className="capitalize">
                  {c.media} · {c.kind}
                </td>
                <td>
                  <span className="text-bp-green">
                    {c.conversation_title
                      ? `${c.conversation_title} · ${c.participants_label}`
                      : c.participants_label}
                  </span>
                </td>
                <td>{formatDuration(c.duration_seconds)}</td>
                <td className="text-bp-muted text-sm">{c.end_reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
