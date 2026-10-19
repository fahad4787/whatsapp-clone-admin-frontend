"use client";

import { useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { useMockStore } from "@/data";

export default function FirewallPage() {
  const store = useMockStore();
  const [allowlist, setAllowlist] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function save() {
    const lines = allowlist
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    store.pushAudit("Updated IP allowlist", lines.length ? lines.join(", ") : "empty (allow all)");
    setToast(lines.length ? `Saved ${lines.length} CIDR entries` : "Allowlist cleared — all IPs allowed");
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="bp-page">
      <PageHeader title="IP access" description="Restrict admin sign-in to allowlisted networks." />
      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium">
          {toast}
        </div>
      ) : null}
      <div className="bp-card p-5">
        <p className="mb-4 text-sm text-bp-muted">Leave empty to allow all IPs.</p>
        <label className="block text-sm font-semibold">
          Allowlist (CIDR, one per line)
          <textarea
            className="bp-input mt-1.5 min-h-32 font-mono text-sm"
            placeholder={"203.0.113.0/24\n198.51.100.10/32"}
            value={allowlist}
            onChange={(e) => setAllowlist(e.target.value)}
          />
        </label>
        <Button className="mt-4" onClick={save}>
          Save allowlist
        </Button>
      </div>
    </div>
  );
}
