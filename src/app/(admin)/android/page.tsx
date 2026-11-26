"use client";

import { useMemo } from "react";
import { ExternalLink, Package, ShieldCheck } from "lucide-react";
import { Callout, Card, CardBody, CardHeader, Field, Input, NumberField, PageHeader, SaveBar, Skeleton } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useDraft } from "@/hooks/useDraft";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type AppSettings } from "@/lib/api";
import { intError, isHttpUrl } from "@/lib/validate";

type Form = {
  latest_android_version: string;
  latest_android_version_code: string;
  min_android_version_code: string;
  download_url: string;
};

const toForm = (s: AppSettings): Form => ({
  latest_android_version: s.latest_android_version,
  latest_android_version_code: String(s.latest_android_version_code),
  min_android_version_code: String(s.min_android_version_code),
  download_url: s.download_url,
});

function validate(f: Form) {
  const name = f.latest_android_version.trim();
  const url = f.download_url.trim();
  const latest = intError(f.latest_android_version_code, 1);
  let min = intError(f.min_android_version_code, 1);
  if (!latest && !min && Number(f.min_android_version_code) > Number(f.latest_android_version_code)) {
    min = "Can't be higher than the latest version code.";
  }
  return {
    latest_android_version: !name ? "Required." : name.length > 40 ? "Up to 40 characters." : null,
    latest_android_version_code: latest,
    min_android_version_code: min,
    download_url: !url ? "Required." : url.length > 500 ? "Up to 500 characters." : !isHttpUrl(url) ? "Enter a full link starting with https://" : null,
  };
}

const LABELS: Record<keyof Form, string> = {
  latest_android_version: "Version name",
  latest_android_version_code: "Version code",
  min_android_version_code: "Minimum version code",
  download_url: "Download link",
};

export default function AndroidPage() {
  const q = useQuery("settings", (s) => adminApi.settings.get(s));
  const base = useMemo(() => (q.data ? toForm(q.data.settings) : null), [q.data]);
  const { draft, set, reset, dirty } = useDraft(base);
  const { run, isPending } = useAction();

  const errors = draft ? validate(draft) : null;
  const firstErrorKey = errors ? (Object.keys(errors) as (keyof Form)[]).find((k) => errors[k]) : undefined;
  const blocked = firstErrorKey && errors ? `${LABELS[firstErrorKey]}: ${errors[firstErrorKey]}` : null;
  const raisesMin = !!base && !!draft && !errors?.min_android_version_code && Number(draft.min_android_version_code) > Number(base.min_android_version_code);

  const save = async () => {
    if (!draft || blocked) return;
    const patch: Partial<AppSettings> = {};
    for (const k of dirty) {
      Object.assign(patch, { [k]: k === "latest_android_version" || k === "download_url" ? draft[k].trim() : Number(draft[k]) });
    }
    const res = await run("save", () => adminApi.settings.update(patch), { success: "Release info saved", errorTitle: "Couldn't save" });
    if (res) q.setData((d) => (d ? { ...d, settings: res.settings } : d));
  };

  const url = draft?.download_url.trim() ?? "";

  return (
    <>
      <PageHeader title="Android app" description="Release details the app checks when it opens the sign-in screen." />
      {q.error ? <Callout tone="danger" className="mb-4">{q.error}</Callout> : null}

      {!draft || !errors ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader icon={<Package size={18} />} title="Latest release" description="The newest build you've published. For your records." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Version name" hint="Like 1.2.0" error={errors.latest_android_version}>
                {(a) => <Input {...a} value={draft.latest_android_version} maxLength={40} onChange={(e) => set("latest_android_version", e.target.value)} />}
              </Field>
              <NumberField
                label="Version code"
                hint="versionCode from the build"
                min={1}
                value={draft.latest_android_version_code}
                onChange={(v) => set("latest_android_version_code", v)}
                error={errors.latest_android_version_code}
              />
              <Field
                label="Download link"
                className="sm:col-span-2"
                hint="Where people get the APK. Opened from the update prompt."
                error={errors.download_url}
              >
                {(a) => (
                  <Input
                    {...a}
                    type="url"
                    value={draft.download_url}
                    maxLength={500}
                    placeholder="https://"
                    onChange={(e) => set("download_url", e.target.value)}
                    trailing={
                      isHttpUrl(url) ? (
                        <a href={url} target="_blank" rel="noreferrer" className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-brand-soft hover:text-brand-strong" aria-label="Open download link" title="Open link">
                          <ExternalLink size={15} />
                        </a>
                      ) : undefined
                    }
                  />
                )}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<ShieldCheck size={18} />} title="Required update" description="Builds older than this must update before they can sign in." />
            <CardBody className="space-y-4">
              <NumberField
                label="Minimum version code"
                hint={`Builds with a lower versionCode see an update prompt with the download link. Latest is ${draft.latest_android_version_code || "—"}.`}
                min={1}
                value={draft.min_android_version_code}
                onChange={(v) => set("min_android_version_code", v)}
                error={errors.min_android_version_code}
              />
              {raisesMin ? (
                <Callout tone="warning" title="This forces an update">
                  People on version code {Number(draft.min_android_version_code) - 1} or lower will have to install the new build before signing in.
                </Callout>
              ) : null}
              <p className="text-[13px] leading-relaxed text-muted">
                The check runs on the sign-in screen. People who are already signed in are not interrupted.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      <SaveBar count={dirty.length} saving={isPending("save")} blockedReason={blocked} onSave={() => void save()} onReset={reset} />
    </>
  );
}
