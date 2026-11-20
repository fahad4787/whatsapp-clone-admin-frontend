"use client";

import { useCallback } from "react";
import { Alert, DataTable, PageHeader, RefreshButton, StatusBadge, type Column } from "@/components/ui";
import { useAdminList } from "@/hooks/useAdminList";
import { fetchAdminStickers, type AdminStickerPackItem } from "@/lib/api";

const COLUMNS: Column<AdminStickerPackItem>[] = [
  { key: "name", header: "Pack", className: "font-semibold", cell: (s) => s.name },
  { key: "publisher", header: "Publisher", cell: (s) => s.publisher },
  { key: "stickers", header: "Stickers", cell: (s) => s.stickers },
  {
    key: "featured",
    header: "Featured",
    cell: (s) => <StatusBadge label={s.featured ? "Featured" : "Standard"} tone={s.featured ? "green" : "gray"} />,
  },
];

export default function StickersPage() {
  const fetcher = useCallback(async (t: string) => (await fetchAdminStickers(t)).items, []);
  const { items, loading, error, reload } = useAdminList(fetcher, {
    interval: 30_000,
    errorMessage: "Could not load sticker packs",
  });

  return (
    <div className="bp-page">
      <PageHeader
        title="Stickers"
        description="Packs available to users inside the Android app."
        actions={<RefreshButton onClick={() => void reload()} />}
      />
      <Alert>{error}</Alert>
      <DataTable columns={COLUMNS} rows={items} getKey={(s) => s.id} loading={loading} empty="No sticker packs" />
    </div>
  );
}
