"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, StatusBadge } from "@/components/ui";
import { chartData, chartSpecs, type ChartSpec } from "@/features/dashboard";
import { useMockStore } from "@/data";

function StatCard({ label, value, delta }: { label: string; value: string; delta?: string }) {
  const up = delta?.startsWith("+");
  return (
    <div className="bp-card p-5">
      <div className="text-[13px] font-medium text-bp-muted">{label}</div>
      <div className="mt-1.5 text-[1.65rem] font-extrabold tracking-tight text-bp-ink">{value}</div>
      {delta ? (
        <div className={`mt-1.5 text-xs font-semibold ${up ? "text-bp-green" : "text-bp-muted"}`}>{delta}</div>
      ) : null}
    </div>
  );
}

function LiveDot({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bp-green opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-bp-green" />
      </span>
      <strong className="tabular-nums">{value}</strong>
      <span className="text-bp-muted">{label}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bp-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        <span className="text-[11px] font-medium text-bp-muted">Last 30 days</span>
      </div>
      {children}
    </div>
  );
}

function DashboardChart({ spec }: { spec: ChartSpec }) {
  return (
    <ChartCard title={spec.title}>
      <ResponsiveContainer width="100%" height={180}>
        {spec.kind === "area" ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={30} />
            <Tooltip />
            <Area type="monotone" dataKey={spec.dataKey} stroke={spec.stroke} fill={spec.fill} />
          </AreaChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={30} />
            <Tooltip />
            <Bar dataKey={spec.dataKey} fill={spec.fill} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function DashboardPage() {
  const store = useMockStore();
  const activeUsers = store.users.filter((u) => u.status === "Active").length;
  const openReports = store.reports.filter((r) => r.status === "Open").length;
  const pendingOtps = store.otps.filter((o) => o.status === "Pending").length;
  const usedOtps = store.otps.filter((o) => o.status === "Used").length;
  const liveRooms = store.live.length;
  const completedCalls = store.calls.filter((c) => c.outcome === "Completed").length;

  const stats = [
    { label: "Registered users", value: `${store.users.length}`, delta: "+555% vs last week" },
    { label: "Active today", value: `${activeUsers}` },
    { label: "Messages this week", value: `${store.conversations.reduce((n, c) => n + c.messages, 0)}`, delta: "-54% vs last week" },
    {
      label: "Call minutes this week",
      value: `${completedCalls * 4} min`,
      delta: "-51% vs last week",
    },
  ];

  const live = [
    { label: "Online users", value: activeUsers },
    { label: "Open connections", value: store.conversations.length },
    { label: "Active calls", value: liveRooms },
    { label: "LiveKit rooms", value: liveRooms },
  ];

  const last24h = [
    { k: "OTP requests", v: store.otps.length },
    { k: "OTP lockouts", v: store.otps.filter((o) => o.status === "Failed").length },
    { k: "Pushes sent", v: usedOtps + pendingOtps },
    { k: "Pushes failed", v: store.otps.filter((o) => o.status === "Failed").length },
    { k: "Open reports", v: openReports, accent: true },
  ];

  const recentOtps = store.otps.slice(0, 6);

  return (
    <div className="bp-page">
      <PageHeader
        title="Dashboard"
        description="Live snapshot of sign-ups, messaging, and calls across Bolta Punjab."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="bp-card mt-3 flex flex-wrap gap-6 px-4 py-3 text-sm" aria-label="Live">
        {live.map((m) => (
          <LiveDot key={m.label} {...m} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {chartSpecs.map((spec) => (
          <DashboardChart key={spec.title} spec={spec} />
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="bp-card p-4">
          <h2 className="mb-3 text-base font-semibold">Last 24 hours</h2>
          <dl className="space-y-2 text-sm">
            {last24h.map((row) => (
              <div
                key={row.k}
                className="flex justify-between border-b border-slate-100 py-1.5 last:border-0"
              >
                <dt className="text-bp-muted">{row.k}</dt>
                <dd className={row.accent ? "font-semibold text-bp-green" : "font-semibold"}>{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bp-card overflow-hidden">
          <div className="border-b border-bp-border px-4 py-3 text-base font-semibold">Recent OTP requests</div>
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
              {recentOtps.map((o) => (
                <tr key={o.id}>
                  <td>{o.time}</td>
                  <td className="text-bp-green">{o.phone}</td>
                  <td>
                    <StatusBadge
                      label={o.status}
                      tone={o.status === "Used" ? "green" : o.status === "Pending" ? "yellow" : "red"}
                    />
                  </td>
                  <td>{o.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
