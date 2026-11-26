"use client";

import { useMemo, useState } from "react";
import { FileText, Scale } from "lucide-react";
import { ErrorCallout, Card, CardToolbar, PageHeader, SaveBar, Segmented, Skeleton, Textarea } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useDraft } from "@/hooks/useDraft";
import { useQuery } from "@/hooks/useQuery";
import { adminApi, type LegalDocs } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNumber } from "@/lib/format";

const MAX = 50_000;
type Doc = keyof LegalDocs;
const DOCS: Record<Doc, { label: string; icon: typeof FileText }> = {
  privacy_policy: { label: "Privacy policy", icon: FileText },
  terms_of_service: { label: "Terms of service", icon: Scale },
};

export default function LegalPage() {
  const [tab, setTab] = useState<Doc>("privacy_policy");
  const q = useQuery("legal", (s) => adminApi.legal.get(s));
  const base = useMemo(() => (q.data ? { privacy_policy: q.data.privacy_policy, terms_of_service: q.data.terms_of_service } : null), [q.data]);
  const { draft, set, reset, dirty } = useDraft(base);
  const { run, isPending } = useAction();

  const over = (Object.keys(DOCS) as Doc[]).find((k) => (draft?.[k].length ?? 0) > MAX);
  const blocked = over ? `${DOCS[over].label} is over ${fmtNumber(MAX)} characters.` : null;

  const save = async () => {
    if (!draft || blocked) return;
    const res = await run("save", () => adminApi.legal.update(draft), { success: "Legal documents published", errorTitle: "Couldn't save" });
    if (res) q.setData(res);
  };

  const text = draft?.[tab] ?? "";
  return (
    <>
      <PageHeader title="Legal" description="Shown in the app under Settings → Help. Saving publishes right away." />
      {q.error ? <ErrorCallout error={q.error} onRetry={q.reload} retrying={q.fetching} className="mb-4" /> : null}
      <Card>
        <CardToolbar className="justify-between">
          <Segmented
            label="Document"
            value={tab}
            onChange={setTab}
            options={(Object.keys(DOCS) as Doc[]).map((k) => ({ value: k, label: `${DOCS[k].label}${dirty.includes(k) ? " •" : ""}` }))}
          />
          <span className={cn("text-xs tabular-nums", text.length > MAX ? "font-semibold text-danger" : "text-muted")}>
            {fmtNumber(text.length)} / {fmtNumber(MAX)}
          </span>
        </CardToolbar>
        <div className="p-4 sm:p-5">
          {!draft ? (
            <Skeleton className="h-[28rem] w-full" />
          ) : (
            <Textarea
              key={tab}
              aria-label={DOCS[tab].label}
              value={text}
              invalid={text.length > MAX}
              onChange={(e) => set(tab, e.target.value)}
              placeholder={`Write the ${DOCS[tab].label.toLowerCase()}…`}
              className="min-h-[28rem] resize-y font-[inherit] text-[14px] leading-7"
              spellCheck
            />
          )}
          <p className="mt-3 text-xs text-muted">Plain text. Blank lines separate paragraphs. If a document is left empty, the app shows its title only.</p>
        </div>
      </Card>
      <SaveBar count={dirty.length} saving={isPending("save")} blockedReason={blocked} onSave={() => void save()} onReset={reset} />
    </>
  );
}
