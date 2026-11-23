"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, Mail, Phone } from "lucide-react";
import {
  Alert,
  Button,
  DataTable,
  FilterBar,
  FormField,
  InfoBanner,
  Modal,
  PageHeader,
  RefreshButton,
  StatusBadge,
  TextInput,
  type Column,
} from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { fetchAdminOtps, generateAdminOtp, getAdminToken, type AdminOtpItem, type AdminOtpStatus } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

type Tone = "green" | "yellow" | "red" | "gray" | "brown";

const STATUS_TONE: Record<AdminOtpStatus, Tone> = {
  Pending: "yellow",
  Used: "green",
  Failed: "red",
  Expired: "gray",
  Superseded: "gray",
};

const STATUS_HELP: Record<AdminOtpStatus, string> = {
  Pending: "Waiting for the user to enter it",
  Used: "Verified — the user signed in",
  Failed: "Too many wrong attempts",
  Expired: "Not used before it expired",
  Superseded: "Replaced by a newer code",
};

const PURPOSE_LABEL: Record<string, string> = {
  login: "Sign in",
  change_number: "Change number",
  add_email: "Add email",
  verify_email: "Verify email",
  two_step: "Two-step",
};

const SEGMENTS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Used", label: "Used" },
  { value: "Expired", label: "Expired" },
  { value: "Failed", label: "Failed" },
];

