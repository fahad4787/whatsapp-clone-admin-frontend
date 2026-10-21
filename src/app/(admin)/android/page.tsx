"use client";

import { useState } from "react";
import { Button, PageHeader, TextInput } from "@/components/ui";
import { AivoraLogo } from "@/components/brand";
import { useMockStore } from "@/data";

export default function AndroidPage() {
  const store = useMockStore();
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  function publish() {
    const nextVersion = version.trim() || store.settings.latestAndroidVersion;
    const nextCode = store.settings.latestAndroidVersionCode + 1;
    store.setSettings({
      ...store.settings,
      latestAndroidVersion: nextVersion,
      latestAndroidVersionCode: nextCode,
    });
    store.pushAudit("Published Android build", `${nextVersion} · ${notes || "no notes"}`);
    setToast(`Published ${nextVersion} (code ${nextCode})`);
    setVersion("");
    setNotes("");
    window.setTimeout(() => setToast(null), 2000);
  }

  function flashFile() {
    setToast("Mock browse — pick an APK in the real build");
    window.setTimeout(() => setToast(null), 1600);
  }

  const s = store.settings;

  return (
    <div className="bp-page">
      <PageHeader title="Android app" description="Publish builds and QR install links for phones." />
      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium">
          {toast}
        </div>
      ) : null}
      <div className="bp-card p-5">
        <div className="mb-5 flex items-center gap-3">
          <AivoraLogo size={48} />
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-bp-ink">Aivora</div>
            <div className="text-xs font-medium text-bp-muted">Android · Dev build</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Version (optional)
            <TextInput className="mt-1.5" placeholder="from APK" value={version} onChange={(e) => setVersion(e.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            Notes (optional)
            <TextInput className="mt-1.5" placeholder="What changed" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => flashFile()}>
            Browse…
          </Button>
          <Button onClick={publish}>Upload APK</Button>
        </div>
        <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-bp-muted">Latest version</dt>
            <dd className="font-semibold">{s.latestAndroidVersion}</dd>
          </div>
          <div>
            <dt className="text-bp-muted">Version code</dt>
            <dd className="font-semibold">{s.latestAndroidVersionCode}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-bp-muted">Download URL</dt>
            <dd className="font-semibold text-bp-green">{s.downloadUrl}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
