"use client";

import { useMemo } from "react";
import { KeyRound, MessageSquareText, ShieldAlert } from "lucide-react";
import { Callout, Card, CardBody, CardHeader, NumberField, PageHeader, SaveBar, Skeleton, SwitchRow } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useDraft } from "@/hooks/useDraft";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type AppSettings } from "@/lib/api";
import { fmtDuration } from "@/lib/format";
import { intError } from "@/lib/validate";

/**
 * Only the settings the backend or app actually act on are shown here.
 * Android release fields live on their own page.
 */
type Form = {
  otp_expiry: string;
  otp_gap: string;
  sms_enabled: boolean;
  maintenance_mode: boolean;
};

const BOUNDS = { otp_expiry: [60, 1800], otp_gap: [10, 600] } as const;

const toForm = (s: AppSettings): Form => ({
  otp_expiry: String(s.otp_expiry),
  otp_gap: String(s.otp_gap),
  sms_enabled: s.sms_enabled,
  maintenance_mode: s.maintenance_mode,
});

const seconds = (raw: string) => (/^\d+$/.test(raw.trim()) ? fmtDuration(Number(raw)) : null);

export default function SettingsPage() {
  const q = useQuery("settings", (s) => adminApi.settings.get(s));
  const base = useMemo(() => (q.data ? toForm(q.data.settings) : null), [q.data]);
  const { draft, set, reset, dirty } = useDraft(base);
  const { run, isPending } = useAction();
  const defaults = q.data?.defaults;

  const errors = draft
    ? {
        otp_expiry: intError(draft.otp_expiry, ...BOUNDS.otp_expiry),
        otp_gap: intError(draft.otp_gap, ...BOUNDS.otp_gap),
      }
    : { otp_expiry: null, otp_gap: null };
  const firstError = errors.otp_expiry ? `Code lifetime: ${errors.otp_expiry}` : errors.otp_gap ? `Resend wait: ${errors.otp_gap}` : null;

  const save = async () => {
    if (!draft || firstError) return;
    const patch: Partial<AppSettings> = {};
    for (const k of dirty) {
      const v = draft[k];
      Object.assign(patch, { [k]: typeof v === "string" ? Number(v) : v });
    }
    const res = await run("save", () => adminApi.settings.update(patch), { success: "Settings saved", errorTitle: "Couldn't save settings" });
    if (res) q.setData((d) => (d ? { ...d, settings: res.settings } : d));
  };

  const hint = (text: string, key: keyof typeof BOUNDS, extra?: string | null) => (
    <>
      {text}
      {extra ? <> · <span className="font-medium text-ink-soft">{extra}</span></> : null}
      {defaults ? <> · Default {String(defaults[key])}</> : null}
    </>
  );

  return (
    <>
      <PageHeader title="Settings" description="Changes apply right away, with no app update needed." />
      {q.error ? <Callout tone="danger" className="mb-4">{q.error}</Callout> : null}

      {!draft ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader icon={<KeyRound size={18} />} title="Sign-in codes" description="One-time codes sent when someone signs in or verifies a number or email." />
            <CardBody className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Code lifetime"
                  unit="sec"
                  min={BOUNDS.otp_expiry[0]}
                  max={BOUNDS.otp_expiry[1]}
                  value={draft.otp_expiry}
                  onChange={(v) => set("otp_expiry", v)}
                  error={errors.otp_expiry}
                  hint={hint("60 to 1800", "otp_expiry", seconds(draft.otp_expiry))}
                />
                <NumberField
                  label="Wait before resending"
                  unit="sec"
                  min={BOUNDS.otp_gap[0]}
                  max={BOUNDS.otp_gap[1]}
                  value={draft.otp_gap}
                  onChange={(v) => set("otp_gap", v)}
                  error={errors.otp_gap}
                  hint={hint("10 to 600", "otp_gap", seconds(draft.otp_gap))}
                />
              </div>
              <div className="border-t border-line pt-4">
                <SwitchRow
                  label="Send codes by SMS"
                  description="Needs Twilio set up on the server. When off, or not set up, codes only appear on the OTP page."
                  checked={draft.sms_enabled}
                  onChange={(v) => set("sms_enabled", v)}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<ShieldAlert size={18} />} title="Access" description="Control who can get into the app." />
            <CardBody className="space-y-4">
              <SwitchRow
                label="Maintenance mode"
                description="Stops new sign-ins: requests for a sign-in code are refused. People already signed in keep using the app."
                checked={draft.maintenance_mode}
                onChange={(v) => set("maintenance_mode", v)}
              />
              {draft.maintenance_mode ? (
                <Callout tone="warning" title={base?.maintenance_mode ? "Maintenance mode is on" : "Maintenance mode turns on when you save"}>
                  Nobody can sign in or sign up until you turn it off.
                </Callout>
              ) : null}
              <div className="flex items-start gap-3 rounded-xl bg-surface-muted px-4 py-3 text-[13px] text-muted">
                <MessageSquareText size={16} className="mt-0.5 shrink-0 text-subtle" />
                <span>Which countries can sign in is set on the Countries page. App version rules are on the Android page.</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <SaveBar count={dirty.length} saving={isPending("save")} blockedReason={firstError} onSave={() => void save()} onReset={reset} />
    </>
  );
}
