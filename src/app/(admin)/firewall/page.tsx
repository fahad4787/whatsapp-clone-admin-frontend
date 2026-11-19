"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminFirewall, putAdminFirewall } from "@/lib/api";

export default function FirewallPage() {
  const [allowlist, setAllowlist] = useState("");
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again");
        return;
      }
      const data = await fetchAdminFirewall(token);
      setAllowlist(data.allowlist.join("\n"));
      setClientIp(data.client_ip);
    } catch {
      setError("Could not load firewall settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const lines = allowlist
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const data = await putAdminFirewall(token, lines);
      setAllowlist(data.allowlist.join("\n"));
      setClientIp(data.client_ip);
      setToast(
        data.allowlist.length
          ? `Saved ${data.allowlist.length} CIDR entries`
          : "Allowlist cleared — all IPs allowed",
      );
      window.setTimeout(() => setToast(null), 1800);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="IP access"
        description="Restrict admin sign-in to allowlisted networks."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="bp-card p-5">
        <p className="mb-2 text-sm text-bp-muted">
          Leave empty to allow all IPs. Your current IP:{" "}
          <span className="font-mono font-semibold text-bp-ink">
            {loading ? "…" : clientIp ?? "unknown"}
          </span>
        </p>
        <p className="mb-4 text-sm text-bp-muted">
          Tip: add your IP before tightening the list or you may lock yourself out.
        </p>
        <label className="block text-sm font-semibold">
          Allowlist (CIDR, one per line)
          <textarea
            className="bp-input mt-1.5 min-h-32 font-mono text-sm"
            placeholder={"203.0.113.0/24\n198.51.100.10/32"}
            value={allowlist}
            disabled={loading}
            onChange={(e) => setAllowlist(e.target.value)}
          />
        </label>
        <Button className="mt-4" onClick={() => void save()} disabled={saving || loading}>
          {saving ? "Saving…" : "Save allowlist"}
        </Button>
      </div>
    </div>
  );
}
