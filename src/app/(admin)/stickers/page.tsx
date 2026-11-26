"use client";

import { Smile, Star } from "lucide-react";
import { Badge, Callout, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { adminApi } from "@/lib/api";
import { fmtNumber } from "@/lib/format";

export default function StickersPage() {
  const q = useQuery("stickers", (s) => adminApi.stickers(s));
  const items = q.data?.items ?? [];
  const total = items.reduce((n, p) => n + p.stickers, 0);

  return (
    <>
      <PageHeader
        title="Sticker packs"
        count={q.data ? items.length : undefined}
        description={q.data ? `${fmtNumber(total)} stickers available to everyone in the app.` : "Sticker packs available in the app."}
      />
      {q.error ? <Callout tone="danger" className="mb-4">{q.error}</Callout> : null}
      <Callout tone="info" className="mb-6">
        These packs are built into the app, so they&apos;re read-only here. Uploading new packs isn&apos;t available yet.
      </Callout>
      {!q.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : items.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <Card className="flex h-full items-start gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Smile size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-bold text-ink">{p.name}</h3>
                    {p.featured ? <Badge tone="warning"><Star size={11} className="-ml-0.5" /> Featured</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted">by {p.publisher}</p>
                  <p className="mt-3 text-sm font-semibold tabular-nums text-ink-soft">{fmtNumber(p.stickers)} stickers</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card><EmptyState icon={<Smile size={22} />} title="No sticker packs" /></Card>
      )}
    </>
  );
}
