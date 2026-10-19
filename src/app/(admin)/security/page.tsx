"use client";

import { useState } from "react";
import { Button, NumberInput, PageHeader, ToggleRow } from "@/components/ui";
import { useMockStore } from "@/data";

export default function SecurityPage() {
  const store = useMockStore();
  const [require2fa, setRequire2fa] = useState(false);
  const [lockAfterFail, setLockAfterFail] = useState(true);
  const [sessionHours, setSessionHours] = useState(12);
  const [toast, setToast] = useState<string | null>(null);

  function save() {
    store.pushAudit("Updated security", `2FA=${require2fa}; lock=${lockAfterFail}; session=${sessionHours}h`);
    setToast("Security settings saved");
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="bp-page">
      <PageHeader title="Security" description="Admin authentication and session policy." />
      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium">
          {toast}
        </div>
      ) : null}
      <div className="bp-card space-y-5 p-5">
        <ToggleRow label="Require 2FA for admins" checked={require2fa} onChange={setRequire2fa} />
        <ToggleRow label="Lock account after failed logins" checked={lockAfterFail} onChange={setLockAfterFail} />
        <label className="block text-sm font-semibold">
          Session lifetime (hours)
          <NumberInput className="mt-1.5 max-w-xs" value={sessionHours} onChange={(e) => setSessionHours(Number(e.target.value))} />
        </label>
        <Button onClick={save}>Save security</Button>
      </div>
    </div>
  );
}
