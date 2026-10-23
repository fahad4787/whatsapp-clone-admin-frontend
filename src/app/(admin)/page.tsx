"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackendHealthBanner } from "@/components/BackendHealthBanner";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import {
  ApiError,
  clearAdminSession,
  fetchAdminMetrics,
  fetchAdminOtps,
  fetchAdminReports,
  type AdminMetrics,
  type AdminOtpItem,
  type AdminReportItem,
} from "@/lib/api";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bp-card p-5">
      <div className="text-[13px] font-medium text-bp-muted">{label}</div>
      <div className="mt-1.5 text-[1.65rem] font-extrabold tracking-tight text-bp-ink">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [otps, setOtps] = useState<AdminOtpItem[]>([]);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setNeedsLogin(false);
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) {
      setNeedsLogin(true);
      setError("Sign in again to load live metrics");
      return;
    }

    const settled = await Promise.allSettled([
      fetchAdminMetrics(token),
      fetchAdminOtps(token),
      fetchAdminReports(token, "open"),
    ]);

    const [m, o, r] = settled;
    const unauthorized = settled.some(
      (s) => s.status === "rejected" && s.reason instanceof ApiError && s.reason.status === 401,
    );
    if (unauthorized) {
      clearAdminSession();
      setNeedsLogin(true);
      setError("Admin session expired — sign in again");
      return;
    }

    if (m.status === "fulfilled") setMetrics(m.value);
    if (o.status === "fulfilled") setOtps(o.value.items.slice(0, 6));
    if (r.status === "fulfilled") setReports(r.value.items.slice(0, 6));

    if (m.status === "rejected") {
      const reason = m.reason instanceof Error ? m.reason.message : "metrics_failed";
      setError(`Could not load metrics (${reason})`);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = metrics
    ? [
        { label: "Registered users", value: `${metrics.users_total}` },
        { label: "Banned users", value: `${metrics.users_banned}` },
        { label: "Messages today", value: `${metrics.messages_today}` },
        { label: "Messages (7d)", value: `${metrics.messages_last_7d}` },
      ]
    : [
        { label: "Registered users", value: "—" },
        { label: "Banned users", value: "—" },
        { label: "Messages today", value: "—" },
        { label: "Messages (7d)", value: "—" },
      ];

  return (
    <div className="bp-page">
      <PageHeader
        title="Dashboard"
        description="Live snapshot from the shared Aivora API."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />

      <BackendHealthBanner />

      {error ? (
        <div className="mb-3 rounded-[var(--radius)] border border-[#f0d4d4] bg-[#fff7f7] px-4 py-2.5 text-sm">
          {error}
          {needsLogin ? (
            <>
              {" "}
              <Link href="/login" className="font-semibold text-bp-green underline">
                Sign in
              </Link>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="bp-card mt-3 flex flex-wrap gap-6 px-4 py-3 text-sm" aria-label="Live">
        <div>
          <strong className="tabular-nums">{metrics?.signups_today ?? "—"}</strong>{" "}
          <span className="text-bp-muted">signups today</span>
        </div>
        <div>
          <strong className="tabular-nums">{metrics?.conversations_total ?? "—"}</strong>{" "}
          <span className="text-bp-muted">conversations</span>
        </div>
        <div>
          <strong className="tabular-nums text-bp-green">{metrics?.reports_open ?? "—"}</strong>{" "}
          <span className="text-bp-muted">open reports</span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="bp-card p-4">
          <h2 className="mb-3 text-base font-semibold">Open reports</h2>
          {reports.length === 0 ? (
            <p className="text-sm text-bp-muted">No open reports.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="flex justify-between gap-3 border-b border-slate-100 py-1.5 last:border-0">
                  <span className="truncate">
                    {r.target_user?.phone ?? "Unknown"} — {r.reason || "No reason"}
                  </span>
                  <StatusBadge label={r.status} tone="yellow" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bp-card overflow-hidden">
          <div className="border-b border-bp-border px-4 py-3 text-base font-semibold">
            Recent OTP requests
          </div>
          <table className="bp-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {otps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-bp-muted">
                    No OTP requests yet.
                  </td>
                </tr>
              ) : (
                otps.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.created_at).toLocaleTimeString()}</td>
                    <td className="text-bp-green">{o.phone}</td>
                    <td>
                      <StatusBadge
                        label={o.status}
                        tone={
                          o.status === "Used" ? "green" : o.status === "Pending" ? "yellow" : "red"
                        }
                      />
                    </td>
                    <td>{o.attempts}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
