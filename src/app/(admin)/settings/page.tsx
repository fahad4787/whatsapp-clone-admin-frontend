"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, FormSection, PageHeader } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { renderSettingsField, settingsSections } from "@/features/settings";
import { fetchAdminSettings, putAdminSettings } from "@/lib/api";
import { settingsFromApi, settingsToApi } from "@/lib/settingsMap";
import type { SettingsMap } from "@/types/models";

export default function SettingsPage() {
  const [draft, setDraft] = useState<SettingsMap | null>(null);
  const [baseline, setBaseline] = useState<SettingsMap | null>(null);
  const [dirty, setDirty] = useState(false);
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
      const data = await fetchAdminSettings(token);
      const mapped = settingsFromApi(data.settings);
      setDraft(mapped);
      setBaseline(mapped);
      setDirty(false);
    } catch {
      setError("Could not load settings from API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const data = await putAdminSettings(token, settingsToApi(draft));
      const mapped = settingsFromApi(data.settings);
      setDraft(mapped);
      setBaseline(mapped);
      setDirty(false);
      setToast("Settings saved");
      window.setTimeout(() => setToast(null), 1800);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (!baseline) return;
    setDraft(baseline);
    setDirty(false);
  }

  return (
    <div className="bp-page pb-24">
      <PageHeader title="Settings" description="OTP, calls, media, Android, and privacy controls." />
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
      {loading || !draft ? (
        <p className="text-sm text-bp-muted">Loading…</p>
      ) : (
        settingsSections.map((section) => (
          <FormSection key={section.title} title={section.title}>
            {section.fields.map((field) =>
              renderSettingsField(field, draft, (key, value) => {
                setDraft((d) => (d ? { ...d, [key]: value } : d));
                setDirty(true);
              }),
            )}
          </FormSection>
        ))
      )}
      <div className="bp-sticky-footer">
        <span className="text-sm text-bp-muted">{dirty ? "Unsaved changes" : "No changes yet"}</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!dirty || saving} onClick={cancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