function purposeLabel(p: string) {
  return PURPOSE_LABEL[p] ?? p.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function remaining(iso: string, now: number): string {
  const s = Math.max(0, Math.round((+new Date(iso) - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function CodeCell({ code, expiresAt, now }: { code: string; expiresAt: string; now: number }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShown(true);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-[4.5rem] font-mono text-[15px] font-bold tracking-[0.18em] text-bp-ink">
        {shown ? code : "••••••"}
      </span>
      <button
        type="button"
        className="bp-icon-btn"
        title={shown ? "Hide code" : "Show code"}
        aria-label={shown ? "Hide code" : "Show code"}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
      <button type="button" className="bp-icon-btn" title="Copy code" aria-label="Copy code" onClick={() => void copy()}>
        {copied ? <Check size={15} className="text-bp-green" /> : <Copy size={15} />}
      </button>
      <span className="text-xs tabular-nums text-bp-muted">{remaining(expiresAt, now)} left</span>
    </div>
  );
}

export default function OtpsPage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [genOpen, setGenOpen] = useState(false);
  const [genPhone, setGenPhone] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ phone: string; code: string } | null>(null);

  const fetcher = useCallback(async (t: string) => (await fetchAdminOtps(t)).items, []);
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 8_000,
    errorMessage: "Could not load OTP codes — check your connection",
  });

  // Tick for the "mm:ss left" countdown on pending codes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, Pending: 0, Used: 0, Expired: 0, Failed: 0, Superseded: 0 };
    for (const o of items) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [items]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((o) => {
      // A pending code whose clock ran out is shown as Expired without waiting for the next refresh.
      if (status === "all") return true;
      return effectiveStatus(o, now) === status;
    }).filter((o) => !needle || o.phone.toLowerCase().includes(needle));
  }, [items, status, q, now]);

  async function generate() {
    const token = getAdminToken();
    if (!token) return;
    setGenBusy(true);
    setGenError(null);
    try {
      const r = await generateAdminOtp(token, genPhone.trim());
      setGenResult({ phone: r.phone, code: r.code });
      void reload();
    } catch {
      setGenError("Could not generate a code — use international format, e.g. +923001234567");
    } finally {
      setGenBusy(false);
    }
  }

  function closeGenerate() {
    setGenOpen(false);
    setGenPhone("");
    setGenError(null);
    setGenResult(null);
  }

  const columns = useMemo<Column<AdminOtpItem>[]>(
    () => [
      {
        key: "contact",
        header: "Sent to",
        cell: (o) => (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bp-green-soft text-bp-green">
              {o.channel === "email" ? <Mail size={15} /> : <Phone size={15} />}
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold text-bp-ink">{o.phone}</div>
              <div className="text-xs text-bp-muted">{purposeLabel(o.purpose)}</div>
            </div>
          </div>
        ),
      },
      {
        key: "code",
        header: "Code",
        cell: (o) =>
          effectiveStatus(o, now) === "Pending" && o.code ? (
            <CodeCell code={o.code} expiresAt={o.expires_at} now={now} />
          ) : (
            <span className="text-bp-muted" title="Codes are hidden once they can no longer be used">
              —
            </span>
          ),
      },
      {
        key: "status",
        header: "Status",
        cell: (o) => {
          const st = effectiveStatus(o, now);
          return (
            <div>
              <StatusBadge label={st} tone={STATUS_TONE[st]} />
              <div className="mt-0.5 text-xs text-bp-muted">
                {st === "Used" && o.consumed_at ? `at ${fmtDateTime(o.consumed_at)}` : STATUS_HELP[st]}
              </div>
            </div>
          );
        },
      },
      {
        key: "attempts",
        header: "Attempts",
        className: "tabular-nums",
        cell: (o) => <span className={o.attempts >= 3 ? "font-semibold text-bp-danger" : ""}>{o.attempts} / 5</span>,
      },
      { key: "created", header: "Requested", className: "whitespace-nowrap text-bp-muted", cell: (o) => fmtDateTime(o.created_at) },
    ],
    [now],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="OTP log"
        count={String(items.length)}
        description="Sign-in codes requested by users. Until SMS and email delivery are switched on, send each pending code to the user yourself."
        actions={
          <>
            <RefreshButton onClick={() => void reload()} />
            <Button onClick={() => setGenOpen(true)}>Generate code</Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["Pending", "Used", "Expired", "Failed"] as AdminOtpStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus((cur) => (cur === s ? "all" : s))}
            className={`bp-card p-4 text-left transition-shadow hover:shadow-md ${status === s ? "ring-2 ring-bp-green" : ""}`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-bp-muted">{s}</div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-bp-ink">{counts[s] ?? 0}</div>
            <div className="mt-0.5 text-xs text-bp-muted">{STATUS_HELP[s]}</div>
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>

      <FilterBar
        search={{ value: q, onChange: setQ, onSubmit: () => {}, placeholder: "Search phone or email" }}
        segments={{ value: status, options: SEGMENTS, onChange: setStatus }}
      />

      <DataTable
        columns={columns}
        rows={rows}
        getKey={(o) => o.id}
        loading={loading}
        empty={status === "all" && !q ? "No OTP requests yet. Request one from the Android app." : "No codes match this filter."}
      />

      <Modal
        open={genOpen}
        title="Generate sign-in code"
        description="Creates a one-time code for a phone number and shows it once."
        onClose={closeGenerate}
        footer={
          genResult ? (
            <Button onClick={closeGenerate}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeGenerate}>
                Cancel
              </Button>
              <Button disabled={genBusy || !/^\+\d{7,15}$/.test(genPhone.trim())} onClick={() => void generate()}>
                {genBusy ? "Generating…" : "Generate"}
              </Button>
            </>
          )
        }
      >
        {genResult ? (
          <div className="text-center">
            <p className="text-sm text-bp-muted">Code for {genResult.phone}</p>
            <p className="my-3 font-mono text-4xl font-extrabold tracking-[0.3em] text-bp-ink">{genResult.code}</p>
            <Button
              variant="secondary"
              onClick={() => void navigator.clipboard.writeText(genResult.code).catch(() => undefined)}
            >
              <Copy size={14} className="mr-1.5" /> Copy code
            </Button>
            <p className="mt-3 text-xs text-bp-muted">Valid for 5 minutes. It is also listed above while pending.</p>
          </div>
        ) : (
          <>
            {genError ? <InfoBanner tone="warn">{genError}</InfoBanner> : null}
            <FormField label="Phone number" hint="International format with country code.">
              <TextInput
                autoFocus
                inputMode="tel"
                placeholder="+923001234567"
                value={genPhone}
                onChange={(e) => setGenPhone(e.target.value)}
              />
            </FormField>
          </>
        )}
      </Modal>
    </div>
  );
}

function effectiveStatus(o: AdminOtpItem, now: number): AdminOtpStatus {
  if (o.status === "Pending" && +new Date(o.expires_at) < now) return "Expired";
  return o.status;
}
