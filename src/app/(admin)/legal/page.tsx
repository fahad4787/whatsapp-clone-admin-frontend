"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminLegal, putAdminLegal } from "@/lib/api";

export default function LegalPage() {
  const [privacy, setPrivacy] = useState("");
  const [terms, setTerms] = useState("");
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
      const data = await fetchAdminLegal(token);
      setPrivacy(data.privacy_policy);
      setTerms(data.terms_of_service);
    } catch {
      setError("Could not load legal documents");
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
      const data = await putAdminLegal(token, {
        privacy_policy: privacy,
        terms_of_service: terms,
      });
      setPrivacy(data.privacy_policy);
      setTerms(data.terms_of_service);
      setToast("Legal documents saved");
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
        title="Legal"
        description="Copy shown in the Android Help → Terms / Privacy screens."
        actions={
          <Button onClick={() => void save()} disabled={saving || loading}>
            {saving ? "Saving…" : "Save documents"}
          </Button>
        }
      />
      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm">
          {error}
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-bp-muted">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bp-card p-4">
            <h2 className="mb-2 font-semibold">Privacy policy</h2>
            <textarea
              className="bp-input min-h-48"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
            />
          </div>
          <div className="bp-card p-4">
            <h2 className="mb-2 font-semibold">Terms of service</h2>
            <textarea
              className="bp-input min-h-48"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
