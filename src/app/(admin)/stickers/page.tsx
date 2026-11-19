"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminStickers, type AdminStickerPackItem } from "@/lib/api";

export default function StickersPage() {
  const [items, setItems] = useState<AdminStickerPackItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.adminToken);
      if (!token) {
        setError("Sign in again");
        return;
      }
      const data = await fetchAdminStickers(token);
      setItems(data.items);
      setNote(data.note ?? null);
    } catch {
      setError("Could not load sticker packs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bp-page">
      <PageHeader
        title="Stickers"
        description="Packs available to users inside the Android app."
        actions={
          <button type="button" className="bp-btn bp-btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {note ? (
        <div className="mb-4 rounded-[var(--radius-sm)] border border-bp-line bg-bp-soft/40 px-4 py-2.5 text-sm text-bp-muted">
          {note}
        </div>
      ) : null}
      <div className="bp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-bp-line bg-bp-soft/40 text-xs uppercase tracking-wide text-bp-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Pack</th>
              <th className="px-4 py-3 font-semibold">Publisher</th>
              <th className="px-4 py-3 font-semibold">Stickers</th>
              <th className="px-4 py-3 font-semibold">Featured</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={4}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-bp-muted" colSpan={4}>
                  No sticker packs
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="border-b border-bp-line/70 last:border-0">
                  <td className="px-4 py-3 font-semibold">{s.name}</td>
                  <td className="px-4 py-3">{s.publisher}</td>
                  <td className="px-4 py-3">{s.stickers}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={s.featured ? "Featured" : "Standard"}
                      tone={s.featured ? "green" : "gray"}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
