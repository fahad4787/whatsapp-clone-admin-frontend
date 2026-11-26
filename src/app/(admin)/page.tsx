"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ban, Flag, KeyRound, MessageSquare, Phone, PhoneCall, RotateCw, Table2, UserPlus, Users, Wifi } from "lucide-react";
import { TrendChart, TrendTable } from "@/components/charts/TrendChart";
import { AnimatedNumber, Badge, Button, Callout, Delta, Elapsed, Card, CardHeader, EmptyState, IconButton, PageHeader, Person, Segmented, Skeleton, StatCard } from "@/components/ui";
import { useAdminCallsStream } from "@/hooks/useAdminCallsStream";
import { useNow } from "@/hooks/useNow";
import { useQuery } from "@/hooks/useQuery";
import { ApiError, adminApi, type CallsSnapshot, type MetricsPoint } from "@/lib/api";
import { pctChange, sum, windows, type SeriesMetric } from "@/lib/series";
import { fmtNumber, humanize, timeAgo } from "@/lib/format";
import { OTP_STATUS, callStatus, otpEffectiveStatus, otpPurpose } from "@/lib/status";

function Breakdown({ rows }: { rows: { label: string; value: number | undefined }[] }) {
  const total = rows.reduce((s, r) => s + (r.value ?? 0), 0);
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const pct = total ? Math.round(((r.value ?? 0) / total) * 100) : 0;
        return (
          <li key={r.label}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="font-medium text-ink-soft">{r.label}</span>
              <span className="font-semibold tabular-nums text-ink">{fmtNumber(r.value ?? 0)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const METRIC_OPTIONS = [
  { value: "messages", label: "Messages" },
  { value: "signups", label: "Sign-ups" },
  { value: "calls", label: "Calls" },
] as const;
const RANGE_OPTIONS = [
  { value: "7", label: "7d" },
  { value: "14", label: "14d" },
  { value: "30", label: "30d" },
] as const;
const UNIT: Record<SeriesMetric, string> = { messages: "messages", signups: "sign-ups", calls: "calls" };

function TrendCard({ points, loading, error, unsupported, onRetry }: { points?: MetricsPoint[]; loading: boolean; error?: string | null; unsupported: boolean; onRetry: () => void }) {
  const [metric, setMetric] = useState<SeriesMetric>("messages");
  const [range, setRange] = useState<"7" | "14" | "30">("30");
  const [asTable, setAsTable] = useState(false);
  const days = Number(range);
  const w = windows(points, days);
  const cur = w ? sum(w.current, metric) : 0;
  const prev = w ? sum(w.previous, metric) : 0;
  const empty = !!w && cur === 0 && prev === 0;

  return (
    <Card className="mt-6">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">Activity trend</h2>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            {w ? (
              <>
                <span className="text-2xl font-bold tracking-tight text-ink tnum">
                  <AnimatedNumber value={cur} />
                </span>
                <span className="text-[13px] text-muted">{UNIT[metric]} in the last {days} days</span>
                <Delta pct={pctChange(cur, prev)} current={cur} context={`vs the ${days} days before`} />
              </>
            ) : loading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <span className="text-[13px] text-muted">Daily totals unavailable</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Metric" value={metric} onChange={setMetric} options={METRIC_OPTIONS} />
          <Segmented label="Range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
          <IconButton label={asTable ? "Show chart" : "Show as table"} aria-pressed={asTable} onClick={() => setAsTable((v) => !v)} disabled={!w}>
            <Table2 size={16} />
          </IconButton>
        </div>
      </header>
      <div className="px-5 pb-4 pt-4">
        {unsupported ? (
          <Callout tone="info" title="Trend data needs a backend update">
            This dashboard reads daily totals from <code className="font-mono text-xs">GET /api/admin/metrics/series</code>, which this backend
            doesn&apos;t have yet. Everything else on the page works.
          </Callout>
        ) : error && !w ? (
          <Callout tone="danger" action={<Button size="sm" variant="secondary" icon={<RotateCw size={14} />} onClick={onRetry}>Retry</Button>}>
            Couldn&apos;t load daily totals. {error}
          </Callout>
        ) : !w ? (
          loading ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <p className="grid h-[240px] place-items-center text-center text-[13px] text-muted">Not enough daily history to draw this range yet.</p>
          )
        ) : asTable ? (
          <TrendTable current={w.current} previous={w.previous} metric={metric} unit={UNIT[metric]} />
        ) : (
          <div className="relative">
            <TrendChart key={`${metric}-${range}`} current={w.current} previous={w.previous} metric={metric} unit={UNIT[metric]} />
            {empty ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] text-muted shadow-xs">No {UNIT[metric]} in this period</span>
              </div>
            ) : null}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-[var(--chart-1)]" aria-hidden /> Last {days} days</span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t-[1.5px] border-dashed border-[var(--chart-compare)]" aria-hidden /> {days} days before</span>
          </div>
          <span>Complete UTC days, ending yesterday. Today&apos;s live counts are in the tiles above.</span>
        </div>
      </div>
    </Card>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-text underline-offset-2 hover:underline">
      View all <ArrowRight size={14} />
    </Link>
  );
}

export default function DashboardPage() {
  const now = useNow(30_000);
  const metrics = useQuery("metrics", (s) => adminApi.metrics(s), { refreshMs: 30_000 });
  const reports = useQuery("dash-reports", (s) => adminApi.reports.list("open", s), { refreshMs: 30_000 });
  const otps = useQuery("dash-otps", (s) => adminApi.otps.list(s), { refreshMs: 15_000 });
  // 30 days → 60 complete UTC days (ending yesterday): the 30-day window and the 30 before it.
  const series = useQuery(
    "dash-series",
    (s) =>
      adminApi.metricsSeries(30, s).catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) return null; // older backend: no trend endpoint
        throw e;
      }),
    { refreshMs: 5 * 60_000 },
  );
  const [calls, setCalls] = useState<CallsSnapshot | null>(null);
  useAdminCallsStream((snap) => setCalls((prev) => ({ ...snap, calls_today: snap.calls_today >= 0 ? snap.calls_today : prev?.calls_today ?? -1 })), true);

  const m = metrics.data;
  const loading = metrics.loading;
  const callsActive = calls?.calls_active ?? m?.calls_active ?? 0;
  const callsToday = calls && calls.calls_today >= 0 ? calls.calls_today : m?.calls_today;

  // Week-over-week from complete days only; sparklines show the last 14 complete days.
  const week = windows(series.data?.points, 7);
  const trend = (metric: SeriesMetric, goodWhen: "up" | "down" = "up") => {
    if (!week) return {};
    const cur = sum(week.current, metric);
    return {
      delta: <Delta pct={pctChange(cur, sum(week.previous, metric))} current={cur} goodWhen={goodWhen} context="last 7 days vs the 7 before" />,
      spark: [...week.previous, ...week.current].map((p) => p[metric]),
    };
  };

  return (
    <>
      <PageHeader title="Dashboard" description="Live health of the platform. Numbers refresh on their own." />

      {metrics.error ? (
        <Callout
          tone="danger"
          className="mb-5"
          action={<Button size="sm" variant="secondary" icon={<RotateCw size={14} />} loading={metrics.fetching} onClick={metrics.reload}>Retry</Button>}
        >
          {metrics.error}
        </Callout>
      ) : null}

      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Users"
          icon={<Users size={15} />}
          loading={loading}
          value={<AnimatedNumber value={m?.users_total} />}
          {...trend("signups")}
          hint={week ? "sign-ups, 7d" : `+${fmtNumber(m?.signups_today ?? 0)} today`}
          href="/users"
        />
        <StatCard label="Online now" icon={<Wifi size={15} />} loading={loading} value={<AnimatedNumber value={m?.users_online ?? 0} />} hint="Connected right now" accent="info" />
        <StatCard
          label="Messages today"
          icon={<MessageSquare size={15} />}
          loading={loading}
          value={<AnimatedNumber value={m?.messages_today} />}
          {...trend("messages")}
          hint={week ? "messages, 7d" : `${fmtNumber(m?.messages_last_7d)} in the last 7 days`}
        />
        <StatCard
          label="Open reports"
          icon={<Flag size={15} />}
          loading={loading}
          value={<AnimatedNumber value={m?.reports_open} />}
          hint={m?.reports_open ? "Waiting for review" : "Nothing to review"}
          href="/reports"
          accent={m?.reports_open ? "danger" : "brand"}
        />
        <StatCard
          label="Active calls"
          icon={<PhoneCall size={15} />}
          loading={loading}
          value={<AnimatedNumber value={callsActive} />}
          {...trend("calls")}
          hint={week ? "calls, 7d" : callsToday != null && callsToday >= 0 ? `${fmtNumber(callsToday)} calls today` : "Ringing or in progress"}
          href="/live"
          accent="warning"
        />
      </div>

      <TrendCard
        points={series.data?.points}
        loading={series.loading}
        error={series.error}
        unsupported={series.data === null}
        onRetry={series.reload}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Conversations" description={`${fmtNumber(m?.conversations_total)} in total`} />
          <div className="p-5">
            <Breakdown
              rows={[
                { label: "Direct chats", value: m?.conversations_direct },
                { label: "Groups", value: m?.conversations_groups },
                { label: "With disappearing messages", value: m?.conversations_disappearing },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Today's message mix" description="Beyond plain text" />
          <div className="p-5">
            <Breakdown
              rows={[
                { label: "Photos, videos & files", value: m?.messages_media_today },
                { label: "Voice notes", value: m?.messages_voice_today },
                { label: "Polls", value: m?.messages_polls_today },
                { label: "Events", value: m?.messages_events_today },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Accounts" description="Sign-ups and moderation" />
          <div className="grid grid-cols-2 gap-3 p-5">
            <div className="rounded-lg bg-brand-soft p-4">
              <UserPlus size={18} className="text-brand" />
              <div className="mt-2 text-2xl font-bold tnum text-ink">{fmtNumber(m?.signups_today ?? 0)}</div>
              <div className="text-xs font-medium text-muted">New today</div>
            </div>
            <Link href="/users?banned=1" className="rounded-lg bg-danger-soft p-4 transition-[box-shadow,transform] duration-150 hover:shadow-raised active:scale-[0.99]">
              <Ban size={18} className="text-danger" />
              <div className="mt-2 text-2xl font-bold tnum text-ink">{fmtNumber(m?.users_banned ?? 0)}</div>
              <div className="text-xs font-medium text-muted">Banned</div>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Open reports" icon={<Flag size={16} />} actions={<ViewAll href="/reports" />} />
          {reports.data?.items.length ? (
            <ul className="divide-y divide-line">
              {reports.data.items.slice(0, 5).map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] font-semibold text-ink">{r.reason ? humanize(r.reason) : "No reason given"}</span>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(r.created_at, now)}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted">
                    {r.target_user ? `Against ${r.target_user.display_name || r.target_user.phone}` : "Conversation report"} · by {r.reporter.display_name || r.reporter.phone}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={reports.loading ? "Loading…" : "Inbox zero"} description={reports.loading ? undefined : "No reports are waiting for review."} />
          )}
        </Card>

        <Card>
          <CardHeader title="Live calls" icon={<Phone size={16} />} actions={<ViewAll href="/live" />} />
          {calls?.items.length ? (
            <ul className="divide-y divide-line">
              {calls.items.slice(0, 5).map((c) => {
                const st = callStatus(c.status);
                const since = c.answered_at ?? c.started_at;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Person size={32} name={c.participants_label || c.initiator.display_name || c.initiator.phone} sub={`${humanize(c.media)} · ${c.kind === "group" ? "Group" : "1:1"}`} seed={c.id} />
                    <div className="shrink-0 text-right">
                      <Badge tone={st.tone} dot pulse>{st.label}</Badge>
                      <div className="mt-0.5 text-xs tabular-nums text-muted"><Elapsed since={since} /></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No calls right now" description="Calls show up here the moment they start ringing." />
          )}
        </Card>

        <Card>
          <CardHeader title="Recent OTPs" icon={<KeyRound size={16} />} actions={<ViewAll href="/otps" />} />
          {otps.data?.items.length ? (
            <ul className="divide-y divide-line">
              {otps.data.items.slice(0, 5).map((o) => {
                const st = otpEffectiveStatus(o, now);
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-ink">{o.phone}</div>
                      <div className="text-xs text-muted">{otpPurpose(o.purpose)} · {timeAgo(o.created_at, now)}</div>
                    </div>
                    <Badge tone={OTP_STATUS[st].tone}>{st}</Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title={otps.loading ? "Loading…" : "No codes yet"} description={otps.loading ? undefined : "Codes appear when someone signs in."} />
          )}
        </Card>
      </div>
    </>
  );
}
