"use client";

import { useEffect, useState } from "react";
import { Button, FormSection, PageHeader } from "@/components/ui";
import { useMockStore } from "@/data";
import { renderSettingsField, settingsSections } from "@/features/settings";
import type { SettingsMap } from "@/types/models";

export default function SettingsPage() {
  const store = useMockStore();
  const [draft, setDraft] = useState<SettingsMap>(store.settings);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setDraft(store.settings);
    setDirty(false);
  }, [store.settings]);

  function save() {
    store.setSettings(draft);
    store.pushAudit("Updated settings", "Admin settings saved");
    setDirty(false);
    setToast("Settings saved");
    window.setTimeout(() => setToast(null), 1800);
  }

  function cancel() {
    setDraft(store.settings);
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
      {settingsSections.map((section) => (
        <FormSection key={section.title} title={section.title}>
          {section.fields.map((field) =>
            renderSettingsField(field, draft, (key, value) => {
              setDraft((d) => ({ ...d, [key]: value }));
              setDirty(true);
            }),
          )}
        </FormSection>
      ))}
      <div className="bp-sticky-footer">
        <span className="text-sm text-bp-muted">{dirty ? "Unsaved changes" : "No changes yet"}</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!dirty} onClick={cancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!dirty} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
