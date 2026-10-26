"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  endAdminCall,
  fetchAdminLiveCalls,
  type AdminCallItem,
} from "@/lib/api";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function LiveCallsPage() {
  const [items, setItems] = useState<AdminCallItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again to view live calls");
        setItems([]);
        return;
      }
      const data = await fetchAdminLiveCalls(token);
      setItems(data.items);
    } catch {
      setError("Could not load live calls — check API / admin token");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 8_000);
    return () => window.clearInterval(t);
  }, [load]);

  async function forceEnd(call: AdminCallItem) {
    if (!window.confirm(`Force-end this ${call.media} call?`)) return;
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusyId(call.id);
    try {
      await endAdminCall(token, call.id);
      setItems((list) => list.filter((c) => c.id !== call.id));
    } catch {
      setError("Force-end failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Live calls"
        description="Ringing or connected rooms right now. Force-end tears down every participant."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />

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
              <th>Status</th>
              <th>Media</th>
              <th>Kind</th>
              <th>Participants</th>
              <th>Room</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-bp-muted">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-bp-muted">
                  No calls in progress. When someone places a call, it shows up here.
                </td>
              </tr>
            ) : null}
            {items.map((c) => (
              <tr key={c.id}>
                <td className="whitespace-nowrap">{formatWhen(c.started_at)}</td>
                <td>
                  <StatusBadge
                    label={c.status}
                    tone={c.status === "active" ? "green" : "yellow"}
                  />
                </td>
                <td className="capitalize">{c.media}</td>
                <td className="capitalize">{c.kind}</td>
                <td>
                  <span className="text-bp-green">
                    {c.conversation_title
                      ? `${c.conversation_title} · ${c.participants_label}`
                      : c.participants_label}
                  </span>
                </td>
                <td className="bp-mono text-xs">{c.room_name}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="bp-btn bp-btn-secondary text-xs"
                    disabled={busyId === c.id}
                    onClick={() => void forceEnd(c)}
                  >
                    {busyId === c.id ? "Ending…" : "Force end"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
