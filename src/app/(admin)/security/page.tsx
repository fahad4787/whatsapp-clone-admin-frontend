"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, NumberInput, PageHeader, ToggleRow } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminSecurity, putAdminSecurity } from "@/lib/api";

export default function SecurityPage() {
  const [require2fa, setRequire2fa] = useState(false);
  const [lockAfterFail, setLockAfterFail] = useState(true);
  const [sessionHours, setSessionHours] = useState(8);
  const [maxFail, setMaxFail] = useState(5);
  const [lockMinutes, setLockMinutes] = useState(15);
  const [note, setNote] = useState<string | null>(null);
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
      const data = await fetchAdminSecurity(token);
      setRequire2fa(data.require_2fa);
      setLockAfterFail(data.lock_after_fail);
      setSessionHours(data.session_hours);
      setMaxFail(data.max_fail_attempts);
      setLockMinutes(data.lock_minutes);
      setNote(data.note ?? null);
    } catch {
      setError("Could not load security settings");
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
      const data = await putAdminSecurity(token, {
        require_2fa: require2fa,
        lock_after_fail: lockAfterFail,
        session_hours: sessionHours,
        max_fail_attempts: maxFail,
        lock_minutes: lockMinutes,
      });
      setRequire2fa(data.require_2fa);
      setLockAfterFail(data.lock_after_fail);
      setSessionHours(data.session_hours);
      setMaxFail(data.max_fail_attempts);
      setLockMinutes(data.lock_minutes);
      setNote(data.note ?? null);
      setToast("Security settings saved");
      window.setTimeout(() => setToast(null), 1800);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bp-page">
      <PageHeader title="Security" description="Admin authentication and session policy." />
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
      {note ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
          {note}
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-bp-muted">Loading…</p>
      ) : (
        <div className="bp-card space-y-5 p-5">
          <ToggleRow
            label="Require 2FA for admins (stored; TOTP not enforced yet)"
            checked={require2fa}
            onChange={setRequire2fa}
          />
          <ToggleRow
            label="Lock account after failed logins"
            checked={lockAfterFail}
            onChange={setLockAfterFail}
          />
          <label className="block text-sm font-semibold">
            Session lifetime (hours)
            <NumberInput
              className="mt-1.5 max-w-xs"
              value={sessionHours}
              onChange={(e) => setSessionHours(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm font-semibold">
            Failed attempts before lock
            <NumberInput
              className="mt-1.5 max-w-xs"
              value={maxFail}
              onChange={(e) => setMaxFail(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm font-semibold">
            Lock duration (minutes)
            <NumberInput
              className="mt-1.5 max-w-xs"
              value={lockMinutes}
              onChange={(e) => setLockMinutes(Number(e.target.value))}
            />
          </label>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save security"}
          </Button>
        </div>
      )}
    </div>
  );
}
