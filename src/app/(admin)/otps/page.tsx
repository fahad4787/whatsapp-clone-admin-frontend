"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert, DataTable, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { fetchAdminOtps, generateAdminOtp, getAdminToken, type AdminOtpItem } from "@/lib/api";
import { fmtDateTime, fmtTime } from "@/lib/format";

type Tone = "green" | "yellow" | "red" | "gray";
const STATUS_TONE: Record<string, Tone> = { Used: "green", Pending: "yellow", Failed: "red" };

export default function OtpsPage() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const fetcher = useCallback(async (t: string) => (await fetchAdminOtps(t)).items, []);
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 12_000,
    errorMessage: "Could not load OTP codes — check your connection",
  });

  async function generate() {
    const phone = window.prompt("Phone in international format, e.g. +923001234567");
    const token = getAdminToken();
    if (!phone || !token) return;
    try {
      const r = await generateAdminOtp(token, phone.trim());
      setActionError(null);
      window.alert(`Code for ${r.phone}: ${r.code}`);
      void reload();
    } catch {
      setActionError("Could not generate code — check the phone number (+countrycode…)");
    }
  }

  const columns = useMemo<Column<AdminOtpItem>[]>(
    () => [
      { key: "created", header: "Requested", className: "whitespace-nowrap", cell: (o) => fmtDateTime(o.created_at) },
      { key: "phone", header: "Phone", className: "text-bp-green", cell: (o) => o.phone },
      {
        key: "code",
        header: "Code",
        className: "font-mono text-sm",
        cell: (o) =>
          o.code ? (
            <button
              type="button"
              className="text-left font-mono"
              title="Click to reveal / hide"
              onClick={() => setRevealed((r) => ({ ...r, [o.id]: !r[o.id] }))}
            >
              {revealed[o.id] ? o.code : "••••••"}
            </button>
          ) : (
            <span className="text-bp-muted">—</span>
          ),
      },
      { key: "status", header: "Status", cell: (o) => <StatusBadge label={o.status} tone={STATUS_TONE[o.status] ?? "gray"} /> },
      { key: "attempts", header: "Attempts", cell: (o) => o.attempts },
      { key: "expires", header: "Expires", className: "whitespace-nowrap text-bp-muted", cell: (o) => fmtTime(o.expires_at) },
    ],
    [revealed],
  );

  return (
    <div className="bp-page">
      <PageHeader
        title="OTP log"
        description="Dev codes from the shared API. Copy a code into the Android app to sign in."
        actions={
          <div className="flex gap-2">
            <RefreshButton onClick={() => void reload()} />
            <button type="button" className="bp-btn bp-btn-primary" onClick={() => void generate()}>
              Generate code
            </button>
          </div>
        }
      />
      <Alert>{actionError ?? error}</Alert>
      <DataTable
        columns={columns}
        rows={items}
        getKey={(o) => o.id}
        loading={loading}
        empty="No OTP requests yet. Request one from the Android app."
      />
    </div>
  );
}
