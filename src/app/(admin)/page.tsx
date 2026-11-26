"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ban, Flag, KeyRound, MessageSquare, Phone, PhoneCall, UserPlus, Users, Wifi } from "lucide-react";
import { Badge, Callout, Elapsed, Card, CardHeader, EmptyState, PageHeader, Person, StatCard } from "@/components/ui";
import { useAdminCallsStream } from "@/hooks/useAdminCallsStream";
import { useNow } from "@/hooks/useNow";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type CallsSnapshot } from "@/lib/api";
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

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-strong">
      View all <ArrowRight size={14} />
    </Link>
  );
}

export default function DashboardPage() {
  const now = useNow(30_000);
  const metrics = useQuery("metrics", (s) => adminApi.metrics(s), { refreshMs: 30_000 });
  const reports = useQuery("dash-reports", (s) => adminApi.reports.list("open", s), { refreshMs: 30_000 });
  const otps = useQuery("dash-otps", (s) => adminApi.otps.list(s), { refreshMs: 15_000 });
  const [calls, setCalls] = useState<CallsSnapshot | null>(null);
  useAdminCallsStream((snap) => setCalls((prev) => ({ ...snap, calls_today: snap.calls_today >= 0 ? snap.calls_today : prev?.calls_today ?? -1 })), true);

  const m = metrics.data;
  const loading = metrics.loading;
  const callsActive = calls?.calls_active ?? m?.calls_active ?? 0;
  const callsToday = calls && calls.calls_today >= 0 ? calls.calls_today : m?.calls_today;

  return (
    <>
      <PageHeader title="Dashboard" description="Live health of the platform. Numbers refresh on their own." />

      {metrics.error ? <Callout tone="danger" className="mb-5">{metrics.error}</Callout> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Users" icon={<Users size={18} />} loading={loading} value={fmtNumber(m?.users_total)} hint={`+${fmtNumber(m?.signups_today ?? 0)} today`} href="/users" />
        <StatCard label="Online now" icon={<Wifi size={18} />} loading={loading} value={fmtNumber(m?.users_online ?? 0)} hint="Connected right now" accent="info" />
        <StatCard label="Messages today" icon={<MessageSquare size={18} />} loading={loading} value={fmtNumber(m?.messages_today)} hint={`${fmtNumber(m?.messages_last_7d)} in the last 7 days`} />
        <StatCard label="Open reports" icon={<Flag size={18} />} loading={loading} value={fmtNumber(m?.reports_open)} hint="Waiting for review" href="/reports" accent={m?.reports_open ? "danger" : "brand"} />
        <StatCard label="Active calls" icon={<PhoneCall size={18} />} loading={loading} value={fmtNumber(callsActive)} hint={callsToday != null && callsToday >= 0 ? `${fmtNumber(callsToday)} calls today` : "Ringing or in progress"} href="/live" accent="warning" />
      </div>

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
            <div className="rounded-xl bg-brand-soft p-4">
              <UserPlus size={18} className="text-brand" />
              <div className="mt-2 text-2xl font-extrabold tabular-nums text-ink">{fmtNumber(m?.signups_today ?? 0)}</div>
              <div className="text-xs font-medium text-muted">New today</div>
            </div>
            <Link href="/users?banned=1" className="rounded-xl bg-danger-soft p-4 transition-shadow hover:shadow-card">
              <Ban size={18} className="text-danger" />
              <div className="mt-2 text-2xl font-extrabold tabular-nums text-ink">{fmtNumber(m?.users_banned ?? 0)}</div>
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
