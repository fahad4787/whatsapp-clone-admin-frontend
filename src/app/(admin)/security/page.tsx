"use client";

import { useMemo } from "react";
import { Clock, Fingerprint, LockKeyhole } from "lucide-react";
import { Callout, ErrorCallout, Card, CardBody, CardHeader, NumberField, PageHeader, SaveBar, Skeleton, SwitchRow } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useDraft } from "@/hooks/useDraft";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type SecuritySettings } from "@/lib/api";
import { intError } from "@/lib/validate";

type Form = {
  require_2fa: boolean;
  lock_after_fail: boolean;
  session_hours: string;
  max_fail_attempts: string;
  lock_minutes: string;
};

const BOUNDS = { session_hours: [1, 168], max_fail_attempts: [3, 20], lock_minutes: [1, 1440] } as const;
const LABELS = { session_hours: "Session length", max_fail_attempts: "Failed attempts", lock_minutes: "Lock duration" } as const;
type NumKey = keyof typeof BOUNDS;
const NUM_KEYS = Object.keys(BOUNDS) as NumKey[];

const toForm = (s: SecuritySettings): Form => ({
  require_2fa: s.require_2fa,
  lock_after_fail: s.lock_after_fail,
  session_hours: String(s.session_hours),
  max_fail_attempts: String(s.max_fail_attempts),
  lock_minutes: String(s.lock_minutes),
});

export default function SecurityPage() {
  const q = useQuery("security", (s) => adminApi.security.get(s));
  const base = useMemo(() => (q.data ? toForm(q.data) : null), [q.data]);
  const { draft, set, reset, dirty } = useDraft(base);
  const { run, isPending } = useAction();

  const errors = Object.fromEntries(NUM_KEYS.map((k) => [k, draft ? intError(draft[k], BOUNDS[k][0], BOUNDS[k][1]) : null])) as Record<NumKey, string | null>;
  // Lockout fields are ignored (and not sent) while lockout is off.
  const active = (k: NumKey) => k === "session_hours" || !!draft?.lock_after_fail;
  const badKey = NUM_KEYS.find((k) => active(k) && errors[k]);
  const blocked = badKey ? `${LABELS[badKey]}: ${errors[badKey]}` : null;

  const save = async () => {
    if (!draft || blocked) return;
    const patch: Partial<SecuritySettings> = {};
    for (const k of dirty) {
      if (k === "require_2fa" || k === "lock_after_fail") patch[k] = draft[k];
      else if (active(k)) patch[k] = Number(draft[k]);
    }
    const res = await run("save", () => adminApi.security.update(patch), { success: "Security settings saved", errorTitle: "Couldn't save" });
    if (res) q.setData(res);
  };

  return (
    <>
      <PageHeader title="Admin security" description="How admins sign in to this console. Doesn't affect app users." />
      {q.error ? <ErrorCallout error={q.error} onRetry={q.reload} retrying={q.fetching} className="mb-4" /> : null}

      {!draft ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader icon={<Fingerprint size={18} />} title="Two-step sign-in" description="An authenticator app code after the password." />
            <CardBody className="space-y-4">
              <SwitchRow
                label="Require an authenticator code"
                description="Every admin enters a 6-digit code from Google Authenticator, 1Password or similar. Admins who haven't set it up are walked through it at their next sign-in."
                checked={draft.require_2fa}
                onChange={(v) => set("require_2fa", v)}
              />
              {draft.require_2fa && !base?.require_2fa ? (
                <Callout tone="info" title="Have your phone ready">
                  You&apos;ll need to set up an authenticator app the next time you sign in.
                </Callout>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<Clock size={18} />} title="Sessions" description="How long a sign-in lasts." />
            <CardBody>
              <NumberField
                label="Session length"
                unit="hrs"
                min={BOUNDS.session_hours[0]}
                max={BOUNDS.session_hours[1]}
                value={draft.session_hours}
                onChange={(v) => set("session_hours", v)}
                error={errors.session_hours}
                hint="1 to 168. Applies to new sign-ins; an open console renews itself while in use."
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader icon={<LockKeyhole size={18} />} title="Lockout" description="Slow down password guessing." />
            <CardBody className="space-y-5">
              <SwitchRow
                label="Lock an email after repeated failed sign-ins"
                description="Wrong passwords for the same email are counted. Once the limit is hit, that email can't sign in until the lock ends."
                checked={draft.lock_after_fail}
                onChange={(v) => set("lock_after_fail", v)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Failed attempts before locking"
                  min={BOUNDS.max_fail_attempts[0]}
                  max={BOUNDS.max_fail_attempts[1]}
                  value={draft.max_fail_attempts}
                  onChange={(v) => set("max_fail_attempts", v)}
                  error={draft.lock_after_fail ? errors.max_fail_attempts : null}
                  disabled={!draft.lock_after_fail}
                  hint="3 to 20"
                />
                <NumberField
                  label="Lock duration"
                  unit="min"
                  min={BOUNDS.lock_minutes[0]}
                  max={BOUNDS.lock_minutes[1]}
                  value={draft.lock_minutes}
                  onChange={(v) => set("lock_minutes", v)}
                  error={draft.lock_after_fail ? errors.lock_minutes : null}
                  disabled={!draft.lock_after_fail}
                  hint="1 to 1440"
                />
              </div>
              <p className="text-xs text-muted">Counts are kept in server memory, so a server restart clears active locks.</p>
            </CardBody>
          </Card>
        </div>
      )}

      <SaveBar count={dirty.length} saving={isPending("save")} blockedReason={blocked} onSave={() => void save()} onReset={reset} />
    </>
  );
}
