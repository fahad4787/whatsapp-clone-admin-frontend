"use client";

import { useState } from "react";
import { Button, PageHeader } from "@/components/ui";
import { useMockStore } from "@/data";

const DOCS = [
  { key: "privacy", title: "Privacy policy", initial: "Privacy policy content…" },
  { key: "terms", title: "Terms of service", initial: "Terms of service content…" },
] as const;

export default function LegalPage() {
  const store = useMockStore();
  const [docs, setDocs] = useState({ privacy: DOCS[0].initial, terms: DOCS[1].initial });
  const [toast, setToast] = useState<string | null>(null);

  function save() {
    store.pushAudit("Updated legal docs", "Privacy + Terms");
    setToast("Legal documents saved");
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="bp-page">
      <PageHeader
        title="Legal"
        description="Copy shown in the Android app and public website."
        actions={<Button onClick={save}>Save documents</Button>}
      />
      {toast ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-emerald-200 bg-bp-green-soft px-4 py-2.5 text-sm font-medium">
          {toast}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {DOCS.map((doc) => (
          <div key={doc.key} className="bp-card p-4">
            <h2 className="mb-2 font-semibold">{doc.title}</h2>
            <textarea
              className="bp-input min-h-48"
              value={docs[doc.key]}
              onChange={(e) => setDocs((d) => ({ ...d, [doc.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
