"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import { STORAGE_KEYS } from "@/config/constants";
import { fetchAdminAudit, type AdminAuditItem } from "@/lib/api";

export default function AuditPage() {
  const [items, setItems] = useState<AdminAuditItem[]>([]);
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
      const data = await fetchAdminAudit(token);
      setItems(data.items);
    } catch {
      setError("Could not load audit log");
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
        title="Audit log"
        description="Admin actions (login, bans, settings, countries)."
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
      <div className="bp-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-bp-line bg-bp-soft/40 text-xs uppercase tracking-wide text-bp-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Detail</th>
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
                  No events yet
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-bp-line/70 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-bp-muted">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {row.actor.display_name || row.actor.email}
                  </td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3 max-w-md truncate text-bp-muted">
                    {row.meta ? JSON.stringify(row.meta) : "—"}
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
