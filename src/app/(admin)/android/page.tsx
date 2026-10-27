"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, PageHeader, TextInput } from "@/components/ui";
import { AivoraLogo } from "@/components/brand";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminSettings, putAdminSettings } from "@/lib/api";

export default function AndroidPage() {
  const [version, setVersion] = useState("");
  const [minCode, setMinCode] = useState("");
  const [notes, setNotes] = useState("");
  const [latestVersion, setLatestVersion] = useState("—");
  const [latestCode, setLatestCode] = useState(0);
  const [minVersionCode, setMinVersionCode] = useState(1);
  const [downloadUrl, setDownloadUrl] = useState("—");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again");
        return;
      }
      const data = await fetchAdminSettings(token);
      const s = data.settings;
      setLatestVersion(s.latest_android_version);
      setLatestCode(s.latest_android_version_code);
      setMinVersionCode(s.min_android_version_code);
      setDownloadUrl(s.download_url);
    } catch {
      setError("Could not load Android settings");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish() {
    const token = localStorage.getItem(STORAGE_KEYS.adminToken);
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const nextVersion = version.trim() || latestVersion;
      const nextCode = latestCode + 1;
      const nextMin = minCode.trim() ? Number(minCode) : minVersionCode;
      const data = await putAdminSettings(token, {
        latest_android_version: nextVersion,
        latest_android_version_code: nextCode,
        min_android_version_code: Number.isFinite(nextMin) && nextMin >= 1 ? nextMin : minVersionCode,
      });
      setLatestVersion(data.settings.latest_android_version);
      setLatestCode(data.settings.latest_android_version_code);
      setMinVersionCode(data.settings.min_android_version_code);
      setDownloadUrl(data.settings.download_url);
      setToast(
        `Published ${data.settings.latest_android_version} (code ${data.settings.latest_android_version_code})${
          notes.trim() ? ` · ${notes.trim()}` : ""
        }`,
      );
      setVersion("");
      setMinCode("");
      setNotes("");
      window.setTimeout(() => setToast(null), 2200);
    } catch {
      setError("Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader title="Android app" description="Version gates and download URL for phones." />
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
        <div className="mb-5 flex items-center gap-3">
          <AivoraLogo size={48} />
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-bp-ink">Aivora</div>
            <div className="text-xs font-medium text-bp-muted">Android · live settings</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Version (optional)
            <TextInput
              className="mt-1.5"
              placeholder="e.g. 1.13.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold">
            Min versionCode (optional)
            <TextInput
              className="mt-1.5"
              placeholder={String(minVersionCode)}
              value={minCode}
              onChange={(e) => setMinCode(e.target.value)}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Notes (optional)
            <TextInput
              className="mt-1.5"
              placeholder="What changed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void publish()}>
            {busy ? "Saving…" : "Bump version"}
          </Button>
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
        <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-bp-muted">Latest version</dt>
            <dd className="font-semibold">{latestVersion}</dd>
          </div>
          <div>
            <dt className="text-bp-muted">Version code</dt>
            <dd className="font-semibold">{latestCode}</dd>
          </div>
          <div>
            <dt className="text-bp-muted">Min version code</dt>
            <dd className="font-semibold">{minVersionCode}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-bp-muted">Download URL</dt>
            <dd className="font-semibold text-bp-green break-all">{downloadUrl}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
