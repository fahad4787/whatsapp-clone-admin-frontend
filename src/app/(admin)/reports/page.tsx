"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  fetchAdminReports,
  resolveAdminReport,
  type AdminReportItem,
} from "@/lib/api";

function tone(status: string): "green" | "yellow" | "red" | "gray" {
  if (status === "open") return "yellow";
  if (status === "resolved") return "green";
  if (status === "dismissed") return "gray";
  return "gray";
}

export default function ReportsPage() {
  const [items, setItems] = useState<AdminReportItem[]>([]);
  const [filter, setFilter] = useState<"all" | "open">("open");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again to view reports");
        setItems([]);
        return;
      }
      const data = await fetchAdminReports(token, filter === "open" ? "open" : undefined);
      setItems(data.items);
    } catch {
      setError("Could not load reports — check API / admin token");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(report: AdminReportItem, action: "resolve" | "dismiss", banUser = false) {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusyId(report.id);
    try {
      const updated = await resolveAdminReport(token, report.id, action, {
        ban_user: banUser,
      });
      setItems((list) =>
        filter === "open"
          ? list.filter((r) => r.id !== report.id)
          : list.map((r) => (r.id === report.id ? updated : r)),
      );
    } catch {
      setError("Could not update report");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Reports"
        description="Review abuse reports from the app and take action."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className={`bp-btn ${filter === "open" ? "bp-btn-primary" : "bp-btn-secondary"}`}
              onClick={() => setFilter("open")}
            >
              Open
            </button>
            <button
              type="button"
              className={`bp-btn ${filter === "all" ? "bp-btn-primary" : "bp-btn-secondary"}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
              Refresh
            </button>
          </div>
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
              <th>Filed</th>
              <th>Reporter</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-bp-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-bp-muted">
                  No reports yet.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td className="whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="text-bp-green">{r.reporter.phone}</td>
                    <td>{r.target_user?.phone ?? r.target_conversation_id ?? "—"}</td>
                    <td className="max-w-[240px] truncate">{r.reason || "—"}</td>
                    <td>
                      <StatusBadge label={r.status} tone={tone(r.status)} />
                    </td>
                    <td className="text-right">
                      {r.status === "open" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="bp-btn bp-btn-secondary"
                            disabled={busyId === r.id}
                            onClick={() => void act(r, "dismiss")}
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            className="bp-btn bp-btn-secondary"
                            disabled={busyId === r.id || !r.target_user_id}
                            onClick={() => void act(r, "resolve", true)}
                          >
                            Ban + resolve
                          </button>
                          <button
                            type="button"
                            className="bp-btn bp-btn-primary"
                            disabled={busyId === r.id}
                            onClick={() => void act(r, "resolve")}
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <span className="text-bp-muted">—</span>
                      )}
                    </td>
                  </tr>
                  {r.messages && r.messages.length > 0 ? (
                    <tr className="bg-[#fafafa]">
                      <td colSpan={6} className="px-4 py-2 text-[12px] text-bp-muted">
                        <span className="font-semibold text-bp-ink">Reported messages: </span>
                        {r.messages.map((m) => (
                          <span key={m.id} className="mr-3 inline-block">
                            [{m.type}] {m.text}
                          </span>
                        ))}
                        {r.target_conversation_id ? (
                          <a
                            className="ml-2 font-semibold text-bp-green underline"
                            href={`/conversations`}
                            title={r.target_conversation_id}
                          >
                            Open conversations
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
