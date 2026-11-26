"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, Phone, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Callout,
  Card,
  CardToolbar,
  CopyButton,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  StatCard,
  type Column,
} from "@/components/ui";
import { PHONE_RE } from "@/config/constants";
import { useAction } from "@/hooks/useAction";
import { useNow } from "@/hooks/useNow";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type OtpItem, type OtpStatus } from "@/lib/api";
import { fmtDateTime, timeAgo } from "@/lib/format";
import { OTP_STATUS, otpEffectiveStatus, otpPurpose } from "@/lib/status";

type Filter = "all" | Exclude<OtpStatus, "Superseded">;
const CARDS: Exclude<Filter, "all">[] = ["Pending", "Used", "Expired", "Failed"];

function remaining(iso: string, now: number) {
  const s = Math.max(0, Math.round((+new Date(iso) - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function CodeCell({ code, expiresAt, now }: { code: string; expiresAt: string; now: number }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span className="min-w-[5.5rem] font-mono text-[15px] font-semibold tracking-[0.2em] text-ink">{shown ? code : "•".repeat(code.length)}</span>
      <IconButton size="sm" label={shown ? "Hide code" : "Show code"} onClick={(e) => (e.stopPropagation(), setShown((v) => !v))}>
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
      </IconButton>
      <CopyButton value={code} label="Copy code" />
      <span className="ml-1 text-xs tabular-nums text-muted">{remaining(expiresAt, now)} left</span>
    </div>
  );
}

function GenerateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { run, isPending } = useAction();
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<{ phone: string; code: string } | null>(null);
  const error = PHONE_RE.test(phone.trim()) ? null : "Use international format with country code, e.g. +923001234567.";

  const close = () => {
    setPhone("");
    setTouched(false);
    setResult(null);
    onClose();
  };
  const submit = async () => {
    setTouched(true);
    if (error) return;
    const r = await run("gen", () => adminApi.otps.generate(phone.trim()), { errorTitle: "Couldn't generate a code" });
    if (r) {
      setResult({ phone: r.phone, code: r.code });
      onCreated();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title="Generate sign-in code"
      description={result ? undefined : "Creates a one-time code for a phone number so you can pass it on yourself."}
      onSubmit={result ? close : submit}
      footer={
        result ? (
          <Button type="submit">Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" loading={isPending("gen")}>Generate</Button>
          </>
        )
      }
    >
      {result ? (
        <div className="py-2 text-center">
          <p className="text-[13px] text-muted">Code for {result.phone}</p>
          <div className="my-3 flex items-center justify-center gap-2">
            <span className="font-mono text-4xl font-bold tracking-[0.3em] text-ink">{result.code}</span>
            <CopyButton value={result.code} label="Copy code" size="md" />
          </div>
          <p className="text-xs text-muted">It stays in the list below while it can still be used.</p>
        </div>
      ) : (
        <Field label="Phone number" required error={touched ? error : null} hint="International format with country code.">
          {(a) => <Input {...a} inputMode="tel" autoComplete="off" placeholder="+923001234567" value={phone} invalid={touched && !!error} onChange={(e) => setPhone(e.target.value.replace(/[\s()-]/g, ""))} />}
        </Field>
      )}
    </Modal>
  );
}

export default function OtpsPage() {
  const now = useNow(1000);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const list = useQuery("otps", (s) => adminApi.otps.list(s), { refreshMs: 8_000 });
  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  const withStatus = useMemo(() => items.map((o) => ({ o, st: otpEffectiveStatus(o, now) })), [items, now]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const { st } of withStatus) c[st] = (c[st] ?? 0) + 1;
    return c;
  }, [withStatus]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return withStatus.filter(({ o, st }) => (filter === "all" || st === filter) && (!needle || o.phone.toLowerCase().includes(needle)));
  }, [withStatus, filter, q]);

  const columns: Column<{ o: OtpItem; st: OtpStatus }>[] = [
    {
      key: "to",
      header: "Sent to",
      cell: ({ o }) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{o.channel === "email" ? <Mail size={16} /> : <Phone size={16} />}</span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink">{o.phone}</div>
            <div className="text-xs text-muted">{otpPurpose(o.purpose)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code",
      cell: ({ o, st }) =>
        st === "Pending" && o.code ? (
          <CodeCell code={o.code} expiresAt={o.expires_at} now={now} />
        ) : (
          <span className="text-subtle" title="Codes are hidden once they can no longer be used">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: ({ o, st }) => (
        <div>
          <Badge tone={OTP_STATUS[st].tone}>{st}</Badge>
          <div className="mt-1 text-xs text-muted">{st === "Used" && o.consumed_at ? `Verified ${timeAgo(o.consumed_at, now)}` : OTP_STATUS[st].help}</div>
        </div>
      ),
    },
    {
      key: "attempts",
      header: "Wrong tries",
      align: "right",
      hideBelow: "md",
      className: "tabular-nums",
      cell: ({ o }) => <span className={o.attempts > 0 ? "font-semibold text-danger" : "text-muted"}>{o.attempts}</span>,
    },
    { key: "created", header: "Requested", hideBelow: "sm", className: "whitespace-nowrap text-muted", cell: ({ o }) => <span title={fmtDateTime(o.created_at)}>{timeAgo(o.created_at, now)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="OTP log"
        count={list.data ? items.length : undefined}
        description="Sign-in codes from the last 100 requests. While SMS delivery is off, pass pending codes on to users yourself."
        actions={<Button icon={<Plus size={16} />} onClick={() => setGenOpen(true)}>Generate code</Button>}
      />

      {list.error ? <Callout tone="danger" className="mb-4">{list.error}</Callout> : null}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map((s) => (
          <StatCard
            key={s}
            label={s}
            value={counts[s] ?? 0}
            loading={list.loading}
            hint={OTP_STATUS[s].help}
            active={filter === s}
            onClick={() => setFilter((cur) => (cur === s ? "all" : s))}
            accent={s === "Failed" ? "danger" : s === "Pending" ? "warning" : s === "Expired" ? "info" : "brand"}
          />
        ))}
      </div>

      <Card>
        <CardToolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Search phone or email" className="md:max-w-xs" aria-label="Search codes" />
          <Segmented
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[{ value: "all", label: "All", count: items.length }, ...CARDS.map((s) => ({ value: s, label: s, count: counts[s] ?? 0 }))]}
          />
        </CardToolbar>
        <DataTable
          label="OTP codes"
          columns={columns}
          rows={list.data ? rows : undefined}
          loading={list.loading}
          getKey={({ o }) => o.id}
          resetKey={`${filter}:${q}`}
          empty={
            <EmptyState
              icon={<KeyRound size={22} />}
              title={filter === "all" && !q ? "No codes yet" : "No codes match"}
              description={filter === "all" && !q ? "Codes appear here when someone signs in on the app." : "Try another filter or search."}
            />
          }
        />
      </Card>

      <GenerateModal open={genOpen} onClose={() => setGenOpen(false)} onCreated={() => void list.reload()} />
    </>
  );
}
