"use client";

import { useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { Badge, Button, Callout, Card, CardToolbar, DataTable, EmptyState, PageHeader, Person, SearchInput, Select, type Column, type Tone } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type AuditItem } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { fmtDateTime, humanize, timeAgo } from "@/lib/format";

/** Friendly names for the actions the backend records. Unknown actions fall back to a humanised key. */
const ACTIONS: Record<string, { label: string; tone: Tone }> = {
  "admin.login": { label: "Signed in", tone: "neutral" },
  "admin.invite": { label: "Added an admin", tone: "brand" },
  "user.create": { label: "Created a user", tone: "brand" },
  "user.ban": { label: "Banned a user", tone: "danger" },
  "user.unban": { label: "Unbanned a user", tone: "success" },
  "user.delete": { label: "Deleted a user", tone: "danger" },
  "otp.generate": { label: "Generated a code", tone: "info" },
  "report.resolve": { label: "Resolved a report", tone: "success" },
  "report.dismiss": { label: "Dismissed a report", tone: "neutral" },
  "settings.update": { label: "Changed settings", tone: "warning" },
  "security.update": { label: "Changed admin security", tone: "warning" },
  "firewall.update": { label: "Changed IP allowlist", tone: "warning" },
  "legal.update": { label: "Updated legal docs", tone: "info" },
  "country.update": { label: "Updated a country", tone: "info" },
  "channel.create": { label: "Created a channel", tone: "brand" },
  "channel.update": { label: "Updated a channel", tone: "info" },
  "channel.delete": { label: "Deleted a channel", tone: "danger" },
  "channel.post.hide": { label: "Hid a channel post", tone: "danger" },
};
const actionInfo = (a: string) => ACTIONS[a] ?? { label: humanize(a), tone: "neutral" as Tone };

const AREAS = [
  { value: "all", label: "All activity" },
  { value: "admin", label: "Sign-ins & admins" },
  { value: "user", label: "Users" },
  { value: "report", label: "Reports" },
  { value: "otp", label: "Codes" },
  { value: "config", label: "Settings & security" },
  { value: "content", label: "Countries, legal & channels" },
] as const;
type Area = (typeof AREAS)[number]["value"];
const AREA_PREFIXES: Record<Exclude<Area, "all">, string[]> = {
  admin: ["admin."],
  user: ["user."],
  report: ["report."],
  otp: ["otp."],
  config: ["settings.", "security.", "firewall."],
  content: ["country.", "legal.", "channel."],
};

function metaEntries(meta: unknown): [string, string][] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  return Object.entries(meta as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)]);
}

function MetaChips({ meta }: { meta: unknown }) {
  const entries = metaEntries(meta);
  if (!entries.length) return <span className="text-muted">—</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="inline-flex max-w-[16rem] items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs" title={`${k}: ${v}`}>
          <span className="text-muted">{humanize(k)}</span>
          <span className="truncate font-medium text-ink">{v}</span>
        </span>
      ))}
    </span>
  );
}

export default function AuditPage() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<Area>("all");
  const list = useQuery("audit", (s) => adminApi.audit(s), { refreshMs: 60_000 });
  const all = useMemo(() => list.data?.items ?? [], [list.data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((r) => {
      if (area !== "all" && !AREA_PREFIXES[area].some((p) => r.action.startsWith(p))) return false;
      if (!needle) return true;
      const hay = [r.action, actionInfo(r.action).label, r.actor.email, r.actor.display_name ?? "", ...metaEntries(r.meta).flat()].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [all, q, area]);

  const columns: Column<AuditItem>[] = [
    {
      key: "when",
      header: "When",
      className: "whitespace-nowrap",
      cell: (r) => (
        <span title={fmtDateTime(r.created_at)}>
          <span className="block text-ink">{timeAgo(r.created_at)}</span>
          <span className="text-xs text-muted">{fmtDateTime(r.created_at)}</span>
        </span>
      ),
    },
    { key: "who", header: "Admin", hideBelow: "xl", cell: (r) => <Person name={r.actor.display_name || r.actor.email} sub={r.actor.display_name ? r.actor.email : undefined} seed={r.actor.id} size={30} /> },
    {
      key: "action",
      header: "Action",
      cell: (r) => {
        const a = actionInfo(r.action);
        return (
          <span className="flex flex-col items-start gap-1">
            <Badge tone={a.tone} title={r.action}>{a.label}</Badge>
            {/* The Admin column is hidden on narrower screens, so show who did it here. */}
            <span className="max-w-[14rem] truncate text-xs text-muted xl:hidden">by {r.actor.display_name || r.actor.email}</span>
          </span>
        );
      },
    },
    { key: "details", header: "Details", hideBelow: "sm", cell: (r) => <MetaChips meta={r.meta} /> },
  ];

  const exportCsv = () =>
    downloadCsv(`aivora-audit-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["created_at", "admin_email", "action", "details"],
      ...rows.map((r) => [r.created_at, r.actor.email, r.action, JSON.stringify(r.meta ?? {})]),
    ]);

  return (
    <>
      <PageHeader
        title="Audit log"
        count={list.data ? rows.length : undefined}
        description="Every change made from this console, newest first (last 200)."
        actions={<Button variant="secondary" icon={<Download size={16} />} onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>}
      />
      {list.error ? <Callout tone="danger" className="mb-4">{list.error}</Callout> : null}
      <Card>
        <CardToolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Admin, action or detail" className="md:max-w-xs" aria-label="Search audit log" />
          <Select aria-label="Area" value={area} onChange={setArea} options={AREAS} className="md:w-60" />
        </CardToolbar>
        <DataTable
          label="Audit log"
          columns={columns}
          rows={list.data ? rows : undefined}
          loading={list.loading}
          getKey={(r) => r.id}
          resetKey={`${q}:${area}`}
          empty={<EmptyState icon={<ScrollText size={22} />} title={q || area !== "all" ? "Nothing matches" : "No activity yet"} />}
        />
      </Card>
    </>
  );
}
