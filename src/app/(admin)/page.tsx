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
import { PageHeader, StatusBadge } from "@/components/ui/primitives";
import {
  chartData,
  chartSpecs,
  dashboardStats,
  last24hRows,
  liveMetrics,
  type ChartSpec,
} from "@/lib/dashboard";
import { mockOtps } from "@/lib/mock";

function StatCard({ label, value, delta }: { label: string; value: string; delta?: string }) {
  const up = delta?.startsWith("+");
  return (
    <div className="bp-card p-4">
      <div className="text-sm text-bp-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {delta ? (
        <div className={`mt-1 text-xs font-medium ${up ? "text-bp-green" : "text-bp-muted"}`}>{delta}</div>
      ) : null}
    </div>
  );
}

function LiveDot({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-bp-green" />
      <strong>{value}</strong>
      <span className="text-bp-muted">{label}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bp-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-bp-muted">last 30 days</span>
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
  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="bp-card mt-3 flex flex-wrap gap-6 px-4 py-3 text-sm" aria-label="Live">
        {liveMetrics.map((m) => (
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
            {last24hRows.map((row) => (
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
              {mockOtps.map((o) => (
                <tr key={`${o.time}-${o.phone}`}>
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
